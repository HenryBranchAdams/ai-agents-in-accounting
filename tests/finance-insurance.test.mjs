import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateSchema } from '../scripts/validate.mjs';

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const packet = read('data/research/finance-insurance-2026-09-19.json');
const recordSchema = read('schemas/record.schema.json');
const coverageSchema = read('schemas/coverage.schema.json');
const helper = path.resolve('scripts/integrate-finance-insurance.mjs');
const canonicalKinds = ['source', 'guide', 'workflow', 'control', 'example'];
const resolveCoverage = (value) => Array.isArray(value)
  ? value.map(resolveCoverage)
  : value && typeof value === 'object'
    ? value.$ref
      ? resolveCoverage(coverageSchema.$defs[value.$ref.split('/').at(-1)])
      : Object.fromEntries(Object.entries(value).filter(([key]) => key !== '$defs').map(([key, child]) => [key, resolveCoverage(child)]))
    : value;

function copyHarness() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'finance-insurance-harness-'));
  for (const dir of ['data/research', 'data/corpus', 'data/coverage', 'scripts']) fs.mkdirSync(path.join(root, dir), { recursive: true });
  for (const file of ['data/coverage/research-questions.json', 'data/coverage/assessments.json', 'data/coverage/mapping-overrides.json']) fs.copyFileSync(file, path.join(root, file));
  for (const kind of canonicalKinds) fs.copyFileSync(`data/corpus/${kind}.json`, path.join(root, `data/corpus/${kind}.json`));
  fs.copyFileSync('data/research/finance-insurance-2026-09-19.json', path.join(root, 'data/research/finance-insurance-2026-09-19.json'));
  fs.copyFileSync(helper, path.join(root, 'scripts/integrate-finance-insurance.mjs'));
  return root;
}
function run(root, args = []) {
  return spawnSync(process.execPath, ['scripts/integrate-finance-insurance.mjs', ...args], { cwd: root, encoding: 'utf8' });
}
function appliedSearch(root, query, limit = 20) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const records = canonicalKinds.flatMap((kind) => read(path.join(root, `data/corpus/${kind}.json`)));
  return records.map((record) => ({ record, score: terms.reduce((n, term) => n + (JSON.stringify(record).toLowerCase().includes(term) ? 1 : 0), 0) }))
    .filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.record);
}

test('source records and coverage assessments resolve schemas and rights', () => {
  for (const record of [...packet.sources, ...packet.records]) {
    validateSchema(record, recordSchema, record.id);
    assert.equal(record.data.id, record.id);
    assert.equal(record.rights.full_text_stored, false);
    if (record.kind === 'source') assert.equal(record.rights.source_status, 'unknown');
  }
  for (const assessment of packet.assessments) {
    validateSchema(assessment, resolveCoverage(coverageSchema.$defs.assessment), assessment.id);
    assert.equal(assessment.status, 'partial');
    assert.equal(assessment.professional_review, 'not-performed');
    assert.equal(assessment.empirical_support, 'not-established');
  }
  assert.equal(packet.status, 'source-only-pending-integration');
  assert.notEqual(packet.package_version, packet.corpus_version);
  assert.doesNotMatch(JSON.stringify(packet), /\/private\/tmp|\/Users\/|task.?id/i);
});

test('four role routes retain exact source URL identity and explicit boundaries', () => {
  assert.deepEqual(packet.scope.roles, ['lending/deposits/servicing', 'funds/valuation/custody', 'broker-dealers/advisers', 'insurance/reinsurance']);
  assert.equal(packet.baseline_inventory.length, 16);
  const sources = new Map([...read('data/corpus/source.json'), ...packet.sources].map((s) => [s.id, s]));
  const covered = new Set();
  for (const row of packet.question_rows) {
    assert.ok(row.source_locators.length >= 2);
    for (const locator of row.source_locators) {
      assert.equal(locator.url, sources.get(locator.source_id)?.source_url, `${locator.source_id} locator URL`);
      assert.ok(locator.locator && locator.effective_period && locator.access_limits);
    }
    covered.add(row.selected_role);
    assert.match(row.answer, /separate|route|framework/i);
  }
  assert.deepEqual([...covered], packet.scope.roles);
  const text = JSON.stringify(packet).toLowerCase();
  for (const term of ['custody', 'owned', 'valuation', 'credit loss', 'premium', 'claim', 'sap', 'us gaap']) assert.match(text, new RegExp(term));
  for (const review of packet.reused_source_reviews) assert.equal(sources.get(review.source_id)?.source_url, review.url);
});

test('synthetic role fixture and counterexamples reconcile without asserting journal entries', () => {
  const f = packet.fixture;
  assert.equal(f.funds_valuation_custody.client_asset_subledger_cents, f.funds_valuation_custody.client_security_value_cents);
  assert.equal(f.funds_valuation_custody.entity_asset_cents, f.funds_valuation_custody.owned_investment_value_cents);
  assert.equal(f.broker_adviser.customer_cash_cents + f.broker_adviser.customer_securities_cents, f.broker_adviser.customer_reserve_input_cents);
  assert.equal(f.insurance_reinsurance.direct_premium_cents - f.insurance_reinsurance.ceded_premium_cents, 45000000);
  assert.equal(f.insurance_reinsurance.reported_claim_estimate_cents - f.insurance_reinsurance.reinsurance_recovery_estimate_cents, 8000000);
  assert.equal(f.lending_deposit_servicing.loan_principal_cents / 100 + f.lending_deposit_servicing.customer_deposit_liability_cents / 100, 1750000);
  assert.equal(f.counterexamples.length, 2);
  assert.ok(packet.records.find((r) => r.id === 'example-aa-i106-role-branches').data.examples.some((x) => x.scenario_type === 'negative'));
});

test('helper applies only in a disposable fixture, replays byte-stably, and stages conflicts before writes', () => {
  const root = copyHarness();
  const first = run(root, ['--applied']);
  assert.equal(first.status, 0, first.stderr || first.stdout);
  const afterFirst = new Map(['data/corpus/source.json', 'data/corpus/guide.json', 'data/corpus/workflow.json', 'data/corpus/control.json', 'data/corpus/example.json', 'data/coverage/research-questions.json', 'data/coverage/assessments.json', 'data/coverage/mapping-overrides.json'].map((file) => [file, fs.readFileSync(path.join(root, file), 'utf8')]));
  const second = run(root, ['--applied']);
  assert.equal(second.status, 0, second.stderr || second.stdout);
  for (const [file, bytes] of afterFirst) assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), bytes, `${file} replay changed bytes`);
  assert.equal(read(path.join(root, 'data/corpus/guide.json')).filter((r) => r.id === 'guide-aa-i106-finance-insurance').length, 1);
  assert.equal(read(path.join(root, 'data/corpus/source.json')).filter((r) => r.id.startsWith('src_aa_i106_')).length, 4);
  assert.equal(read(path.join(root, 'data/coverage/research-questions.json')).questions.filter((r) => r.id.startsWith('rq-aa-i106-')).length, 4);
  assert.equal(read(path.join(root, 'data/coverage/assessments.json')).assessments.filter((r) => r.id.startsWith('coverage-aa-i106-')).length, 4);
  assert.equal(fs.existsSync(path.join(root, 'data/catalog.json')), false, 'source helper must not create catalog output');

  const sourceFile = path.join(root, 'data/corpus/source.json');
  const sources = read(sourceFile);
  const conflict = sources.find((s) => s.id === packet.sources[0].id);
  conflict.title = 'conflicting primary metadata';
  fs.writeFileSync(sourceFile, JSON.stringify(sources, null, 2) + '\n');
  const before = fs.readFileSync(sourceFile, 'utf8');
  const result = run(root, ['--dry-run']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /Refuse overwrite|primary metadata|stable ID/i);
  assert.equal(fs.readFileSync(sourceFile, 'utf8'), before);
});

test('applied retrieval returns bounded role evidence and the custody counterexample', () => {
  const root = copyHarness();
  const result = run(root, ['--applied']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const roleHits = appliedSearch(root, 'lending funds custody broker insurance', 20);
  assert.ok(roleHits.some((r) => r.id === 'guide-aa-i106-finance-insurance'));
  assert.ok(roleHits.length <= 20);
  const counterHits = appliedSearch(root, 'client_asset_subledger_cents custody', 20);
  assert.ok(counterHits.some((r) => r.id === 'example-aa-i106-role-branches'), JSON.stringify(counterHits.map((r) => r.id)));
  assert.ok(JSON.stringify(counterHits).includes('client_asset_subledger_cents'));
  assert.ok(!counterHits.some((r) => r.id === 'guide-aa-i106-finance-insurance' && JSON.stringify(r).includes('whole-industry sufficiency')));
});
