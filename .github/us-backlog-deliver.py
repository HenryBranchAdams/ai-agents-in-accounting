"""Temporary, branch-only transport for the inspected nonprofit repair."""
import base64
import gzip
import hashlib
import json
from pathlib import Path
import re
import subprocess


def run(*args):
    subprocess.run(args, check=True)


def output(*args):
    return subprocess.check_output(args, text=True).strip()


def read(path):
    return json.loads(Path(path).read_text())


def allowed(path):
    return bool(re.fullmatch(r'(?:data|docs|scripts|tests|schemas)/[A-Za-z0-9_./-]+', path)) and '..' not in Path(path).parts


def verify(hashes):
    for path, digest in hashes.items():
        if not allowed(path) or not re.fullmatch('[a-f0-9]{64}', digest):
            raise SystemExit('Invalid output declaration: ' + path)
        if hashlib.sha256(Path(path).read_bytes()).hexdigest() != digest:
            raise SystemExit('Output hash mismatch: ' + path)


def apply(spec, parts, label):
    encoded = ''.join(Path(p).read_text().strip() for p in parts)
    if len(encoded) > 4000000:
        raise SystemExit('Transport too large')
    patch = gzip.decompress(base64.b64decode(encoded, validate=True))
    if len(patch) > 100000000 or hashlib.sha256(patch).hexdigest() != spec['patch_sha256']:
        raise SystemExit('Patch digest mismatch: ' + label)
    target = Path('/tmp/nonprofit-' + label + '.patch')
    target.write_bytes(patch)
    paths = [line.split('\t', 2)[2] for line in output('git', 'apply', '--numstat', str(target)).splitlines()]
    if sorted(paths) != sorted(spec['changed_paths']) or len(paths) != len(set(paths)) or not all(map(allowed, paths)):
        raise SystemExit('Patch path mismatch: ' + label)
    run('git', 'apply', '--check', '--index', str(target))
    run('git', 'apply', '--index', str(target))


spec = read('.github/us-backlog-repair.json')
base = '63d1241422b160de42f2588ee57f20a3cb79e711'
if spec['expected_base'] != base:
    raise SystemExit('Unexpected recovery base')
run('git', 'merge-base', '--is-ancestor', base, 'HEAD')
parts = [f'.github/us-backlog-repair.part{i}' for i in range(1, 6)]
if spec['parts'] != parts:
    raise SystemExit('Unexpected repair part population')
original_parts = [f'.github/us-backlog-patch.part{i}' for i in range(1, 5)]
cleanup = original_parts + parts + ['.github/us-backlog-patch.json', '.github/us-backlog-repair.json', '.github/us-backlog-deliver.py']
changed = output('git', 'diff', '--name-only', base, 'HEAD').splitlines()
if not set(changed) <= set(cleanup + ['.github/workflows/us-backlog-authoring.yml']):
    raise SystemExit('Unrelated work arrived; reconcile before delivery')
if read('data/catalog.json')['corpus_version'] != '2026-09-14.3':
    raise SystemExit('Untouched baseline is required')

# Preserve the actual original edition, never a reconstruction from changed records.
run('npm', 'run', 'build')
run('node', 'scripts/release-history.mjs', 'dist/client/downloads/corpus.json', 'data/releases/2026-09-14.2/corpus.json')
original = read('.github/us-backlog-patch.json')
run('git', 'merge-base', '--is-ancestor', original['expected_parent'], 'HEAD')
apply(original, original_parts, 'original')
verify(original['expected_output_sha256'])
apply(spec, parts, 'repair')
# The inspected recovery has one extra EOF blank line; normalize only this file.
ledger = Path('docs/research/us-backlog-execution-2026-09-16.md')
ledger.write_text(ledger.read_text().rstrip() + '\n')
run('node', 'scripts/coverage-mappings.mjs')
if spec['snapshot_id'] != '2026-09-16.1' or spec['snapshot_recorded_at'] != '2026-09-17':
    raise SystemExit('Unexpected snapshot identity')
run('node', 'scripts/coverage-snapshot.mjs', spec['snapshot_id'])
p = Path('data/coverage/snapshots.json')
history = read(p)
# Pin the date of the locally measured identical-input snapshot; retain every prior row.
if history['snapshots'][-1]['id'] != spec['snapshot_id']:
    raise SystemExit('Snapshot append failed')
history['snapshots'][-1]['recorded_at'] = spec['snapshot_recorded_at']
p.write_text(json.dumps(history, separators=(',', ':')) + '\n')
verify(spec['expected_output_sha256'])

# Remove only this assignment's data transports. The connector removes the workflow
# after this commit, avoiding any assumption of workflow-write rights for GITHUB_TOKEN.
for path in cleanup:
    Path(path).unlink()
run('git', 'add', '--', *sorted(spec['expected_output_sha256']), *cleanup)
expected = set(spec['expected_output_sha256']) | set(cleanup)
if set(output('git', 'diff', '--cached', '--name-only').splitlines()) != expected:
    raise SystemExit('Staged file population mismatch')
for line in output('git', 'diff', '--cached', '--raw').splitlines():
    if line.split()[1] not in ('100644', '000000'):
        raise SystemExit('Only ordinary files and declared transport removals are permitted')
print('Recovered and hash-verified all', len(spec['expected_output_sha256']), 'canonical, release, test and evidence outputs.')
