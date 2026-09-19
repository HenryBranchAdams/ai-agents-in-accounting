import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.env.AA_REAL_ESTATE_ROOT || process.cwd();
const resolve = relative => path.join(root, relative);
const read = relative => JSON.parse(fs.readFileSync(resolve(relative), 'utf8'));
const writeBody = value => JSON.stringify(value, null, 2) + '\n';
const packet = read('data/research/real-estate-2026-09-19.json');
const dryRun = process.argv.includes('--dry-run');
const applyFixture = process.argv.includes('--apply-source-fixture');

assert.equal(packet.status, 'source-only-pending-integration');
assert.equal(packet.integration_contract.source_only, true);
assert.equal(packet.integration_contract.catalog_write, false);
assert.equal(packet.integration_contract.release_write, false);
assert.equal(packet.integration_contract.snapshot_write, false);
assert.equal(packet.integration_contract.archive_write, false);
assert.notEqual(packet.package_version, packet.current_corpus_version);
if (!dryRun && !applyFixture) throw new Error('Refusing to write: use --dry-run or --apply-source-fixture in a disposable fixture.');

const files = {
  source: 'data/corpus/source.json', guide: 'data/corpus/guide.json', workflow: 'data/corpus/workflow.json',
  control: 'data/corpus/control.json', example: 'data/corpus/example.json',
  questions: 'data/coverage/research-questions.json', assessments: 'data/coverage/assessments.json', mappings: 'data/coverage/mapping-overrides.json',
};
for (const file of Object.values(files)) assert.ok(fs.existsSync(resolve(file)), `Missing integration target ${file}`);
const corpus = Object.fromEntries(Object.entries(files).filter(([kind]) => ['source','guide','workflow','control','example'].includes(kind)).map(([kind,file]) => [kind, read(file)]));
const questions = read(files.questions);
const assessments = read(files.assessments);
const mappings = read(files.mappings);
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const conflicts = [];
const conflict = (target, reason, current, incoming) => conflicts.push({target, reason, current, incoming});
const index = new Map();
for (const [kind, rows] of Object.entries(corpus)) for (const row of rows) {
  if (index.has(row.id)) conflict(`record:${row.id}`, 'duplicate-existing-stable-id', index.get(row.id), kind);
  index.set(row.id, {kind, row});
}
const sourceUrls = new Map(corpus.source.filter(row => row.source_url).map(row => [row.source_url, row.id]));
for (const source of packet.sources) {
  assert.equal(source.kind, 'source');
  const prior = sourceUrls.get(source.source_url);
  if (prior && prior !== source.id) conflict(`source-url:${source.source_url}`, 'different-stable-id-for-source-url', prior, source.id);
  const current = index.get(source.id)?.row;
  if (current && !same(current, source)) conflict(`source:${source.id}`, 'existing-record-differs', current, source);
  if (!current) { corpus.source.push(structuredClone(source)); index.set(source.id, {kind:'source', row:source}); sourceUrls.set(source.source_url, source.id); }
}
const knownSources = new Set(corpus.source.map(row => row.id));
const sourceUrlById = new Map(corpus.source.filter(row => row.source_url).map(row => [row.id, row.source_url]));
for (const source of packet.sources) for (const locator of source.data?.locators || []) if (locator.url) assert.equal(locator.url, source.source_url, `${source.id}: locator URL mismatch`);
for (const row of packet.question_rows) {
  for (const sourceId of row.source_ids || []) assert.ok(knownSources.has(sourceId), `${row.id}: unknown source ${sourceId}`);
  for (const locator of row.source_locators || []) {
    assert.ok(knownSources.has(locator.source_id), `${row.id}: unknown locator source ${locator.source_id}`);
    if (locator.url) assert.equal(locator.url, sourceUrlById.get(locator.source_id), `${row.id}: locator URL mismatch`);
  }
}
for (const incoming of packet.records) {
  assert.ok(corpus[incoming.kind], `Unsupported record kind ${incoming.kind}`);
  for (const sourceId of incoming.source_ids || []) assert.ok(knownSources.has(sourceId), `${incoming.id}: unknown source ${sourceId}`);
  const current = index.get(incoming.id)?.row;
  if (current && !same(current, incoming)) conflict(`${incoming.kind}:${incoming.id}`, 'existing-record-differs', current, incoming);
  if (!current) { corpus[incoming.kind].push(structuredClone(incoming)); index.set(incoming.id, {kind:incoming.kind,row:incoming}); }
}
const addById = (rows, incoming, target) => {
  const current = rows.find(row => row.id === incoming.id);
  if (current && !same(current, incoming)) conflict(`${target}:${incoming.id}`, 'existing-row-differs', current, incoming);
  if (!current) rows.push(structuredClone(incoming));
};
for (const incoming of packet.question_rows) addById(questions.questions, incoming, 'research-question');
for (const incoming of packet.assessments) addById(assessments.assessments, incoming, 'assessment');
for (const [id, incoming] of Object.entries(packet.mapping_overrides)) {
  const current = mappings.records[id];
  if (current && !same(current, incoming)) conflict(`mapping:${id}`, 'existing-mapping-differs', current, incoming);
  if (!current) mappings.records[id] = structuredClone(incoming);
}
assert.equal(conflicts.length, 0, JSON.stringify({message:'Real-estate integration preflight conflicts; no files written.', conflicts}, null, 2));
const staged = new Map();
for (const [kind,file] of Object.entries(files)) {
  if (['source','guide','workflow','control','example'].includes(kind)) staged.set(file, writeBody(corpus[kind]));
}
staged.set(files.questions, writeBody(questions));
staged.set(files.assessments, writeBody(assessments));
staged.set(files.mappings, writeBody(mappings));
if (!dryRun && applyFixture) for (const [file, body] of staged) if (fs.readFileSync(resolve(file), 'utf8') !== body) fs.writeFileSync(resolve(file), body);
console.log(JSON.stringify({mode:dryRun?'dry-run':'applied',package_version:packet.package_version,candidate_sources:packet.sources.length,candidate_records:packet.records.length,candidate_questions:packet.question_rows.length,candidate_assessments:packet.assessments.length,candidate_mappings:Object.keys(packet.mapping_overrides).length,staged_files:[...staged.keys()]}, null, 2));
