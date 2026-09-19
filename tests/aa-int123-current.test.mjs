import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const base = '96076fe134cb5dc344969370b536e193255c8794';
const files = ['data/catalog.json', 'data/corpus/source.json', 'data/corpus/guide.json', 'data/corpus/example.json',
  ...['research-questions', 'assessments', 'mapping-overrides', 'record-mappings', 'research-criteria', 'subsector-profiles', 'subsector-screening'].map(name => `data/coverage/${name}.json`),
  'data/research/source-aliases.json', 'data/research/aa-i123-entity-events.json', 'data/research/aa-i123-inventory.json'];
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const bytes = root => files.map(file => [file, fs.readFileSync(path.join(root, file))]);
const script = path.resolve('scripts/integrate-aa-i123.mjs');
const run = root => execFileSync(process.execPath, [script, '--current'], { cwd: root, stdio: 'pipe' });
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aa-int123-'));
  for (const file of files) {
    const destination = path.join(root, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    const data = file.includes('/aa-i123-') ? fs.readFileSync(file) : execFileSync('git', ['show', `${base}:${file}`], { maxBuffer: 24 * 1024 * 1024 });
    fs.writeFileSync(destination, data);
  }
  return root;
}

test('current entity integration preserves existing records, source metadata and named answers', () => {
  const root = fixture();
  try {
    const packet = read(path.join(root, 'data/research/aa-i123-entity-events.json'));
    const guides = new Set(packet.questions.map(q => `guide-${q.family_id}`));
    const reused = new Set(packet.sources.filter(source => source.reuse).map(source => source.id));
    const before = new Map(['source', 'guide', 'example'].map(kind => [kind, read(path.join(root, `data/corpus/${kind}.json`))]));
    const priorQuestions = read(path.join(root, 'data/coverage/research-questions.json')).questions;
    run(root);
    for (const [kind, rows] of before) {
      const actual = new Map(read(path.join(root, `data/corpus/${kind}.json`)).map(row => [row.id, row]));
      for (const prior of rows) {
        const current = actual.get(prior.id);
        assert.ok(current, prior.id);
        if (kind === 'source' && reused.has(prior.id)) {
          const normalized = structuredClone(current);
          if (prior.data.supplemental_reviews) normalized.data.supplemental_reviews = prior.data.supplemental_reviews;
          else delete normalized.data.supplemental_reviews;
          assert.deepEqual(normalized, prior);
          assert.ok(current.data.supplemental_reviews.some(review => review.batch === 'aa-i123'));
        } else if (kind === 'guide' && guides.has(prior.id)) {
          for (const key of ['provenance', 'rights', 'reviewed_at', 'jurisdiction']) assert.deepEqual(current[key], prior[key]);
          assert.equal(current.data.scope, prior.data.scope);
          for (const question of prior.data.research_questions) assert.deepEqual(current.data.research_questions.find(q => q.id === question.id), question);
          for (const id of prior.related_ids) assert.ok(current.related_ids.includes(id));
        } else assert.deepEqual(current, prior, prior.id);
      }
    }
    const registry = read(path.join(root, 'data/coverage/research-questions.json')).questions;
    for (const question of priorQuestions) assert.deepEqual(registry.find(q => q.id === question.id), question);
    const first = bytes(root);
    run(root);
    assert.deepEqual(bytes(root), first);
    const sources = read(path.join(root, 'data/corpus/source.json'));
    const aliases = read(path.join(root, 'data/research/source-aliases.json'));
    assert.equal(aliases.src_aa_i123_fas143, 'src_us_extractive_fas143_historical');
    assert.equal(sources.find(s => s.id === 'src_aa_i123_fas143').source_url, sources.find(s => s.id === aliases.src_aa_i123_fas143).source_url);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('current entity integration rejects unknown editions and incompatible aliases before writes', () => {
  for (const defect of ['edition', 'alias', 'document']) {
    const root = fixture();
    try {
      const file = defect === 'edition' ? 'data/catalog.json' : defect === 'alias' ? 'data/research/source-aliases.json' : 'data/research/aa-i123-entity-events.json';
      const value = read(path.join(root, file));
      if (defect === 'edition') value.corpus_version = '2099-01-01.1';
      if (defect === 'alias') value.src_aa_i123_fas143 = 'unrelated-source';
      if (defect === 'document') value.sources.find(source => source.id === 'src_aa_i123_fas143').url = 'https://example.com/different-document';
      fs.writeFileSync(path.join(root, file), JSON.stringify(value, null, 2) + '\n');
      const before = bytes(root);
      const result = spawnSync(process.execPath, [script, '--current'], { cwd: root, encoding: 'utf8' });
      assert.notEqual(result.status, 0, defect);
      assert.deepEqual(bytes(root), before, defect);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  }
});
