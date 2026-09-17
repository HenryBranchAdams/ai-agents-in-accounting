import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { coverage, records } from "../dist/internal/corpus.mjs";
import { executeAgent } from "../dist/internal/agent.mjs";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
const supplement = read("data/research/reporting-foundations.json");
const inventory = read("data/research/reporting-foundations-inventory.json");
const catalog = read("data/catalog.json");
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
  const evidenceGapFamilies = new Set(["q-ledger-close", "q-estimates", "q-presentation", "q-policy-changes-errors"]);
  for (const family of supplement.families) {
    const question = byId.get(family.guide_id).data.research_questions.find((candidate) => candidate.id === family.question.id);
    assert.equal(question.answer_status, evidenceGapFamilies.has(family.family_id) ? "evidence-gap" : "sourced-answer-bounded");
  }
  assert.equal(supplement.sources.find((source) => source.id === "src_fasb_201415").effective_period, "Effective for the annual period ending after December 15, 2016, and for annual periods and interim periods thereafter; early application is permitted.");
});

test("the baseline inventory maps reuse, deepening, new work and unresolved populations", () => {
  assert.equal(inventory.package_id, supplement.package_id);
  assert.equal(inventory.baseline.named_question_count, 178);
  assert.equal(inventory.baseline.selected_existing_question_count, 16);
  assert.equal(inventory.dispositions.reuse.length, 12);
  assert.equal(inventory.dispositions.deepen.length, 8);
  assert.equal(inventory.dispositions.new.filter((item) => item.kind === "question").length, 8);
  assert.ok(inventory.dispositions.unresolved.length >= 6);
  assert.equal(inventory.shared_generator_dependency.source_branch, "codex/aa-i119");
  assert.equal(inventory.shared_generator_dependency.source_commit, "0d447e6033bdc10ecd3ab9a2f5855ae73644807d");
  assert.match(inventory.shared_generator_dependency.review_state, /pending/);
  assert.match(inventory.shared_generator_dependency.remaining_scope, /not final until the shared generator revision is integrated and rerun/);
  const existingQuestionIds = inventory.dispositions.deepen.flatMap((item) => item.existing_question_ids);
  assert.equal(new Set(existingQuestionIds).size, 16);
  for (const item of inventory.dispositions.reuse) assert.equal(byId.get(item.id)?.kind, "source", item.id);
  for (const item of inventory.dispositions.deepen) {
    assert.equal(byId.get(item.id)?.kind, "guide", item.id);
    for (const questionId of item.existing_question_ids)
      assert.ok(byId.get(item.id).data.research_questions.some((question) => question.id === questionId), questionId);
    assert.ok(item.new_question_id.startsWith("rq-"));
  }
  for (const item of inventory.dispositions.new.filter((candidate) => candidate.kind === "question"))
    assert.ok(byId.get(item.record_id).data.research_questions.some((question) => question.id === item.id), item.id);
  assert.equal(inventory.original_acceptance_evidence.length, 5);
  assert.ok(inventory.original_acceptance_evidence.every((item) => item.evidence.length >= 2));
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

test("the FX fixture states its pair direction and converts CAD into USD independently", () => {
  const fixture = byId.get("example-us-reporting-foundations-close").data;
  const table = fixture.fx_rate_table;
  assert.equal(table.base_currency, "CAD");
  assert.equal(table.quote_currency, "USD");
  assert.equal(table.pair_notation, "CAD/USD");
  assert.equal(table.quote_convention, "1 CAD = rate USD");
  assert.equal(table.conversion_formula, "USD amount = CAD amount * rate");
  const rates = new Map(table.rates.map((rate) => [rate.rate_id, rate]));
  for (const rate of table.rates) {
    assert.equal(rate.currency_pair, "CAD/USD");
    assert.equal(rate.base_currency, "CAD");
    assert.equal(rate.quote_currency, "USD");
    assert.equal(rate.rate_unit, "USD per CAD");
  }
  const cadEvents = [
    ...fixture.events.filter((event) => event.currency === "CAD"),
    ...fixture.post_period_events.filter((event) => event.currency === "CAD"),
  ];
  for (const event of cadEvents) {
    const rate = rates.get(event.fx_rate_id);
    assert.ok(rate, event.event_id);
    assert.equal(event.usd_rate, rate.rate);
    const usdAmount = event.usd_amount ?? event.usd_settlement_amount;
    assert.equal(usdAmount, Math.round(event.foreign_amount * rate.rate * 100) / 100, event.event_id);
  }
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

test("generated coverage headers match the catalog", () => {
  assert.equal(read("data/coverage/subsector-profiles.json").corpus_version, catalog.corpus_version);
  assert.equal(read("data/coverage/subsector-screening.json").corpus_version, catalog.corpus_version);
});

test("the applicator refuses a newer unrelated field on a matching canonical record", () => {
  const script = path.resolve("scripts/apply-reporting-foundations.mjs");
  const inputs = [
    "data/catalog.json",
    "data/corpus/source.json",
    "data/corpus/guide.json",
    "data/corpus/example.json",
    "data/coverage/research-questions.json",
    "data/coverage/assessments.json",
    "data/coverage/mapping-overrides.json",
    "data/coverage/subsector-profiles.json",
    "data/coverage/subsector-screening.json",
    "data/research/reporting-foundations.json",
    "data/research/reporting-foundations-example.json",
    "data/research/reporting-foundations-assessments.json",
    "data/research/reporting-foundations-inventory.json",
  ];
  const copyRoot = () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "reporting-foundations-preservation-"));
    for (const file of inputs) {
      const destination = path.join(root, file);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(file, destination);
    }
    return root;
  };
  const run = (root) => execFileSync(process.execPath, [script], {
    cwd: root,
    env: { ...process.env, REPORTING_FOUNDATIONS_ROOT: root },
    encoding: "utf8",
    stdio: "pipe",
  });
  const exampleRoot = copyRoot();
  try {
    const file = path.join(exampleRoot, "data/corpus/example.json");
    const examples = read(file);
    const record = examples.find((candidate) => candidate.id === "example-us-reporting-foundations-close");
    record.data.newer_unrelated_canonical_note = "preserve this field";
    write(file, examples);
    assert.throws(() => run(exampleRoot), /example-us-reporting-foundations-close: existing canonical record differs; refusing overwrite/);
    assert.equal(read(file).find((candidate) => candidate.id === record.id).data.newer_unrelated_canonical_note, "preserve this field");
  } finally {
    fs.rmSync(exampleRoot, { recursive: true, force: true });
  }
  const questionRoot = copyRoot();
  try {
    const file = path.join(questionRoot, "data/corpus/guide.json");
    const canonicalGuides = read(file);
    const question = canonicalGuides.find((record) => record.id === "guide-q-estimates").data.research_questions.find((candidate) => candidate.id === "rq-estimates-us-change-or-error");
    question.newer_unrelated_canonical_note = "preserve this question field";
    write(file, canonicalGuides);
    assert.throws(() => run(questionRoot), /rq-estimates-us-change-or-error: existing canonical question differs; refusing overwrite/);
    assert.equal(read(file).find((record) => record.id === "guide-q-estimates").data.research_questions.find((candidate) => candidate.id === question.id).newer_unrelated_canonical_note, "preserve this question field");
  } finally {
    fs.rmSync(questionRoot, { recursive: true, force: true });
  }
});
