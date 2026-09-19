import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.env.AA_UTILITIES_ROOT || process.cwd();
const resolve = relative => path.join(root, relative);
const read = relative => JSON.parse(fs.readFileSync(resolve(relative), 'utf8'));
const serialize = (relative, value) => {
  const original = fs.readFileSync(resolve(relative), 'utf8');
  let body = JSON.stringify(value, null, 2) + '\n';
  if (!/[^\x00-\x7f]/.test(original) && /\\u[0-9a-f]{4}/i.test(original)) body = body.replace(/[\u007f-\uFFFF]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
  return body;
};
const packageFile = 'data/research/utilities-2026-09-19.json';
const packet = read(packageFile);
const catalog = read('data/catalog.json');
const inputVersion = catalog.corpus_version;
const reviewedAt = [...packet.sources, ...packet.records].map(record => record.reviewed_at).filter(Boolean).sort().at(-1);
assert.match(reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
const dryRun = process.argv.includes('--dry-run');
const currentIntegration = process.argv.includes('--current');
const version = '2026-09-19.12411';
if (currentIntegration) assert.ok(['2026-09-19.12410', version].includes(catalog.corpus_version), 'Refuse an unrecognized utilities integration edition before writes.');

assert.equal(packet.status, 'source-only-pending-integration', 'Utilities package must remain source-only until applied by a coordinator.');
assert.notEqual(packet.package_version, packet.current_corpus_version, 'Package and corpus versions must remain separate.');
assert.ok(packet.package_version && packet.current_corpus_version, 'Package version metadata is required.');
assert.match(catalog.corpus_version, /^\d{4}-\d{2}-\d{2}\.\d+$/);
assert.ok(catalog.corpus_version.localeCompare(packet.current_corpus_version, 'en', {numeric: true}) >= 0, `Refusing older corpus ${catalog.corpus_version}; package baseline is ${packet.current_corpus_version}.`);
assert.equal(packet.records.filter(record => record.id === 'guide-utilities-us-regulated-close').length, 1);
assert.equal(packet.question_rows.length, packet.records.find(record => record.id === 'guide-utilities-us-regulated-close').data.research_questions.length);

const files = {
  source: 'data/corpus/source.json', guide: 'data/corpus/guide.json', example: 'data/corpus/example.json', workflow: 'data/corpus/workflow.json', control: 'data/corpus/control.json',
  questions: 'data/coverage/research-questions.json', assessments: 'data/coverage/assessments.json', mappings: 'data/coverage/mapping-overrides.json',
};
const staged = new Map();
const stage = (relative, value) => staged.set(relative, serialize(relative, value));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const conflicts = [];
const recordConflict = (target, reason, current, incoming) => conflicts.push({ target, reason, current, incoming });
const addRecord = (list, incoming, target) => {
  const index = list.findIndex(record => record.id === incoming.id);
  if (index < 0) { list.push(structuredClone(incoming)); return; }
  if (!same(list[index], incoming)) recordConflict(`${target}:${incoming.id}`, 'existing-record-differs', list[index], incoming);
};
const addUnique = (list, incoming, target) => {
  const index = list.findIndex(row => row.id === incoming.id);
  if (index < 0) { list.push(structuredClone(incoming)); return; }
  if (!same(list[index], incoming)) recordConflict(`${target}:${incoming.id}`, 'existing-row-differs', list[index], incoming);
};

const corpus = {};
for (const kind of ['source', 'guide', 'example', 'workflow', 'control']) corpus[kind] = read(files[kind]);
const questions = read(files.questions);
const assessments = read(files.assessments);
const mappings = read(files.mappings);

const knownSourceIds = new Set(corpus.source.map(record => record.id));
const sourceUrls = new Map(corpus.source.filter(record => record.source_url).map(record => [record.source_url, record.id]));
for (const source of packet.sources) {
  assert.equal(source.kind, 'source');
  if (sourceUrls.has(source.source_url) && sourceUrls.get(source.source_url) !== source.id) recordConflict(`source-url:${source.source_url}`, 'different-stable-id-for-source-url', sourceUrls.get(source.source_url), source.id);
  addRecord(corpus.source, source, 'source');
  knownSourceIds.add(source.id);
}
for (const record of packet.records) {
  assert.ok(corpus[record.kind], `Unsupported package record kind: ${record.kind}`);
  for (const sourceId of record.source_ids) assert.ok(knownSourceIds.has(sourceId), `${record.id}: unknown source ${sourceId}`);
  addRecord(corpus[record.kind], record, record.kind);
}
for (const question of packet.question_rows) {
  assert.equal(question.record_id, 'guide-utilities-us-regulated-close');
  addUnique(questions.questions, question, 'research-questions');
}
for (const assessment of packet.assessments) addUnique(assessments.assessments, assessment, 'assessments');
for (const [id, override] of Object.entries(packet.mapping_overrides)) {
  if (mappings.records[id] && !same(mappings.records[id], override)) recordConflict(`mapping:${id}`, 'existing-mapping-differs', mappings.records[id], override);
  else mappings.records[id] = structuredClone(override);
}
for (const [id, override] of Object.entries(mappings.records)) {
  if (override.reviewed_question_ids?.length || override.reviewed_industry_codes?.length) {
    assert.ok(override.reviewed_at && override.review_note, `${id}: reviewed mapping requires date and note`);
  }
}
assert.equal(new Set(packet.question_rows.map(row => row.id)).size, packet.question_rows.length);
assert.equal(new Set(packet.records.map(record => record.id)).size, packet.records.length);
assert.equal(new Set(packet.sources.map(source => source.id)).size, packet.sources.length);
assert.equal(conflicts.length, 0, JSON.stringify({ message: 'Utilities integration preflight conflicts; no files written.', conflicts }, null, 2));

if (currentIntegration) {
  questions.question_set_version = version; questions.corpus_version = version;
  questions.reviewed_at = [questions.reviewed_at, reviewedAt].filter(Boolean).sort().at(-1);
  assessments.assessment_version = version;
  mappings.mapping_version = version;
  mappings.updated_at = [mappings.updated_at, reviewedAt].filter(Boolean).sort().at(-1);
  const criteria = read('data/coverage/research-criteria.json');
  criteria.population.named_research_questions = questions.questions.length;
  stage('data/coverage/research-criteria.json', criteria);
  for (const file of ['data/coverage/subsector-profiles.json', 'data/coverage/subsector-screening.json']) {
    const value = read(file); value.corpus_version = version; stage(file, value);
  }
  if (catalog.corpus_version !== version) {
    catalog.coverage_note += ` Edition${version} integrates five bounded FERC electric-utility application questions with three source records and four original guide, workflow, control and synthetic example records.`;
    catalog.review_note += ` Edition${version} integrates the utilities source proposal after the accepted trade edition; original source-package metadata records its separate proposal baseline. Current consolidated GAAP, tariffs, professional review, operational evidence and rights remain limited.`;
  }
  catalog.corpus_version = version;
  catalog.updated_at = [catalog.updated_at, reviewedAt].filter(Boolean).sort().at(-1);
  stage('data/catalog.json', catalog);
}
for (const kind of ['source', 'guide', 'example', 'workflow', 'control']) stage(files[kind], corpus[kind]);
stage(files.questions, questions);
stage(files.assessments, assessments);
stage(files.mappings, mappings);
if (!dryRun) for (const [relative, content] of staged) if (fs.readFileSync(resolve(relative), 'utf8') !== content) fs.writeFileSync(resolve(relative), content);
console.log(JSON.stringify({ mode: dryRun ? 'dry-run' : 'applied', package_version: packet.package_version, input_corpus_version: inputVersion, target_corpus_version: catalog.corpus_version, candidate_records: packet.sources.length + packet.records.length, candidate_questions: packet.question_rows.length, candidate_assessments: packet.assessments.length, mappings: Object.keys(packet.mapping_overrides).length, files: [...staged.keys()] }, null, 2));
