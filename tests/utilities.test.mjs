import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { validateSchema } from '../scripts/validate.mjs';

const packageFile = 'data/research/utilities-2026-09-19.json';
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const sourceRoot = process.cwd();
const packageData = read(path.join(sourceRoot, packageFile));
const canonicalFiles = [
  'data/catalog.json', 'data/research/utilities-2026-09-19.json', 'scripts/integrate-utilities.mjs',
  'data/corpus/source.json', 'data/corpus/guide.json', 'data/corpus/example.json', 'data/corpus/workflow.json', 'data/corpus/control.json',
  'data/coverage/research-questions.json', 'data/coverage/assessments.json', 'data/coverage/mapping-overrides.json',
];
const copy = (root, relative) => { const target = path.join(root, relative); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(path.join(sourceRoot, relative), target); };
const harness = ({ newer = false } = {}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'utilities-integration-'));
  for (const file of canonicalFiles) copy(root, file);
  if (newer) { const catalog = read(path.join(root, 'data/catalog.json')); catalog.corpus_version = '2026-09-19.12405'; write(path.join(root, 'data/catalog.json'), catalog); }
  return root;
};
const run = (root, ...args) => execFileSync(process.execPath, [path.join(root, 'scripts/integrate-utilities.mjs'), ...args], { cwd: root, env: { ...process.env, AA_UTILITIES_ROOT: root }, encoding: 'utf8' });
const ids = kind => packageData.records.filter(record => record.kind === kind).map(record => record.id);

test('package declares source-only utility scope, reusable sources and five bounded questions', () => {
  assert.equal(packageData.status, 'source-only-pending-integration');
  assert.notEqual(packageData.package_version, packageData.current_corpus_version);
  assert.deepEqual(packageData.scope.selected_roles, [
    'FERC-jurisdictional electric public utility or licensee maintaining Part 101 records',
    'Unregulated merchant generator or utility service provider as a scope counterexample',
  ]);
  assert.equal(packageData.records.find(record => record.id === 'guide-utilities-us-regulated-close').data.research_questions.length, 5);
  assert.ok(packageData.reused_source_ids.includes('src_aa_i124_ferc101'));
  assert.ok(packageData.common_limits.some(limit => limit.includes('ASC 980')));
  assert.ok(packageData.sources.every(source => source.rights.source_status === 'unknown'));
  const records = new Map([...packageData.sources, ...packageData.records].map(record => [record.id, record]));
  for (const [id, mapping] of Object.entries(packageData.mapping_overrides)) assert.notEqual(mapping.basis_field.split('/').slice(1).reduce((value, key) => value?.[key], records.get(id)), undefined, id);
});

test('package records and assessments satisfy the public schemas before integration', () => {
  const recordSchema = read(path.join(sourceRoot, 'schemas/record.schema.json'));
  const coverageSchema = read(path.join(sourceRoot, 'schemas/coverage.schema.json'));
  for (const record of [...packageData.sources, ...packageData.records]) validateSchema(record, recordSchema, `record:${record.id}`);
  for (const assessment of packageData.assessments) validateSchema(assessment, coverageSchema.$defs.assessment, `assessment:${assessment.id}`);
  const dimensions = read(path.join(sourceRoot, 'data/coverage/topology.json')).depth_dimensions;
  for (const row of packageData.question_rows) {
    for (const dimension of dimensions) assert.ok(['present', 'partial', 'missing', 'not-assessed', 'not-applicable'].includes(row.dimensions?.[dimension.id]), row.id);
    assert.ok(row.dimension_basis);
  }
});

test('applicator stages and applies all owned records while preserving the current corpus version', () => {
  const root = harness({ newer: true });
  try {
    run(root, '--dry-run');
    run(root);
    const catalog = read(path.join(root, 'data/catalog.json'));
    assert.equal(catalog.corpus_version, '2026-09-19.12405');
    for (const kind of ['source', 'guide', 'example', 'workflow', 'control']) {
      const records = read(path.join(root, `data/corpus/${kind}.json`));
      for (const id of kind === 'source' ? packageData.sources.map(source => source.id) : ids(kind)) assert.ok(records.some(record => record.id === id), `${kind}:${id}`);
    }
    const registry = read(path.join(root, 'data/coverage/research-questions.json'));
    assert.ok(packageData.question_rows.every(row => registry.questions.some(candidate => candidate.id === row.id && candidate.record_id === row.record_id)));
    const assessments = read(path.join(root, 'data/coverage/assessments.json'));
    assert.ok(packageData.assessments.every(row => assessments.assessments.some(candidate => candidate.id === row.id && candidate.status === 'partial')));
    const mappings = read(path.join(root, 'data/coverage/mapping-overrides.json')).records;
    assert.deepEqual(mappings['guide-utilities-us-regulated-close'].industry_codes, ['2211']);
    assert.equal(read(path.join(root, 'data/corpus/source.json')).find(record => record.id === 'src_aa_i124_ferc101').reviewed_at, '2026-09-19');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('applicator is idempotent and refuses a conflicting owned record before any write', () => {
  const root = harness();
  try {
    run(root);
    const first = new Map(canonicalFiles.filter(file => !file.endsWith('integrate-utilities.mjs') && !file.includes('utilities-2026')).map(file => [file, fs.readFileSync(path.join(root, file))]));
    run(root);
    for (const [file, bytes] of first) assert.deepEqual(fs.readFileSync(path.join(root, file)), bytes, file);
    const guideFile = path.join(root, 'data/corpus/guide.json');
    const guides = read(guideFile);
    guides.find(record => record.id === 'guide-utilities-us-regulated-close').summary = 'conflict injected';
    write(guideFile, guides);
    const before = new Map(canonicalFiles.filter(file => !file.endsWith('integrate-utilities.mjs') && !file.includes('utilities-2026')).map(file => [file, fs.readFileSync(path.join(root, file))]));
    assert.throws(() => run(root), /preflight conflicts/);
    for (const [file, bytes] of before) assert.deepEqual(fs.readFileSync(path.join(root, file)), bytes, `partial write: ${file}`);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('synthetic example reconciles independent numeric branches and preserves scope counterexamples', () => {
  const example = packageData.records.find(record => record.id === 'example-utilities-billing-plant-close').data;
  assert.equal(example.examples.length, 3);
  assert.ok(example.examples.every(row => row.synthetic && row.review_result));
  assert.ok(example.limitations.some(limit => limit.includes('Synthetic')));
  assert.equal(example.reconciliation.customer_sales_total, 952000);
  assert.equal(example.reconciliation.purchased_power, 72000);
  assert.equal(example.reconciliation.plant_project, 600000);
  assert.equal(example.numeric_counterexamples.find(row => row.id === 'METER-DIFF-50').difference.amount_at_synthetic_rate, 4250);
  assert.equal(example.numeric_counterexamples.find(row => row.id === 'NETTING-DIFF').difference.net_if_wrongly_combined, 880000);
  assert.ok(example.scope_counterexamples.some(row => row.id === 'UNREG-MERCHANT'));
  assert.ok(example.scope_counterexamples.some(row => row.id === 'SERVICE-PROVIDER'));
  assert.ok(example.limitations.some(limit => limit.includes('ASC 980')));
});
