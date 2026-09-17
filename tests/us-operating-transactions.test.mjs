import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const catalog = read("data/catalog.json");
const guides = read("data/corpus/guide.json");
const sources = read("data/corpus/source.json");
const examples = new Map(read("data/corpus/example.json").map((record) => [record.id, record]));
const sourceIds = new Set(sources.map((record) => record.id));

test("US operating transaction families retain bounded questions, references, and exclusions", () => {
  const expected = {
    "q-revenue": ["rq-us-revenue-contract-control", "rq-us-revenue-presentation-refunds"],
    "q-project-wip": ["rq-us-project-wip-over-time-cutoff", "rq-us-project-wip-contract-costs"],
    "q-purchasing-payables": ["rq-us-purchasing-payables-receipt-cutoff", "rq-us-purchasing-payables-corrections"],
    "q-receivables-credit": ["rq-us-receivables-contract-assets", "rq-us-receivables-credit-loss"],
    "q-cash-settlement": ["rq-us-cash-settlement-gross-to-bank", "rq-us-cash-settlement-clearing"],
    "q-inventory": ["rq-us-inventory-landed-cost", "rq-us-inventory-ownership-rollforward"],
  };

  for (const [familyId, questionIds] of Object.entries(expected)) {
    const guide = guides.find((record) => record.data?.family_id === familyId);
    assert.ok(guide, familyId);
    for (const questionId of questionIds) {
      const question = guide.data.research_questions.find((candidate) => candidate.id === questionId);
      assert.ok(question, questionId);
      assert.match(question.scope, /United States nongovernmental/);
      assert.match(question.scope, /Excludes bank lending, insurer contracts, governmental fund accounting/);
      for (const sourceId of question.source_ids) assert.ok(sourceIds.has(sourceId), `${questionId}: ${sourceId}`);
      assert.ok(question.workflow_ids.length > 0);
      assert.ok(question.control_ids.length > 0);
      assert.ok(examples.has(question.worked_record_id), `${questionId}: missing worked record`);
    }
  }
});

test("US synthetic ledgers reconcile without netting unrelated populations", () => {
  const operating = examples.get("example-us-operating-transactions-ledger");
  assert.deepEqual(operating.data.rollforwards.inventory_base, {
    opening_units: 0,
    received_units: 100,
    shipped_units: 60,
    ending_units: 40,
    received_cost: 4200,
    cogs: 2520,
    ending_cost: 1680,
    unit_cost: 42,
  });
  assert.deepEqual(operating.data.rollforwards.settlement_branch, {
    gross_customer_consideration: 4200,
    tax_collected: 336,
    processor_fee: 126,
    refund: 140,
    cash_deposit: 4270,
  });
  assert.ok(operating.data.reconciliations.every((row) => row.difference === 0));
  assert.ok(operating.data.journals.every((journal) => journal.amount > 0 && journal.debit && journal.credit));
  assert.equal(operating.data.branches.find((branch) => branch.id === "loan-proceeds-branch").result.customer_revenue, 0);
  assert.ok(operating.data.limitations.some((limitation) => limitation.startsWith("Synthetic example:")));
  assert.equal(operating.rights.full_text_stored, false);

  const project = examples.get("example-us-project-wip-ledger");
  assert.equal(project.data.reference_output.progress, 0.4);
  assert.equal(project.data.reference_output.revenue_to_date, 48000);
  assert.equal(project.data.reference_output.contract_asset, 18000);
  assert.ok(project.data.reconciliations.every((row) => row.difference === 0));
  assert.ok(project.data.limitations.some((limitation) => limitation.startsWith("Synthetic example:")));
});

test("generated coverage metadata follows the catalog edition", () => {
  for (const file of ["data/coverage/subsector-profiles.json", "data/coverage/subsector-screening.json"])
    assert.equal(read(file).corpus_version, catalog.corpus_version, `${file}: stale corpus version`);
  const generator = fs.readFileSync("scripts/build-research-coverage.mjs", "utf8");
  assert.match(generator, /read\('data\/catalog\.json'\)/);
  assert.doesNotMatch(generator, /corpus_version:'2026-09-11\.2'/);
});

test("source review scope covers cited US locators and guide history is idempotent", () => {
  const source = new Map(sources.map((record) => [record.id, record]));
  const asu2014 = source.get("src_construction_fasb_2014_09");
  const asu2025 = source.get("src_construction_fasb_202505");
  const asu2016 = source.get("src_fasb_asu2016_08_principal_agent");
  for (const [record, locators] of [
    [asu2014, ["25-1", "32-1", "45-1", "340-40-25-1", "606-10-65-1"]],
    [asu2025, ["30-10A", "50-12A", "55-40A", "326-10-65-6"]],
    [asu2016, ["55-36", "55-40", "65-1"]],
  ]) {
    assert.equal(record.reviewed_at, "2026-09-17", record.id);
    assert.equal(record.data.source_review.review_level, "substantive-excerpt", record.id);
    for (const locator of locators) assert.match(record.data.source_review.source_locator, new RegExp(locator), `${record.id}: ${locator}`);
    assert.ok(record.data.source_review.checks.some((check) => check.material_read), `${record.id}: missing read evidence`);
    assert.equal(record.rights.full_text_stored, false);
  }
  assert.match(asu2025.data.source_review.effective_period, /prospectively/);
  assert.match(asu2025.data.source_review.effective_period, /other than public business entities/);
  assert.match(asu2016.data.source_review.effective_period, /interim periods/);
  assert.match(asu2016.data.source_review.effective_period, /earlier application/);

  for (const id of [
    "guide-q-revenue",
    "guide-q-project-wip",
    "guide-q-purchasing-payables",
    "guide-q-receivables-credit",
    "guide-q-cash-settlement",
    "guide-q-inventory",
  ]) {
    const history = guides.find((record) => record.id === id).provenance.revision_history;
    assert.equal(history.length, 1, `${id}: duplicate revision history`);
    assert.equal(new Set(history.map((entry) => JSON.stringify(entry))).size, history.length, `${id}: non-idempotent history`);
  }
});
