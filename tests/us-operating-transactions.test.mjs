import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
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
