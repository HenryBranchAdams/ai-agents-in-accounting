"""Build the research map from the official NAICS workbook and local corpus.

Uses Python's standard library. The input workbook is read only and is not
redistributed. Run from the repository root with --naics-xlsx PATH. Rebuilding
updates the corpus snapshot; preserve the dated outputs before changing inputs.
"""

import argparse
import collections
import hashlib
import json
import re
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "docs/research"
STEM = "accounting-coverage-topology-2026-09-11"
SOURCE_URL = "https://www.census.gov/naics/2022NAICS/2022_NAICS_Structure.xlsx"
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
LEVELS = {1: "sector", 2: "subsector", 3: "industry-group", 4: "naics-industry", 5: "us-industry"}
EXPECTED = {"sector": 20, "subsector": 96, "industry-group": 308, "naics-industry": 689, "us-industry": 1012}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_structure(path):
    with ZipFile(path) as z:
        strings = ET.fromstring(z.read("xl/sharedStrings.xml"))
        shared = ["".join(t.text or "" for t in si.findall(".//s:t", NS)) for si in strings]
        sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    nodes, parents = [], {}
    for row in sheet.findall(".//s:row", NS):
        cells = {}
        for cell in row.findall("s:c", NS):
            col = re.sub(r"\d", "", cell.attrib["r"])
            value = cell.find("s:v", NS)
            value = value.text if value is not None else ""
            if cell.attrib.get("t") == "s":
                value = shared[int(value)]
            cells[col] = value
        code = cells.get("B", "")
        if not re.fullmatch(r"\d{2,6}|\d{2}-\d{2}", code):
            continue
        depth = 1 if "-" in code else len(code) - 1
        raw_title = cells["C"].strip()
        trilateral = raw_title.endswith("T")
        title = raw_title[:-1].rstrip() if trilateral else raw_title
        parent = parents.get(depth - 1) if depth > 1 else None
        if depth > 1 and parent is None:
            raise ValueError(f"Missing parent for {code}")
        nodes.append({"code": code, "title": title, "level": LEVELS[depth], "parent_code": parent,
                      "trilateral_indicator": trilateral, "source_row": int(row.attrib["r"])})
        parents[depth] = code
        for d in list(parents):
            if d > depth:
                del parents[d]
    counts = dict(collections.Counter(n["level"] for n in nodes))
    assert counts == EXPECTED, counts
    assert len({n["code"] for n in nodes}) == len(nodes)
    by_code = {n["code"]: n for n in nodes}
    for n in nodes:
        if n["parent_code"]:
            p = by_code[n["parent_code"]]
            if "-" in p["code"]:
                low, high = p["code"].split("-")
                assert int(low) <= int(n["code"][:2]) <= int(high)
            else:
                assert n["code"].startswith(p["code"])
    return nodes, counts


def construction_links():
    rows = [
        ("Contract scope and delivery model", ["q-reporting-basis", "q-revenue"], "contract-intake"),
        ("Over-time eligibility and progress", ["q-revenue", "q-project-wip"], "wip-close"),
        ("Job-cost completeness and cutoff", ["q-project-wip", "q-data-lineage"], "job-cost-estimates"),
        ("Estimates to complete and margin fade", ["q-estimates", "q-project-wip"], "job-cost-estimates"),
        ("Change orders and claims", ["q-revenue", "q-project-wip", "q-provisions"], "change-orders-claims"),
        ("Expected contract losses", ["q-project-wip", "q-provisions"], "change-orders-claims"),
        ("Payment applications and schedules of values", ["q-revenue", "q-data-lineage"], "billing-retainage"),
        ("Retainage and contract balances", ["q-receivables-credit", "q-project-wip"], "billing-retainage"),
        ("Credit losses and collections", ["q-receivables-credit"], "billing-retainage"),
        ("Subcontractor obligations and payments", ["q-purchasing-payables", "q-cash-settlement"], "subcontractor-payables"),
        ("Trust funds, waivers, liens and bonds", ["q-provisions", "q-compliance-assurance"], "subcontractor-payables"),
        ("Public works and allowable costs", ["q-cost-allocation", "q-compliance-assurance"], "contract-intake"),
        ("Prevailing wages and certified payroll", ["q-payroll", "q-compliance-assurance"], "prevailing-wage-payroll"),
        ("Long-term-contract federal tax", ["q-tax-methods", "q-tax-returns"], "long-term-contract-tax"),
        ("Multistate sales and use tax", ["q-indirect-tax"], "multistate-tax"),
        ("Income apportionment and conformity", ["q-income-tax", "q-tax-methods"], "multistate-tax"),
        ("Equipment, rentals and internal charges", ["q-capital-assets", "q-leases", "q-cost-allocation"], "equipment-leases"),
        ("Insurance, wrap-ups and premiums", ["q-insurance-policyholder"], "insurance-contingencies"),
        ("Warranties, guarantees and contingencies", ["q-provisions"], "insurance-contingencies"),
        ("Joint ventures and related entities", ["q-business-combinations", "q-consolidation", "q-related-parties"], "joint-ventures"),
        ("Cash, borrowing and surety", ["q-cash-settlement", "q-debt", "q-planning"], "cash-surety-closeout"),
        ("Backlog and closeout", ["q-performance", "q-project-wip", "q-provisions"], "cash-surety-closeout"),
        ("Data lineage, access and fraud controls", ["q-data-lineage", "q-security", "q-controls-fraud"], "wip-close"),
    ]
    return [{"area": name, "question_family_ids": qs, "candidate_record_ids": ["wf-construction-" + suffix],
             "coverage_assessment": "not-assessed-under-proposed-rubric"} for name, qs, suffix in rows]


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--naics-xlsx", type=Path, required=True)
    args = p.parse_args()
    editorial_path = Path(__file__).with_name("accounting-topology-editorial-2026-09-11.json")
    ed = json.loads(editorial_path.read_text())
    nodes, counts = load_structure(args.naics_xlsx)
    by_code = {n["code"]: n for n in nodes}
    corpus_files = sorted((ROOT / "data/corpus").glob("*.json"))
    records = [r for path in corpus_files for r in json.loads(path.read_text())]
    by_id = {r["id"]: r for r in records}
    q_ids = {q[0] for q in ed["question_families"]}
    archetypes = {a[0]: a for a in ed["archetypes"]}
    assert len(q_ids) == len(ed["question_families"])
    assert len(archetypes) == len(ed["archetypes"])
    assert {s[0] for s in ed["subsector_screening"]} == {n["code"] for n in nodes if n["level"] == "subsector"}
    assert len(ed["subsector_screening"]) == 96
    for a in archetypes.values():
        assert set(a[3]) <= q_ids
    for ids in ed["sector_candidate_records"].values():
        assert set(ids) <= by_id.keys(), set(ids) - by_id.keys()
    assert set(ed["sector_candidate_records"]) == {n["code"] for n in nodes if n["level"] == "sector"}
    for wave in ed["initial_research_waves"]:
        assert set(wave["subsectors"]) <= {s[0] for s in ed["subsector_screening"]}

    screening = []
    for code, archetype_ids, question in ed["subsector_screening"]:
        assert set(archetype_ids) <= archetypes.keys()
        n = by_code[code]
        leaves = [leaf["code"] for leaf in nodes if leaf["level"] == "us-industry" and leaf["code"].startswith(code)]
        screening.append({"naics_code": code, "title": n["title"], "sector_code": n["parent_code"],
            "detailed_industry_count": len(leaves), "candidate_archetype_ids": archetype_ids,
            "screening_question": question,
            "candidate_question_family_ids": sorted({qid for aid in archetype_ids for qid in archetypes[aid][3]}),
            "applicability_status": "not-assessed", "coverage_status": "not-assessed",
            "leaf_exception_review_status": "not-assessed",
            "candidate_corpus_record_ids": ed["sector_candidate_records"][n["parent_code"]],
            "candidate_record_scope": "Sector-level navigation seeds; no applicability or coverage credit is inherited."})
    assert sum(s["detailed_industry_count"] for s in screening) == 1012

    tag_counts = collections.Counter(t for r in records for t in set(r["industries"]))
    snapshot = {"corpus_version": json.loads((ROOT / "data/catalog.json").read_text())["corpus_version"],
        "record_count": len(records), "kind_counts": dict(sorted(collections.Counter(r["kind"] for r in records).items())),
        "industry_tag_counts": dict(sorted(tag_counts.items())),
        "records_without_industry_tag": sum(not r["industries"] for r in records),
        "distinct_topic_count": len({t for r in records for t in r["topics"]}),
        "review_status_counts": dict(sorted(collections.Counter(r["review_status"] for r in records).items())),
        "hash_algorithm": "sha256",
        "input_sha256": {str(path.relative_to(ROOT)): sha(path) for path in [*corpus_files, ROOT / "data/catalog.json"]},
        "interpretation": "Direct metadata inventory. Tags overlap. Missing tags and source-check statuses do not establish missing or sufficient accounting coverage."}
    examples = construction_links()
    for example in examples:
        assert set(example["question_family_ids"]) <= q_ids
        assert set(example["candidate_record_ids"]) <= by_id.keys()
    data = {
        "schema_version": "research-topology-0.1", "date": ed["date"], "status": ed["status"], "scope": ed["scope"],
        "interpretation": ed["interpretation"],
        "rights": {"original_metadata": "CC0-1.0", "original_editorial_analysis": "CC-BY-4.0",
            "external_source": "Factual classification codes and titles are attributed to Census. The publisher workbook, manual and other external publications are not redistributed. No external training or full-text reuse license is granted."},
        "industry_backbone": {"scheme": "NAICS-US", "edition": "2022", "source_url": SOURCE_URL,
            "source_landing_url": "https://www.census.gov/naics/", "source_sha256": sha(args.naics_xlsx),
            "retrieved_at": ed["date"], "source_sheet": "2022 NAICS Structure", "counts": counts,
            "extraction": "Read columns B and C. Preserve codes as strings, retain hierarchy order and immediate parents, trim surrounding whitespace and separate terminal T footnote indicators. Combined sector ranges remain sector codes. No classification definitions copied.",
            "nodes": nodes},
        "inventory_result": {"industry_tree_enumerated": True, "detailed_industries_enumerated": 1012,
            "subsectors_with_editorial_screening_prompts": 96,
            "applicability_assessed_pairs": 0,
            "candidate_screening_pairs": 96 * len(q_ids),
            "question_family_count": len(q_ids),
            "accounting_coverage_percentage": None,
            "interpretation": "All industry nodes are inventoried; no complete industry-by-question applicability or evidence assessment has been performed. Zero assessed pairs describes this new map, not absence of existing content."},
        "question_groups": ed["question_groups"],
        "question_families": [{"id": q[0], "group": q[1], "title": q[2], "screening_question": q[3], "status": "proposed"} for q in ed["question_families"]],
        "depth_dimensions": [{"id": d[0], "title": d[1]} for d in ed["depth_dimensions"]],
        "archetypes": [{"id": a[0], "title": a[1], "description": a[2], "candidate_question_family_ids": a[3], "status": "proposed-nonexclusive"} for a in ed["archetypes"]],
        "subsector_screening": screening,
        "jurisdiction_and_entity_dimensions": ed["jurisdiction_and_entity_dimensions"],
        "construction_example_links": examples,
        "initial_research_waves": ed["initial_research_waves"],
        "crosswalks": {"status": "not-imported-or-verified", "target_schemes": ["SIC-SEC", "ISIC-Rev5", "NACE-Rev2.1"],
            "rule": "Preserve both scheme editions, mapping relation, provenance and review status. Do not infer equivalence from code prefixes, matching labels or a primary company classification."},
        "assessment_contract": {
            "unit": "A specific answerable question for a declared entity, activity, transaction role, framework, jurisdiction and period profile.",
            "applicability_states": ["not-assessed", "applicable", "conditional", "not-applicable-reviewed"],
            "evidence_states": ["not-assessed", "searched-no-suitable-source", "candidate-only", "source-checked", "sourced-answer", "workflow-supported"],
            "review_states": ["not-reviewed", "editorial", "professional"],
            "empirical_support_states": ["not-assessed", "no-performance-claim", "vendor-reported", "observed-study", "independently-replicated"],
            "currency_states": ["unknown", "current-for-stated-period", "historical", "superseded", "conflict-unresolved"],
            "rights_states": ["unknown", "reference-only", "verified-reusable-with-conditions"],
            "required_fields": ["question_id", "scope_profile", "applicability", "rationale", "record_ids", "source_locators", "evidence_state", "unresolved_gaps", "review_basis", "effective_period", "currency_state", "rights_state"],
            "coverage_rule": "Measure separately against a fixed version of questions and explicit acceptance criteria. Candidate links and generic source inheritance do not count. Unassessed and unresolved conditional cells remain visible; not-applicable exclusions require reasons. Professional and empirical review are separate evidence dimensions."},
        "corpus_snapshot": snapshot,
        "editorial_input_sha256": sha(editorial_path),
    }
    (OUT / f"{STEM}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")

    lines = ["# Accounting coverage topology worklist", "",
        "This is the human-readable companion to the [research report](accounting-coverage-topology-2026-09-11.md) and [machine-readable map](accounting-coverage-topology-2026-09-11.json).",
        "", f"It inventories all 96 subsectors and 1,012 detailed industries in NAICS United States 2022. The {len(q_ids)} question families and {len(archetypes)} business-model archetypes are original screening proposals. All subsectors remain unassessed for applicability, detailed-industry exceptions and evidence sufficiency.",
        "", "Source for codes, titles and hierarchy: [U.S. Census Bureau, 2022 NAICS Structure](https://www.census.gov/naics/2022NAICS/2022_NAICS_Structure.xlsx). Titles omit the publisher's T footnote marker; the JSON retains the marker separately. Questions below are editorial research prompts, not statements of accounting requirements.",
        "", "## Industry screening", ""]
    for sector in (n for n in nodes if n["level"] == "sector"):
        lines += [f"### {sector['code']} — {sector['title']}", "", "| Subsector | Detailed industries | Questions to investigate |", "|---|---:|---|"]
        for s in screening:
            if s["sector_code"] == sector["code"]:
                lines.append(f"| {s['naics_code']} {s['title']} | {s['detailed_industry_count']} | {s['screening_question']} |")
        lines += ["", "Existing navigation seeds: " + ", ".join(f"`{rid}`" for rid in ed["sector_candidate_records"][sector["code"]]) + ". Their applicability and depth must be assessed separately.", ""]
    lines += ["## Accounting and agent question families", "",
        "Every subsector is to be screened against the full question-family list. Archetypes suggest places to begin; they do not exclude other families.", ""]
    for group, title in ed["question_groups"].items():
        lines += [f"### {title}", "", "| Family | Screening question |", "|---|---|"]
        for q in ed["question_families"]:
            if q[1] == group:
                lines.append(f"| {q[2]} (`{q[0]}`) | {q[3]} |")
        lines += [""]
    lines += ["## Reusable business-model archetypes", "", "Several archetypes may apply to one entity or subsector. These are proposed research groupings, not alternative official industry codes.", "", "| Archetype | Accounting distinctions to investigate |", "|---|---|"]
    lines += [f"| {a[1]} | {a[2]} |" for a in ed["archetypes"]]
    lines += ["", "## Construction example", "", "The 23 areas from the prior construction review can be linked into the broader topology. These are candidate content links; the earlier review's limitations remain in force.", "", "| Prior construction area | Question families | Existing workflow |", "|---|---|---|"]
    lines += [f"| {e['area']} | {', '.join(e['question_family_ids'])} | `{e['candidate_record_ids'][0]}` |" for e in examples]
    lines += ["", "## Snapshot and review boundary", "", f"The local corpus snapshot is {snapshot['corpus_version']}: {len(records)} records, including {snapshot['kind_counts']['source']} sources and {snapshot['kind_counts']['workflow']} workflows. The JSON contains input hashes, classification provenance, candidate links and review states. No source record was added, retagged or reverified by this topology mapping.", ""]
    (OUT / "accounting-coverage-topology-worklist-2026-09-11.md").write_text("\n".join(lines))
    print(json.dumps({"structure_counts": counts, "question_families": len(q_ids), "archetypes": len(archetypes),
        "subsectors": len(screening), "screening_pairs": 96 * len(q_ids), "construction_links": len(examples),
        "corpus_records": len(records), "outputs": [f"docs/research/{STEM}.json", "docs/research/accounting-coverage-topology-worklist-2026-09-11.md"]}, indent=2))


if __name__ == "__main__":
    main()
