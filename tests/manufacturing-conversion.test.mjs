import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateSchema } from '../scripts/validate.mjs';

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const packet = read('data/research/manufacturing-conversion-2026-09-18.json');
const schema = read('schemas/record.schema.json');
const helper = path.resolve('scripts/integrate-manufacturing-conversion.mjs');
const targetFiles = [
  'data/corpus/source.json', 'data/corpus/example.json', 'data/corpus/guide.json',
  'data/coverage/research-questions.json', 'data/coverage/assessments.json',
  'data/coverage/mapping-overrides.json', 'data/research-questions.json'
];

function copyHarness() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'manufacturing-harness-'));
  for (const dir of ['data/corpus', 'data/coverage', 'data/research', 'scripts']) fs.mkdirSync(path.join(root, dir), { recursive: true });
  for (const file of ['data/catalog.json', 'data/research-questions.json', ...targetFiles.filter((file) => file.startsWith('data/coverage/'))]) {
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(file, target);
  }
  for (const kind of ['source', 'guide', 'example']) fs.copyFileSync(`data/corpus/${kind}.json`, path.join(root, `data/corpus/${kind}.json`));
  fs.copyFileSync('data/research/manufacturing-conversion-2026-09-18.json', path.join(root, 'data/research/manufacturing-conversion-2026-09-18.json'));
  fs.copyFileSync(helper, path.join(root, 'scripts/integrate-manufacturing-conversion.mjs'));
  return root;
}
function run(root, args = []) {
  return spawnSync(process.execPath, ['scripts/integrate-manufacturing-conversion.mjs', ...args], { cwd: root, encoding: 'utf8' });
}
function bytes(root, file) { return fs.readFileSync(path.join(root, file)); }

 test('packet preserves stable metadata, rights, original source locators and no private paths', () => {
  for (const record of [...packet.sources, packet.example]) {
    validateSchema(record, schema, record.id);
    assert.equal(record.data.id, record.id);
    assert.equal(record.rights.full_text_stored, false);
    if (record.kind === 'source') assert.equal(record.rights.source_status, 'unknown');
  }
  assert.equal(packet.status, 'source-only-pending-integration');
  assert.equal(packet.corpus_version, null);
  assert.notEqual(packet.package_version, read('data/catalog.json').corpus_version);
  assert.equal(packet.source_checks.length, 5);
  assert.ok(packet.source_checks.every((source) => source.url.startsWith('https://') && source.effective_period && source.rights_status === 'unknown'));
  assert.doesNotMatch(JSON.stringify(packet), /\/private\/tmp|\/Users\/|node_modules|branchcodex|task.?id/i);
});

test('baseline, five questions and all 21 subsector dispositions remain explicit', () => {
  assert.equal(packet.baseline.record_ids.length, 23);
  assert.equal(packet.baseline.question_ids.length, 5);
  assert.equal(packet.questions.length, 5);
  assert.equal(packet.subsector_dispositions.length, 21);
  assert.ok(packet.subsector_dispositions.every((item) => item.coverage_status === 'partial' && item.reason && item.remaining_gap));
  assert.deepEqual(packet.application.required_source_ids.sort(), packet.source_checks.map((source) => source.source_id).sort());
  assert.ok(packet.baseline.reused_source_ids.every((id) => !packet.sources.some((source) => source.id === id)));
});

test('independent manufacturing calculations reconcile and retain negative branches', () => {
  const [process, discrete, outsourced, custom, nrv, cutoff] = packet.example.data.examples;
  assert.equal(process.inputs.kg, process.inputs.good_kg + process.inputs.scrap_kg + process.inputs.loss_kg);
  assert.equal(process.outputs.fixed_rate_cents_per_hour, process.inputs.fixed_overhead_cents / process.inputs.normal_hours);
  assert.equal(process.outputs.production_cost_cents, process.inputs.materials_cents + process.inputs.labor_cents + process.inputs.variable_overhead_cents + process.outputs.applied_fixed_cents);
  assert.equal(process.outputs.finished_goods_cents + process.outputs.scrap_cents + process.outputs.idle_expense_cents, process.outputs.total_incurred_cents);
  assert.equal(discrete.inputs.started_units, discrete.inputs.completed_units + discrete.inputs.wip_units);
  assert.equal(discrete.outputs.conversion_equivalent_units, discrete.inputs.completed_units + discrete.inputs.wip_units * discrete.inputs.wip_conversion_completion);
  assert.equal(outsourced.outputs.finished_goods_cents, outsourced.inputs.completed * (outsourced.inputs.component_cost_cents + outsourced.inputs.conversion_fee_cents_per_completed));
  assert.equal(outsourced.outputs.total_inventory_cents, outsourced.inputs.components * outsourced.inputs.component_cost_cents + outsourced.outputs.accrued_fee_cents);
  assert.equal(custom.outputs.progress, custom.inputs.incurred_cost_cents / custom.inputs.estimated_total_cost_cents);
  assert.equal(custom.counterexample.revenue_cents_before_transfer, 0);
  assert.equal(nrv.outputs.nrv_cents, nrv.inputs.quantity_kg * (nrv.inputs.estimated_sale_cents_per_kg - nrv.inputs.completion_cents_per_kg - nrv.inputs.disposal_transport_cents_per_kg));
  assert.equal(nrv.outputs.write_down_cents, nrv.inputs.cost_cents - nrv.outputs.nrv_cents);
  assert.match(cutoff.counterexample, /does not prove zero/i);
  for (const example of packet.example.data.examples) for (const journal of example.journals || []) {
    assert.ok(journal.lot);
    assert.equal(Object.values(journal.debits).reduce((a, b) => a + b, 0), Object.values(journal.credits).reduce((a, b) => a + b, 0));
  }
});

test('helper applies additively, preserves current metadata, and replays idempotently', () => {
  const root = copyHarness();
  const catalogBefore = bytes(root, 'data/catalog.json');
  const guideBefore = read(path.join(root, 'data/corpus/guide.json')).find((record) => record.id === 'guide-manufacturing-conversion');
  const questionBefore = guideBefore.data.research_questions[0];
  const first = run(root);
  assert.equal(first.status, 0, first.stderr || first.stdout);
  const after = read(path.join(root, 'data/corpus/guide.json')).find((record) => record.id === guideBefore.id);
  assert.equal(after.summary, guideBefore.summary);
  assert.equal(after.reviewed_at, guideBefore.reviewed_at);
  assert.deepEqual(after.data.research_questions[0].answer, questionBefore.answer);
  assert.ok(after.data.research_questions.every((question) => question.us_application));
  assert.ok(after.data.us_manufacturing);
  assert.ok(after.source_ids.includes('src_aa_i101_fas151_inventory'));
  assert.ok(read(path.join(root, 'data/corpus/example.json')).some((record) => record.id === packet.example.id));
  assert.deepEqual(bytes(root, 'data/catalog.json'), catalogBefore);
  const afterFirst = new Map(targetFiles.map((file) => [file, bytes(root, file)]));
  const second = run(root);
  assert.equal(second.status, 0, second.stderr || second.stdout);
  for (const file of targetFiles) assert.deepEqual(bytes(root, file), afterFirst.get(file), file);
  const assessments = read(path.join(root, 'data/coverage/assessments.json')).assessments;
  assert.equal(assessments.filter((item) => item.id.startsWith('coverage-aa-i101-')).length, 5);
  const registry = read(path.join(root, 'data/coverage/research-questions.json'));
  assert.equal(registry.question_set_version, read('data/coverage/research-questions.json').question_set_version);
});

test('helper stages conflict assertions before writes', () => {
  const root = copyHarness();
  const guideFile = path.join(root, 'data/corpus/guide.json');
  const guides = read(guideFile);
  guides.find((record) => record.id === 'guide-manufacturing-conversion').data.us_manufacturing = { conflicting: true };
  fs.writeFileSync(guideFile, JSON.stringify(guides, null, 2) + '\n');
  const before = new Map(targetFiles.map((file) => [file, bytes(root, file)]));
  const result = run(root, ['--dry-run']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /Refuse overwrite|changed manufacturing US supplement/);
  for (const file of targetFiles) assert.deepEqual(bytes(root, file), before.get(file), file);
});

test('source-check URLs resolve to their declared stable source records',()=>{const sources=new Map([...read('data/corpus/source.json'),...packet.sources].map(s=>[s.id,s]));for(const check of packet.source_checks)assert.equal(sources.get(check.source_id)?.source_url,check.url,check.source_id);});
