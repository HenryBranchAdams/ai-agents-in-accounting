import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const serialize = (value) => JSON.stringify(value, null, 2) + '\n';
const packet = read('data/research/finance-insurance-2026-09-19.json');
const staged = new Map();
const currentMode = process.argv.includes('--current');
const version = '2026-09-19.12424';
const catalog = currentMode ? read('data/catalog.json') : null;
if (currentMode) assert.ok(['2026-09-19.12422','2026-09-19.12423', version].includes(catalog.corpus_version), 'Refuse unexpected finance current edition before writes');
const sourceFile = 'data/corpus/source.json';
const registryFile = 'data/coverage/research-questions.json';
const assessmentsFile = 'data/coverage/assessments.json';
const overridesFile = 'data/coverage/mapping-overrides.json';
const canonicalKinds = ['source', 'guide', 'workflow', 'control', 'example'];
const add = (list, value) => {
  const matches = list.filter((candidate) => candidate.id === value.id);
  assert.ok(matches.length < 2, `Refuse duplicate stable ID ${value.id}`);
  if (matches[0]) assert.deepEqual(matches[0], value, `Refuse overwrite of ${value.id}`);
  else list.push(value);
};
const stage = (file, value) => staged.set(file, serialize(value));

assert.equal(packet.status, 'source-only-pending-integration');
assert.notEqual(packet.package_version, packet.corpus_version, 'Package and corpus versions must remain distinct.');
assert.equal(packet.baseline_commit, 'd07dd357b9b8faa1ba32cb534c8397030364d3fd');
assert.equal(packet.scope?.roles?.length, 4);
assert.equal(packet.sources.length, 4);
assert.equal(packet.records.length, 4);
assert.equal(packet.question_rows.length, 4);
assert.equal(packet.assessments.length, 4);
assert.ok(process.argv.includes('--applied') || process.argv.includes('--dry-run'), 'Source helper requires --applied in a disposable fixture or --dry-run.');

const existing = new Map();
for (const kind of canonicalKinds) {
  const file = `data/corpus/${kind}.json`;
  for (const record of read(file)) existing.set(record.id, record);
}
for (const id of packet.reused_foundations) assert.ok(existing.has(id), `Missing accepted foundation ${id}`);

const sourceList = read(sourceFile);
const sourceUrls = new Map(sourceList.filter((r) => r.kind === 'source' && r.source_url).map((r) => [r.source_url, r.id]));
for (const review of packet.reused_source_reviews) {
  const prior = existing.get(review.source_id);
  assert.ok(prior?.kind === 'source', `Missing reused source ${review.source_id}`);
  assert.equal(prior.source_url, review.url, `Reused source URL mismatch: ${review.source_id}`);
  assert.ok(review.locator && review.effective_period && review.access_limits);
}
for (const record of packet.sources) {
  assert.equal(record.data.id, record.id, `Source primary metadata ID mismatch: ${record.id}`);
  const prior = sourceUrls.get(record.source_url);
  assert.ok(!prior || prior === record.id, `Source URL already has a different stable ID: ${record.source_url}`);
  sourceUrls.set(record.source_url, record.id);
  add(sourceList, record);
}
for (const record of packet.records) {
  assert.equal(record.data.id, record.id, `Record primary metadata ID mismatch: ${record.id}`);
  add(read(`data/corpus/${record.kind}.json`), record);
}
const sourceIds = new Set(sourceList.map((record) => record.id));
for (const record of packet.records) for (const sourceId of record.source_ids) assert.ok(sourceIds.has(sourceId), `Dangling source ID ${sourceId}`);
for (const row of packet.question_rows) {
  const guide = packet.records.find(r => r.id === row.record_id);
  assert.deepEqual(row.pointer.split('/').slice(1).reduce((v, key) => v?.[key], guide), row, `Question pointer mismatch ${row.id}`);
  for (const sourceId of row.source_ids) assert.ok(sourceIds.has(sourceId), `Dangling question source ID ${sourceId}`);
  for (const locator of row.source_locators) assert.equal(locator.url, sourceList.find((s) => s.id === locator.source_id)?.source_url, `Locator URL identity mismatch: ${locator.source_id}`);
}

// Re-read and stage all lists only after every stable-ID, URL and reference check passes.
const finalLists = {};
finalLists[sourceFile] = sourceList;
for (const kind of ['guide', 'workflow', 'control', 'example']) {
  const file = `data/corpus/${kind}.json`;
  const list = read(file);
  for (const record of packet.records.filter((candidate) => candidate.kind === kind)) add(list, record);
  finalLists[file] = list;
}
const registry = read(registryFile);
for (const row of packet.question_rows) add(registry.questions, row);
const assessments = read(assessmentsFile);
for (const assessment of packet.assessments) add(assessments.assessments, assessment);
const overrides = read(overridesFile);
for (const [id, value] of Object.entries(packet.mapping_overrides.records)) {
  if (overrides.records[id]) assert.deepEqual(overrides.records[id], value, `Refuse overwrite of mapping override ${id}`);
  else overrides.records[id] = value;
}
for (const [file, value] of Object.entries(finalLists)) stage(file, value);
stage(registryFile, registry);
stage(assessmentsFile, assessments);
stage(overridesFile, overrides);

if (currentMode) {
  const note = ` Edition ${version} adds selected US finance, insurance and healthcare role questions with connected synthetic evidence.`;
  const review = ` Edition ${version} preserves earlier records and rights, source-specific authority limits and separate accounting and regulatory roles.`;
  if (!catalog.coverage_note.includes(note)) catalog.coverage_note += note;
  if (!catalog.review_note.includes(review)) catalog.review_note += review;
  catalog.corpus_version = version;
  registry.corpus_version = version; registry.question_set_version = version;
  assessments.assessment_version = version;
  overrides.mapping_version = version; overrides.updated_at = packet.reviewed_at;
  stage('data/catalog.json', catalog); stage(registryFile, registry); stage(assessmentsFile, assessments); stage(overridesFile, overrides);
  const criteria = read('data/coverage/research-criteria.json'); criteria.population.named_research_questions = registry.questions.length; stage('data/coverage/research-criteria.json', criteria);
  for (const file of ['data/coverage/subsector-profiles.json', 'data/coverage/subsector-screening.json']) { const value = read(file); value.corpus_version = version; stage(file, value); }
  const fixtures = read('data/research-questions.json');
  for (const row of read('data/research/finance-insurance-retrieval-2026-09-19.json')) add(fixtures, row);
  stage('data/research-questions.json', fixtures);
}

const summary = { dry_run: process.argv.includes('--dry-run'), applied: process.argv.includes('--applied'), package_version: packet.package_version, files: [...staged.keys()], sources: packet.sources.length, records: packet.records.length, questions: packet.question_rows.length, assessments: packet.assessments.length, catalog_changed: currentMode };
if (summary.applied && !summary.dry_run) for (const [file, content] of staged) {
  if (fs.existsSync(file) && JSON.stringify(read(file)) === JSON.stringify(JSON.parse(content))) continue;
  fs.writeFileSync(file, content);
}
console.log(JSON.stringify(summary, null, 2));
