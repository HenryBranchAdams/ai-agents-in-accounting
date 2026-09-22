#!/usr/bin/env python3
"""Read-only, offline structural checks of user-supplied public research samples.

Usage: python3 scripts/check-research-asset-samples.py ASSET_DIRECTORY
No downloading, third-party code execution, credentials, or content printing.
The directory layout is documented in docs/research/issue-173-catalogue-depth.md.
"""
import hashlib
import json
import sys
from pathlib import Path

root = Path(sys.argv[1]).resolve()
results = []

def read(relative, lines=False):
    path = root / relative
    raw = path.read_bytes()
    data = [json.loads(line) for line in raw.splitlines() if line.strip()] if lines else json.loads(raw)
    return data, hashlib.sha256(raw).hexdigest()

def unique(rows, field):
    values = [r[field] for r in rows]
    assert all(isinstance(v, str) and v for v in values)
    assert len(values) == len(set(values)), f'duplicate {field}'

rows, digest = read('finbalance-release/data/coverage/records.jsonl', True)
unique(rows, 'record_id')
r = rows[0]
unique(r['documents'], 'doc_id')
doc_ids = {d['doc_id'] for d in r['documents']}
for e in r['expected_entries']:
    assert e['doc_refs'] and set(e['doc_refs']) <= doc_ids, 'unresolved document reference'
    assert e['debit_account'] in r['allowed_accounts'] and e['credit_account'] in r['allowed_accounts']
    assert isinstance(e['amount'], (int, float)) and e['amount'] > 0
results.append(dict(asset='FinBalance coverage', sha256=digest, population_ids=len(rows), sample_entries=len(r['expected_entries']), check='Unique population IDs; first record document references, account membership and positive amounts. No document/accounting truth check.'))
rows, digest = read('apex-release/data/dev.jsonl', True)
unique(rows, 'task_id')
for r in rows:
    assert r['prompt'] and r['gold_output'] and r['context_files']
    unique(r['rubric'], 'id')
    assert all(x['description'] and x['criterion_type'] for x in r['rubric'])
results.append(dict(asset='APEX public dev', sha256=digest, tasks=len(rows), criteria=sum(len(r['rubric']) for r in rows), check='Task/rubric identity and required strings; no file completeness, answer or judge validation.'))
rows, digest = read('finqa-release/dataset/dev.json')
unique(rows, 'id')
r = rows[0]
assert isinstance(r['table'], list) and r['table']
assert isinstance(r['qa']['program'], str) and r['qa']['program']
assert isinstance(r['qa']['question'], str) and r['qa']['question']
results.append(dict(asset='FinQA dev', sha256=digest, population_ids=len(rows), check='Unique IDs and first question/table/program structure; no execution of DSL or external grader.'))
preview, digest = read('cord-first-row.json')
r = json.loads(preview['rows'][0]['row']['ground_truth'])
assert isinstance(r['gt_parse'], dict) and isinstance(r['valid_line'], list)
for line in r['valid_line']:
    assert isinstance(line['category'], str)
    for word in line['words']:
        assert isinstance(word['text'], str)
        assert set(word['quad']) == {'x1','y1','x2','y2','x3','y3','x4','y4'}
results.append(dict(asset='CORD preview', sha256=digest, lines=len(r['valid_line']), check='One preview ground-truth structure and coordinate keys; no OCR accuracy or pinned Parquet identity established.'))
print(json.dumps(dict(status='passed', scope='Bounded offline structural checks only', results=results), indent=2))
