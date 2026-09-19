import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const clone = (value) => structuredClone(value);
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const union = (left, right) => [...new Set([...(left || []), ...(right || [])])];
const packet = read('data/research/manufacturing-conversion-2026-09-18.json');
const catalog = read('data/catalog.json');
const currentMode=process.argv.includes('--current'),version='2026-09-19.12419';
if(currentMode)assert.ok(['2026-09-19.12418',version].includes(catalog.corpus_version),'Refuse unknown manufacturing integration edition before writes');
const staged = new Map();
const serialize = (value) => JSON.stringify(value, null, 2) + '\n';
const stage = (file, value) => {const original=fs.readFileSync(file,'utf8');let body=serialize(value);if(!/[^\x00-\x7f]/.test(original)&&/\\u[0-9a-f]{4}/i.test(original))body=body.replace(/[\u007f-\uFFFF]/g,c=>`\\u${c.charCodeAt(0).toString(16).padStart(4,'0')}`);staged.set(file,body);};
if(currentMode){const note=` Edition ${version} adds selected US manufacturing conversion-cost and information-provider research.`;if(!catalog.coverage_note.includes(note))catalog.coverage_note+=note;const review=` Edition ${version} preserves earlier source rights and questions while adding separately scoped manufacturing and information evidence.`;if(!catalog.review_note.includes(review))catalog.review_note+=review;catalog.corpus_version=version;stage('data/catalog.json',catalog);}


assert.equal(packet.status, 'source-only-pending-integration');
assert.ok(packet.package_version && packet.package_version !== catalog.corpus_version);
assert.ok(packet.corpus_version === null, 'A source package must not pin the current corpus version.');
assert.ok(packet.application?.target_files?.length, 'Application contract is required.');
assert.ok(packet.sources.length && packet.example?.id && packet.questions.length === 5);
assert.equal(packet.baseline.record_ids.length, 23, 'The bounded baseline inventory must remain explicit.');

const recordsPath = (kind) => `data/corpus/${kind}.json`;
const lists = new Map();
for (const kind of ['source', 'guide', 'example']) lists.set(kind, read(recordsPath(kind)));
const existingById = new Map();
for (const list of lists.values()) {
  const seen = new Set();
  for (const record of list) {
    assert.ok(!seen.has(record.id), `Duplicate current stable ID ${record.id}`);
    seen.add(record.id);
    existingById.set(record.id, record);
  }
}
for (const id of packet.baseline.reused_foundations) assert.ok(existingById.has(id), `Missing reused foundation ${id}`);

const addOrSame = (list, value, label = value.id) => {
  const matches = list.filter((candidate) => candidate.id === value.id);
  assert.ok(matches.length < 2, `Refuse duplicate stable ID ${label}`);
  if (!matches.length) {
    list.push(clone(value));
    return;
  }
  assert.deepEqual(matches[0], value, `Refuse overwrite of changed ${label}`);
};
const addFieldOrSame = (object, field, value, label) => {
  if (object[field] === undefined) object[field] = clone(value);
  else assert.deepEqual(object[field], value, `Refuse overwrite of changed ${label || field}`);
};
const addNestedOrSame = (object, path, value, label) => {
  const parts = path.split('.');
  let cursor = object;
  for (const part of parts.slice(0, -1)) cursor = cursor[part] ||= {};
  addFieldOrSame(cursor, parts.at(-1), value, label || path);
};
const sourceUrls = new Map();
for (const record of lists.get('source')) if (record.source_url) {
  sourceUrls.set(record.source_url, record.id);
}
for (const record of packet.sources) {
  assert.equal(record.data?.id, record.id, `Source primary metadata ID mismatch: ${record.id}`);
  const prior = sourceUrls.get(record.source_url);
  assert.ok(!prior || prior === record.id, `Source URL already belongs to ${prior}: ${record.source_url}`);
  sourceUrls.set(record.source_url, record.id);
}
for(const check of packet.source_checks){
  const source=packet.sources.find(s=>s.id===check.source_id)||existingById.get(check.source_id);
  assert.ok(source, `Missing checked source ${check.source_id}`);
  assert.equal(source.source_url,check.url,`Source check URL does not match stable ID ${check.source_id}`);
}
for (const sourceId of packet.application.required_source_ids) {
  assert.ok(packet.sources.some((source) => source.id === sourceId) || existingById.has(sourceId), `Required source is neither packaged nor present: ${sourceId}`);
}
for (const record of [packet.example, ...packet.sources]) assert.equal(record.data?.id, record.id, `Primary metadata ID mismatch: ${record.id}`);
for (const sourceId of packet.example.source_ids) assert.ok(packet.application.required_source_ids.includes(sourceId), `Example source is outside the application contract: ${sourceId}`);

for (const source of packet.sources) addOrSame(lists.get('source'), source);
addOrSame(lists.get('example'), packet.example);

const guides = read(recordsPath('guide'));
const guideMatches = guides.filter((record) => record.id === 'guide-manufacturing-conversion');
assert.equal(guideMatches.length, 1, 'The existing manufacturing guide is required for additive application.');
// Mutate only the allowlisted additive fields on the existing guide object.
// The object remains in the current list, so unrelated metadata is preserved by construction.
const guide = guideMatches[0];
guide.source_ids = union(guide.source_ids, packet.application.required_source_ids);
guide.related_ids = union(guide.related_ids, [packet.example.id, ...packet.baseline.reused_foundations]);
addNestedOrSame(guide, 'provenance.manufacturing_us_supplement', {
  research_file: 'data/research/manufacturing-conversion-2026-09-18.json',
  reviewed_at: packet.reviewed_at,
  scope: packet.selected_scope,
  reviewer: 'Codex AI-assisted original-source and synthetic-fixture review'
}, 'manufacturing US supplement provenance');
addNestedOrSame(guide, 'data.us_manufacturing', {
  package_version: packet.package_version,
  scope: packet.selected_scope,
  source_checks: packet.source_checks,
  workflow: packet.workflow,
  controls: packet.controls,
  subsector_dispositions: packet.subsector_dispositions,
  example_id: packet.example.id,
  remaining_gaps: packet.remaining_gaps
}, 'manufacturing US supplement');
const guideQuestions = new Map(guide.data.research_questions.map((question) => [question.id, question]));
for (const question of packet.questions) {
  const prior = guideQuestions.get(question.id);
  assert.ok(prior, `Existing guide question missing: ${question.id}`);
  prior.source_ids = union(prior.source_ids, question.source_ids);
  addFieldOrSame(prior, 'us_application', question, `${question.id} US application`);
}

const registry = read('data/coverage/research-questions.json');
for (const question of packet.questions) {
  const row = registry.questions.find((candidate) => candidate.id === question.id);
  assert.ok(row, `Existing coverage question missing: ${question.id}`);
  row.source_ids = union(row.source_ids, question.source_ids);
  row.remaining_gaps = union(row.remaining_gaps, packet.remaining_gaps);
  addFieldOrSame(row, 'us_application_pointer', `${row.pointer}/us_application`, `${question.id} registry pointer`);
  addFieldOrSame(row, 'us_scope', packet.selected_scope, `${question.id} registry scope`);
}

const assessments = read('data/coverage/assessments.json');
for (const assessment of packet.assessments) addOrSame(assessments.assessments, assessment, assessment.id);
const overrides = read('data/coverage/mapping-overrides.json');
for (const [id, override] of Object.entries(packet.mapping_overrides.records)) {
  if (overrides.records[id] === undefined) overrides.records[id] = clone(override);
  else assert.deepEqual(overrides.records[id], override, `Refuse overwrite of mapping override ${id}`);
}
const fixtures = read('data/research-questions.json');
for (const fixture of packet.research_question_fixtures) addOrSame(fixtures, fixture, fixture.id);

if(currentMode){registry.question_set_version=version;registry.corpus_version=version;assessments.assessment_version=version;overrides.mapping_version=version;overrides.updated_at=packet.reviewed_at;for(const file of ['data/coverage/subsector-profiles.json','data/coverage/subsector-screening.json']){const v=read(file);v.corpus_version=version;stage(file,v);}const criteria=read('data/coverage/research-criteria.json');criteria.population.named_research_questions=registry.questions.length;stage('data/coverage/research-criteria.json',criteria);}
// Every assertion above runs before any file is written.
stage(recordsPath('source'), lists.get('source'));
stage(recordsPath('example'), lists.get('example'));
stage(recordsPath('guide'), guides);
stage('data/coverage/research-questions.json', registry);
stage('data/coverage/assessments.json', assessments);
stage('data/coverage/mapping-overrides.json', overrides);
stage('data/research-questions.json', fixtures);

const result = {
  dry_run: process.argv.includes('--dry-run'),
  package_version: packet.package_version,
  current_corpus_version: catalog.corpus_version,
  files: [...staged.keys()],
  sources_added_or_verified: packet.sources.length,
  records_added_or_verified: 1,
  questions_enriched: packet.questions.length,
  assessments_added_or_verified: packet.assessments.length,
  required_sources: packet.application.required_source_ids.length
};
if (!result.dry_run) for (const [file, content] of staged) fs.writeFileSync(file, content);
console.log(JSON.stringify(result, null, 2));
