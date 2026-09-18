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
  assert.equal(supplement.version, "2026-09-17.2");
  assert.equal(supplement.sources.find((source) => source.id === "src_fasb_202010").source_locator, "ASU printed pp.5, 13-14 and 37-38; Issue 21, Topic 250-10-45-27 and 250-10-50-12; Issue 22, Topic 250-10-45-28 and 50-7A; transition 105-10-65-6");
  assert.equal(supplement.sources.find((source) => source.id === "src_fasb_202511").effective_period, "Public business entities: interim reporting periods within annual reporting periods beginning after December 15, 2027. Entities other than public business entities: interim reporting periods within annual reporting periods beginning after December 15, 2028. Early adoption is permitted for all entities; the stated prospective or retrospective transition choices apply.");
  assert.deepEqual(new Set(inventory.follow_up_research.accessible_sources.map((source) => source.id)), new Set(["src_fasb_202010", "src_fasb_202511", "src_secsab0099"]));
  assert.equal(inventory.follow_up_research.unresolved_questions.length, 4);
  assert.match(inventory.follow_up_research.disposition, /all four original evidence-gap questions remain open/);
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
  assert.equal(inventory.shared_generator_dependency.correction_commit, "f777250e2baf400212d312ba4e9405bd5c358e3d");
  assert.equal(inventory.shared_generator_dependency.review_state, "AA-R119 accepted");
  assert.equal(inventory.shared_generator_dependency.review_receipt, "46f4b50");
  assert.match(inventory.shared_generator_dependency.remaining_scope, /final combined edition still requires snapshot-history reconciliation/);
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

test("coverage generator preserves explicit construction source scope on clean reruns", () => {
  const generatedFiles = [
    "data/corpus/guide.json",
    "data/coverage/mapping-overrides.json",
    "data/coverage/research-criteria.json",
    "data/coverage/subsector-profiles.json",
    "data/coverage/subsector-screening.json",
  ];
  const inputFiles = [
    "data/catalog.json",
    "data/coverage/topology.json",
    "data/research/subsector-profiles.json",
    "data/research/family-screening-rules.json",
    "data/coverage/research-questions.json",
    "data/coverage/industry-exception-reviews.json",
    "data/corpus/source.json",
    "data/corpus/guide.json",
    "data/coverage/mapping-overrides.json",
    "scripts/build-research-coverage.mjs",
  ];
  const guideIds = [
    "guide-industry-naics2022-236",
    "guide-industry-naics2022-237",
    "guide-industry-naics2022-238",
  ];
  const constructionOnlySourceIds = [
    "src_construction_fasb_retainage_staff",
    "src_construction_gao_25107258",
    "src_construction_asbca_51759",
  ];
  const expectedSourceIds = new Map(guideIds.map((id) => [id, guides.find((record) => record.id === id).source_ids]));
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "aa-coverage-generator-"));
  const copy = (file) => {
    const destination = path.join(temp, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(file, destination);
  };
  const snapshot = () => Object.fromEntries(generatedFiles.map((file) => [file, fs.readFileSync(path.join(temp, file), "utf8")]));

  try {
    for (const file of inputFiles) copy(file);
    const run = () => execFileSync(process.execPath, ["scripts/build-research-coverage.mjs"], { cwd: temp, encoding: "utf8" });
    run();

    const generatedGuides = new Map(read(path.join(temp, "data/corpus/guide.json")).map((record) => [record.id, record]));
    const generatedOverrides = read(path.join(temp, "data/coverage/mapping-overrides.json")).records;
    for (const id of guideIds) {
      assert.deepEqual(generatedGuides.get(id).source_ids, expectedSourceIds.get(id), `${id}: source scope broadened`);
      assert.deepEqual(generatedOverrides[id].source_ids, expectedSourceIds.get(id), `${id}: explicit source scope changed`);
      for (const sourceId of constructionOnlySourceIds)
        assert.ok(!generatedGuides.get(id).source_ids.includes(sourceId), `${id}: unrelated construction source ${sourceId}`);
    }

    const firstRun = snapshot();
    run();
    assert.deepEqual(snapshot(), firstRun, "coverage generator changed output on its second run");
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
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
  const run = (root) => execFileSync(process.execPath, [script, "--integrate-into-newer-corpus"], {
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
  const guideRoot = copyRoot();
  try {
    const file = path.join(guideRoot, "data/corpus/guide.json");
    const canonicalGuides = read(file);
    const guide = canonicalGuides.find((record) => record.id === "guide-q-estimates");
    guide.summary = `${guide.summary} Newer unrelated guide annotation.`;
    write(file, canonicalGuides);
    assert.throws(() => run(guideRoot), /guide-q-estimates: package-owned guide field summary differs; refusing overwrite/);
    assert.match(read(file).find((record) => record.id === guide.id).summary, /Newer unrelated guide annotation\.$/);
  } finally {
    fs.rmSync(guideRoot, { recursive: true, force: true });
  }
});

test("the applicator applies to the clean base, replays byte-identically, and preserves guide divergence", () => {
  const script = path.resolve("scripts/apply-reporting-foundations.mjs");
  const cleanBase = "afd2aced307628843f8a26677c3a6fb37fa733e3";
  const canonicalInputs = [
    "data/catalog.json",
    "data/corpus/source.json",
    "data/corpus/guide.json",
    "data/corpus/example.json",
    "data/coverage/research-questions.json",
    "data/coverage/assessments.json",
    "data/coverage/mapping-overrides.json",
    "data/coverage/subsector-profiles.json",
    "data/coverage/subsector-screening.json",
  ];
  const packageInputs = [
    "data/research/reporting-foundations.json",
    "data/research/reporting-foundations-example.json",
    "data/research/reporting-foundations-assessments.json",
    "data/research/reporting-foundations-inventory.json",
  ];
  const outputs = canonicalInputs.slice(1);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "reporting-foundations-clean-base-"));
  const copy = (file, revision) => {
    const destination = path.join(root, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    const contents = revision
      ? execFileSync("git", ["show", `${revision}:${file}`], { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 })
      : fs.readFileSync(file, "utf8");
    fs.writeFileSync(destination, contents);
  };
  const run = () => execFileSync(process.execPath, [script], {
    cwd: root,
    env: { ...process.env, REPORTING_FOUNDATIONS_ROOT: root },
    encoding: "utf8",
    stdio: "pipe",
  });
  const snapshot = () => Object.fromEntries(outputs.map((file) => [file, fs.readFileSync(path.join(root, file), "utf8")]));

  try {
    for (const file of canonicalInputs) copy(file, cleanBase);
    for (const file of packageInputs) copy(file);

    const family = supplement.families.find((candidate) => candidate.guide_id === "guide-q-estimates");
    const before = read(path.join(root, "data/corpus/guide.json")).find((record) => record.id === family.guide_id);
    assert.equal(before.provenance.supplemental_research_file, undefined);
    assert.equal(before.data.supplemental_research_package, undefined);
    assert.notEqual(before.summary, family.summary);
    const preservedSharedInputs = structuredClone(before.data.shared_inputs);

    run();

    const applied = read(path.join(root, "data/corpus/guide.json")).find((record) => record.id === family.guide_id);
    assert.equal(applied.summary, family.summary);
    assert.equal(applied.data.version, supplement.version);
    assert.equal(applied.data.supplemental_research_package, supplement.package_id);
    assert.deepEqual(applied.data.shared_inputs, preservedSharedInputs);
    const firstRun = snapshot();
    run();
    assert.deepEqual(snapshot(), firstRun, "applicator changed clean-base output on replay");

    const divergentGuides = read(path.join(root, "data/corpus/guide.json"));
    const divergent = divergentGuides.find((record) => record.id === family.guide_id);
    divergent.summary = `${divergent.summary} Newer unrelated guide annotation.`;
    divergent.provenance.newer_unrelated_canonical_note = "preserve this provenance field";
    divergent.data.newer_unrelated_canonical_note = "preserve this data field";
    write(path.join(root, "data/corpus/guide.json"), divergentGuides);
    const beforeDivergence = snapshot();
    assert.throws(() => run(), /guide-q-estimates: package-owned guide field summary differs; refusing overwrite/);
    assert.deepEqual(snapshot(), beforeDivergence, "divergent guide failure wrote files");
    const preserved = read(path.join(root, "data/corpus/guide.json")).find((record) => record.id === family.guide_id);
    assert.match(preserved.summary, /Newer unrelated guide annotation\.$/);
    assert.equal(preserved.provenance.newer_unrelated_canonical_note, "preserve this provenance field");
    assert.equal(preserved.data.newer_unrelated_canonical_note, "preserve this data field");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("the bounded package integrates into the accepted mainline without downgrading newer metadata", () => {
  const script = path.resolve("scripts/apply-reporting-foundations.mjs");
  const currentMain = "7ecd9e31d7035f7a4d38bae6e0bd1fba46343144";
  const canonicalInputs = [
    "data/catalog.json",
    "data/corpus/source.json",
    "data/corpus/guide.json",
    "data/corpus/example.json",
    "data/coverage/research-questions.json",
    "data/coverage/assessments.json",
    "data/coverage/mapping-overrides.json",
    "data/coverage/subsector-profiles.json",
    "data/coverage/subsector-screening.json",
  ];
  const packageInputs = [
    "data/research/reporting-foundations.json",
    "data/research/reporting-foundations-example.json",
    "data/research/reporting-foundations-assessments.json",
    "data/research/reporting-foundations-inventory.json",
  ];
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "reporting-foundations-mainline-"));
  const copy = (file, revision = null) => {
    const destination = path.join(root, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    const contents = revision
      ? execFileSync("git", ["show", `${revision}:${file}`], { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 })
      : fs.readFileSync(file, "utf8");
    fs.writeFileSync(destination, contents);
  };
  const run = () => execFileSync(process.execPath, [script, "--integrate-into-newer-corpus"], {
    cwd: root,
    env: { ...process.env, REPORTING_FOUNDATIONS_ROOT: root },
    encoding: "utf8",
    stdio: "pipe",
  });
  const outputFiles = canonicalInputs.slice(1);
  const snapshot = () => Object.fromEntries(outputFiles.map((file) => [file, fs.readFileSync(path.join(root, file))]));
  const targetGuideIds = new Set(supplement.families.map((family) => family.guide_id));
  const compareProtectedRecords = (file, ids) => {
    const before = new Map(read(path.join(root, file)).map((record) => [record.id, record]));
    const expected = new Map(read(file).map((record) => [record.id, record]));
    for (const id of ids) assert.deepEqual(before.get(id), expected.get(id), `${file}:${id} changed outside the bounded package`);
  };

  try {
    for (const file of canonicalInputs) copy(file, file === "data/catalog.json" ? null : currentMain);
    for (const file of packageInputs) copy(file);

    run();

    const sources = read(path.join(root, "data/corpus/source.json"));
    const guides = read(path.join(root, "data/corpus/guide.json"));
    const registry = read(path.join(root, "data/coverage/research-questions.json"));
    const assessments = read(path.join(root, "data/coverage/assessments.json"));
    const overrides = read(path.join(root, "data/coverage/mapping-overrides.json"));
    assert.equal(sources.length, 653);
    assert.equal(guides.length, 188);
    assert.equal(registry.questions.length, 208);
    assert.equal(registry.question_set_version, "2026-09-17.1272");
    assert.equal(registry.corpus_version, "2026-09-17.4");
    assert.equal(assessments.assessments.length, 25);
    assert.equal(assessments.assessment_version, "2026-09-17.1302");
    assert.equal(overrides.mapping_version, "2026-09-17.1272");
    assert.deepEqual(
      assessments.assessments.filter((assessment) => assessment.id.startsWith("coverage-reporting-foundations-")).map((assessment) => assessment.status),
      Array(8).fill("partial"),
    );

    const baseSourceIds = new Set(read(path.join(root, "data/corpus/source.json")).map((record) => record.id));
    for (const source of supplement.sources) assert.ok(sources.some((record) => record.id === source.id));
    assert.ok(guides.every((record) => record.id));
    assert.equal(baseSourceIds.size, 653);
    assert.equal(read(path.join(root, "data/corpus/example.json")).some((record) => record.id === "example-us-reporting-foundations-close"), true);

    const gitShow = (file) => execFileSync("git", ["show", `${currentMain}:${file}`], { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 });
    const baseSources = JSON.parse(gitShow("data/corpus/source.json"));
    const baseGuides = JSON.parse(gitShow("data/corpus/guide.json"));
    const baseExamples = JSON.parse(gitShow("data/corpus/example.json"));
    const currentSourceIds = new Set(baseSources.map((record) => record.id));
    const currentGuideIds = new Set(baseGuides.map((record) => record.id).filter((id) => !targetGuideIds.has(id)));
    const currentExampleIds = new Set(baseExamples.map((record) => record.id));
    compareProtectedRecords("data/corpus/source.json", currentSourceIds);
    compareProtectedRecords("data/corpus/guide.json", currentGuideIds);
    compareProtectedRecords("data/corpus/example.json", currentExampleIds);

    const firstRun = snapshot();
    run();
    for (const [file, bytes] of Object.entries(firstRun)) assert.deepEqual(fs.readFileSync(path.join(root, file)), bytes, `${file}: mainline replay changed bytes`);

    const divergent = read(path.join(root, "data/corpus/guide.json"));
    const guide = divergent.find((record) => record.id === "guide-q-estimates");
    guide.summary = `${guide.summary} Mainline divergence.`;
    fs.writeFileSync(path.join(root, "data/corpus/guide.json"), `${JSON.stringify(divergent, null, 2)}\n`);
    assert.throws(() => run(), /guide-q-estimates: package-owned guide field summary differs; refusing overwrite/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
