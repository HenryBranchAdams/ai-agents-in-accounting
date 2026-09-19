import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const packet = read('data/research/transport-2026-09-19.json');
const catalog = read('data/catalog.json');
const currentMode=process.argv.includes('--current'),version='2026-09-19.12418';
if(currentMode)assert.ok(['2026-09-19.12416','2026-09-19.12417',version].includes(catalog.corpus_version),'Refuse an unrecognized transport integration edition before writes');
const staged = new Map();
const serialize = (value) => JSON.stringify(value, null, 2) + '\n';
const stage = (file, value) => {
  const original=fs.readFileSync(file,'utf8');let text=serialize(value);
  if(!/[^\x00-\x7f]/.test(original)&&/\\u[0-9a-f]{4}/i.test(original))text=text.replace(/[\u007f-\uFFFF]/g,c=>`\\u${c.charCodeAt(0).toString(16).padStart(4,'0')}`);
  staged.set(file,text);
};
if(currentMode){if(catalog.corpus_version!==version){catalog.coverage_note+=` Edition ${version} adds five bounded US transport questions with carrier, broker, passenger and custodian distinctions.`;catalog.review_note+=` Edition ${version}: AA-I104 current integration includes corrected passenger/property authority routes, source locators and original synthetic event-to-ledger material.`;}catalog.corpus_version=version;stage('data/catalog.json',catalog);}
const recordsPath = (kind) => `data/corpus/${kind}.json`;

assert.equal(packet.status, 'source-only-pending-integration');
assert.ok(packet.package_version);
assert.notEqual(packet.package_version, packet.corpus_version, 'Package and corpus versions must remain distinct.');
assert.ok(catalog.corpus_version, 'A target corpus version is required.');
assert.ok(packet.records.length > 0 && packet.sources.length > 0);
assert.ok(packet.records.every((record) => record.data?.limitations?.length || record.kind !== 'example'), 'Synthetic example must declare limitations.');

const allExisting = new Map();
for (const kind of ['source', 'guide', 'workflow', 'control', 'example']) {
  const file = recordsPath(kind);
  const list = read(file);
  for (const record of list) allExisting.set(record.id, record);
}
for (const id of packet.reused_foundations) assert.ok(allExisting.has(id), `Missing accepted foundation ${id}`);

const add = (list, value) => {
  const matches = list.filter((candidate) => candidate.id === value.id);
  assert.ok(matches.length < 2, `Refuse duplicate stable ID ${value.id}`);
  const existing = matches[0];
  if (existing) assert.deepEqual(existing, value, `Refuse overwrite of ${value.id}`);
  else list.push(value);
};
const sourceUrls = new Map();
for (const record of allExisting.values()) if (record.kind === 'source' && record.source_url) sourceUrls.set(record.source_url, record.id);
for (const record of packet.sources) {
  const prior = sourceUrls.get(record.source_url);
  assert.ok(!prior || prior === record.id, `Source URL already has a different stable ID: ${record.source_url}`);
  sourceUrls.set(record.source_url, record.id);
  assert.equal(record.data.id, record.id, `Source primary metadata ID mismatch: ${record.id}`);
}
for (const record of packet.records) assert.equal(record.data.id, record.id, `Record primary metadata ID mismatch: ${record.id}`);

const sourceList = read(recordsPath('source'));
for (const record of packet.sources) add(sourceList, record);
stage(recordsPath('source'), sourceList);
for (const kind of ['guide', 'workflow', 'control', 'example']) {
  const additions = packet.records.filter((record) => record.kind === kind);
  const list = read(recordsPath(kind));
  for (const record of additions) add(list, record);
  stage(recordsPath(kind), list);
}

const sourceIds = new Set([...sourceList, ...packet.sources].map((record) => record.id));
for (const record of packet.records) for (const sourceId of record.source_ids) assert.ok(sourceIds.has(sourceId), `Dangling source ID ${sourceId}`);
for (const row of packet.question_rows) for (const sourceId of row.source_ids) assert.ok(sourceIds.has(sourceId), `Dangling question source ID ${sourceId}`);

const registry = read('data/coverage/research-questions.json');
for (const row of packet.question_rows) add(registry.questions, row);
registry.question_set_version = catalog.corpus_version;
registry.corpus_version = catalog.corpus_version;
stage('data/coverage/research-questions.json', registry);
const criteria = read('data/coverage/research-criteria.json');
criteria.population.named_research_questions = registry.questions.length;
stage('data/coverage/research-criteria.json', criteria);
const assessments = read('data/coverage/assessments.json');
for (const assessment of packet.assessments) add(assessments.assessments, assessment);
assessments.assessment_version = catalog.corpus_version;
stage('data/coverage/assessments.json', assessments);
const overrides = read('data/coverage/mapping-overrides.json');
for (const [id, override] of Object.entries(packet.mapping_overrides.records)) {
  if (overrides.records[id]) assert.deepEqual(overrides.records[id], override, `Refuse overwrite of mapping override ${id}`);
  else overrides.records[id] = override;
}
overrides.mapping_version = catalog.corpus_version;
overrides.updated_at = packet.reviewed_at;
stage('data/coverage/mapping-overrides.json', overrides);

if(currentMode){
  for(const file of ['data/coverage/subsector-profiles.json','data/coverage/subsector-screening.json']){const value=read(file);value.corpus_version=version;stage(file,value);}
  const fixtures=read('data/research-questions.json');for(const row of packet.retrieval_fixtures)add(fixtures,row);stage('data/research-questions.json',fixtures);
}
if (process.argv.includes('--dry-run')) {
  console.log(JSON.stringify({dry_run:true,target_corpus_version:catalog.corpus_version,package_version:packet.package_version,files:[...staged.keys()],sources:packet.sources.length,records:packet.records.length,questions:packet.question_rows.length,assessments:packet.assessments.length},null,2));
} else {
  for (const [file, content] of staged) fs.writeFileSync(file, content);
  console.log(JSON.stringify({dry_run:false,target_corpus_version:catalog.corpus_version,package_version:packet.package_version,files:[...staged.keys()],sources:packet.sources.length,records:packet.records.length,questions:packet.question_rows.length,assessments:packet.assessments.length},null,2));
}
