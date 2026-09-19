import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateSchema } from '../scripts/validate.mjs';

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const packet = read('data/research/transport-2026-09-19.json');
const schema = read('schemas/record.schema.json');
const coverageSchema = read('schemas/coverage.schema.json');
const helper = path.resolve('scripts/integrate-transport.mjs');
const canonicalKinds = ['source', 'guide', 'workflow', 'control', 'example'];

function copyHarness() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'transport-harness-'));
  for (const dir of ['data/research', 'data/corpus', 'data/coverage', 'scripts']) fs.mkdirSync(path.join(root, dir), { recursive: true });
  for (const file of ['data/catalog.json', 'data/coverage/research-questions.json', 'data/coverage/research-criteria.json', 'data/coverage/assessments.json', 'data/coverage/mapping-overrides.json']) fs.copyFileSync(file, path.join(root, file));
  for (const kind of canonicalKinds) fs.copyFileSync(`data/corpus/${kind}.json`, path.join(root, `data/corpus/${kind}.json`));
  fs.copyFileSync('data/research/transport-2026-09-19.json', path.join(root, 'data/research/transport-2026-09-19.json'));
  fs.copyFileSync(helper, path.join(root, 'scripts/integrate-transport.mjs'));
  return root;
}

function run(root, args = []) {
  return spawnSync(process.execPath, ['scripts/integrate-transport.mjs', ...args], { cwd: root, encoding: 'utf8' });
}

test('package records have stable metadata, explicit source rights, and no private/task identifiers', () => {
  for (const record of [...packet.sources, ...packet.records]) {
    validateSchema(record, schema, record.id);
    assert.equal(record.data.id, record.id);
    assert.equal(record.rights.full_text_stored, false);
    if (record.kind === 'source') assert.equal(record.rights.source_status, 'unknown');
  }
  const resolve=value=>Array.isArray(value)?value.map(resolve):value&&typeof value==='object'?(value.$ref?resolve(coverageSchema.$defs[value.$ref.split('/').at(-1)]):Object.fromEntries(Object.entries(value).filter(([key])=>key!=='$defs').map(([key,v])=>[key,resolve(v)]))):value;
  for(const assessment of packet.assessments) {
    validateSchema(assessment,resolve(coverageSchema.$defs.assessment),assessment.id);
    assert.equal(assessment.source_currency,'unknown');
  }
  assert.equal(packet.status, 'source-only-pending-integration');
  assert.notEqual(packet.package_version, packet.corpus_version);
  assert.match(JSON.stringify(packet), /freight|passenger|broker|warehouse|custod/i);
  assert.doesNotMatch(JSON.stringify(packet), /\/private\/tmp|\/Users\/|issue.?104|task.?id/i);
});

test('baseline inventory and question packet cover the selected roles and named topics', () => {
  assert.equal(packet.baseline_inventory.length, 12);
  assert.deepEqual(packet.scope.roles, ['freight carrier','passenger carrier','property broker','warehouse operator or custodian']);
  const text = JSON.stringify(packet.question_rows).toLowerCase();
  for (const term of ['fuel surcharge','passenger','carrier settlements','leased','maintenance','customer-owned','claims']) assert.match(text, new RegExp(term));
  assert.equal(packet.question_rows.length, 5);
  assert.equal(packet.assessments.length, 5);
  assert.ok(packet.question_rows.every((row) => row.assessment_status === 'partial'));
  const guide = packet.records.find((record) => record.id === 'guide-transport-role-routing');
  assert.ok(guide.data.research_questions.every((question) => question.answer && question.assessment?.dimensions));
});

test('synthetic transport math and scope counterexamples are independently checkable', () => {
  const f = packet.fixture;
  assert.equal(f.freight.base_cents * f.freight.surcharge_rate_bps / 10000, f.freight.surcharge_cents);
  assert.equal(f.freight.base_cents + f.freight.surcharge_cents, f.freight.invoice_cents);
  assert.equal(f.broker.carrier_settlement_cents + f.broker.broker_fee_cents, f.broker.customer_collected_cents);
  assert.equal(f.passenger.fare_cents * f.passenger.quantity, f.passenger.total_cents);
  assert.equal(f.warehouse.units * f.warehouse.unit_value_cents, f.warehouse.customer_goods_value_cents);
  assert.equal(f.warehouse.owned_inventory_cents, 0);
  assert.equal(f.claim.status, 'notice-received-under-review');
  assert.ok(packet.records.find((r) => r.id === 'example-transport-connected-ledger').data.examples.some((x) => x.scenario_type === 'negative'));
});

test('helper applies additively in a temp harness and is idempotent', () => {
  const root = copyHarness();
  const inputVersion = read(path.join(root,'data/catalog.json')).corpus_version;
  const first = run(root);
  assert.equal(first.status, 0, first.stderr || first.stdout);
  const second = run(root);
  assert.equal(second.status, 0, second.stderr || second.stdout);
  const guide = read(path.join(root, 'data/corpus/guide.json'));
  const sources = read(path.join(root, 'data/corpus/source.json'));
  const registry = read(path.join(root, 'data/coverage/research-questions.json'));
  const assessments = read(path.join(root, 'data/coverage/assessments.json'));
  const criteria = read(path.join(root, 'data/coverage/research-criteria.json'));
  assert.equal(guide.filter((r) => r.id === 'guide-transport-role-routing').length, 1);
  assert.equal(sources.filter((r) => r.id.startsWith('src_transport_')).length, packet.sources.length);
  assert.equal(registry.questions.filter((r) => r.id.startsWith('rq-transport-')).length, 5);
  assert.equal(assessments.assessments.filter((r) => r.id.startsWith('coverage-transport-')).length, 5);
  assert.equal(criteria.population.named_research_questions, registry.questions.length);
  const overrides = read(path.join(root, 'data/coverage/mapping-overrides.json'));
  for (const override of Object.values(overrides.records).filter((record) => record.review_note?.includes('Source-only package'))) {
    assert.ok(override.question_ids.every((id) => /^q-/.test(id)));
    assert.deepEqual(override.industry_codes, ['48-49']);
  }
  assert.equal(read(path.join(root, 'data/catalog.json')).corpus_version, inputVersion);
});

test('helper detects conflicts before writing canonical files', () => {
  const root = copyHarness();
  const sourceFile = path.join(root, 'data/corpus/source.json');
  const sources = read(sourceFile);
  sources.push({ ...packet.sources[0], title: 'Conflicting title' });
  fs.writeFileSync(sourceFile, JSON.stringify(sources, null, 2) + '\n');
  const before = fs.readFileSync(sourceFile, 'utf8');
  const result = run(root, ['--dry-run']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /Refuse overwrite|stable ID|Conflicting/);
  assert.equal(fs.readFileSync(sourceFile, 'utf8'), before);
});

test('temp application retrieval exposes transport evidence and the role counterexample', () => {
  const root = copyHarness();
  const result = run(root);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const records = canonicalKinds.flatMap((kind) => read(path.join(root, `data/corpus/${kind}.json`)));
  const transport = records.filter((record) => /transport|carrier|broker|warehouse|custod/i.test(JSON.stringify(record)));
  assert.ok(transport.some((record) => record.id === 'guide-transport-role-routing'));
  const example = transport.find((record) => record.id === 'example-transport-connected-ledger');
  assert.ok(JSON.stringify(example).includes('Treat broker collection as carrier revenue'));
  assert.ok(JSON.stringify(example).includes('customer-owned goods'));
});
