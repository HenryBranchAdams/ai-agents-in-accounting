import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { executeAgent } from "../dist/internal/agent.mjs";

const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const packageRecord = read("data/research/aa-i102103-wholesale-retail-2026-09-19.json");
const catalog = read("data/catalog.json");
const sources = read("data/corpus/source.json");
const guides = read("data/corpus/guide.json");
const examples = read("data/corpus/example.json");
const registry = read("data/coverage/research-questions.json");
const assessments = read("data/coverage/assessments.json");
const mappings = read("data/coverage/record-mappings.json");
const snapshots = read("data/coverage/snapshots.json");

const byId = (records, id) => {
  const record = records.find(candidate => candidate.id === id);
  assert.ok(record, `missing ${id}`);
  return record;
};

test("AA-I102 and AA-I103 preserve scope, source boundaries, and additive history", () => {
  assert.deepEqual(packageRecord.issue_ids, ["AA-I102", "AA-I103"]);
  assert.equal(packageRecord.package_version, catalog.corpus_version);
  assert.equal(packageRecord.baseline.corpus_version, "2026-09-18.1");
  assert.deepEqual(packageRecord.baseline.existing_questions, [
    "rq-trade-control",
    "rq-trade-principal",
    "rq-trade-returns",
    "rq-trade-cutoff",
    "rq-trade-inventory",
    "rq-trade-intermediary",
  ]);
  assert.deepEqual(packageRecord.new_records.source_ids, ["src_fasb_asu2016_04_gift_cards"]);
  assert.deepEqual(packageRecord.new_records.example_ids, ["example-us-wholesale-retail-trade-reconciliation"]);
  assert.equal(packageRecord.criteria_evidence["AA-I102"].length, 5);
  assert.equal(packageRecord.criteria_evidence["AA-I103"].length, 5);
  assert.ok(packageRecord.negative_scope.some(item => item.includes("net bank deposit")));
  assert.ok(packageRecord.negative_scope.some(item => item.includes("shrinkage")));

  const guide = byId(guides, "guide-wholesale-retail");
  assert.equal(guide.data.version, catalog.corpus_version);
  assert.equal(guide.reviewed_at, packageRecord.reviewed_at);
  assert.ok(guide.source_ids.includes("src_fasb_asu2016_04_gift_cards"));
  assert.ok(guide.source_ids.includes("src_1os761s"));
  assert.deepEqual(guide.data.research_questions.map(question => question.id), packageRecord.baseline.existing_questions);
  for (const question of guide.data.research_questions) {
    const row = byId(registry.questions, question.id);
    assert.equal(row.record_id, guide.id);
    assert.equal(row.pointer, `/data/research_questions/${guide.data.research_questions.indexOf(question)}`);
    assert.deepEqual(row.source_ids, question.source_ids, question.id);
    assert.equal(row.scope, question.scope, question.id);
    assert.deepEqual(row.remaining_gaps, question.remaining_gaps, question.id);
    assert.equal(row.dimensions.workflow, "partial", question.id);
    assert.equal(question.assessment.dimensions.workflow, "partial", question.id);
    assert.equal(question.worked_record_id, "example-us-wholesale-retail-trade-reconciliation", question.id);
    for (const locator of question.source_locators) assert.ok(question.source_ids.includes(locator.source_id), question.id);
  }

  const giftCard = byId(sources, "src_fasb_asu2016_04_gift_cards");
  assert.equal(giftCard.reviewed_at, packageRecord.reviewed_at);
  assert.equal(giftCard.rights.full_text_stored, false);
  assert.equal(giftCard.rights.source_status, "unknown");
  assert.match(giftCard.data.source_review.source_locator, /405-20-40-1/);
  const fasbTrade = byId(sources, "src_construction_fasb_2014_09");
  assert.ok(fasbTrade.data.supplemental_reviews.some(review => review.batch === packageRecord.package_id));
  assert.equal(byId(sources, "src_roadmap_naics2022_manual").rights.full_text_stored, false);

  for (const id of packageRecord.new_records.assessment_ids) {
    const assessment = byId(assessments.assessments, id);
    assert.equal(assessment.status, "partial");
    assert.equal(assessment.dimensions["empirical-support"], "not-assessed");
    assert.equal(assessment.rights.full_text_stored, false);
  }
  assert.equal(assessments.assessment_version, catalog.corpus_version);
  const wholesale = byId(assessments.assessments, "coverage-wholesale-trade-2026-09-18");
  const retail = byId(assessments.assessments, "coverage-retail-trade-2026-09-18");
  assert.equal(wholesale.industry_code, "42");
  assert.equal(retail.industry_code, "44-45");
  assert.ok(wholesale.gaps.some(gap => gap.includes("consolidated")));
  assert.ok(retail.gaps.some(gap => gap.includes("unclaimed")));

  const mapping = mappings.mappings.find(candidate => candidate.record_id === "guide-wholesale-retail");
  assert.ok(mapping);
  assert.equal(mapping.industry_scope, "specific");
  assert.deepEqual(mapping.industry_mappings.map(item => item.industry_code), ["42", "44-45"]);
  assert.deepEqual(mapping.question_mappings.map(item => item.question_id), [
    "q-cash-settlement",
    "q-data-lineage",
    "q-inventory",
    "q-receivables-credit",
    "q-revenue",
  ]);
  assert.ok(mapping.note.includes("AA-I102"));
  assert.equal(mappings.mapping_version, catalog.corpus_version);
  assert.equal(snapshots.snapshots.at(-1).id, catalog.corpus_version);
});

test("AA-I102 and AA-I103 synthetic trade bridges reconcile without posting actions", () => {
  const example = byId(examples, "example-us-wholesale-retail-trade-reconciliation").data;
  const merchant = example.wholesale_merchant;
  assert.equal(100 * 400 + 2000, 42000);
  assert.equal(60 * 420, merchant.reference_output.cost_of_goods_sold);
  assert.equal(100 - 60, merchant.reference_output.ending_units);
  assert.equal(42000 - 25200, merchant.reference_output.ending_inventory_cost);
  for (const row of merchant.reconciliations) assert.equal(row.difference, 0, row.name);

  const broker = example.broker_and_consignor.settlement_bridge;
  assert.equal(broker.customer_activity - broker.amount_due_principal, broker.commission_revenue_candidate);
  assert.equal(broker.difference, 0);
  assert.equal(example.broker_and_consignor.owned_inventory_units, 0);
  assert.match(example.broker_and_consignor.warehouse_confirmation, /incomplete/);

  const retail = example.retail_pos_and_card_clearing;
  assert.equal(retail.population.gross_card_charges - retail.population.refunds - retail.population.processor_fees, retail.population.bank_deposit);
  assert.equal(retail.population.merchandise_amount + retail.population.sales_tax_collected + retail.population.gift_card_issuance, retail.population.gross_card_charges);
  const gift = retail.gift_card_liability_rollforward;
  assert.equal(gift.opening_liability + gift.issuance - gift.redemption - gift.refunds, gift.ending_before_breakage);
  assert.equal(gift.ending_before_breakage, 2200);
  assert.equal(retail.settlement_reconciliation.difference, 0);
  assert.equal(retail.composition_reconciliation.difference, 0);
  assert.equal(gift.difference, 0);
  assert.equal(retail.loyalty_population.awards_expired, 0);
  assert.match(retail.loyalty_population.unresolved, /Material-right/);

  const grocery = example.grocery_inventory.quantity_rollforward;
  assert.equal(grocery.opening_units + grocery.receipts - grocery.sales - grocery.recorded_spoilage, grocery.expected_ending_units);
  assert.equal(grocery.expected_ending_units - grocery.counted_units, grocery.shrink_pending_investigation);
  assert.equal(grocery.difference, 0);

  const branches = new Map(example.marketplace_role_branches.map(branch => [branch.id, branch]));
  assert.equal(branches.get("marketplace-agent").commission_candidate, 2500);
  assert.equal(branches.get("marketplace-principal").gross_revenue_candidate, 50000);
  assert.notEqual(branches.get("marketplace-agent").commission_candidate, branches.get("marketplace-principal").gross_revenue_candidate);
  assert.deepEqual(example.reference_output.proposed_actions, []);
  assert.deepEqual(example.reference_output.executed_actions, []);
});

test("AA-I102 and AA-I103 retrieval exposes merchant, gift-card, and grocery evidence", () => {
  const searches = [
    ["wholesale merchant landed cost broker consignment", "guide-wholesale-retail", "guide"],
    ["gift card breakage prepaid stored value", "src_fasb_asu2016_04_gift_cards", "source"],
    ["grocery shrink spoilage marketplace settlement", "example-us-wholesale-retail-trade-reconciliation", "example"],
  ];
  for (const [query, expected, kind] of searches) {
    const result = executeAgent("search", { q: query, kind, limit: 10 });
    assert.ok(result.results.some(hit => hit.id === expected), `${kind}: ${expected}`);
  }
  const example = executeAgent("get", { id: "example-us-wholesale-retail-trade-reconciliation", section: "data.retail_pos_and_card_clearing", limit: 20 });
  assert.ok(example.passages.some(passage => passage.text.includes("10,900")));
  const source = executeAgent("get", { id: "src_fasb_asu2016_04_gift_cards", section: "data.source_review", limit: 20 });
  assert.ok(source.passages.some(passage => passage.text.includes("40-3 through 40-4")));
  assert.equal(source.record.rights.full_text_stored, false);
  const context = executeAgent("context", { ids: ["example-us-wholesale-retail-trade-reconciliation"], include_sources: true, max_chars: 40000 });
  assert.ok(context.records.some(entry => entry.record.id === "src_fasb_asu2016_04_gift_cards"));
  assert.ok(context.records.every(entry => entry.record.rights.full_text_stored === false));
});
