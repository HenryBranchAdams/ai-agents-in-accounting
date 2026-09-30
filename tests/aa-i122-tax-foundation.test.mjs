import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { executeAgent } from "../dist/internal/agent.mjs";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const packageData = read("data/research/tax-foundations-2026-09-18.json");
const exampleData = read("data/research/tax-foundations-example-2026-09-18.json");
const inventoryData = read("data/research/tax-foundations-inventory-2026-09-18.json");
const sources = read("data/corpus/source.json");
const guides = read("data/corpus/guide.json");
const examples = read("data/corpus/example.json");
const registry = read("data/coverage/research-questions.json");
const assessments = read("data/coverage/assessments.json");
const fixtures = read("data/research-questions.json");

test("AA-I122 adds five bounded US tax questions with source and rights metadata", () => {
  assert.equal(packageData.version, "2026-09-18.122");
  assert.equal(packageData.sources.length, 13);
  assert.equal(packageData.families.length, 5);
  assert.equal(packageData.retrieval_fixtures.length, 5);
  assert.equal(exampleData.data.examples.length, 5);
  assert.equal(inventoryData.new_named_questions.length, 5);

  const sourceIds = new Set(sources.map((record) => record.id));
  for (const source of packageData.sources) {
    const record = sources.find((candidate) => candidate.id === source.id);
    assert.ok(record, `${source.id}: canonical source missing`);
    assert.equal(record.rights.full_text_stored, false);
    assert.equal(record.data.source_rights.full_text_stored, false);
    assert.ok(record.data.source_review);
    assert.ok(record.data.metadata_rights);
    assert.ok(record.data.annotation_rights);
    assert.equal(record.data.canonical_source_url, source.source_url);
  }
  for (const sourceId of exampleData.source_ids) assert.ok(sourceIds.has(sourceId), `example source missing: ${sourceId}`);

  const namedQuestionIds = new Set(registry.questions.map((question) => question.id));
  for (const family of packageData.families) {
    const guide = guides.find((record) => record.id === family.guide_id);
    assert.ok(guide, `${family.guide_id}: guide missing`);
    const question = guide.data.research_questions.find((candidate) => candidate.id === family.question.id);
    assert.deepEqual(question, family.question);
    assert.ok(namedQuestionIds.has(question.id));
    assert.deepEqual(guide.provenance.aa_i122, guide.data.aa_i122);
    assert.equal(guide.data.aa_i122.issue_id, "AA-I122");
    assert.ok(guide.data.coverage_gaps.some((gap) => /professional review|empirical/i.test(gap)));
    assert.ok(question.remaining_gaps.length > 0);
  }

  const example = examples.find((record) => record.id === exampleData.id);
  assert.ok(example);
  assert.equal(example.rights.full_text_stored, false);
  assert.ok(example.data.limitations.some((limitation) => /Synthetic/.test(limitation)));
  assert.equal(assessments.assessments.filter((assessment) => assessment.id.startsWith("coverage-aa-i122-")).length, 5);
});

test("AA-I122 synthetic bridge and cross-border branches preserve assumptions and gaps", () => {
  const bridge = exampleData.data.examples.find((example) => example.id === "book-tax-bridge");
  assert.equal(bridge.facts.pretax_book_income + bridge.facts.assumed_nondeductible_difference - bridge.facts.assumed_excess_tax_depreciation_over_book, 185000);
  assert.ok(bridge.calculation.some((line) => line.includes("185000 * r")));
  assert.equal(bridge.facts.rate, "r, a symbolic input only");
  assert.ok(bridge.unavailable_facts.some((fact) => /ASC Topic 740/.test(fact)));

  const withholding = exampleData.data.examples.find((example) => example.id === "withholding-character-and-place");
  assert.equal(withholding.invoices.length, 2);
  assert.notEqual(withholding.invoices[0].place_of_performance, withholding.invoices[1].place_of_performance);
  assert.notEqual(withholding.invoices[0].certificate, withholding.invoices[1].certificate);
  assert.ok(withholding.invoices[1].route.includes("human review"));

  const international = packageData.families.find((family) => family.family_id === "q-international-tax").question;
  assert.equal(international.answer_status, "evidence-gap");
  assert.match(international.answer, /OECD transfer-pricing reference.*does not establish residence/i);
  assert.doesNotMatch(international.answer, /\b\d+\s*%|\bthirty percent\b/i);
});

test("AA-I122 leaves the Issue 100 construction conflict record unchanged", () => {
  const baseGuides = JSON.parse(execFileSync("git", ["show", "a38de70787ee47653f3e315a3c31f0577b5b9ae2:data/corpus/guide.json"], { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 }));
  const current = guides.find((record) => record.id === "guide-construction-tax-transitions");
  const base = baseGuides.find((record) => record.id === current.id);
  assert.deepEqual(current, base);
});

test("AA-I122 retrieval fixtures expose citable records", () => {
  for (const fixture of packageData.retrieval_fixtures) {
    const result = executeAgent("search", { q: fixture.search_query, limit: 5 });
    const ids = new Set(result.results.map((record) => record.id));
    for (const expected of fixture.expected_ids) assert.ok(ids.has(expected), `${fixture.id}: missing ${expected}`);
    for (const excluded of fixture.excluded_ids) assert.equal(ids.has(excluded), false, `${fixture.id}: excluded ${excluded} appeared`);
    const context = executeAgent("context", { ids: fixture.expected_ids, max_chars: 40000, include_sources: true });
    assert.ok(context.records.length >= fixture.expected_ids.length, `${fixture.id}: context omitted expected record`);
    assert.ok(context.records.every((entry) => entry.record.rights && entry.record.review_status));
  }
});

test("AA-I122 integration is byte-stable on clean replay", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aa-i122-tax-integration-"));
  const files = [
    "data/catalog.json",
    "data/research/tax-foundations-2026-09-18.json",
    "data/research/tax-foundations-example-2026-09-18.json",
    "data/research/tax-foundations-inventory-2026-09-18.json",
    "data/research/foundations.json",
    "data/corpus/source.json",
    "data/corpus/guide.json",
    "data/corpus/example.json",
    "data/coverage/research-questions.json",
    "data/coverage/research-criteria.json",
    "data/coverage/subsector-profiles.json",
    "data/coverage/subsector-screening.json",
    "data/coverage/assessments.json",
    "data/coverage/mapping-overrides.json",
    "data/research-questions.json",
  ];
  const script = path.resolve("scripts/apply-tax-foundations.mjs");
  try {
    for (const file of files) {
      const destination = path.join(root, file);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(file, destination);
    }
    const env = { ...process.env, TAX_FOUNDATIONS_ROOT: root };
    execFileSync(process.execPath, [script, "--integrate-into-newer-corpus"], { cwd: root, env, stdio: "pipe" });
    const firstReplay = new Map(files.map((file) => [file, fs.readFileSync(path.join(root, file))]));
    execFileSync(process.execPath, [script, "--integrate-into-newer-corpus"], { cwd: root, env, stdio: "pipe" });
    for (const [file, bytes] of firstReplay)
      assert.deepEqual(fs.readFileSync(path.join(root, file)), bytes, `${file}: replay changed canonical bytes`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
