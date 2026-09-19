import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { validateSchema } from '../scripts/validate.mjs';

const root = process.cwd();
const packetFile = 'data/research/real-estate-2026-09-19.json';
const packet = JSON.parse(fs.readFileSync(path.join(root, packetFile), 'utf8'));
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const canonicalFiles = [
  'data/catalog.json', 'data/corpus/source.json', 'data/corpus/guide.json', 'data/corpus/workflow.json',
  'data/corpus/control.json', 'data/corpus/example.json', 'data/coverage/research-questions.json',
  'data/coverage/assessments.json', 'data/coverage/mapping-overrides.json',
];
const copy = (cwd, file) => { const target = path.join(cwd, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(path.join(root, file), target); };
const harness = () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'real-estate-integration-'));
  for (const file of canonicalFiles) copy(cwd, file);
  fs.mkdirSync(path.join(cwd, 'data/research'), { recursive: true });
  fs.mkdirSync(path.join(cwd, 'scripts'), { recursive: true });
  copy(cwd, packetFile);
  copy(cwd, 'scripts/integrate-real-estate.mjs');
  return cwd;
};
const run = (cwd, ...args) => execFileSync(process.execPath, [path.join(cwd, 'scripts/integrate-real-estate.mjs'), ...args], { cwd, env: { ...process.env, AA_REAL_ESTATE_ROOT: cwd }, encoding: 'utf8' });

test('packet inventories the three baseline guides and declares selected roles', () => {
  assert.equal(packet.status, 'source-only-pending-integration');
  assert.equal(packet.baseline.associated_record_count, 3);
  assert.deepEqual(packet.baseline.associated_records.map(row => row.id), [
    'guide-industry-naics2022-531', 'guide-industry-naics2022-532', 'guide-industry-naics2022-533',
  ]);
  assert.equal(packet.question_rows.length, 6);
  assert.deepEqual(packet.scope.selected_roles, ['property owners and developers','property managers and brokers','equipment lessors','nonfinancial-rights licensors']);
  assert.equal(packet.integration_contract.catalog_write, false);
  assert.equal(packet.integration_contract.release_write, false);
  assert.equal(packet.integration_contract.snapshot_write, false);
});

test('records, assessments and question locators meet public schemas and rights limits', () => {
  const recordSchema = read('schemas/record.schema.json');
  const coverageSchema = read('schemas/coverage.schema.json');
  for (const record of [...packet.sources, ...packet.records]) validateSchema(record, recordSchema, `record:${record.id}`);
  for (const assessment of packet.assessments) validateSchema(assessment, coverageSchema.$defs.assessment, `assessment:${assessment.id}`);
  assert.equal(packet.sources.length, 0, 'new publisher URLs must be added only after independent source review');
  assert.ok(packet.reused_source_ids.includes('src_fasb_asu201602_leases'));
  assert.ok(packet.reused_source_ids.includes('src_construction_fasb_2014_09'));
  assert.ok(packet.records.every(record => record.rights.full_text_stored === false));
  const sources = new Map(read('data/corpus/source.json').map(row => [row.id, row]));
  for (const row of packet.question_rows) for (const locator of row.source_locators) {
    assert.equal(locator.url, sources.get(locator.source_id)?.source_url, `${row.id}: locator URL identity`);
  }
});

test('synthetic owner-manager, development and license arithmetic reconciles', () => {
  const data = packet.records.find(row => row.id === 'example-real-estate-owner-manager-close').data;
  assert.equal(data.owner_manager.management_fee_cents + data.owner_manager.owner_settlement_liability_cents, data.owner_manager.rent_collected_cents);
  assert.equal(data.developer_cost_bridge.land_cents + data.developer_cost_bridge.closing_costs_cents + data.developer_cost_bridge.direct_development_cents, data.developer_cost_bridge.project_cost_population_cents);
  assert.equal(data.rights_license.fixed_fee_cents + data.rights_license.royalty_cents, data.rights_license.total_consideration_cents);
  assert.equal(data.proposed_entries.every(row => row.status === 'proposed-synthetic'), true);
  assert.equal(data.scope_counterexamples.length, 4);
});

test('source-only helper stages additive records, preserves catalog, and replays byte-stably', () => {
  const cwd = harness();
  try {
    const beforeCatalog = fs.readFileSync(path.join(cwd, 'data/catalog.json'));
    run(cwd, '--dry-run');
    assert.deepEqual(fs.readFileSync(path.join(cwd, 'data/catalog.json')), beforeCatalog);
    run(cwd, '--apply-source-fixture');
    const afterFirst = new Map(canonicalFiles.map(file => [file, fs.readFileSync(path.join(cwd, file))]));
    const guides = JSON.parse(fs.readFileSync(path.join(cwd, 'data/corpus/guide.json')));
    assert.ok(guides.some(row => row.id === 'guide-real-estate-us-roles'));
    assert.equal(JSON.parse(fs.readFileSync(path.join(cwd, 'data/catalog.json'))).corpus_version, JSON.parse(beforeCatalog).corpus_version);
    run(cwd, '--apply-source-fixture');
    for (const [file, bytes] of afterFirst) assert.deepEqual(fs.readFileSync(path.join(cwd, file)), bytes, `replay changed ${file}`);
    assert.deepEqual(fs.readFileSync(path.join(cwd, 'data/catalog.json')), beforeCatalog);
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});

test('helper refuses a stable-ID conflict before writing any target', () => {
  const cwd = harness();
  try {
    run(cwd, '--apply-source-fixture');
    const packetPath = path.join(cwd, packetFile);
    const changed = JSON.parse(fs.readFileSync(packetPath, 'utf8'));
    changed.records[0].summary = 'conflict injected for preflight test';
    fs.writeFileSync(packetPath, JSON.stringify(changed, null, 2) + '\n');
    const before = new Map(canonicalFiles.map(file => [file, fs.readFileSync(path.join(cwd, file))]));
    assert.throws(() => run(cwd, '--apply-source-fixture'), /preflight conflicts/);
    for (const [file, bytes] of before) assert.deepEqual(fs.readFileSync(path.join(cwd, file)), bytes, `partial write ${file}`);
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});

test('retrieval fixtures stay representative and bounded', () => {
  assert.ok(packet.retrieval_fixtures.search.every(row => row.limit <= 20));
  assert.ok(packet.retrieval_fixtures.get.every(row => row.limit <= 20));
  assert.ok(packet.retrieval_fixtures.search.some(row => row.expected_record_ids.includes('example-real-estate-owner-manager-close')));
  assert.ok(packet.retrieval_fixtures.get.some(row => row.id === 'guide-real-estate-us-roles' && row.expected_question_ids.length === 6));
  assert.deepEqual(packet.integration_contract.target_files.filter(file => /catalog|release|snapshot|archive/.test(file)), []);
});
