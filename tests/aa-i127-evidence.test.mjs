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
  assert.equal(exported.exported_record_count, 1097);
  assert.ok(exported.records.some((record) => record.id === "example-erp-journal-lineage"));
  assert.ok(exported.records.some((record) => record.id === "guide-us-accounting-agent-evidence-boundaries"));
  const manifest = read("dist/client/downloads/manifest.json");
  const archive = manifest.files.find((file) => file.path === "/downloads/accounting-agents-source.zip");
  assert.ok(archive && archive.bytes > 0);
  assert.ok(fs.statSync("dist/client/downloads/accounting-agents-source.zip").size === archive.bytes);
});

test("AA-I127 derived research denominators agree across criteria, runtime analytics, and the latest snapshot", () => {
  const criteria = read("data/coverage/research-criteria.json");
  const questions = read("data/coverage/research-questions.json").questions;
  const analytics = read("dist/client/downloads/coverage.json");
  const history = read("data/coverage/snapshots.json").snapshots;
  const latest = history.at(-1);
  const partial = questions.filter((question) => question.assessment_status === "partial").length;
  const gaps = questions.filter((question) => question.assessment_status === "evidence-gap").length;
  assert.equal(criteria.population.named_research_questions, questions.length);
  assert.equal(analytics.summary.research.named_research_questions, questions.length);
  assert.equal(analytics.summary.research.named_partial_questions, partial);
  assert.equal(analytics.summary.research.named_evidence_gaps, gaps);
  assert.equal(partial + gaps, questions.length);
  assert.equal(latest.id, "2026-09-17.3");
  assert.deepEqual(latest.summary, analytics.summary);
});

test("AA-I127 shared assessments, cited locators, and empirical source reviews are canonical and synchronized", () => {
  const guides = read("data/corpus/guide.json");
  const assessments = read("data/coverage/assessments.json").assessments;
  const analytics = read("dist/client/downloads/coverage.json");
  const guideIds = ["guide-independent-deployment-evidence", "guide-us-accounting-agent-evidence-boundaries"];
  for (const guideId of guideIds) {
    const guide = byId.get(guideId);
    const nestedSourceIds = new Set(guide.data.research_questions.flatMap((question) => question.source_ids));
    assert.deepEqual([...nestedSourceIds].sort(), [...guide.source_ids].sort(), `${guideId}: top-level source union`);
    for (const question of guide.data.research_questions) {
      assert.deepEqual(new Set(question.source_ids), new Set(question.source_locators.map((locator) => locator.source_id)), `${question.id}: cited locator union`);
      if (guideId === "guide-us-accounting-agent-evidence-boundaries" || question.id === "rq-deployment-accounting-evidence-gap") {
        assert.ok(question.source_locators.every((locator) => /^https:\/\//.test(locator.url) && locator.locator.length > 20), `${question.id}: reproducible locator`);
      }
    }
  }

  const namedQuestions = [
    ...byId.get("guide-independent-deployment-evidence").data.research_questions.filter((question) => question.id.startsWith("rq-deployment-accounting-")),
    ...byId.get("guide-us-accounting-agent-evidence-boundaries").data.research_questions,
  ];
  const shared = assessments.filter((assessment) => assessment.scope_kind === "shared-context");
  assert.equal(shared.length, namedQuestions.length);
  assert.ok(shared.every((assessment) => assessment.industry_code === null && assessment.named_question_id));
  assert.deepEqual(new Set(shared.map((assessment) => assessment.named_question_id)), new Set(namedQuestions.map((question) => question.id)));
  assert.equal(analytics.summary.shared_scope_assessments, shared.length);
  assert.ok(analytics.assessments.some((assessment) => assessment.named_question_id === "rq-aa-i127-rights-provenance"));

  const empirical = read("data/research/empirical.json").sources.filter((source) => ["src_1sbtyzp", "src_1v8cm5i"].includes(source.id));
  const sources = read("data/corpus/source.json");
  const ledger = read("data/reviews/source-reviews.json").reviews;
  for (const input of empirical) {
    const source = sources.find((record) => record.id === input.id);
    const review = source.data.source_review;
    const supplemental = source.data.supplemental_reviews.find((candidate) => candidate.batch === "empirical" && candidate.checked_url === input.source_url);
    const ledgerReview = ledger.find((candidate) => candidate.record_id === input.id);
    assert.equal(source.reviewed_at, "2026-09-17");
    assert.equal(review.checked_url, input.source_url);
    assert.equal(review.review_level, input.review_level);
    assert.equal(review.review_scope, input.review_scope);
    assert.equal(review.source_locator, input.source_locator);
    assert.deepEqual(supplemental, { batch: "empirical", reviewed_at: "2026-09-17", review_level: input.review_level, review_scope: input.review_scope || input.review_level, checked_url: input.source_url, locator: input.source_locator, publication_or_edition: input.publication_or_edition, effective_period: null, evidence_summary: input.evidence_summary, limitations: input.limitations, checks: input.checks, rights_review: input.rights_review });
    assert.deepEqual(ledgerReview, review);
  }
  assert.equal(empirical.find((source) => source.id === "src_1sbtyzp").jurisdiction, "SME accounting platform; professional accountants");
});
