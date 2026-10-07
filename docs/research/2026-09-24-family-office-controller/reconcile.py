#!/usr/bin/env python3
"""Build the research handoff from frozen prior and leaf observations.

This writes only inside this follow-up directory. It does not touch the corpus.
"""
from __future__ import annotations

import json
import re
from copy import deepcopy
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]
PRIOR = ROOT.parent / "2026-09-24-family-office-expansion"
SPECIALTY = ROOT.parent / "2026-09-23-accounting-specialties-followup"
WORKERS = ROOT / "workers"

GROUP_AREAS = {
    "governance-controls": [1, 10],
    "accounting-reporting": [2, 11],
    "investments-treasury": [3, 4],
    "trust-tax": [5, 6],
    "coordinator-operations": [7, 8, 9],
}
PRIOR_QUESTION_AREAS = {
    "FO-R1": [2, 11], "FO-R2": [3], "FO-R3": [1],
    "FO-T1": [5, 6], "FO-T2": [5, 6], "FO-T3": [5, 6],
    "FO-O1": [1, 2, 8], "FO-O2": [9], "FO-O3": [8],
    "FO-L1": [5, 6], "FO-L2": [5, 6],
}
BASELINE_ID_AREAS = {
    "src_family_office_irs_k1_1041_2025": [5, 6],
    "src_aa122_irs_i1120_2025": [6],
    "src_family_office_sec_2011_rule": [1],
    "src_fasb_201502": [2, 11],
    "src_fasb_asu_201601_equity_investments": [3],
    "src_aa_i123_fas57": [1, 2, 11],
}


def read_json(path: Path):
    return json.loads(path.read_text())


def normalized_url(url: str) -> str:
    parts = urlsplit(url)
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), parts.path.rstrip("/"), parts.query, ""))


def edition_year(observation: dict) -> str:
    edition = observation.get("publication_date_or_edition", "")
    match = re.search(r"\b(?:19|20)\d{2}\b", str(edition))
    return match.group(0) if match else "undated"


def source_areas(observation: dict, group: str) -> list[int]:
    areas = set()
    for q in observation.get("questions", []):
        match = re.search(r"FO-C(\d{1,2})", q)
        if match:
            areas.add(int(match.group(1)))
        areas.update(PRIOR_QUESTION_AREAS.get(q, []))
    return sorted(areas or GROUP_AREAS.get(group, []))


def main():
    corpus_by_url = {}
    for source in read_json(REPO / "data/corpus/source.json"):
        if source.get("source_url"):
            corpus_by_url.setdefault(normalized_url(source["source_url"]), []).append(source["id"])
    prior = deepcopy(read_json(PRIOR / "source-inventory.json"))
    by_key = {}
    by_url_unobserved = {}
    seen_source_keys = set()
    seen_prior_ids = set()
    for row in prior:
        row["research_change"] = "prior-family-office-research"
        row["area_ids"] = sorted(
            {area for q in row.get("questions", []) for area in PRIOR_QUESTION_AREAS.get(q, [])}
            | {area for rid in row.get("existing_record_ids", []) for area in BASELINE_ID_AREAS.get(rid, [])}
        )
        for obs in row.get("observations", []):
            obs.setdefault("research_stage", "prior-family-office-research")
            seen_source_keys.add(obs["source_key"])
            by_key[(normalized_url(row["url"]), edition_year(obs))] = row
        if not row.get("observations"):
            by_url_unobserved[normalized_url(row["url"])] = row
        seen_prior_ids.update(row.get("prior_inventory_ids", []))

    specialty = read_json(SPECIALTY / "source-inventory.json")
    specialty_by_key = {}
    for row in specialty:
        for obs in row.get("observations", []):
            for key in row.get("source_keys", []) + [row.get("inventory_id")]:
                if key:
                    specialty_by_key[key] = (row, obs)
    leaf_sources = []
    for group in GROUP_AREAS:
        path = WORKERS / group / "sources.json"
        if not path.exists():
            raise SystemExit(f"Missing worker sources: {path}")
        for obs in read_json(path):
            leaf_sources.append((group, obs))
            for prior_id in obs.get("prior_inventory_ids", []):
                if prior_id in specialty_by_key and prior_id not in seen_prior_ids:
                    base_row, base_obs = specialty_by_key[prior_id]
                    prior.append({
                        "inventory_id": f"FOC-SP-{prior_id}",
                        "title": base_row["title"], "url": base_row["url"],
                        "existing_record_ids": base_row.get("existing_record_ids", []),
                        "prior_inventory_ids": [prior_id], "source_keys": [prior_id],
                        "questions": [], "observations": [deepcopy(base_obs)],
                        "research_change": "reused-specialty-research", "area_ids": source_areas(obs, group),
                    })
                    row = prior[-1]
                    by_key[(normalized_url(row["url"]), edition_year(base_obs))] = row
                    seen_source_keys.add(prior_id)
                    seen_source_keys.add(base_obs["source_key"])
                    seen_prior_ids.add(prior_id)

    counter = 1
    for group, obs in leaf_sources:
        if not obs.get("url") or not obs.get("source_key"):
            raise SystemExit(f"Missing URL or source key in {group}: {obs}")
        key = (normalized_url(obs["url"]), edition_year(obs))
        row = by_key.get(key) or by_url_unobserved.get(key[0])
        if row is None:
            corpus_ids = corpus_by_url.get(key[0], [])
            row = {
                "inventory_id": f"FOC{counter:03d}", "title": obs["title"], "url": obs["url"],
                "existing_record_ids": corpus_ids, "prior_inventory_ids": [], "source_keys": [],
                "questions": [], "observations": [], "research_change": "new-follow-up-reference", "area_ids": [],
            }
            if corpus_ids:
                row["research_change"] = "existing-corpus-source-context"
            counter += 1
            prior.append(row)
            by_key[key] = row
        else:
            by_key[key] = row
            if row["research_change"] in ("prior-family-office-research", "reused-specialty-research"):
                row["research_change"] = "prior-reference-enriched"
        row["area_ids"] = sorted(set(row["area_ids"]) | set(source_areas(obs, group)))
        row["source_keys"] = list(dict.fromkeys(row["source_keys"] + [obs["source_key"]]))
        row["questions"] = list(dict.fromkeys(row["questions"] + obs.get("questions", [])))
        row["existing_record_ids"] = list(dict.fromkeys(row["existing_record_ids"] + obs.get("existing_record_ids", [])))
        row["prior_inventory_ids"] = list(dict.fromkeys(row["prior_inventory_ids"] + obs.get("prior_inventory_ids", [])))
        if obs["source_key"] not in seen_source_keys:
            record = deepcopy(obs)
            record["research_stage"] = f"follow-up-{group}"
            row["observations"].append(record)
            seen_source_keys.add(obs["source_key"])

    (ROOT / "source-inventory.json").write_text(json.dumps(prior, indent=2) + "\n")
    summary = {
        "prior_family_office_references": len(read_json(PRIOR / "source-inventory.json")),
        "cumulative_references": len(prior),
        "follow_up_observations": len(leaf_sources),
        "area_references": {str(i): sum(i in row["area_ids"] for row in prior) for i in range(1, 12)},
        "changes": {status: sum(row["research_change"] == status for row in prior) for status in sorted({row["research_change"] for row in prior})},
    }
    (ROOT / "inventory-summary.json").write_text(json.dumps(summary, indent=2) + "\n")


if __name__ == "__main__":
    main()
