import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { validateSchema } from '../scripts/validate.mjs';
import { applyToRoot, packetFile } from '../scripts/integrate-real-estate.mjs';

const root = process.cwd();
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const packet = read(packetFile);
const base = packet.baseline.source_commit;
const targetFiles = [
  'data/catalog.json', 'data/corpus/source.json', 'data/corpus/guide.json', 'data/corpus/workflow.json',
  'data/corpus/control.json', 'data/corpus/example.json', 'data/coverage/research-questions.json',
  'data/coverage/assessments.json', 'data/coverage/mapping-overrides.json',
];
const gitFile = file => execFileSync('git', ['show', `${base}:${file}`], { maxBuffer: 128 * 1024 * 1024 });
const write = (cwd, file, value) => fs.writeFileSync(path.join(cwd, file), JSON.stringify(value, null, 2) + '\n');
const copyBaseline = (cwd, file) => {
  const target = path.join(cwd, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, gitFile(file));
};
const harness = () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'real-estate-source-'));
  for (const file of targetFiles) copyBaseline(cwd, file);
  fs.mkdirSync(path.join(cwd, 'data/research'), { recursive: true });
  fs.mkdirSync(path.join(cwd, 'scripts'), { recursive: true });
  fs.copyFileSync(path.join(root, packetFile), path.join(cwd, packetFile));
  fs.copyFileSync(path.join(root, 'scripts/integrate-real-estate.mjs'), path.join(cwd, 'scripts/integrate-real-estate.mjs'));
  return cwd;
};
const snapshot = cwd => new Map(targetFiles.map(file => [file, fs.readFileSync(path.join(cwd, file))]));
const unchanged = (cwd, before) => { for (const [file, bytes] of before) assert.deepEqual(fs.readFileSync(path.join(cwd, file)), bytes, file); };
const resolveRefs = (value, schema) => Array.isArray(value) ? value.map(item => resolveRefs(item, schema)) : value && typeof value === 'object' ? value.$ref ? resolveRefs(value.$ref.split('/').slice(1).reduce((node, key) => node[key], schema), schema) : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveRefs(item, schema)])) : value;

function copyAppliedBaseline(cwd) {
  const dataFiles = execFileSync('git', ['ls-tree', '-r', '--name-only', base, 'data'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  for (const file of dataFiles) {
    if (/^data\/(research|releases)\//.test(file)) continue;
    copyBaseline(cwd, file);
  }
  for (const dir of ['src', 'scripts', 'schemas']) fs.cpSync(path.join(root, dir), path.join(cwd, dir), { recursive: true });
  fs.mkdirSync(path.join(cwd, 'data/research'), { recursive: true });
  fs.copyFileSync(path.join(root, packetFile), path.join(cwd, packetFile));
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(cwd, 'node_modules'));
}

test('packet inventories the three baseline guides and selected roles', () => {
  assert.equal(packet.status, 'source-only-pending-integration');
  assert.equal(packet.baseline.associated_record_count, 3);
  assert.deepEqual(packet.baseline.associated_records.map(row => row.id), ['guide-industry-naics2022-531','guide-industry-naics2022-532','guide-industry-naics2022-533']);
  assert.equal(packet.baseline.linked_question_count, 81);
  const baseRegistry = JSON.parse(gitFile('data/coverage/research-questions.json')).questions;
  const familyIds = new Set(packet.baseline.associated_records.flatMap(row => row.linked_question_ids));
  const expectedLinked = baseRegistry.filter(row => row.family_ids?.some(id => familyIds.has(id))).map(row => row.id);
  assert.deepEqual(packet.baseline.linked_questions.map(row => row.id), expectedLinked);
  assert.equal(packet.question_rows.length, 6);
  assert.deepEqual(packet.scope.selected_roles, ['property owners and developers','property managers and brokers','equipment lessors','nonfinancial-rights licensors']);
  assert.equal(packet.integration_contract.catalog_write, false);
  assert.equal(packet.integration_contract.release_write, false);
  assert.equal(packet.integration_contract.snapshot_write, false);
});

test('records and assessments pass schemas with resolved refs and source evidence', () => {
  const recordSchema = read('schemas/record.schema.json');
  const coverageSchema = read('schemas/coverage.schema.json');
  for (const record of [...packet.sources, ...packet.records]) validateSchema(record, recordSchema, `record:${record.id}`);
  const assessmentSchema = resolveRefs(coverageSchema.$defs.assessment, coverageSchema);
  for (const assessment of packet.assessments) {
    validateSchema(assessment, assessmentSchema, `assessment:${assessment.id}`);
    assert.equal(assessment.status, 'partial');
    assert.equal(assessment.rights.full_text_stored, false);
  }
  const sourceById = new Map([...read('data/corpus/source.json'), ...packet.sources].map(row => [row.id, row]));
  for (const question of packet.question_rows) {
    assert.equal(question.example_id, 'example-real-estate-owner-manager-close');
    assert.ok(question.example_subcase);
    for (const locator of question.source_locators) {
      assert.equal(locator.url, sourceById.get(locator.source_id)?.source_url, `${question.id}: locator URL identity`);
      assert.ok(locator.effective_period && locator.access_limits, `${question.id}: locator evidence`);
    }
  }
  assert.ok(packet.sources.some(source => source.id === 'src_aa_i107_fas67_real_estate_costs'));
  assert.ok(packet.sources.some(source => source.id === 'src_aa_i107_fas66_real_estate_sales'));
});

function balance(entries) {
  const totals = {};
  for (const entry of entries) {
    const delta = entry.lines.reduce((sum, line) => sum + line.debit_cents - line.credit_cents, 0);
    assert.equal(delta, 0, entry.id);
    for (const line of entry.lines) totals[line.account] = (totals[line.account] || 0) + line.debit_cents - line.credit_cents;
  }
  return totals;
}

test('synthetic owner and manager books, payment schedule, developer bridge and royalty reconcile', () => {
  const data = packet.records.find(row => row.id === 'example-real-estate-owner-manager-close').data;
  const om = data.owner_manager;
  assert.deepEqual(balance(om.owner_book.entries), om.owner_book.ending_balances);
  assert.deepEqual(balance(om.manager_book.entries), om.manager_book.ending_balances);
  assert.equal(om.management_fee_cents, om.rent_collected_cents * om.management_fee_rate_bps / 10000);
  assert.equal(om.owner_settlement_liability_cents, om.rent_collected_cents - om.management_fee_cents);
  assert.equal(data.equipment_lessor.months * data.equipment_lessor.monthly_payment_cents, data.equipment_lessor.fixed_payments_cents);
  assert.equal(data.developer_cost_bridge.land_cents + data.developer_cost_bridge.closing_costs_cents + data.developer_cost_bridge.direct_development_cents, data.developer_cost_bridge.project_cost_population_cents);
  assert.equal(data.rights_license.usage_units * data.rights_license.royalty_rate_cents_per_unit, data.rights_license.royalty_cents);
  assert.equal(data.rights_license.fixed_fee_cents + data.rights_license.royalty_cents, data.rights_license.total_consideration_cents);
  assert.ok(data.examples.some(example => example.synthetic && example.scenario_type === 'positive'));
  assert.ok(data.limitations.some(text => /Synthetic example/i.test(text)));
});

test('source-only helper stages additively, preserves catalog and replays byte-stably', () => {
  const cwd = harness();
  try {
    const before = snapshot(cwd);
    applyToRoot(cwd, { dryRun: true });
    unchanged(cwd, before);
    applyToRoot(cwd);
    assert.deepEqual(fs.readFileSync(path.join(cwd, 'data/catalog.json')), before.get('data/catalog.json'));
    const first = snapshot(cwd);
    applyToRoot(cwd);
    unchanged(cwd, first);
    assert.ok(JSON.parse(fs.readFileSync(path.join(cwd, 'data/corpus/guide.json'))).some(row => row.id === 'guide-real-estate-us-roles'));
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});

test('helper refuses a stable-ID conflict before any write', () => {
  const cwd = harness();
  try {
    applyToRoot(cwd);
    const altered = JSON.parse(fs.readFileSync(path.join(cwd, packetFile), 'utf8'));
    altered.records[0].summary = 'conflict injected';
    write(cwd, packetFile, altered);
    const before = snapshot(cwd);
    assert.throws(() => applyToRoot(cwd), /preflight conflict/);
    unchanged(cwd, before);
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});

test('applied exact-baseline fixture passes repository validation and real agent search/context/get', async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'real-estate-applied-'));
  try {
    copyAppliedBaseline(cwd);
    for (const file of targetFiles) copyBaseline(cwd, file);
    fs.mkdirSync(path.join(cwd, 'data/research'), { recursive: true });
    fs.copyFileSync(path.join(root, packetFile), path.join(cwd, packetFile));
    applyToRoot(cwd);
    const example = JSON.parse(fs.readFileSync(path.join(cwd, 'data/corpus/example.json'), 'utf8')).find(row => row.id === 'example-real-estate-owner-manager-close');
    assert.ok(example.data.examples.length > 0);
    assert.ok(example.data.limitations.some(text => /Synthetic example/i.test(text)));
    const criteriaFile = 'data/coverage/research-criteria.json';
    const criteria = JSON.parse(fs.readFileSync(path.join(cwd, criteriaFile), 'utf8'));
    criteria.population.named_research_questions = JSON.parse(fs.readFileSync(path.join(cwd, 'data/coverage/research-questions.json'), 'utf8')).questions.length;
    write(cwd, criteriaFile, criteria);
    execFileSync(process.execPath, ['scripts/coverage-mappings.mjs'], { cwd, stdio: 'pipe' });
    execFileSync(process.execPath, ['scripts/validate.mjs'], { cwd, stdio: 'pipe' });
    const bundled = path.join(cwd, 'agent.mjs');
    execFileSync(path.join(root, 'node_modules/.bin/esbuild'), ['src/agent.ts', '--bundle', '--platform=node', '--format=esm', `--outfile=${bundled}`], { cwd, stdio: 'pipe' });
    const { executeAgent } = await import(pathToFileURL(bundled));
    const fixture = packet.retrieval_fixtures;
    for (const search of fixture.search) {
      const result = executeAgent('search', { q: search.query, limit: search.limit });
      for (const id of search.expected_record_ids) assert.ok(result.results.some(row => row.id === id), `${id}: ${result.results.map(row => row.id)}`);
    }
    const context = executeAgent('context', { ids: ['src_aa_i107_fas67_real_estate_costs'], include_sources: false, max_chars: 12000 });
    const sourceContext = context.records.find(entry => entry.record.id === 'src_aa_i107_fas67_real_estate_costs');
    assert.ok(sourceContext);
    assert.equal(sourceContext.record.citation.original_source_url, 'https://storage.fasb.org/aop_FAS67.pdf');
    const got = executeAgent('get', { id: 'guide-real-estate-us-roles', limit: 20 });
    assert.equal(got.record.id, 'guide-real-estate-us-roles');
    assert.ok(got.passages.length);
    assert.equal(got.record.rights.full_text_stored, false);
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});
