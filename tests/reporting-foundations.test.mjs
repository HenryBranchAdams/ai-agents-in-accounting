import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { coverage, records } from "../dist/internal/corpus.mjs";
import { executeAgent } from "../dist/internal/agent.mjs";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const supplement = read("data/research/reporting-foundations.json");
const guides = read("data/corpus/guide.json");
const byId = new Map(records.map((record) => [record.id, record]));

test("US reporting foundations preserve eight scoped questions and citable source reviews", () => {
  assert.equal(supplement.families.length, 8);
  for (const family of supplement.families) {
    const guide = byId.get(family.guide_id);
    assert.ok(guide, `${family.guide_id}: canonical guide missing`);
    const question = guide.data.research_questions.find((candidate) => candidate.id === family.question.id);
    assert.ok(question, `${family.question.id}: canonical question missing`);
    assert.match(question.scope, /US/);
    assert.ok(question.answer.length > 80);
    assert.ok(question.remaining_gaps.length >= 2);
    assert.equal(question.assessment.status, "partial");
    assert.equal(question.assessment.dimensions.workflow, "present");
    assert.equal(question.assessment.dimensions["worked-material"], "present");
    assert.ok(question.source_locators.length);
    for (const sourceId of question.source_ids) {
      const source = byId.get(sourceId);
      assert.equal(source?.kind, "source", `${question.id}: unresolved source ${sourceId}`);
    }
    for (const locator of question.source_locators)
      assert.ok(question.source_ids.includes(locator.source_id), `${question.id}: locator source not cited`);
  }
  for (const source of supplement.sources) {
    const record = byId.get(source.id);
    assert.equal(record?.kind, "source", `${source.id}: canonical source missing`);
    assert.equal(record.reviewed_at, supplement.reviewed_at);
    assert.equal(record.rights.full_text_stored, false);
    assert.equal(record.rights.source_status, "unknown");
    assert.equal(record.data.source_review.review_level, source.review_level);
    assert.equal(record.data.source_review.source_locator, source.source_locator);
    assert.ok(record.data.source_review.checks.length);
  }
});

test("US retrieval returns the new answer and source locator without replacing IFRS records", () => {
  const route = executeAgent("search", {
    q: "US framework routing FASAB GASB",
    kind: "guide",
    limit: 20,
  });
  assert.ok(route.results.some((record) => record.id === "guide-q-reporting-basis"));
  const events = executeAgent("search", {
    q: "US GAAP subsequent events going concern issuance availability",
    kind: "guide",
    limit: 20,
  });
  assert.ok(events.results.some((record) => record.id === "guide-q-events-going-concern"));

  const usConsolidation = byId.get("guide-q-consolidation").data.research_questions.find((question) => question.id === "rq-consolidation-us-control-models");
  assert.ok(usConsolidation.source_ids.includes("src_fasb_201502"));
  assert.ok(!usConsolidation.source_ids.some((id) => id.startsWith("src_ifrs")));
  const existingIfrs = byId.get("guide-q-consolidation").data.research_questions.find((question) => question.id === "rq-consolidation-scope-treatment");
  assert.ok(existingIfrs.source_ids.some((id) => id.startsWith("src_ifrs")));

  const direct = executeAgent("get", {
    id: "guide-q-events-going-concern",
    section: "data.research_questions",
    limit: 20,
  });
  assert.ok(direct.passages.some((passage) => passage.text.includes("financial-statement issuance or availability date")));
  assert.ok(direct.passages.some((passage) => passage.text.includes("src_fasb_201415")));
  assert.ok(direct.passages.every((passage) => passage.source_pointers.every((pointer) => pointer.startsWith("/data/research_questions/"))));

  const source = executeAgent("get", {
    id: "src_fasb_201415",
    section: "data.source_review",
    limit: 20,
  });
  assert.ok(source.passages.some((passage) => passage.text.includes("50-1")));
  assert.ok(source.record.citation.original_source_url.endsWith("ASU%202014-15.pdf"));
});

test("the synthetic January close balances, ties to statements and keeps actions unexecuted", () => {
  const fixture = byId.get("example-us-reporting-foundations-close").data;
  const sum = (rows, key) => rows.reduce((total, row) => total + (row[key] || 0), 0);
  assert.equal(fixture.opening_trial_balance.total_debits, sum(fixture.opening_trial_balance.accounts, "debit"));
  assert.equal(fixture.opening_trial_balance.total_credits, sum(fixture.opening_trial_balance.accounts, "credit"));
  assert.equal(fixture.opening_trial_balance.total_debits, fixture.opening_trial_balance.total_credits);
  assert.equal(fixture.proposed_journal_entries.length, 6);
  for (const journal of fixture.proposed_journal_entries) {
    assert.equal(sum(journal.lines, "debit"), sum(journal.lines, "credit"), journal.journal_id);
    assert.equal(journal.balanced, true, journal.journal_id);
    assert.equal(journal.status, "proposed-not-posted");
    assert.ok(journal.event_ids.length);
  }
  assert.equal(fixture.adjusted_trial_balance.total_debits, sum(fixture.adjusted_trial_balance.accounts, "debit"));
  assert.equal(fixture.adjusted_trial_balance.total_credits, sum(fixture.adjusted_trial_balance.accounts, "credit"));
  assert.equal(fixture.adjusted_trial_balance.total_debits, 185000);
  assert.equal(fixture.adjusted_trial_balance.total_debits, fixture.adjusted_trial_balance.total_credits);
  assert.equal(fixture.statement_mapping.assets, 185000);
  assert.equal(fixture.statement_mapping.liabilities_plus_equity, 185000);
  assert.equal(fixture.statement_mapping.liabilities + fixture.statement_mapping.equity, 185000);
  assert.equal(fixture.statement_mapping.net_expense, 31500);
  assert.equal(fixture.reference_output.net_expense, 31500);
  assert.equal(fixture.reference_output.adjusted_trial_balance_ties, true);
  assert.equal(fixture.reference_output.statement_mapping_ties, true);
  assert.deepEqual(fixture.reference_output.executed_actions, []);
  assert.equal(fixture.post_period_events.find((event) => event.event_id === "EVT-2026-02-10-CAD-SETTLEMENT").status, "outside-january-close");
});

test("estimate, issued-period and missing-date branches preserve their decision boundaries", () => {
  const fixture = byId.get("example-us-reporting-foundations-close").data;
  const branches = new Map(fixture.branches.map((branch) => [branch.branch_id, branch]));
  assert.deepEqual([...branches.keys()], ["estimate_revision", "issued_period_error", "post_period_event", "missing_decisive_date"]);
  assert.match(branches.get("estimate_revision").expected_route, /new information/);
  assert.match(branches.get("estimate_revision").expected_route, /ASC 250/);
  assert.match(branches.get("issued_period_error").expected_route, /materiality/);
  assert.match(branches.get("post_period_event").expected_route, /Topic 855/);
  assert.equal(branches.get("missing_decisive_date").facts.financial_statements_issued_or_available_date, null);
  assert.equal(branches.get("missing_decisive_date").status, "blocked-on-missing-input");
  assert.match(branches.get("missing_decisive_date").expected_route, /Escalate/);
  assert.ok(fixture.controls.some((control) => control.includes("No posting")));
});

test("scoped sector-anchor assessments do not propagate to descendants or claim industry adequacy", () => {
  const assessments = read("data/coverage/assessments.json").assessments;
  const reporting = assessments.filter((assessment) => assessment.id.startsWith("coverage-reporting-foundations-"));
  assert.equal(reporting.length, 8);
  assert.deepEqual(new Set(reporting.map((assessment) => assessment.industry_code)), new Set(["54"]));
  assert.ok(reporting.every((assessment) => assessment.status === "partial"));
  assert.ok(reporting.every((assessment) => assessment.scope.includes("not a Professional, Scientific, and Technical Services conclusion")));
  assert.equal(coverage.cell("54", "q-reporting-basis").assessments.length, 1);
  assert.equal(coverage.cell("541", "q-reporting-basis").assessments.length, 0);
  assert.equal(coverage.cell("541110", "q-reporting-basis").assessments.length, 0);
  const exampleMapping = coverage.profiles.get("example-us-reporting-foundations-close");
  assert.equal(exampleMapping.industry_scope, "shared-context");
  assert.deepEqual(exampleMapping.industry_mappings, []);
});
