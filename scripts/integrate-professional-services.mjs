import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = process.env.AA_PROFESSIONAL_SERVICES_ROOT || process.cwd();
const resolve = file => path.join(root, file);
const read = file => JSON.parse(fs.readFileSync(resolve(file), 'utf8'));
const packet = read('data/research/professional-services-2026-09-19.json');
const dryRun = process.argv.includes('--dry-run');
const apply = process.argv.includes('--apply') || (!dryRun && process.argv.includes('--write'));
const applied = process.argv.includes('--applied');
const expectedBase = process.env.AA_PROFESSIONAL_SERVICES_EXPECTED_BASE || packet.integration_contract.required_base_commit;
const files = {
  catalog: 'data/catalog.json',
  source: 'data/corpus/source.json',
  guide: 'data/corpus/guide.json',
  workflow: 'data/corpus/workflow.json',
  control: 'data/corpus/control.json',
  example: 'data/corpus/example.json',
  questions: 'data/coverage/research-questions.json',
  assessments: 'data/coverage/assessments.json',
  mappings: 'data/coverage/mapping-overrides.json',
  criteria: 'data/coverage/research-criteria.json',
};

const array = value => Array.isArray(value) ? value : value.records || value.questions || value.assessments || value.data || [];
const serialize = (file, value) => {
  const original = fs.readFileSync(resolve(file), 'utf8');
  let body = JSON.stringify(value, null, 2) + '\n';
  if (!/[^\x00-\x7f]/.test(original) && /\\u[0-9a-f]{4}/i.test(original)) {
    body = body.replace(/[\u007f-\uFFFF]/g, ch => `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`);
  }
  return body;
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const rootGitHead = () => {
  try { return execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; }
};

assert.equal(packet.status, 'source-only-pending-integration');
assert.notEqual(packet.package_version, packet.current_corpus_version);
assert.equal(packet.integration_contract.source_only, true);
assert.equal(packet.integration_contract.additive_only, true);
assert.equal(packet.integration_contract.catalog_write, false);
assert.equal(packet.integration_contract.release_write, false);
assert.equal(packet.integration_contract.canonical_write, false);
assert.equal(packet.integration_contract.required_base_commit, expectedBase);
if (apply) {
  const actual = rootGitHead();
  if (actual) assert.equal(actual, expectedBase, `Refusing apply from unexpected base ${actual}; expected ${expectedBase}.`);
  else assert.equal(process.env.AA_PROFESSIONAL_SERVICES_BASE_COMMIT, expectedBase, 'Apply requires an explicit disposable-harness base commit.');
}
for (const file of Object.values(files)) assert.ok(fs.existsSync(resolve(file)), `Missing integration target ${file}`);

const catalogBefore = fs.readFileSync(resolve(files.catalog));
const corpus = Object.fromEntries(['source', 'guide', 'workflow', 'control', 'example'].map(kind => [kind, array(read(files[kind]))]));
const questions = read(files.questions);
const assessments = read(files.assessments);
const mappings = read(files.mappings);
const conflicts = [];
const conflict = (target, reason, current, incoming) => conflicts.push({ target, reason, current, incoming });
const index = new Map();
for (const [kind, rows] of Object.entries(corpus)) for (const row of rows) {
  if (index.has(row.id)) conflict(`record:${row.id}`, 'duplicate-existing-stable-id', index.get(row.id), kind);
  index.set(row.id, { kind, row });
}
const sourceUrls = new Map(corpus.source.filter(row => row.source_url).map(row => [row.source_url, row.id]));
const stage = new Map();
const addRecord = incoming => {
  assert.ok(corpus[incoming.kind], `Unsupported record kind ${incoming.kind}`);
  assert.ok(incoming.data && incoming.data.id === incoming.id, `${incoming.id}: primary data.id must preserve stable ID`);
  if (incoming.kind === 'source') {
    assert.ok(incoming.source_url, `${incoming.id}: source URL required`);
    assert.equal(incoming.data.source_review?.record_id, incoming.id, `${incoming.id}: source review primary metadata mismatch`);
    assert.equal(incoming.data.source_review?.checked_url, incoming.source_url, `${incoming.id}: source review URL mismatch`);
    const priorUrl = sourceUrls.get(incoming.source_url);
    if (priorUrl && priorUrl !== incoming.id) conflict(`source-url:${incoming.source_url}`, 'different-stable-id-for-source-url', priorUrl, incoming.id);
  }
  const prior = index.get(incoming.id)?.row;
  if (prior && !same(prior, incoming)) conflict(`${incoming.kind}:${incoming.id}`, 'existing-record-differs', prior, incoming);
  if (!prior) { corpus[incoming.kind].push(structuredClone(incoming)); index.set(incoming.id, { kind: incoming.kind, row: incoming }); }
  if (incoming.kind === 'source') sourceUrls.set(incoming.source_url, incoming.id);
};
for (const incoming of packet.sources) addRecord(incoming);
for (const incoming of packet.records) addRecord(incoming);
const knownSources = new Set(corpus.source.map(row => row.id));
for (const incoming of packet.records) for (const id of incoming.source_ids || []) assert.ok(knownSources.has(id), `${incoming.id}: unknown source ${id}`);
for (const incoming of packet.sources) for (const locator of incoming.data.locators || []) {
  assert.equal(locator.url, incoming.source_url, `${incoming.id}: locator URL differs from source URL`);
  assert.ok(locator.locator && locator.source_period !== undefined, `${incoming.id}: locator lacks exact text and source period`);
}
for (const q of packet.question_rows) {
  assert.ok(q.dimensions && Object.keys(q.dimensions).length >= 5, `${q.id}: dimensions required`);
  for (const id of q.source_ids) assert.ok(knownSources.has(id), `${q.id}: unknown source ${id}`);
  for (const locator of q.source_locators || []) {
    const source = corpus.source.find(row => row.id === locator.source_id);
    assert.ok(source, `${q.id}: missing locator source ${locator.source_id}`);
    assert.equal(locator.url, source.source_url, `${q.id}: locator URL differs from source URL`);
  }
}
const addById = (rows, incoming, target) => {
  const prior = rows.find(row => row.id === incoming.id);
  if (prior && !same(prior, incoming)) conflict(`${target}:${incoming.id}`, 'existing-row-differs', prior, incoming);
  if (!prior) rows.push(structuredClone(incoming));
};
for (const q of packet.question_rows) addById(questions.questions, q, 'research-question');
for (const a of packet.assessments) addById(assessments.assessments, a, 'assessment');
const mappingRows = mappings.records || mappings;
for (const [id, incoming] of Object.entries(packet.mapping_overrides)) {
  const prior = mappingRows[id];
  if (prior && !same(prior, incoming)) conflict(`mapping:${id}`, 'existing-mapping-differs', prior, incoming);
  if (!prior) mappingRows[id] = structuredClone(incoming);
}
assert.equal(conflicts.length, 0, JSON.stringify({ message: 'Professional-services integration preflight conflicts; no files written.', conflicts }, null, 2));
for (const [kind, file] of Object.entries(files)) {
  if (['source', 'guide', 'workflow', 'control', 'example'].includes(kind)) stage.set(file, serialize(file, corpus[kind]));
}
stage.set(files.questions, serialize(files.questions, questions));
stage.set(files.assessments, serialize(files.assessments, assessments));
stage.set(files.mappings, serialize(files.mappings, mappings));
if (applied) {
  const criteria = read(files.criteria);
  criteria.population.named_research_questions = questions.questions.length;
  stage.set(files.criteria, serialize(files.criteria, criteria));
}
assert.deepEqual(fs.readFileSync(resolve(files.catalog)), catalogBefore, 'Source-only helper must never stage or write catalog changes.');
if (apply && !dryRun) for (const [file, body] of stage) if (fs.readFileSync(resolve(file), 'utf8') !== body) fs.writeFileSync(resolve(file), body);
console.log(JSON.stringify({ mode: apply && !dryRun ? 'applied' : 'dry-run', package_version: packet.package_version, corpus_version_preserved: read(files.catalog).corpus_version, base_commit: expectedBase, sources: packet.sources.length, records: packet.records.length, questions: packet.question_rows.length, assessments: packet.assessments.length, mappings: Object.keys(packet.mapping_overrides).length, staged_files: [...stage.keys()] }, null, 2));
