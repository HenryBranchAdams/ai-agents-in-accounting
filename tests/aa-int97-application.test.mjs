import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const files = [
  'data/research/agriculture-i97.json', 'data/catalog.json',
  'data/corpus/example.json', 'data/corpus/workflow.json', 'data/corpus/control.json',
  'data/corpus/guide.json', 'data/coverage/assessments.json',
  'data/coverage/mapping-overrides.json', 'data/coverage/research-questions.json',
];
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (root, file, value) => fs.writeFileSync(path.join(root, file), JSON.stringify(value, null, 2) + '\n');
const bytes = root => files.map(file => [file, fs.readFileSync(path.join(root, file))]);
const run = (root, name) => execFileSync(process.execPath, [path.resolve(`scripts/${name}.mjs`)], { cwd: root, stdio: 'pipe' });
function harness() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aa-int97-'));
  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.copyFileSync(file, path.join(root, file));
  }
  const catalog = read(path.join(root, 'data/catalog.json'));
  catalog.corpus_version = '2026-09-19.12402';
  write(root, 'data/catalog.json', catalog);
  return root;
}

test('agriculture application preserves unrelated records and byte-stable replay', () => {
  const root = harness();
  try {
    const pkg = read(path.join(root, files[0]));
    const owned = new Set(pkg.records.map(record => record.id));
    const before = new Map();
    for (const kind of ['example', 'workflow', 'control']) {
      const file = `data/corpus/${kind}.json`;
      const retained = read(path.join(root, file)).filter(record => !owned.has(record.id));
      before.set(file, retained);
      write(root, file, retained);
    }
    run(root, 'integrate-agriculture-i97');
    for (const [file, retained] of before) {
      const actual = read(path.join(root, file));
      assert.deepEqual(actual.filter(record => !owned.has(record.id)), retained);
      for (const record of pkg.records.filter(record => file.endsWith(`/${record.kind}.json`))) {
        assert.deepEqual(actual.find(candidate => candidate.id === record.id), record);
      }
    }
    run(root, 'integrate-agriculture-current');
    const first = bytes(root);
    run(root, 'integrate-agriculture-i97');
    run(root, 'integrate-agriculture-current');
    assert.deepEqual(bytes(root), first);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('agriculture refuses a conflicting mapping without partial record writes', () => {
  const root = harness();
  try {
    const pkg = read(path.join(root, files[0]));
    const file = 'data/coverage/mapping-overrides.json';
    const overrides = read(path.join(root, file));
    overrides.records[Object.keys(pkg.mapping_overrides).at(-1)].industry_codes = ['23'];
    write(root, file, overrides);
    const before = bytes(root);
    assert.throws(() => run(root, 'integrate-agriculture-i97'), /Conflicting mapping/);
    assert.deepEqual(bytes(root), before);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('agriculture current-edition helper preflights late missing mappings before writes', () => {
  const root = harness();
  try {
    const pkg = read(path.join(root, files[0]));
    const file = 'data/coverage/mapping-overrides.json';
    const overrides = read(path.join(root, file));
    delete overrides.records[pkg.families.at(-1).guide_id];
    write(root, file, overrides);
    const before = bytes(root);
    assert.throws(() => run(root, 'integrate-agriculture-current'), /guide mappings/);
    assert.deepEqual(bytes(root), before);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('agriculture current-edition helper refuses an unknown edition before writes', () => {
  const root = harness();
  try {
    const file = 'data/catalog.json';
    const catalog = read(path.join(root, file));
    catalog.corpus_version = '2099-01-01.1';
    write(root, file, catalog);
    const before = bytes(root);
    assert.throws(() => run(root, 'integrate-agriculture-current'), /unrecognized current corpus edition/);
    assert.deepEqual(bytes(root), before);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
