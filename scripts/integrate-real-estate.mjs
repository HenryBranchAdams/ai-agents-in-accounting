import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';

export const packetFile = 'data/research/real-estate-2026-09-19.json';
const files = {
  source: 'data/corpus/source.json', guide: 'data/corpus/guide.json', workflow: 'data/corpus/workflow.json',
  control: 'data/corpus/control.json', example: 'data/corpus/example.json',
  questions: 'data/coverage/research-questions.json', assessments: 'data/coverage/assessments.json', mappings: 'data/coverage/mapping-overrides.json',
};
const readFrom = root => file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

export function applyToRoot(root, { expectedVersion, dryRun = false, currentMode = false } = {}) {
  const read = readFrom(root);
  const packet = read(packetFile);
  const catalog = read('data/catalog.json');
  assert.equal(packet.status, 'source-only-pending-integration');
  assert.equal(packet.integration_contract.source_only, true);
  assert.equal(packet.integration_contract.catalog_write, false);
  assert.equal(packet.integration_contract.release_write, false);
  assert.equal(packet.integration_contract.snapshot_write, false);
  assert.equal(packet.integration_contract.archive_write, false);
  const version='2026-09-19.12425';
  if(currentMode)assert.ok(['2026-09-19.12424',version].includes(catalog.corpus_version),'Refuse unexpected real-estate current edition');
  else assert.equal(catalog.corpus_version, expectedVersion || packet.current_corpus_version, 'Refuse unexpected real-estate integration edition before writes');
  for (const file of Object.values(files)) assert.ok(fs.existsSync(path.join(root, file)), `Missing integration target ${file}`);

  const stage = new Map();
  const index = new Map();
  const corpus = {};
  for (const [kind, file] of Object.entries(files)) {
    if (!['source', 'guide', 'workflow', 'control', 'example'].includes(kind)) continue;
    corpus[kind] = read(file);
    stage.set(file, corpus[kind]);
    for (const row of corpus[kind]) {
      assert.ok(!index.has(row.id), `Duplicate stable record ${row.id}`);
      index.set(row.id, row);
    }
  }
  const urls = new Map([...index.values()].filter(row => row.kind === 'source' && row.source_url).map(row => [row.source_url, row.id]));
  const addRecord = (rows, incoming, target) => {
    const current = rows.find(row => row.id === incoming.id);
    assert.ok(!current || isDeepStrictEqual(current, incoming), `Real-estate preflight conflict: ${target}:${incoming.id}`);
    if (!current) rows.push(structuredClone(incoming));
  };
  for (const incoming of [...packet.sources, ...packet.records]) {
    assert.ok(corpus[incoming.kind], `Unsupported record kind ${incoming.kind}`);
    const current = index.get(incoming.id);
    assert.ok(!current || isDeepStrictEqual(current, incoming), `Real-estate preflight conflict: record:${incoming.id}`);
    if (incoming.kind === 'source') {
      assert.ok(!urls.has(incoming.source_url) || urls.get(incoming.source_url) === incoming.id, `Real-estate source URL identity conflict: ${incoming.id}`);
      urls.set(incoming.source_url, incoming.id);
      for (const locator of incoming.data?.locators || []) if (locator.url) assert.equal(locator.url, incoming.source_url, `Source locator URL identity: ${incoming.id}`);
    }
    addRecord(corpus[incoming.kind], incoming, 'record');
    index.set(incoming.id, incoming);
  }
  for (const incoming of [...packet.sources, ...packet.records]) {
    for (const sourceId of incoming.source_ids || []) assert.equal(index.get(sourceId)?.kind, 'source', `Missing real-estate source ${sourceId}`);
    for (const relatedId of incoming.related_ids || []) assert.ok(index.has(relatedId), `Missing real-estate related record ${relatedId}`);
  }
  for (const question of packet.question_rows) {
    const guide = index.get(question.record_id);
    assert.ok(guide, `Missing question record ${question.record_id}`);
    const pointed = question.pointer.split('/').slice(1).reduce((node, key) => node?.[key], guide);
    assert.deepEqual(pointed, question, `Question pointer differs: ${question.id}`);
    for (const locator of question.source_locators || []) {
      const source = index.get(locator.source_id);
      assert.equal(source?.kind, 'source', `Missing question source: ${question.id}`);
      assert.equal(locator.url, source.source_url, `Question source URL identity: ${question.id}`);
      assert.ok(locator.effective_period && locator.access_limits, `Question locator evidence is incomplete: ${question.id}`);
    }
    assert.equal(index.get(question.example_id)?.kind, 'example', `Question example is unresolved: ${question.id}`);
  }
  const questions = read(files.questions), assessments = read(files.assessments), mappings = read(files.mappings);
  for (const row of packet.question_rows) addRecord(questions.questions, row, 'question');
  for (const row of packet.assessments) addRecord(assessments.assessments, row, 'assessment');
  for (const [id, row] of Object.entries(packet.mapping_overrides)) {
    const current = mappings.records[id];
    assert.ok(!current || isDeepStrictEqual(current, row), `Real-estate preflight conflict: mapping:${id}`);
    if (!current) mappings.records[id] = structuredClone(row);
  }
  stage.set(files.questions, questions);
  stage.set(files.assessments, assessments);
  stage.set(files.mappings, mappings);

    if (currentMode) {
    const note = ` Edition ${version} adds selected US real-estate, accommodation, food-service and government research, with separate entity roles and source limits.`;
    const review = ` Edition ${version} retains prior rights and history and documents a narrow correction to the ASU 2016-10 publication month.`;
    if (!catalog.coverage_note.includes(note)) catalog.coverage_note += note;
    if (!catalog.review_note.includes(review)) catalog.review_note += review;
    catalog.corpus_version=version; stage.set('data/catalog.json',catalog);
    const registry=stage.get('data/coverage/research-questions.json'); registry.corpus_version=version; registry.question_set_version=version;
    stage.get('data/coverage/assessments.json').assessment_version=version;
    const overrides=stage.get('data/coverage/mapping-overrides.json'); overrides.mapping_version=version; overrides.updated_at=packet.reviewed_at;
    const criteria=read('data/coverage/research-criteria.json'); criteria.population.named_research_questions=registry.questions.length; stage.set('data/coverage/research-criteria.json',criteria);
    for (const file of ['data/coverage/subsector-profiles.json','data/coverage/subsector-screening.json']) { const value=read(file); value.corpus_version=version; stage.set(file,value); }
    const file='data/research-questions.json', fixtures=read(file);
    for (const row of read('data/research/real-estate-retrieval-2026-09-19.json')) {
      const old=fixtures.find(x=>x.id===row.id); assert.ok(!old||isDeepStrictEqual(old,row),`Retrieval conflict ${row.id}`); if(!old)fixtures.push(structuredClone(row));
    }
    stage.set(file,fixtures);
  }

  let changed = 0;
  for (const [file, value] of stage) {
    const original = fs.readFileSync(path.join(root, file), 'utf8');
    const body = JSON.stringify(value, null, 2) + '\n';
    if (isDeepStrictEqual(JSON.parse(original), value)) continue;
    if (!dryRun) fs.writeFileSync(path.join(root, file), body);
    changed++;
  }
  return { dryRun, changed, catalog_version: catalog.corpus_version, sources: packet.sources.length, records: packet.records.length, questions: packet.question_rows.length, assessments: packet.assessments.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const value = flag => { const i = process.argv.indexOf(flag); return i < 0 ? undefined : process.argv[i + 1]; };
  const dryRun = process.argv.includes('--dry-run');
  assert.ok(dryRun || process.argv.includes('--apply-source-fixture') || process.argv.includes('--current'), 'Refusing to write without --apply-source-fixture');
  console.log(JSON.stringify(applyToRoot(value('--root') || process.cwd(), { expectedVersion: value('--expected-version'), dryRun, currentMode: process.argv.includes('--current') }), null, 2));
}
