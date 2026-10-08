import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
export const packageDirectory = path.join(root, 'docs/asc-scoping');
const noLocator = 'Reporting context or coverage control; no automatic ASC conclusion.';
const originalNames = [
  'ASC-scoping-design.md', 'README.md', 'acceptance-scenarios.json',
  'rule-authoring.schema.json', 'source-register.json',
  'starter-question-bank.json', 'starter-question-bank.md',
];
const hash = (value) => createHash('sha256').update(value).digest('hex');
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

// This parser reconstructs a supplied design artifact. It never evaluates ASC scope.
// Markdown holds each question once; metadata holds the original common guardrails.
export function parseQuestionBank(markdown, metadata) {
  assert.equal(typeof markdown, 'string');
  assert.equal(metadata.modules.length, metadata.bank.module_count, 'Module count mismatch');
  const sections = [...markdown.matchAll(/^## (.+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)];
  assert.equal(sections.length, metadata.modules.length + 1, 'Unexpected or missing module');
  assert.equal(sections.at(-1)[1], 'Interpretation guardrails', 'Missing guardrails');
  const questions = [];
  const ids = new Set();
  metadata.modules.forEach((module, index) => {
    const [, title, body] = sections[index];
    assert.equal(title, module.title, 'Module order or title changed');
    const tierLine = `\nTier: ${module.tier}.\n`;
    assert.ok(body.startsWith(tierLine), `Invalid tier for ${title}`);
    const questionBody = body.slice(tierLine.length);
    const pattern = /^### ([A-Z_]+-\d{2})\n([^\n]+)\n\nAnswer type: `([^`]+)`\. Research-routing hints: ([^\n]+)\n/gm;
    const matches = [...questionBody.matchAll(pattern)];
    assert.ok(matches.length > 0, `Empty module ${module.id}`);
    assert.equal(questionBody.replace(pattern, '').trim(), '', `Unparsed content in ${module.id}`);
    for (const [, id, prompt, answerType, hints] of matches) {
      assert.ok(!ids.has(id), `Duplicate question ${id}`);
      ids.add(id);
      assert.ok(id.startsWith(`${module.id.toUpperCase()}-`), `Wrong module for ${id}`);
      assert.ok(metadata.answer_types.includes(answerType), `Unknown answer type ${answerType}`);
      const locators = hints === noLocator ? [] : hints.split(', ').map((hint) => {
        assert.match(hint, /^ASC \d{3}(?:-\d{2})*(?:-[A-Za-z0-9]+)?$/, `Malformed locator ${hint}`);
        return hint.slice(4);
      });
      questions.push({
        id, module_id: module.id, module_title: module.title, tier: module.tier,
        prompt, answer_type: answerType,
        answer_states: structuredClone(metadata.answer_states[answerType] ?? null),
        candidate_asc_locators: locators,
        ...structuredClone(metadata.question_defaults),
      });
    }
  });
  assert.equal(questions.length, metadata.bank.question_count, 'Question count mismatch');
  return { ...structuredClone(metadata.bank), questions };
}

export async function verifyPackage(directory = packageDirectory) {
  const read = (name) => readFile(path.join(directory, name));
  const metadata = JSON.parse(await read('question-bank.metadata.json'));
  const markdown = (await read('starter-question-bank.md')).toString('utf8');
  const bank = parseQuestionBank(markdown, metadata);
  assert.equal(bank.status, 'DESIGN_ONLY_NOT_A_PRODUCTION_ASC_RULESET');
  assert.equal(bank.full_codification_inventory_included, false);
  assert.equal(bank.authoritative_ASC_snapshot, null);
  assert.equal(bank.current_paragraph_rules_verified, 0);
  for (const question of bank.questions) {
    assert.equal(question.mapping_status, 'draft_not_current_asc_verified');
    assert.equal(question.question_definition_is_accounting_authority, false);
    assert.deepEqual(question.rule_ids, []);
    if (question.answer_type === 'yes_no_unknown') {
      assert.deepEqual(question.answer_states, ['yes', 'no', 'unknown', 'not_assessed']);
    }
  }
  const manifestBytes = await read('original-package.manifest.json');
  const manifest = JSON.parse(manifestBytes);
  assert.equal(manifest.package_status, 'design_only');
  assert.deepEqual(manifest.files.map((file) => file.name).sort(), [...originalNames].sort());
  const files = new Map();
  for (const file of manifest.files) {
    const bytes = file.name === 'starter-question-bank.json'
      ? Buffer.from(json(bank))
      : await read(file.name === 'README.md' ? 'original-package-readme.md' : file.name);
    assert.equal(bytes.length, file.bytes, `Size mismatch: ${file.name}`);
    assert.equal(hash(bytes), file.sha256, `SHA-256 mismatch: ${file.name}`);
    files.set(file.name, bytes);
  }
  files.set('manifest.json', manifestBytes);
  const sources = JSON.parse(files.get('source-register.json')).sources;
  const scenarios = JSON.parse(files.get('acceptance-scenarios.json'));
  assert.equal(sources.length, 14);
  assert.equal(new Set(sources.map((source) => source.id)).size, sources.length);
  assert.equal(scenarios.status, 'proposed_expected_behaviors_not_executed_accounting_tests');
  assert.equal(scenarios.scenarios.length, 28);
  assert.equal(new Set(scenarios.scenarios.map((scenario) => scenario.id)).size, 28);
  for (const source of sources) {
    const url = new URL(source.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(url.hostname === 'fasb.org' || url.hostname.endsWith('.fasb.org'));
  }
  return { bank, files, summary: {
    modules: bank.module_count, questions: bank.question_count,
    proposedScenarios: scenarios.scenarios.length, sourceRecords: sources.length,
    originalFilesVerified: manifest.files.length, accountingRulesVerified: 0,
  } };
}

export async function exportPackage(destination, directory = packageDirectory) {
  const target = path.resolve(destination);
  const source = path.resolve(directory);
  assert.ok(target !== source && !target.startsWith(`${source}${path.sep}`), 'Export must not overwrite design sources');
  const result = await verifyPackage(directory);
  await mkdir(target, { recursive: true });
  for (const [name, bytes] of result.files) await writeFile(path.join(target, name), bytes);
  return result.summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    assert.ok(args.length <= 1 && (!args.length || ['--check', '--export'].includes(args[0])),
      'Usage: node scripts/asc-scoping-package.mjs [--check|--export]');
    const summary = args[0] === '--export'
      ? await exportPackage(path.join(root, 'dist/asc-scoping-design'))
      : (await verifyPackage()).summary;
    console.log(JSON.stringify(summary, null, 2));
    if (args[0] === '--export') console.log('Exported original package files to dist/asc-scoping-design/');
    console.log('Content integrity only. No current-ASC rules or accounting outcomes were validated.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
