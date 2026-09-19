import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const files = [
  'data/catalog.json', 'data/corpus/source.json', 'data/corpus/guide.json',
  'data/corpus/example.json', 'data/coverage/research-questions.json',
  'data/coverage/assessments.json', 'data/coverage/mapping-overrides.json',
  'data/coverage/research-criteria.json', 'data/coverage/subsector-profiles.json',
  'data/coverage/subsector-screening.json', 'data/research/institutional-regulated-124.json',
];
const script = path.resolve('scripts/integrate-aa-i124.mjs');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (root, file, value) => fs.writeFileSync(path.join(root, file), JSON.stringify(value, null, 2) + '\n');
const bytes = root => files.map(file => [file, fs.readFileSync(path.join(root, file))]);
const run = root => execFileSync(process.execPath, [script], { cwd: root, stdio: 'pipe' });
function harness() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aa-int124-preservation-'));
  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.copyFileSync(file, path.join(root, file));
  }
  return root;
}

test('institutional integration adds absent records while preserving accepted education and unrelated records', () => {
  const root = harness();
  try {
    const packet = read(path.join(root, files.at(-1)));
    const owned = new Set([packet.guide.id, packet.example.id, ...packet.sources.map(s => s.id)]);
    const before = new Map();
    for (const kind of ['source', 'guide', 'example']) {
      const file = `data/corpus/${kind}.json`;
      const records = read(path.join(root, file)).filter(r => !owned.has(r.id));
      if (kind === 'guide') for (const r of records) r.related_ids = r.related_ids.filter(id => id !== packet.guide.id);
      before.set(kind, structuredClone(records));
      write(root, file, records);
    }
    const registryFile = 'data/coverage/research-questions.json';
    const registry = read(path.join(root, registryFile));
    registry.questions = registry.questions.filter(q => q.record_id !== packet.guide.id);
    write(root, registryFile, registry);
    const assessmentFile = 'data/coverage/assessments.json';
    const assessments = read(path.join(root, assessmentFile));
    assessments.assessments = assessments.assessments.filter(a => !a.id.startsWith('coverage-aa-i124-'));
    write(root, assessmentFile, assessments);
    const overrideFile = 'data/coverage/mapping-overrides.json';
    const overrides = read(path.join(root, overrideFile));
    for (const id of owned) delete overrides.records[id];
    write(root, overrideFile, overrides);
    run(root);
    const linked = new Set(packet.baseline_inventory.map(row => row.existing_guide_id));
    for (const [kind, records] of before) {
      const actual = new Map(read(path.join(root, `data/corpus/${kind}.json`)).map(r => [r.id, r]));
      for (const prior of records) {
        const expected = structuredClone(prior);
        if (kind === 'guide' && linked.has(prior.id)) expected.related_ids.push(packet.guide.id);
        assert.deepEqual(actual.get(prior.id), expected, `preserve ${prior.id}`);
      }
    }
    const first = bytes(root);
    run(root);
    assert.deepEqual(bytes(root), first, 'a replay must preserve every written byte');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('institutional integration rejects a late mapping conflict before writing any canonical file', () => {
  const root = harness();
  try {
    const packet = read(path.join(root, files.at(-1)));
    const file = 'data/coverage/mapping-overrides.json';
    const overrides = read(path.join(root, file));
    overrides.records[packet.sources.at(-1).id].industry_codes = ['23'];
    write(root, file, overrides);
    const before = bytes(root);
    assert.throws(() => run(root));
    assert.deepEqual(bytes(root), before, 'a conflict must not partially apply the package');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('institutional integration refuses an unrecognized corpus edition without writes', () => {
  const root = harness();
  try {
    const catalog = read(path.join(root, files[0]));
    catalog.corpus_version = '2099-01-01.1';
    write(root, files[0], catalog);
    const before = bytes(root);
    assert.throws(() => run(root), /Refuse integration/);
    assert.deepEqual(bytes(root), before);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
