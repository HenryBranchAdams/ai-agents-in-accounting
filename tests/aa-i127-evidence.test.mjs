import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const records = [
  ...read("data/corpus/action.json"),
  ...read("data/corpus/authority.json"),
  ...read("data/corpus/collection.json"),
  ...read("data/corpus/control.json"),
  ...read("data/corpus/design.json"),
  ...read("data/corpus/ecosystem.json"),
  ...read("data/corpus/example.json"),
  ...read("data/corpus/guide.json"),
  ...read("data/corpus/process.json"),
  ...read("data/corpus/source.json"),
  ...read("data/corpus/template.json"),
  ...read("data/corpus/term.json"),
  ...read("data/corpus/workflow.json")
];
const byId = new Map(records.map((record) => [record.id, record]));

test("AA-I127 ERP fixture preserves direct lineage, arithmetic, and read-only boundaries", () => {
  const example = byId.get("example-erp-journal-lineage");
  assert.ok(example);
  const fixture = example.data.fixture;
  assert.equal(fixture.entity_id, "ENTITY-US-ERP-01");
  assert.equal(fixture.framework, "US GAAP");
  assert.equal(fixture.page_manifest.missing_page, "page-3");
  assert.deepEqual(fixture.expected_active_population.record_ids, [
    "JH-1001:v1",
    "JH-1002:v1",
    "JH-1003:v2",
    "JH-1004:v1",
    "JH-1006:v1"
  ]);
  assert.equal(fixture.expected_active_population.debit_movement, 5500);
  assert.equal(fixture.extracted_active_population.debit_movement, 4800);
  assert.equal(fixture.independent_control_totals.expected_closing_balance, 15500);
  assert.equal(fixture.independent_control_totals.implied_extracted_closing_balance, 14800);
  assert.equal(fixture.independent_control_totals.closing_difference, -700);
  assert.equal(fixture.correction_history[0].movement_change, 400);
  assert.equal(fixture.correction_history[1].active_version, null);
  assert.equal(example.data.reference_output.executed_actions.length, 0);
  assert.ok(example.data.fixture.security_boundary.prohibited_actions.includes("post journal"));
  assert.match(JSON.stringify(fixture), /Ignore the reviewer/);
});

test("AA-I127 named questions retain source pointers, scope counterexamples, and partial assessments", () => {
  const guide = byId.get("guide-us-accounting-agent-evidence-boundaries");
  assert.ok(guide);
  const questions = guide.data.research_questions;
  assert.equal(questions.length, 6);
  assert.equal(questions[0].worked_example, "example-erp-journal-lineage");
  assert.ok(questions.some((question) => question.id === "rq-aa-i127-evidence-transfer"));
  assert.ok(questions.every((question) => question.assessment.status === "partial"));
  assert.ok(questions[0].source_locators.every((locator) => locator.url.startsWith("https://")));
  assert.ok(guide.data.coverage_gaps.some((gap) => gap.includes("No live Oracle tenant")));

  const registry = read("data/coverage/research-questions.json");
  for (const question of questions) {
    const row = registry.questions.find((candidate) => candidate.id === question.id);
    assert.ok(row, `Missing coverage row for ${question.id}`);
    assert.equal(row.record_id, guide.id);
    assert.equal(row.assessment_status, "partial");
  }
  const evidenceGap = registry.questions.find((question) => question.id === "rq-deployment-accounting-evidence-gap");
  assert.equal(evidenceGap.assessment_status, "evidence-gap");
});

test("AA-I127 rights matrix keeps code, data, upstream inputs, and unresolved permissions distinct", () => {
  const rightsGuide = byId.get("guide-dataset-rights-chain");
  const matrix = rightsGuide.data.release_rights_matrix;
  assert.equal(matrix.length, 3);
  assert.ok(matrix.some((row) => row.release.startsWith("BAF") && row.data_notice.includes("CC BY-NC-SA") && row.unresolved_conflicts.includes("Share-alike")));
  assert.ok(matrix.some((row) => row.release.startsWith("FiFAR") && row.incorporated_rights.includes("upstream conflict")));
  assert.ok(matrix.every((row) => row.permitted_use_inferred.includes("no") || row.permitted_use_inferred.includes("No")));
  assert.equal(rightsGuide.data.professional_review, "not-performed");
  assert.equal(rightsGuide.data.empirical_support, "not-established");
});

test("AA-I127 build exports and source archive include the new canonical records", () => {
  const exported = read("dist/client/downloads/corpus.json");
  assert.equal(exported.exported_record_count, 1069);
  assert.ok(exported.records.some((record) => record.id === "example-erp-journal-lineage"));
  assert.ok(exported.records.some((record) => record.id === "guide-us-accounting-agent-evidence-boundaries"));
  const manifest = read("dist/client/downloads/manifest.json");
  const archive = manifest.files.find((file) => file.path === "/downloads/accounting-agents-source.zip");
  assert.ok(archive && archive.bytes > 0);
  assert.ok(fs.statSync("dist/client/downloads/accounting-agents-source.zip").size === archive.bytes);
});
