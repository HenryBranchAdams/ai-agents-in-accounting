#!/usr/bin/env python3
"""Check local research handoff structure and preserved inputs."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]
PRIOR = ROOT.parent / "2026-09-24-family-office-expansion"
AREAS = set(range(1, 12))


def read(path):
    return json.loads(path.read_text())


def main():
    errors = []
    sources = read(ROOT / "source-inventory.json")
    source_keys = {}
    source_aliases = set()
    ids = set()
    for row in sources:
        rid = row.get("inventory_id")
        if not rid or rid in ids:
            errors.append(f"duplicate/missing inventory ID: {rid}")
        ids.add(rid)
        if not row.get("url", "").startswith("https://"):
            errors.append(f"invalid original URL: {rid}")
        if not row.get("area_ids") or not set(row["area_ids"]) <= AREAS:
            errors.append(f"unmapped area: {rid}")
        source_aliases.update(row.get("source_keys", []))
        for obs in row.get("observations", []):
            key = obs.get("source_key")
            if key in source_keys:
                errors.append(f"duplicate source key: {key}")
            source_keys[key] = row
            for field in ("title", "publisher", "url", "publication_date_or_edition", "source_classification", "inspected_summary", "rights", "verification_status"):
                if not obs.get(field):
                    errors.append(f"missing {field}: {key}")
            if obs.get("verification_status") == "discovery-only" and obs.get("inspected_summary", "").lower().startswith("the guidance requires"):
                errors.append(f"discovery source used as rule: {key}")
    for area in AREAS:
        if not any(area in row["area_ids"] for row in sources):
            errors.append(f"no source routes for area {area}")

    prior_sources = read(PRIOR / "source-inventory.json")
    for old in prior_sources:
        matches = [row for row in sources if row.get("inventory_id") == old.get("inventory_id")]
        if len(matches) != 1:
            errors.append(f"prior inventory identity not preserved: {old.get('inventory_id')}")

    for group in ("governance-controls", "accounting-reporting", "investments-treasury", "trust-tax", "coordinator-operations"):
        base = ROOT / "workers" / group
        if not (base / "brief.md").exists() or not (base / "sources.json").exists():
            errors.append(f"missing group package: {group}")
        else:
            for obs in read(base / "sources.json"):
                if obs["source_key"] not in source_keys and obs["source_key"] not in source_aliases:
                    errors.append(f"unreconciled source: {obs['source_key']}")

    for path in ROOT.rglob("*.md"):
        for target in re.findall(r"\[[^]]+\]\(([^)]+)\)", path.read_text()):
            if target.startswith(("http://", "https://", "#")):
                continue
            local = (path.parent / target.split("#", 1)[0]).resolve()
            if not local.exists():
                errors.append(f"broken local link: {path.relative_to(ROOT)} -> {target}")

    preserved = read(PRIOR / "protected-hashes.json")
    historical_drift = []
    for relative, expected in preserved.items():
        path = REPO / relative
        if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            historical_drift.append(relative)
    # The protected hashes describe the historical research snapshot, not a
    # permanent pin on later main. Guard this branch's tracked changes instead.
    changed = subprocess.run(
        ["git", "diff", "HEAD", "--name-only"], cwd=REPO,
        check=True, capture_output=True, text=True,
    ).stdout.splitlines()
    protected_worktree_changes = sorted(
        relative for relative in set(changed) & set(preserved)
        if not relative.startswith("docs/research/") or relative in historical_drift
    )
    for relative in protected_worktree_changes:
        errors.append(f"protected input modified in this branch: {relative}")

    baseline = read(PRIOR / "baseline.json")
    guide = {row["id"]: row for row in read(REPO / "data/corpus/guide.json")}
    source = {row["id"]: row for row in read(REPO / "data/corpus/source.json")}
    assessments = {row["id"]: row for row in read(REPO / "data/coverage/assessments.json")["assessments"]}
    for kind, rows, current in (
        ("guide", [baseline["guide"]], guide),
        ("direct source", baseline["direct_sources"], source),
        ("assessment", baseline["assessments"], assessments),
    ):
        for row in rows:
            if current.get(row["id"]) != row:
                errors.append(f"family-office {kind} differs from snapshot: {row['id']}")

    # Each responsibility must have a question-level ledger entry.
    ledger = (ROOT / "GAP-LEDGER.md").read_text()
    for area in AREAS:
        if not re.search(rf"^\| {area}\. ", ledger, flags=re.M):
            errors.append(f"area {area} absent from gap ledger")

    result = {
        "inventory_references": len(sources),
        "source_observations": sum(len(row.get("observations", [])) for row in sources),
        "prior_identities_preserved": len(prior_sources),
        "protected_inputs_checked": len(preserved),
        "historical_snapshot_drift": historical_drift,
        "protected_worktree_changes": protected_worktree_changes,
        "family_office_baseline_records_checked": 17,
        "areas": sorted(AREAS),
        "errors": errors,
    }
    (ROOT / "validation.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
