import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const base = '1a44d89f600cc11a3e23fff6f7548197ece7fec3';
const packetFiles = ['tax-foundations-2026-09-18', 'tax-foundations-example-2026-09-18', 'tax-foundations-inventory-2026-09-18'].map(name => `data/research/${name}.json`);
const files = ['data/catalog.json', 'data/corpus/source.json', 'data/corpus/guide.json', 'data/corpus/example.json',
  ...['research-questions', 'assessments', 'mapping-overrides', 'record-mappings', 'research-criteria', 'subsector-profiles', 'subsector-screening'].map(name => `data/coverage/${name}.json`),
  'data/research-questions.json', 'data/research/foundations.json', ...packetFiles];
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const bytes = root => files.map(file => [file, fs.readFileSync(path.join(root, file))]);
const script = path.resolve('scripts/apply-tax-foundations.mjs');
const run = (root, mode = '--current') => execFileSync(process.execPath, [script, mode], { cwd: root, env: { ...process.env, TAX_FOUNDATIONS_ROOT: root }, stdio: 'pipe' });
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aa-int122-'));
  for (const file of files) {
    const destination = path.join(root, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, packetFiles.includes(file) ? fs.readFileSync(file) : execFileSync('git', ['show', `${base}:${file}`], { maxBuffer: 24 * 1024 * 1024 }));
  }
  return root;
}

test('current tax integration preserves earlier questions, sources and unrelated records', () => {
  const root = fixture();
  try {
    const packet = read(path.join(root, packetFiles[0]));
    const guideIds = new Set(packet.families.map(family => family.guide_id));
    const before = new Map(['source', 'guide', 'example'].map(kind => [kind, read(path.join(root, `data/corpus/${kind}.json`))]));
    const questions = read(path.join(root, 'data/coverage/research-questions.json')).questions;
    run(root);
    for (const [kind, rows] of before) {
      const actual = new Map(read(path.join(root, `data/corpus/${kind}.json`)).map(row => [row.id, row]));
      for (const prior of rows) {
        const current = actual.get(prior.id);
        assert.ok(current, prior.id);
        if (kind === 'guide' && guideIds.has(prior.id)) {
          assert.deepEqual(current.rights, prior.rights);
          for (const question of prior.data.research_questions) assert.deepEqual(current.data.research_questions.find(q => q.id === question.id), question);
          for (const id of prior.source_ids) assert.ok(current.source_ids.includes(id));
          for (const id of prior.related_ids) assert.ok(current.related_ids.includes(id));
        } else assert.deepEqual(current, prior, prior.id);
      }
    }
    const registry = read(path.join(root, 'data/coverage/research-questions.json')).questions;
    for (const question of questions) assert.deepEqual(registry.find(q => q.id === question.id), question);
    const first = bytes(root);
    run(root);
    assert.deepEqual(bytes(root), first);
    const foundationsPath = path.join(root, 'data/research/foundations.json');
    const marker = read(foundationsPath).aa_i122;
    const catalogPath = path.join(root, 'data/catalog.json');
    const catalog = read(catalogPath); catalog.corpus_version = '2099-01-01.1';
    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
    run(root, '--integrate-into-newer-corpus');
    assert.deepEqual(read(foundationsPath).aa_i122, marker, 'Later corpus editions must retain the first integration provenance');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('current tax integration fails before writes on an unknown edition or conflicting source', () => {
  for (const defect of ['edition', 'source']) {
    const root = fixture();
    try {
      if (defect === 'source') run(root);
      const file = defect === 'edition' ? 'data/catalog.json' : 'data/corpus/source.json';
      const value = read(path.join(root, file));
      if (defect === 'edition') value.corpus_version = '2099-01-01.1';
      else value.find(source => source.id === read(path.join(root, packetFiles[0])).sources[0].id).summary = 'Deliberate conflicting source';
      fs.writeFileSync(path.join(root, file), JSON.stringify(value, null, 2) + '\n');
      const before = bytes(root);
      const result = spawnSync(process.execPath, [script, '--current'], { cwd: root, env: { ...process.env, TAX_FOUNDATIONS_ROOT: root }, encoding: 'utf8' });
      assert.notEqual(result.status, 0, defect);
      assert.deepEqual(bytes(root), before);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  }
});
