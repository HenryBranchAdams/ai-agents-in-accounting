# Prepare strict JSON resolutions for the September19 institutional/extractive integration.
# Usage: python3 scripts/reconcile-institutional-extractive.py BASE LEFT RIGHT OUTPUT_DIRECTORY
# Requires the recorded Git commits. Writes only the chosen output directory.
import json
from pathlib import Path
import subprocess
import sys

base, left, right, destination = sys.argv[1:]
destination = Path(destination)
destination.mkdir(parents=True, exist_ok=True)
version = '2026-09-19.12401'
missing = object()

def git(*args):
    return subprocess.check_output(['git', *args])

def read(rev, file):
    return json.loads(git('show', f'{rev}:{file}'))

def changed(rev):
    return set(git('diff', '--name-only', base, rev).decode().splitlines())

def merge(b, l, r, pointer=''):
    if l == r:
        return l
    if l == b:
        return r
    if r == b:
        return l
    if missing in (b, l, r):
        raise ValueError(f'Conflicting addition/deletion: {pointer}')
    if isinstance(b, dict) and isinstance(l, dict) and isinstance(r, dict):
        result = {}
        for key in dict.fromkeys([*b, *l, *r]):
            value = merge(b.get(key, missing), l.get(key, missing), r.get(key, missing), pointer+'/'+key)
            if value is not missing:
                result[key] = value
        return result
    if all(isinstance(x, list) for x in (b, l, r)):
        if all(isinstance(x, dict) and 'id' in x for rows in (b,l,r) for x in rows):
            maps = [{x['id']:x for x in rows} for rows in (b,l,r)]
            for rows,m in zip((b,l,r), maps):
                assert len(rows) == len(m), f'Duplicate ID at {pointer}'
            values = merge(*maps, pointer)
            return list(values.values())
    if pointer.split('/')[-1] in {'corpus_version','question_set_version','assessment_version','mapping_version','current_version'}:
        return version
    if pointer == '/population/named_research_questions':
        return None  # Recomputed from the merged registry below.
    if pointer in {'/coverage_note','/review_note'}:
        return None  # Explicit reconciled scope statements below.
    raise ValueError(f'Unresolved semantic conflict: {pointer}')

outputs = {}
for file in sorted(changed(left) & changed(right)):
    if not file.endswith('.json'):
        raise ValueError(f'Unexpected shared non-JSON edit: {file}')
    if file in {'data/coverage/record-mappings.json','data/releases/index.json'}:
        outputs[file] = read(left, file) # Replaced by standard generators before validation.
    else:
        outputs[file] = merge(read(base,file), read(left,file), read(right,file))

registry = outputs['data/coverage/research-questions.json']
registry['corpus_version'] = registry['question_set_version'] = version
criteria_file = 'data/coverage/research-criteria.json'
criteria = outputs.get(criteria_file, read(left, criteria_file))
criteria['population']['named_research_questions'] = len(registry['questions'])
outputs[criteria_file] = criteria
catalog = outputs['data/catalog.json']
catalog['corpus_version'] = version
catalog['coverage_note'] = (
    'The 2026-09-19.12401 edition integrates ten role-qualified US institutional and regulated questions '
    'and five US extractive questions, with separate synthetic role-routing and production-to-settlement examples. '
    'Accepted education tuition and aid, assurance, reporting, nonprofit, operating, management and agent-evidence work remains. '
    'Framework, entity role, source edition, current applicability, rights and operational limits remain explicit. '
    'The 96 subsector profiles and 1,012 industry exception reviews remain; no whole family or industry is assessed sufficient.'
)
catalog['review_note'] = (
    f'Edition 2026-09-19.12401 reconciles institutional integration {left} and corrected extractive source {right} '
    f'on accepted main {base}. Institutional source137e04f and extractive source78bf0aa have separate scoped review receipts; '
    'integrated-commit acceptance is recorded separately. Prior releases and coverage snapshots, including institutional1115 '
    'and extractive9801 through9804, remain immutable. Historical accounting amendments and source-year guidance do not '
    'establish current consolidated authority or later compliance. Unknown rights and current applicability remain unknown. '
    'Professional review, operational completeness, empirical agent performance and deployment are not established.'
)

# Assert that every record and snapshot from either input survives unchanged unless
# its only change was the independent, non-conflicting other package extension.
for file in ['data/corpus/source.json','data/corpus/guide.json','data/corpus/example.json']:
    merged = outputs.get(file)
    if merged is None:
        continue
    records = {x['id']:x for x in merged}
    prior = {x['id']:x for x in read(base,file)}
    for rev in (left,right):
        for record in read(rev,file):
            if record != prior.get(record['id']):
                assert records[record['id']] == record, f'Changed package record: {record["id"]}'
history = outputs['data/coverage/snapshots.json']['snapshots']
by_id = {x['id']:x for x in history}
for rev in (left,right):
    for snapshot in read(rev,'data/coverage/snapshots.json')['snapshots']:
        assert by_id[snapshot['id']] == snapshot, f'Changed snapshot: {snapshot["id"]}'

for file, value in outputs.items():
    original = git('show',f'{left}:{file}').decode()
    p = destination/file
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(value,indent=2,ensure_ascii=not any(ord(c)>127 for c in original))+'\n')
(destination/'files.json').write_text(json.dumps(list(outputs),indent=2)+'\n')
print(f'Prepared {len(outputs)} strict semantic resolutions; retained {len(history)} input snapshots. No checkout written.')
