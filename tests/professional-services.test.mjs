import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { validateSchema, validateCorpus } from '../scripts/validate.mjs';

const root = process.cwd();
const packetPath = 'data/research/professional-services-2026-09-19.json';
const packet = JSON.parse(fs.readFileSync(path.join(root, packetPath), 'utf8'));
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const targetFiles = [
  'data/catalog.json', 'data/corpus/source.json', 'data/corpus/guide.json',
  'data/corpus/workflow.json', 'data/corpus/control.json', 'data/corpus/example.json',
  'data/coverage/research-questions.json', 'data/coverage/assessments.json',
  'data/coverage/mapping-overrides.json',
];
const copy = (from, to) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(path.join(root, from), to);
};
const harness = () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'professional-services-integration-'));
  fs.cpSync(root, cwd, { recursive: true, filter: source => !source.includes(`${path.sep}.git${path.sep}`) && !source.endsWith(`${path.sep}.git`) && !source.includes(`${path.sep}node_modules${path.sep}`) });
  return cwd;
};
const run = (cwd, ...args) => execFileSync(process.execPath, [path.join(cwd, 'scripts/integrate-professional-services.mjs'), ...args], {
  cwd,
  env: { ...process.env, AA_PROFESSIONAL_SERVICES_ROOT: cwd, AA_PROFESSIONAL_SERVICES_EXPECTED_BASE: packet.integration_contract.required_base_commit, AA_PROFESSIONAL_SERVICES_BASE_COMMIT: packet.integration_contract.required_base_commit },
  encoding: 'utf8',
});

test('packet inventories the seven NAICS 54 baseline records and six existing questions', () => {
  assert.equal(packet.status, 'source-only-pending-integration');
  assert.notEqual(packet.package_version, packet.current_corpus_version);
  assert.equal(packet.baseline.associated_record_count, 7);
  assert.equal(packet.baseline.associated_records.length, 7);
  assert.deepEqual(packet.baseline.linked_questions, [
    'rq-services-time-material', 'rq-services-fixed-fee-wip', 'rq-services-principal-agent-staffing',
    'rq-services-retainers', 'rq-services-credit-costs', 'rq-services-wip-controls',
  ]);
  assert.equal(packet.question_rows.length, 6);
  assert.ok(packet.scope.selected_roles.some(role => /legal/i.test(role)));
  assert.ok(packet.scope.selected_roles.some(role => /engineering/i.test(role)));
  assert.ok(packet.scope.selected_roles.some(role => /staffing/i.test(role)));
  assert.ok(packet.scope.selected_roles.some(role => /California/i.test(role)));
});

test('new sources and records satisfy record and assessment schemas with source rights unknown', () => {
  const recordSchema = read('schemas/record.schema.json');
  const coverageSchema = read('schemas/coverage.schema.json');
  for (const record of [...packet.sources, ...packet.records]) {
    validateSchema(record, recordSchema, `record:${record.id}`);
    assert.equal(record.data.id, record.id);
  }
  for (const assessment of packet.assessments) validateSchema(assessment, coverageSchema.$defs.assessment, `assessment:${assessment.id}`);
  assert.ok(packet.sources.every(source => source.rights.source_status === 'unknown'));
  assert.ok(packet.sources.every(source => source.rights.full_text_stored === false));
  for (const source of packet.sources) for (const locator of source.data.locators) {
    assert.equal(locator.url, source.source_url);
    assert.ok(locator.locator && locator.source_period);
  }
  for (const row of packet.question_rows) {
    assert.ok(Object.keys(row.dimensions).length >= 5);
    assert.ok(row.source_locators.length > 0);
    assert.ok(row.dimension_basis);
  }
  const guide = packet.records.find(record => record.id === 'guide-us-professional-services-contract-to-ledger');
  assert.equal(guide.data.research_questions.length, 6);
});

test('synthetic close independently reconciles revenue, retainer, WIP, payroll, staffing and client funds', () => {
  const data = packet.records.find(record => record.id === 'example-us-professional-services-connected-close').data;
  assert.equal(data.reconciliation.fixed_fee_progress, 0.5);
  assert.equal(data.reconciliation.earned_revenue, 60000);
  assert.equal(data.reconciliation.contract_asset, 30000);
  assert.equal(data.reconciliation.retainer_revenue, 8000);
  assert.equal(data.reconciliation.retainer_liability, 16000);
  assert.equal(data.reconciliation.staffing_gross_margin, 12000);
  assert.equal(data.reconciliation.client_fund_liability, 20000);
  assert.equal(data.reconciliation.entry_debits, data.reconciliation.entry_credits);
  assert.equal(data.numeric_counterexamples.find(row => row.id === 'ADVANCE-RETAINER').difference.overstatement, 16000);
  assert.equal(data.numeric_counterexamples.find(row => row.id === 'BILLING-CUTOFF').difference.contract_asset, 30000);
  assert.ok(data.scope_counterexamples.some(row => row.id === 'NONCALIFORNIA-CLIENT-FUNDS'));
  assert.ok(data.scope_counterexamples.some(row => row.id === 'TAX-GAAP-SPLIT'));
  assert.ok(data.limitations.some(text => /Synthetic/.test(text)));
  assert.ok(data.examples.length >= 2);
});

test('source-only helper stages all conflicts, preserves catalog, applies in a disposable harness and replays byte-stably', () => {
  const cwd = harness();
  try {
    const catalogBefore = fs.readFileSync(path.join(cwd, 'data/catalog.json'));
    run(cwd, '--dry-run');
    assert.deepEqual(fs.readFileSync(path.join(cwd, 'data/catalog.json')), catalogBefore);
    run(cwd, '--apply', '--applied');
    const afterFirst = new Map(targetFiles.map(file => [file, fs.readFileSync(path.join(cwd, file))]));
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(cwd, 'data/catalog.json'))).corpus_version, JSON.parse(catalogBefore).corpus_version);
    assert.equal(JSON.parse(fs.readFileSync(path.join(cwd, 'data/corpus/guide.json'))).some(row => row.id === 'guide-us-professional-services-contract-to-ledger'), true);
    assert.equal(JSON.parse(fs.readFileSync(path.join(cwd, 'data/corpus/source.json'))).filter(row => packet.sources.some(source => source.id === row.id)).length, 2);
    execFileSync(process.execPath, ['scripts/coverage-mappings.mjs'], { cwd, encoding: 'utf8' });
    const validation = execFileSync(process.execPath, ['scripts/validate.mjs'], { cwd, encoding: 'utf8' });
    assert.match(validation, /Corpus integrity verified/);
    run(cwd, '--apply', '--applied');
    for (const [file, bytes] of afterFirst) assert.deepEqual(fs.readFileSync(path.join(cwd, file)), bytes, `replay changed ${file}`);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('helper refuses a conflicting stable source before writing any staged target', () => {
  const cwd = harness();
  try {
    const sourceFile = path.join(cwd, 'data/corpus/source.json');
    const sources = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
    sources.push({ ...packet.sources[0], summary: 'conflict injected' });
    fs.writeFileSync(sourceFile, JSON.stringify(sources, null, 2) + '\n');
    const before = new Map(targetFiles.map(file => [file, fs.readFileSync(path.join(cwd, file))]));
    assert.throws(() => run(cwd, '--apply', '--applied'), /preflight conflicts/);
    for (const [file, bytes] of before) assert.deepEqual(fs.readFileSync(path.join(cwd, file)), bytes, `partial write ${file}`);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('retrieval fixtures are bounded and route the California exception explicitly', () => {
  assert.ok(packet.retrieval_fixtures.search.every(row => row.limit <= 20));
  assert.ok(packet.retrieval_fixtures.get.every(row => row.limit <= 20));
  assert.ok(packet.retrieval_fixtures.search.some(row => row.expected_record_ids.includes('src_professional_california_rule_115')));
  assert.ok(packet.retrieval_fixtures.get.some(row => row.record_id === 'guide-us-professional-services-contract-to-ledger'));
});
