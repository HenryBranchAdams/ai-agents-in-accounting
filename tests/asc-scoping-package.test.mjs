import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { exportPackage, packageDirectory, parseQuestionBank, verifyPackage } from '../scripts/asc-scoping-package.mjs';

const markdown = await readFile(path.join(packageDirectory, 'starter-question-bank.md'), 'utf8');
const metadata = JSON.parse(await readFile(path.join(packageDirectory, 'question-bank.metadata.json'), 'utf8'));

// These tests establish artifact integrity, not the correctness of ASC determinations.
test('all original package content, including expanded JSON, matches the supplied SHA-256 manifest', async () => {
  const { bank, summary } = await verifyPackage();
  assert.deepEqual(summary, {
    modules: 13, questions: 133, proposedScenarios: 28, sourceRecords: 14,
    originalFilesVerified: 7, accountingRulesVerified: 0,
  });
  assert.equal(new Set(bank.questions.map((question) => question.id)).size, 133);
});

test('expanded question JSON retains the original artifact hash', () => {
  const bank = parseQuestionBank(markdown, metadata);
  const hash = createHash('sha256').update(`${JSON.stringify(bank, null, 2)}\n`).digest('hex');
  assert.equal(hash, '5b37a95bbdae3f5345cefa94665e3292f35cfe30053753660b95ac725e804f47');
});

test('unknown and not assessed remain distinct supported answer states', () => {
  const bank = parseQuestionBank(markdown, metadata);
  for (const question of bank.questions.filter((item) => item.answer_type === 'yes_no_unknown')) {
    assert.deepEqual(question.answer_states, ['yes', 'no', 'unknown', 'not_assessed']);
    assert.match(question.unknown_handling, /never coerce to no/);
  }
});

test('no starter question is promoted to an approved accounting rule', () => {
  for (const question of parseQuestionBank(markdown, metadata).questions) {
    assert.equal(question.mapping_use, 'research_and_branch_routing_only');
    assert.equal(question.mapping_status, 'draft_not_current_asc_verified');
    assert.equal(question.question_definition_is_accounting_authority, false);
    assert.deepEqual(question.rule_ids, []);
    assert.equal(question.production_gates.length, 3);
  }
});

test('parsing is deterministic and does not share mutable question arrays', () => {
  const first = parseQuestionBank(markdown, metadata);
  const second = parseQuestionBank(markdown, metadata);
  assert.deepEqual(first, second);
  first.questions[0].production_gates.push('test-only');
  assert.equal(first.questions[1].production_gates.length, 3);
  assert.deepEqual(second, parseQuestionBank(markdown, metadata));
});

test('duplicate question IDs are rejected', () => {
  assert.throws(() => parseQuestionBank(markdown.replace('### CONTEXT-02', '### CONTEXT-01'), metadata), /Duplicate question/);
});

test('unknown answer types are rejected', () => {
  assert.throws(() => parseQuestionBank(markdown.replace('`single_select`', '`invented_type`'), metadata), /Unknown answer type/);
});

test('question removal is not silently accepted', () => {
  const changed = markdown.replace(/### CONTEXT-02\n[\s\S]*?(?=### CONTEXT-03)/, '');
  assert.throws(() => parseQuestionBank(changed, metadata), /Question count mismatch/);
});

test('module changes are not silently accepted', () => {
  assert.throws(() => parseQuestionBank(markdown.replace('## Reporting context', '## Changed context'), metadata), /Module order or title/);
});

test('unparsed content and malformed routing hints fail closed', () => {
  assert.throws(() => parseQuestionBank(markdown.replace('### CONTEXT-01', 'Unparsed content\n\n### CONTEXT-01'), metadata), /Unparsed content/);
  assert.throws(() => parseQuestionBank(markdown.replace('hints: ASC 810', 'hints: unverified guess'), metadata), /Malformed locator/);
});

test('artifact tampering fails the checksum gate', async (t) => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'asc-scoping-test-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const copy = path.join(temp, 'package');
  await cp(packageDirectory, copy, { recursive: true });
  const filename = path.join(copy, 'ASC-scoping-design.md');
  await writeFile(filename, `${await readFile(filename, 'utf8')}\nChanged.\n`);
  await assert.rejects(verifyPackage(copy), /Size mismatch|SHA-256 mismatch/);
});

test('export recreates all eight original package files without changing sources', async (t) => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'asc-scoping-export-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const destination = path.join(temp, 'export');
  await exportPackage(destination);
  const { files } = await verifyPackage();
  assert.deepEqual((await readdir(destination)).sort(), [...files.keys()].sort());
  for (const [name, expected] of files) assert.deepEqual(await readFile(path.join(destination, name)), expected);
  await assert.rejects(exportPackage(packageDirectory), /must not overwrite/);
});
