import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const packageFile = path.join(repo, 'data/research/reporting-completion-2026-09-19.json');
const inventoryFile = path.join(repo, 'data/research/reporting-completion-inventory-2026-09-19.json');
const exampleFile = path.join(repo, 'data/research/reporting-completion-example-2026-09-19.json');
const integrationScript = path.join(repo, 'scripts/integrate-reporting-completion.mjs');
const sourceReuse={src_aa118_fasb_asc_current:'src_1os761s',src_aa118_fasb_asu202010:'src_fasb_202010',src_aa118_sec_sab99:'src_secsab0099',src_aa118_sec_sab108:'src_secsab0108',src_aa118_ecfr_reg_sx_current:'src_regsxcfr'};
const canonicalId=id=>sourceReuse[id]||id;
const baseCommit = 'f3d7fb2d56e09d7a3af8ed602e7d0238c763e9e8';

const packageData = JSON.parse(fs.readFileSync(packageFile));
const inventory = JSON.parse(fs.readFileSync(inventoryFile));
const examplePackage = JSON.parse(fs.readFileSync(exampleFile));

function read(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function stable(value) {
  return JSON.stringify(value);
}

function makeTempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aa-reporting-completion-'));
  for (const relative of [
    'data/catalog.json',
    'data/corpus/source.json',
    'data/corpus/guide.json',
    'data/corpus/example.json',
    'data/coverage/research-questions.json',
    'data/coverage/assessments.json',
    'data/coverage/mapping-overrides.json',
    'data/research/foundations.json'
  ]) {
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(repo, relative), target);
  }
  for (const [source, target] of [
    [packageFile, 'data/research/reporting-completion-2026-09-19.json'],
    [inventoryFile, 'data/research/reporting-completion-inventory-2026-09-19.json'],
    [exampleFile, 'data/research/reporting-completion-example-2026-09-19.json']
  ]) fs.copyFileSync(source, path.join(root, target));
  return root;
}

function runIntegration(root, args = []) {
  return spawnSync(process.execPath, [integrationScript, ...args], {
    cwd: repo,
    env: { ...process.env, REPORTING_COMPLETION_ROOT: root },
    encoding: 'utf8'
  });
}

function filesAt(root) {
  return [
    'data/corpus/source.json',
    'data/corpus/guide.json',
    'data/corpus/example.json',
    'data/coverage/research-questions.json',
    'data/coverage/assessments.json',
    'data/coverage/mapping-overrides.json',
    'data/research/foundations.json'
  ];
}

function assertGuidePreserved(before, after) {
  const additiveTopLevel = new Set(['source_ids', 'provenance', 'data']);
  const additiveData = new Set([
    'source_ids',
    'source_locators',
    'research_questions',
    'reporting_completion'
  ]);
  for (const [key, value] of Object.entries(before)) {
    if (!additiveTopLevel.has(key)) assert.deepEqual(after[key], value, `guide field changed: ${before.id}.${key}`);
  }
  assert.deepEqual(after.source_ids.slice(0, before.source_ids.length), before.source_ids);
  for (const [key, value] of Object.entries(before.provenance)) {
    assert.deepEqual(after.provenance[key], value, `guide provenance changed: ${before.id}.${key}`);
  }
  for (const [key, value] of Object.entries(before.data)) {
    if (!additiveData.has(key)) assert.deepEqual(after.data[key], value, `guide data changed: ${before.id}.${key}`);
  }
  if (Array.isArray(before.data.source_ids)) assert.deepEqual(after.data.source_ids.slice(0, before.data.source_ids.length), before.data.source_ids);
  if (Array.isArray(before.data.source_locators)) assert.deepEqual(after.data.source_locators.slice(0, before.data.source_locators.length), before.data.source_locators);
  if (Array.isArray(before.data.research_questions)) assert.deepEqual(after.data.research_questions.slice(0, before.data.research_questions.length), before.data.research_questions);
}

test('package proves four selected routes, source locators, periods, rights and synthetic boundaries', () => {
  const catalog = read(path.join(repo, 'data/catalog.json'));
  assert.equal(packageData.base_commit, baseCommit);
  assert.notEqual(packageData.version, catalog.corpus_version);
  assert.deepEqual(inventory.completion_targets, ['q-ledger-close', 'q-estimates', 'q-presentation', 'q-policy-changes-errors']);
  assert.equal(packageData.families.length, 4);
  assert.equal(packageData.sources.length, 6);
  for (const source of packageData.sources) {
    assert.match(source.source_url, /^https:\/\//);
    assert.ok(source.source_locator);
    assert.ok(source.effective_period);
    assert.ok(source.access_status);
    assert.equal(source.rights_review.status, 'unresolved');
  }
  for (const family of packageData.families) {
    assert.equal(family.question.answer_status, 'sourced-answer-bounded');
    assert.equal(family.question.assessment.status, 'partial');
    assert.ok(family.question.remaining_gaps.length > 0);
    assert.ok(family.question.source_ids.length > 0);
  }
  const estimate = examplePackage.data.examples.find(item => item.id === 'estimate-change-boundary');
  assert.equal(estimate.facts.original_estimate, estimate.facts.original_expected_units * estimate.facts.original_unit_cost);
  assert.equal(estimate.facts.revised_estimate, estimate.facts.original_expected_units * estimate.facts.new_expected_unit_cost);
  const close = examplePackage.data.examples.find(item => item.id === 'close-cutoff-bridge');
  assert.equal(close.facts.january_trial_balance_after_supported_entry - close.facts.january_trial_balance_before_review, close.facts.january_accrual_supported);
  assert.match(examplePackage.data.limitations.join(' '), /synthetic/i);
});

test('temporary application preserves prior records and is byte-stable on replay', () => {
  const root = makeTempRoot();
  const before = Object.fromEntries(filesAt(root).map(file => [file, fs.readFileSync(path.join(root, file), 'utf8')]));
  const result = runIntegration(root);
  assert.equal(result.status, 0, result.stderr);

  const source = read(path.join(root, 'data/corpus/source.json'));
  const guide = read(path.join(root, 'data/corpus/guide.json'));
  const example = read(path.join(root, 'data/corpus/example.json'));
  const questions = read(path.join(root, 'data/coverage/research-questions.json'));
  const assessments = read(path.join(root, 'data/coverage/assessments.json'));
  const mapping = read(path.join(root, 'data/coverage/mapping-overrides.json'));
  const foundations = read(path.join(root, 'data/research/foundations.json'));
  const oldSource = JSON.parse(before['data/corpus/source.json']);
  const oldGuide = JSON.parse(before['data/corpus/guide.json']);
  const oldExample = JSON.parse(before['data/corpus/example.json']);
  const oldQuestions = JSON.parse(before['data/coverage/research-questions.json']);
  const oldAssessments = JSON.parse(before['data/coverage/assessments.json']);
  const oldMapping = JSON.parse(before['data/coverage/mapping-overrides.json']);
  const oldFoundations = JSON.parse(before['data/research/foundations.json']);
  for (const record of oldSource) {
    const actual=structuredClone(source.find(item=>item.id===record.id));
    if(Object.values(sourceReuse).includes(record.id)&&!record.data.supplemental_reviews?.some(r=>r.batch===packageData.package_id)){
      actual.data.supplemental_reviews=actual.data.supplemental_reviews.filter(r=>r.batch!==packageData.package_id);
      if(!Object.hasOwn(record.data,'supplemental_reviews'))delete actual.data.supplemental_reviews;
    }
    assert.deepEqual(actual,record,record.id);
  }
  for (const record of oldGuide) assertGuidePreserved(record, guide.find(item => item.id === record.id));
  for (const record of oldExample) assert.deepEqual(example.find(item => item.id === record.id), record);
  for (const record of oldQuestions.questions) assert.deepEqual(questions.questions.find(item => item.id === record.id), record);
  for (const record of oldAssessments.assessments) assert.deepEqual(assessments.assessments.find(item => item.id === record.id), record);
  for (const [id, record] of Object.entries(oldMapping.records)) assert.deepEqual(mapping.records[id], record);
  for (const [key, value] of Object.entries(oldFoundations)) if (key !== 'reporting_completion_us') assert.deepEqual(foundations[key], value);
  for (const family of packageData.families) {
    const guideRecord = guide.find(item => item.id === family.guide_id);
    assert.ok(guideRecord.data.research_questions.some(item => item.id === family.question.id));
    assert.ok(questions.questions.some(item => item.id === family.question.id));
    assert.ok(assessments.assessments.some(item => item.question_id === family.family_id && item.status === 'partial'));
  }
  for (const sourceRecord of packageData.sources) assert.ok(source.some(item => item.id === canonicalId(sourceRecord.id)));
  assert.ok(example.some(item => item.id === examplePackage.id));
  assert.equal(foundations.reporting_completion_us.package_version, packageData.version);

  const first = Object.fromEntries(filesAt(root).map(file => [file, fs.readFileSync(path.join(root, file), 'utf8')]));
  const replay = runIntegration(root);
  assert.equal(replay.status, 0, replay.stderr);
  for (const file of filesAt(root)) assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), first[file], `replay changed ${file}`);
});

test('conflict is detected before any output file is written', () => {
  const root = makeTempRoot();
  const first = runIntegration(root);
  assert.equal(first.status, 0, first.stderr);
  const sourcePath = path.join(root, 'data/corpus/source.json');
  const source = read(sourcePath);
  const owned = source.find(item => item.id === canonicalId(packageData.sources[0].id));
  owned.data.supplemental_reviews.find(r=>r.batch===packageData.package_id).locator='Conflicting review';
  fs.writeFileSync(sourcePath, `${JSON.stringify(source, null, 2)}\n`);
  const before = Object.fromEntries(filesAt(root).map(file => [file, fs.readFileSync(path.join(root, file), 'utf8')]));
  const result = runIntegration(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /conflict before write/);
  for (const file of filesAt(root)) assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), before[file], `conflict changed ${file}`);
});

test('original proposal inventory preserves the four accepted routes and original scope', () => {
  assert.equal(inventory.source_dispositions?.canonical_data_changes ?? null, null);
  assert.match(JSON.stringify(inventory.source_dispositions), /preserve/i);
  assert.deepEqual(inventory.completion_targets, ['q-ledger-close', 'q-estimates', 'q-presentation', 'q-policy-changes-errors']);
});

test('temporary applied corpus passes the standard corpus and coverage validators without writing the source checkout', () => {
  const protectedFiles = [
    'data/corpus/source.json',
    'data/corpus/guide.json',
    'data/corpus/example.json',
    'data/coverage/research-questions.json',
    'data/coverage/assessments.json',
    'data/coverage/mapping-overrides.json',
    'data/coverage/record-mappings.json',
    'data/coverage/research-criteria.json',
    'data/research/foundations.json'
  ];
  const before = Object.fromEntries(protectedFiles.map(file => [file, fs.readFileSync(path.join(repo, file), 'utf8')]));
  const result = runIntegration(repo, ['--validate-applied']);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /"applied_validation"/);
  assert.match(result.stdout, /"records"/);
  for (const file of protectedFiles) assert.equal(fs.readFileSync(path.join(repo, file), 'utf8'), before[file], `validation wrote ${file}`);
});
