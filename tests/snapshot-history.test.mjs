import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readSnapshotHistory, writeSnapshotHistory } from '../scripts/snapshot-history.mjs';

const json = value => JSON.stringify(value, null, 2) + '\n';
const snapshot = id => ({ id, recorded_at: '2026-09-19', corpus_version: id, inputs_sha256: { source: 'preserved' }, summary: { record_count: 1 } });
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'snapshot-store-'));
  fs.mkdirSync(path.join(root, 'data/coverage'), { recursive: true });
  const history = { schema_version: '1.0.0', snapshots: [snapshot('2026-09-19.2'), snapshot('2026-09-19.10')] };
  fs.writeFileSync(path.join(root, 'data/coverage/snapshots.json'), json(history));
  return { root, history };
}
function bytes(root) {
  const result = {};
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else result[path.relative(root, file)] = fs.readFileSync(file);
    }
  }
  walk(root);
  return result;
}

test('flat history migrates without changing any object and replays without changing bytes', () => {
  const { root, history } = fixture();
  try {
    assert.deepEqual(readSnapshotHistory({ root }), history);
    writeSnapshotHistory(history, { root });
    assert.deepEqual(readSnapshotHistory({ root }), history);
    const first = bytes(root);
    writeSnapshotHistory(history, { root });
    assert.deepEqual(bytes(root), first);
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data/coverage/snapshots.json')));
    assert.deepEqual(manifest.snapshots.map(entry => entry.id), history.snapshots.map(entry => entry.id));
    assert.ok(manifest.snapshots.every(entry => entry.bytes > 0 && /^[a-f0-9]{64}$/.test(entry.sha256)));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('append retains every prior snapshot byte and sorts recovered historical editions numerically', () => {
  const { root, history } = fixture();
  try {
    writeSnapshotHistory(history, { root });
    const before = bytes(root);
    const next = { ...history, snapshots: [...history.snapshots, snapshot('2026-09-19.3')] };
    writeSnapshotHistory(next, { root });
    const actual = readSnapshotHistory({ root });
    assert.deepEqual(actual.snapshots.map(entry => entry.id), ['2026-09-19.2', '2026-09-19.3', '2026-09-19.10']);
    for (const [file, body] of Object.entries(before)) if (file.startsWith('data/coverage/snapshots/')) {
      assert.deepEqual(fs.readFileSync(path.join(root, file)), body);
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('changed, removed or duplicate historical snapshots fail before any file is written', () => {
  const { root, history } = fixture();
  try {
    writeSnapshotHistory(history, { root });
    const before = bytes(root);
    for (const mutate of [
      next => { next.snapshots[1].summary.record_count = 2; },
      next => { next.snapshots.splice(1, 1); },
      next => { next.snapshots.push(next.snapshots[0]); },
    ]) {
      const next = structuredClone(history);
      next.snapshots.unshift(snapshot('2026-09-19.1'));
      mutate(next);
      assert.throws(() => writeSnapshotHistory(next, { root }));
      assert.deepEqual(bytes(root), before);
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('reading refuses changed content, missing files, escaped paths and stale runtime imports', () => {
  for (const defect of ['changed', 'missing', 'path', 'runtime']) {
    const { root, history } = fixture();
    try {
      writeSnapshotHistory(history, { root });
      const file = path.join(root, 'data/coverage/snapshots/2026-09-19.2.json');
      if (defect === 'changed') fs.appendFileSync(file, ' ');
      if (defect === 'missing') fs.unlinkSync(file);
      if (defect === 'runtime') fs.appendFileSync(path.join(root, 'data/coverage/snapshots.generated.ts'), '// stale\n');
      if (defect === 'path') {
        const index = path.join(root, 'data/coverage/snapshots.json');
        const manifest = JSON.parse(fs.readFileSync(index));
        manifest.snapshots[0].path = '../outside.json';
        fs.writeFileSync(index, json(manifest));
      }
      assert.throws(() => readSnapshotHistory({ root }), defect);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  }
});

test('public history keeps the full flat download contract and matches the runtime history', async () => {
  const history = readSnapshotHistory();
  const { default: worker } = await import('./worker-fixture.mjs');
  const downloadResponse = await worker.fetch(new Request('https://corpus.example/downloads/coverage-history.json'), {
    ASSETS: { fetch: async request => {
      const file = `dist/client${new URL(request.url).pathname}`;
      return fs.existsSync(file) ? new Response(fs.readFileSync(file)) : new Response(null, { status: 404 });
    } },
  });
  assert.equal(downloadResponse.status, 200);
  const download = await downloadResponse.json();
  const response = await worker.fetch(new Request('https://corpus.example/api/v1/coverage/history'), { ASSETS: { fetch: async request => new Response(fs.readFileSync(`dist/client${new URL(request.url).pathname}`)) } });
  assert.equal(download.schema_version, '1.0.0');
  assert.deepEqual(download, history);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), history);
});
