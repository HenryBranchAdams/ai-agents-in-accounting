import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.env.AA_INFORMATION_ROOT || process.cwd();
const resolve = relative => path.join(root, relative);
const read = relative => JSON.parse(fs.readFileSync(resolve(relative), 'utf8'));
const serialize = (relative, value) => {
  const file = resolve(relative);
  const original = fs.readFileSync(file, 'utf8');
  let body = JSON.stringify(value, null, 2) + '\n';
  if (!/[^\x00-\x7f]/.test(original) && /\\u[0-9a-f]{4}/i.test(original)) {
    body = body.replace(/[\u007f-\uFFFF]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
  }
  return body;
};

const packetFile = 'data/research/information-2026-09-19.json';
const packet = read(packetFile);
const catalog = read('data/catalog.json');
const dryRun = process.argv.includes('--dry-run');
const currentMode=process.argv.includes('--current'),version='2026-09-19.12419';
const expectedCatalogVersion = process.env.AA_INFORMATION_EXPECTED_VERSION || packet.current_corpus_version;

assert.equal(packet.status, 'source-only-pending-integration', 'Information package must remain source-only until integrated by the coordinator.');
assert.notEqual(packet.package_version, packet.current_corpus_version, 'Package and corpus versions must remain separate.');
assert.equal(packet.integration_contract.catalog_write, false);
assert.equal(packet.integration_contract.release_write, false);
assert.equal(packet.integration_contract.additive_only, true);
if(currentMode)assert.ok(['2026-09-19.12418',version].includes(catalog.corpus_version),'Refuse unknown information integration edition before writes');
else assert.equal(catalog.corpus_version, expectedCatalogVersion, `Refusing unexpected catalog version ${catalog.corpus_version}; expected ${expectedCatalogVersion}.`);
assert.equal(packet.question_rows.length, 6);
assert.equal(packet.records.find(record => record.id === 'guide-information-us-provider-customer').data.research_questions.length, packet.question_rows.length);

const files = {
  source: 'data/corpus/source.json', guide: 'data/corpus/guide.json', example: 'data/corpus/example.json',
  workflow: 'data/corpus/workflow.json', control: 'data/corpus/control.json',
  questions: 'data/coverage/research-questions.json', assessments: 'data/coverage/assessments.json', mappings: 'data/coverage/mapping-overrides.json',
};
const corpus = Object.fromEntries(Object.entries(files).filter(([kind]) => ['source','guide','example','workflow','control'].includes(kind)).map(([kind,file]) => [kind, read(file)]));
const questions = read(files.questions);
const assessments = read(files.assessments);
const mappings = read(files.mappings);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const conflicts = [];
const conflict = (target, reason, current, incoming) => conflicts.push({ target, reason, current, incoming });
const stage = new Map();
for (const file of Object.values(files)) assert.ok(fs.existsSync(resolve(file)), `Missing integration target ${file}`);

const recordIndex = new Map();
for (const [kind, rows] of Object.entries(corpus)) for (const row of rows) {
  if (recordIndex.has(row.id)) conflict(`record:${row.id}`, 'duplicate-existing-stable-id', recordIndex.get(row.id), kind);
  recordIndex.set(row.id, { kind, row });
}
const sourceUrls = new Map(corpus.source.filter(row => row.source_url).map(row => [row.source_url, row.id]));
for (const incoming of packet.sources) {
  assert.equal(incoming.kind, 'source');
  const priorUrl = sourceUrls.get(incoming.source_url);
  if (priorUrl && priorUrl !== incoming.id) conflict(`source-url:${incoming.source_url}`, 'different-stable-id-for-source-url', priorUrl, incoming.id);
  const current = recordIndex.get(incoming.id)?.row;
  if (current && !same(current, incoming)) conflict(`source:${incoming.id}`, 'existing-record-differs', current, incoming);
  if (!current) {
    corpus.source.push(structuredClone(incoming));
    recordIndex.set(incoming.id, { kind: 'source', row: incoming });
    sourceUrls.set(incoming.source_url, incoming.id);
  }
}
for(const source of packet.sources)for(const locator of source.data.locators||[])if(locator.url)assert.equal(locator.url,source.source_url,`${source.id}: locator URL differs from stable source URL`);
for(const question of packet.question_rows)for(const locator of question.source_locators||[])if(locator.url){const source=corpus.source.find(row=>row.id===locator.source_id);assert.ok(source,`Missing locator source ${locator.source_id}`);assert.equal(locator.url,source.source_url,`${question.id}: locator URL differs from stable source URL`);}
const knownSourceIds = new Set(corpus.source.map(row => row.id));
for (const incoming of packet.records) {
  assert.ok(corpus[incoming.kind], `Unsupported package record kind ${incoming.kind}`);
  for (const sourceId of incoming.source_ids) assert.ok(knownSourceIds.has(sourceId), `${incoming.id}: unknown source ${sourceId}`);
  const current = recordIndex.get(incoming.id)?.row;
  if (current && !same(current, incoming)) conflict(`${incoming.kind}:${incoming.id}`, 'existing-record-differs', current, incoming);
  if (!current) {
    corpus[incoming.kind].push(structuredClone(incoming));
    recordIndex.set(incoming.id, { kind: incoming.kind, row: incoming });
  }
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
if(currentMode){
 const note=` Edition ${version} adds selected US manufacturing conversion-cost and information-provider research.`;if(!catalog.coverage_note.includes(note))catalog.coverage_note+=note;
 const review=` Edition ${version} preserves earlier source rights and questions while adding separately scoped manufacturing and information evidence.`;if(!catalog.review_note.includes(review))catalog.review_note+=review;
 catalog.corpus_version=version;stage.set('data/catalog.json',serialize('data/catalog.json',catalog));
 questions.question_set_version=version;questions.corpus_version=version;assessments.assessment_version=version;mappings.mapping_version=version;mappings.updated_at=packet.reviewed_at;
 const criteria=read('data/coverage/research-criteria.json');criteria.population.named_research_questions=questions.questions.length;stage.set('data/coverage/research-criteria.json',serialize('data/coverage/research-criteria.json',criteria));
 for(const file of ['data/coverage/subsector-profiles.json','data/coverage/subsector-screening.json']){const v=read(file);v.corpus_version=version;stage.set(file,serialize(file,v));}
 const fixtureFile='data/research-questions.json',fixtures=read(fixtureFile);for(const row of read('data/research/information-retrieval-2026-09-19.json'))addById(fixtures,row,'retrieval');stage.set(fixtureFile,serialize(fixtureFile,fixtures));
}
assert.equal(conflicts.length, 0, JSON.stringify({ message: 'Information integration preflight conflicts; no files written.', conflicts }, null, 2));

for (const [kind, file] of Object.entries(files)) {
  if (['source','guide','example','workflow','control'].includes(kind)) stage.set(file, serialize(file, corpus[kind]));
}
stage.set(files.questions, serialize(files.questions, questions));
stage.set(files.assessments, serialize(files.assessments, assessments));
stage.set(files.mappings, serialize(files.mappings, mappings));
if (!dryRun) for (const [file, body] of stage) if (fs.readFileSync(resolve(file), 'utf8') !== body) fs.writeFileSync(resolve(file), body);
console.log(JSON.stringify({ mode: dryRun ? 'dry-run' : 'applied', package_version: packet.package_version, preserved_corpus_version: catalog.corpus_version, candidate_sources: packet.sources.length, candidate_records: packet.records.length, candidate_questions: packet.question_rows.length, candidate_assessments: packet.assessments.length, candidate_mappings: Object.keys(packet.mapping_overrides).length, staged_files: [...stage.keys()] }, null, 2));
