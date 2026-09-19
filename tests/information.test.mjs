import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { validateSchema } from '../scripts/validate.mjs';

const root = process.cwd();
const packetFile = 'data/research/information-2026-09-19.json';
const packet = JSON.parse(fs.readFileSync(path.join(root, packetFile), 'utf8'));
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const write = (file, value, cwd = root) => fs.writeFileSync(path.join(cwd, file), JSON.stringify(value, null, 2) + '\n');
const canonicalFiles = [
  'data/catalog.json', 'data/corpus/source.json', 'data/corpus/guide.json', 'data/corpus/example.json',
  'data/corpus/workflow.json', 'data/corpus/control.json', 'data/coverage/research-questions.json',
  'data/coverage/assessments.json', 'data/coverage/mapping-overrides.json', 'data/coverage/topology.json',
];
const copy = (cwd, file) => { const target = path.join(cwd, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(path.join(root, file), target); };
const harness = () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'information-integration-'));
  for (const file of canonicalFiles) copy(cwd, file);
  fs.mkdirSync(path.join(cwd, 'data/research'), { recursive: true });
  fs.mkdirSync(path.join(cwd, 'scripts'), { recursive: true });
  fs.copyFileSync(path.join(root, packetFile), path.join(cwd, packetFile));
  fs.copyFileSync(path.join(root, 'scripts/integrate-information.mjs'), path.join(cwd, 'scripts/integrate-information.mjs'));
  return cwd;
};
const run = (cwd, ...args) => execFileSync(process.execPath, [path.join(cwd, 'scripts/integrate-information.mjs'), ...args], { cwd, env: { ...process.env, AA_INFORMATION_ROOT: cwd, AA_INFORMATION_EXPECTED_VERSION: JSON.parse(fs.readFileSync(path.join(cwd,'data/catalog.json'))).corpus_version }, encoding: 'utf8' });

 test('packet inventories the seven NAICS 51 records and names all bounded questions', () => {
  assert.equal(packet.status, 'source-only-pending-integration');
  assert.notEqual(packet.package_version, packet.current_corpus_version);
  assert.equal(packet.baseline.associated_record_count, 7);
  assert.equal(packet.baseline.associated_records.length, 7);
  assert.deepEqual(packet.baseline.associated_records.map(row => row.id), [
    'guide-industry-naics2022-512', 'guide-industry-naics2022-513', 'guide-industry-naics2022-516',
    'guide-industry-naics2022-517', 'guide-industry-naics2022-518', 'guide-industry-naics2022-519', 'guide-software-subscriptions',
  ]);
  assert.equal(packet.question_rows.length, 6);
  assert.ok(packet.records.find(row => row.id === 'guide-information-us-provider-customer').data.research_questions.length === 6);
  assert.ok(packet.scope.selected_roles.some(role => /customer/i.test(role)));
  assert.ok(packet.scope.selected_roles.some(role => /telecom/i.test(role)));
  assert.ok(packet.scope.selected_roles.some(role => /hosting/i.test(role)));
  assert.ok(packet.scope.selected_roles.some(role => /publishing|media/i.test(role)));
});

test('new source records and assessments pass schemas with unknown rights and locator limits', () => {
  const recordSchema = read('schemas/record.schema.json');
  const coverageSchema = read('schemas/coverage.schema.json');
  const topology = read('data/coverage/topology.json');
  for (const record of [...packet.sources, ...packet.records]) validateSchema(record, recordSchema, `record:${record.id}`);
  for (const assessment of packet.assessments) validateSchema(assessment, coverageSchema.$defs.assessment, `assessment:${assessment.id}`);
  assert.ok(packet.sources.every(source => source.rights.source_status === 'unknown'));
  assert.ok(packet.sources.every(source => source.rights.full_text_stored === false));
  for (const row of packet.question_rows) {
    for (const dimension of topology.depth_dimensions) assert.ok(['present', 'partial', 'missing', 'not-assessed', 'not-applicable'].includes(row.dimensions[dimension.id]), `${row.id}:${dimension.id}`);
    assert.ok(row.source_locators.length > 0);
    assert.ok(row.dimension_basis);
  }
  assert.ok(packet.records.find(row => row.id === 'example-information-bundle-close').data.limitations.some(text => /Synthetic/i.test(text)));
});

test('synthetic arithmetic independently reconciles subscription, usage, bundle allocation and royalty', () => {
  const data = packet.records.find(row => row.id === 'example-information-bundle-close').data;
  assert.equal(data.reconciliation.subscription_revenue_for_2026_q4, 120000 / 12 * 3);
  assert.equal(data.reconciliation.december_usage_revenue, 4000 * 2.5);
  assert.equal(data.reconciliation.distinct_setup_revenue, 12000);
  assert.equal(data.reconciliation.bundle_allocated.hosting + data.reconciliation.bundle_allocated.content + data.reconciliation.bundle_allocated.implementation, 180000);
  assert.equal(data.reconciliation.royalty, 10000 * 0.05);
  assert.equal(data.numeric_counterexamples.find(row => row.id === 'SUB-CUTOFF').difference.overstatement, 90000);
  assert.ok(data.scope_counterexamples.some(row => row.id === 'CUSTOMER-SOFTWARE'));
  assert.ok(data.scope_counterexamples.some(row => row.id === 'NONCARRIER-HOSTING'));
  assert.ok(data.scope_counterexamples.some(row => row.id === 'EXPIRED-CONTENT'));
  for (const entry of data.proposed_entries) assert.equal(entry.status.startsWith('proposed-synthetic'), true);
});

test('applicator stages additive records, preserves catalog version, and replays byte-stably', () => {
  const cwd = harness();
  try {
    const beforeCatalog = fs.readFileSync(path.join(cwd, 'data/catalog.json'));
    run(cwd, '--dry-run');
    assert.deepEqual(fs.readFileSync(path.join(cwd, 'data/catalog.json')), beforeCatalog);
    run(cwd);
    const afterFirst = new Map(canonicalFiles.filter(file => file !== 'data/coverage/topology.json').map(file => [file, fs.readFileSync(path.join(cwd, file))]));
    assert.equal(JSON.parse(fs.readFileSync(path.join(cwd, 'data/catalog.json'))).corpus_version, JSON.parse(beforeCatalog).corpus_version);
    assert.equal(JSON.parse(fs.readFileSync(path.join(cwd, 'data/corpus/guide.json'))).some(row => row.id === 'guide-information-us-provider-customer'), true);
    assert.equal(JSON.parse(fs.readFileSync(path.join(cwd, 'data/corpus/source.json'))).filter(row => packet.sources.some(source => source.id === row.id)).length, 3);
    run(cwd);
    for (const [file, bytes] of afterFirst) assert.deepEqual(fs.readFileSync(path.join(cwd, file)), bytes, `replay changed ${file}`);
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});

test('applicator refuses a conflicting source or mapping before writing any target', () => {
  const cwd = harness();
  try {
    const sourcesFile = path.join(cwd, 'data/corpus/source.json');
    const sources = JSON.parse(fs.readFileSync(sourcesFile, 'utf8'));
    sources.push({ ...packet.sources[0], summary: 'conflict injected' });
    fs.writeFileSync(sourcesFile, JSON.stringify(sources, null, 2) + '\n');
    const before = new Map(canonicalFiles.map(file => [file, fs.readFileSync(path.join(cwd, file))]));
    assert.throws(() => run(cwd), /preflight conflicts/);
    for (const [file, bytes] of before) assert.deepEqual(fs.readFileSync(path.join(cwd, file)), bytes, `partial write ${file}`);
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});

test('retrieval fixtures cap search/get and route representative roles', () => {
  const fixtures = packet.retrieval_fixtures;
  assert.ok(fixtures.search.every(row => row.limit <= 20));
  assert.ok(fixtures.get.every(row => row.limit <= 20));
  assert.ok(fixtures.search.some(row => /telecom/i.test(row.query) && row.expected_record_ids.includes('src_aa_i105_fcc_part32')));
  assert.ok(fixtures.get.some(row => row.id === 'guide-information-us-provider-customer'));
});

 test('source and named-question locator URLs retain exact stable source identity',()=>{const sources=new Map([...read('data/corpus/source.json'),...packet.sources].map(row=>[row.id,row]));for(const source of packet.sources)for(const locator of source.data.locators||[])if(locator.url)assert.equal(locator.url,source.source_url,source.id);for(const question of packet.question_rows)for(const locator of question.source_locators||[])if(locator.url)assert.equal(locator.url,sources.get(locator.source_id)?.source_url,question.id);});
