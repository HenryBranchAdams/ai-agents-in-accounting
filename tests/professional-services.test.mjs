import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { validateSchema } from '../scripts/validate.mjs';

const root = process.cwd();
const packetPath = 'data/research/professional-services-2026-09-19.json';
const packet = JSON.parse(fs.readFileSync(path.join(root, packetPath), 'utf8'));
const baselineCommit = packet.integration_contract.required_base_commit;
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const targetFiles = [
  'data/catalog.json', 'data/corpus/source.json', 'data/corpus/guide.json',
  'data/corpus/workflow.json', 'data/corpus/control.json', 'data/corpus/example.json',
  'data/coverage/research-questions.json', 'data/coverage/assessments.json',
  'data/coverage/mapping-overrides.json', 'data/coverage/research-criteria.json',
];
const resolveRefs = (value, schema) => Array.isArray(value)
  ? value.map(item => resolveRefs(item, schema))
  : value && typeof value === 'object'
    ? value.$ref
      ? resolveRefs(schema.$defs[value.$ref.split('/').at(-1)], schema)
      : Object.fromEntries(Object.entries(value).filter(([key]) => key !== '$defs').map(([key, child]) => [key, resolveRefs(child, schema)]))
    : value;
const harness = () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'professional-services-integration-'));
  // Keep current scripts, schemas and source code, but reconstruct every data
  // input from the packet's required base before overlaying this packet.
  fs.cpSync(root, cwd, {
    recursive: true,
    filter: source => !source.includes(`${path.sep}.git${path.sep}`) && !source.endsWith(`${path.sep}.git`) && !source.includes(`${path.sep}node_modules${path.sep}`) && source !== path.join(root, 'node_modules') && source !== path.join(root, 'data'),
  });
  fs.rmSync(path.join(cwd, 'data'), { recursive: true, force: true });
  const archivePath = path.join(cwd, 'baseline-data.tar');
  const archiveFd = fs.openSync(archivePath, 'w');
  try {
    execFileSync('git', ['archive', '--format=tar', baselineCommit, 'data'], { cwd: root, stdio: ['ignore', archiveFd, 'pipe'] });
  } finally {
    fs.closeSync(archiveFd);
  }
  execFileSync('tar', ['-xf', archivePath, '-C', cwd]);
  fs.rmSync(archivePath, { force: true });
  fs.mkdirSync(path.dirname(path.join(cwd, packetPath)), { recursive: true });
  fs.copyFileSync(path.join(root, packetPath), path.join(cwd, packetPath));
  fs.symlinkSync(path.resolve(root, 'node_modules'), path.join(cwd, 'node_modules'), 'dir');
  return cwd;
};
const run = (cwd, ...args) => execFileSync(process.execPath, [path.join(cwd, 'scripts/integrate-professional-services.mjs'), ...args], {
  cwd,
  env: { ...process.env, AA_PROFESSIONAL_SERVICES_ROOT: cwd, AA_PROFESSIONAL_SERVICES_EXPECTED_BASE: packet.integration_contract.required_base_commit, AA_PROFESSIONAL_SERVICES_BASE_COMMIT: packet.integration_contract.required_base_commit },
  encoding: 'utf8',
});
const runScript = (cwd, script) => execFileSync(process.execPath, [`scripts/${script}`], { cwd, encoding: 'utf8', timeout: 180000 });
const appliedFixture = cwd => {
  // Validate the applied corpus and bundle the real agent without forcing a
  // catalog edition or running the repository-wide build pipeline.
  runScript(cwd, 'coverage-mappings.mjs');
  const validation = runScript(cwd, 'validate.mjs');
  assert.match(validation, /Corpus integrity verified/);
  const bundle = path.join(cwd, 'agent.mjs');
  execFileSync(path.resolve(root, 'node_modules/.bin/esbuild'), ['src/agent.ts', '--bundle', '--platform=node', '--format=esm', `--outfile=${bundle}`], {
    cwd,
    encoding: 'utf8',
    timeout: 180000,
  });
  return bundle;
};
const lineTotals = entry => {
  const debit = entry.lines.filter(line => line.side === 'debit').reduce((sum, line) => sum + line.amount, 0);
  const credit = entry.lines.filter(line => line.side === 'credit').reduce((sum, line) => sum + line.amount, 0);
  return { debit, credit };
};
const accountBalances = entries => {
  const balances = new Map();
  for (const entry of entries) for (const line of entry.lines) {
    const amount = line.side === 'debit' ? line.amount : -line.amount;
    balances.set(line.account, (balances.get(line.account) || 0) + amount);
  }
  return balances;
};

test('packet inventories the seven NAICS 54 baseline records and six existing questions', () => {
  assert.equal(packet.status, 'source-only-pending-integration');
  assert.equal(baselineCommit, '45ab4c64672cbbae76b790f1215e00d0dfd35c78');
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

test('source records, source-specific locators and assessments resolve schemas', () => {
  const recordSchema = read('schemas/record.schema.json');
  const coverageSchema = read('schemas/coverage.schema.json');
  for (const record of [...packet.sources, ...packet.records]) {
    validateSchema(record, recordSchema, `record:${record.id}`);
    assert.equal(record.data.id, record.id);
  }
  for (const assessment of packet.assessments) validateSchema(assessment, resolveRefs(coverageSchema.$defs.assessment, coverageSchema), `assessment:${assessment.id}`);
  assert.ok(packet.sources.every(source => source.rights.source_status === 'unknown'));
  assert.ok(packet.sources.every(source => source.rights.full_text_stored === false));
  const sourceById = new Map([...read('data/corpus/source.json'), ...packet.sources].map(source => [source.id, source]));
  const locators = [...packet.question_rows, ...packet.records.flatMap(record => record.data.research_questions || [])].flatMap(row => row.source_locators || []);
  for (const locator of locators) {
    assert.equal(locator.url, sourceById.get(locator.source_id)?.source_url, `${locator.source_id} URL identity`);
    assert.ok(locator.locator && locator.source_period);
    if (['src_roadmap_naics2022_manual', 'src_irs_pub15_2026', 'src_dol_factsheet21_recordkeeping'].includes(locator.source_id)) {
      assert.doesNotMatch(locator.source_period, /edition\/source review 2026-09-19/i);
      assert.doesNotMatch(locator.locator, /ASU 2014-09|ASC 606/i);
    }
    if (locator.source_id === 'src_construction_fasb_2014_09') {
      assert.match(locator.source_period, /^May 2014 original issued text;/);
      assert.doesNotMatch(locator.source_period, /edition\/source review 2026-09-19/i);
    }
    if (locator.source_id === 'src_fasb_asu2016_08_principal_agent') {
      assert.match(locator.source_period, /^March 2016;/);
      assert.doesNotMatch(locator.source_period, /edition\/source review 2026-09-19/i);
    }
    if (locator.source_id === 'src_roadmap_naics2022_manual') {
      assert.match(locator.locator, /Part I, Sector 54/);
      assert.doesNotMatch(locator.locator, /Part II, Sector 54/);
    }
  }
  const ca = sourceById.get('src_professional_california_rule_115');
  assert.ok(ca.data.locators.some(locator => /Rule 1\.15\(f\)/.test(locator.locator) && /\(d\)\(7\)/.test(locator.locator)));
  assert.ok(ca.data.locators.some(locator => /Rule 1\.15\(g\)/.test(locator.locator)));
  assert.match(ca.data.source_review.effective_period, /January 1, 2023/);
  assert.match(ca.provenance.scope, /publisher note amendment effective January 1, 2023/);
  for (const row of packet.question_rows) {
    assert.ok(Object.keys(row.dimensions).length >= 5);
    assert.ok(row.source_locators.length > 0);
    assert.ok(row.dimension_basis);
  }
});

test('synthetic close independently recomputes journals, cost progress, settlement and counterexamples', () => {
  const data = packet.records.find(record => record.id === 'example-us-professional-services-connected-close').data;
  const c = data.calculation;
  const entries = data.proposed_entries;
  assert.equal(entries.length, 17);
  for (const entry of entries) {
    const totals = lineTotals(entry);
    assert.equal(totals.debit, totals.credit, entry.id);
    assert.ok(entry.lines.every(line => line.account && line.amount > 0));
  }
  const total = entries.flatMap(entry => entry.lines).reduce((sum, line) => sum + (line.side === 'debit' ? line.amount : -line.amount), 0);
  assert.equal(total, 0, 'trial balance must net to zero from journal lines');
  const costPopulation = c.direct_labor_cost + c.subcontractor_cost + c.reimbursable_cost + c.other_direct_project_cost;
  assert.equal(costPopulation, c.costs_incurred);
  assert.equal(c.approved_time_hours * 50, c.direct_labor_cost);
  assert.equal(c.costs_incurred / c.estimated_total_cost, c.progress);
  assert.equal(c.progress * c.fixed_fee, c.earned_revenue);
  assert.equal(c.earned_revenue - c.billed, c.contract_asset);
  assert.equal(c.billed, c.cash_settled_on_billing);
  assert.equal(c.retainer_month_recognized, 8000);
  assert.equal(c.retainer_cash - c.retainer_month_recognized, c.retainer_contract_liability);
  assert.equal(c.staffing_invoice - c.staffing_worker_payroll, c.staffing_gross_margin);
  const balances = accountBalances(entries);
  assert.equal(balances.get('trust_cash'), 20000);
  assert.equal(balances.get('client_funds_liability'), -20000);
  assert.equal(balances.get('operating_cash'), 59000);
  assert.equal(balances.get('legal_fee_revenue'), -5000);
  assert.equal(data.numeric_counterexamples.find(row => row.id === 'ADVANCE-RETAINER').difference.overstatement, 16000);
  const reimbursement = data.numeric_counterexamples.find(row => row.id === 'REIMBURSABLE-GROSS-NET');
  assert.deepEqual(reimbursement.selected_case, { vendor_cost: 8000, customer_charge: 8000, presentation: 'gross principal case', net_revenue: 8000 });
  assert.equal(reimbursement.countercase.net_revenue, 0);
  assert.ok(data.numeric_counterexamples.some(row => row.id === 'CLIENT-FUND-DISPUTE'));
  assert.ok(data.scope_counterexamples.some(row => row.id === 'NONCALIFORNIA-CLIENT-FUNDS'));
  assert.match(data.limitations.join(' '), /Synthetic/);
  assert.ok(data.examples.length >= 3);
});

test('source-only helper stages conflicts, preserves catalog, applies in a disposable harness and replays byte-stably', () => {
  const cwd = harness();
  try {
    const catalogBefore = fs.readFileSync(path.join(cwd, 'data/catalog.json'));
    run(cwd, '--dry-run');
    assert.deepEqual(fs.readFileSync(path.join(cwd, 'data/catalog.json')), catalogBefore);
    run(cwd, '--apply', '--applied');
    assert.deepEqual(fs.readFileSync(path.join(cwd, 'data/catalog.json')), catalogBefore);
    appliedFixture(cwd);
    const afterFirst = new Map(targetFiles.map(file => [file, fs.readFileSync(path.join(cwd, file))]));
    assert.equal(JSON.parse(fs.readFileSync(path.join(cwd, 'data/corpus/guide.json'))).some(row => row.id === 'guide-us-professional-services-contract-to-ledger'), true);
    assert.equal(JSON.parse(fs.readFileSync(path.join(cwd, 'data/corpus/source.json'))).filter(row => packet.sources.some(source => source.id === row.id)).length, 2);
    run(cwd, '--apply', '--applied');
    appliedFixture(cwd);
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

test('applied validated fixture uses real agent search, context and get for California and nationwide counter-role routes', async () => {
  const cwd = harness();
  try {
    run(cwd, '--apply', '--applied');
    const bundle = appliedFixture(cwd);
    const { executeAgent } = await import(`${pathToFileURL(bundle).href}?professional=${Date.now()}`);
    const fixtures = JSON.parse(fs.readFileSync(path.join(cwd, packetPath), 'utf8')).retrieval_fixtures;
    for (const fixture of fixtures.search) {
      const result = executeAgent('search', { q: fixture.query, limit: fixture.limit });
      assert.ok(result.results.length <= 20, fixture.id);
      for (const id of fixture.expected_record_ids) assert.ok(result.results.some(row => row.id === id), `${fixture.id}: missing ${id}`);
      for (const id of fixture.excluded_record_ids || []) assert.ok(!result.results.some(row => row.id === id), `${fixture.id}: excluded ${id}`);
    }
    const guide = executeAgent('get', { id: 'guide-us-professional-services-contract-to-ledger', limit: 20 });
    assert.ok(guide.passages.length);
    assert.ok(guide.passages.some(passage => /California|Rule 1\.15/.test(JSON.stringify(passage))));
    const context = executeAgent('context', { ids: ['guide-us-professional-services-contract-to-ledger', 'example-us-professional-services-connected-close'], include_sources: true, max_chars: 40000 });
    assert.ok(context.records.some(entry => entry.record.id === 'guide-us-professional-services-contract-to-ledger'));
    assert.ok(context.records.some(entry => entry.record.id === 'src_professional_california_rule_115'));
    assert.ok(context.records.some(entry => entry.record.id === 'example-us-professional-services-connected-close'));
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});
