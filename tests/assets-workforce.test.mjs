import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { executeAgent } from "../dist/internal/agent.mjs";
import { coverage, records } from "../dist/internal/corpus.mjs";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const byId = new Map(records.map((record) => [record.id, record]));
const packet = read("data/research/assets-workforce-2026-09-18.json");
const catalog = read("data/catalog.json");
const example = byId.get("example-us-assets-workforce-ledger");
const exampleData = example.data;

test("I120 synthetic capital, lease, software, payroll and benefit arithmetic is exact", () => {
  const capital = exampleData.capital_asset_cip;
  const impairment = exampleData.capital_asset_impairment;
  assert.ok(impairment.carrying_amount_cents > impairment.undiscounted_cash_flows_cents);
  assert.equal(impairment.carrying_amount_cents - impairment.fair_value_cents, impairment.proposed_loss_cents);
  assert.ok(impairment.counterexample.undiscounted_cash_flows_cents > impairment.carrying_amount_cents);
  assert.equal(impairment.counterexample.proposed_loss_cents, 0);
  assert.equal(capital.invoice.equipment_cents + capital.invoice.installation_cents, capital.invoice.total_cents);
  assert.equal(capital.depreciation.first_59_months_cents * 59 + capital.depreciation.final_month_cents, capital.depreciation.total_cents);
  assert.equal(capital.depreciation.depreciable_basis_cents, capital.placed_in_service.cost_cents - capital.depreciation.salvage_cents);

  const lease = exampleData.lease_commencement;
  assert.equal(lease.schedule.length, lease.term_months);
  const presentValue = (payment, rate, periods) => Math.round(payment * (1 - (1 + rate) ** -periods) / rate);
  assert.equal(lease.monthly_rate, lease.annual_discount_rate / 12);
  assert.equal(lease.opening_liability_cents, presentValue(lease.payments_in_arrears_cents, lease.monthly_rate, lease.term_months));
  assert.equal(lease.opening_rou_asset_cents, lease.opening_liability_cents + lease.prepayments_cents + lease.initial_direct_costs_cents - lease.incentives_cents);
  for (const [index, row] of lease.schedule.entries()) {
    assert.equal(row.period, index + 1);
    assert.equal(row.payment_cents, lease.payments_in_arrears_cents);
    assert.equal(row.interest_cents, Math.round(row.opening_cents * lease.monthly_rate) + (row.rounding_adjustment_cents || 0));
    assert.equal(row.opening_cents + row.interest_cents - row.payment_cents, row.closing_cents, `base lease period ${row.period}`);
    if (index > 0) assert.equal(row.opening_cents, lease.schedule[index - 1].closing_cents, `base lease opening ${row.period}`);
  }
  assert.equal(lease.schedule.at(-1).closing_cents, 0);
  const modification = lease.modification_at_period_13;
  assert.equal(modification.new_pv_cents, presentValue(modification.new_payment_cents, modification.modification_facts.discount_rate_at_modification_monthly, modification.remaining_periods));
  assert.equal(modification.old_period_12_closing_cents, lease.schedule[11].closing_cents);
  assert.equal(modification.new_pv_cents - modification.old_period_12_closing_cents, modification.remeasurement_increase_cents);
  assert.equal(modification.rou_bridge.opening_rou_after_period12_cents, lease.operating_rou_schedule[11].closing_rou_cents);
  assert.equal(modification.rou_bridge.opening_rou_after_period12_cents + modification.rou_bridge.rou_adjustment_cents, modification.rou_bridge.remeasured_rou_cents);
  assert.equal(modification.rou_bridge.rou_adjustment_cents, modification.remeasurement_increase_cents);
  assert.equal(modification.remaining_lease_cost.remaining_fixed_payments_cents, modification.new_payment_cents * modification.remaining_periods);
  assert.equal(modification.remaining_lease_cost.single_lease_cost_cents_per_month, modification.remaining_lease_cost.remaining_fixed_payments_cents / modification.remaining_periods);
  for (const [liabilityRows, rouRows, opening] of [[lease.schedule, lease.operating_rou_schedule, lease.opening_rou_asset_cents], [modification.post_modification_schedule, modification.operating_rou_schedule, modification.rou_bridge.remeasured_rou_cents]]) {
    assert.equal(rouRows[0].opening_rou_cents, opening);
    assert.equal(rouRows.length, liabilityRows.length);
    for (const [i, row] of rouRows.entries()) {
      assert.equal(row.liability_accretion_cents, liabilityRows[i].interest_cents);
      assert.equal(row.single_lease_cost_cents - row.liability_accretion_cents, row.rou_reduction_cents);
      assert.equal(row.opening_rou_cents - row.rou_reduction_cents, row.closing_rou_cents);
      if (i) assert.equal(row.opening_rou_cents, rouRows[i - 1].closing_rou_cents);
    }
    assert.equal(rouRows.at(-1).closing_rou_cents, 0);
  }
  for (const [index, row] of modification.post_modification_schedule.entries()) {
    assert.equal(row.opening_cents + row.interest_cents - row.payment_cents, row.closing_cents, `modified lease period ${row.period}`);
    if (index > 0) assert.equal(row.opening_cents, modification.post_modification_schedule[index - 1].closing_cents, `modified lease opening ${row.period}`);
  }
  assert.equal(modification.post_modification_schedule.at(-1).closing_cents, 0);

  const software = exampleData.software_customer_implementation;
  assert.equal(software.application_development_qualifying_cents + software.training_and_data_conversion_expense_cents, software.implementation_invoice_cents);
  assert.equal(software.application_development_qualifying_cents / software.term_months_including_reasonably_certain_renewal, software.monthly_implementation_amortization_cents);
  assert.equal(software.application_development_qualifying_cents - software.monthly_implementation_amortization_cents * 6, software.asset_after_six_months_cents);

  const payroll = exampleData.payroll_workweek;
  assert.equal(payroll.regular_hours * payroll.hourly_rate_cents + payroll.overtime_hours * payroll.overtime_rate_cents, payroll.gross_wages_cents);
  assert.equal(payroll.gross_wages_cents - payroll.employee_federal_income_tax_withholding_cents - payroll.employee_social_security_cents - payroll.employee_medicare_cents - payroll.employee_benefit_deduction_cents, payroll.net_pay_cents);
  assert.equal(payroll.gross_wages_cents + payroll.employer_social_security_cents + payroll.employer_medicare_cents + payroll.employer_benefit_contribution_cents, payroll.employer_total_cost_cents);

  const benefits = exampleData.benefits_defined_contribution;
  const formula = benefits.synthetic_plan_formula;
  const eligible = formula.participant_facts.age_years >= formula.eligibility.minimum_age_years && formula.participant_facts.service_days >= formula.eligibility.minimum_service_days && formula.participant_facts.approved_hours >= formula.eligibility.minimum_hours_in_service_week;
  assert.equal(formula.participant_facts.eligible, eligible);
  assert.equal(benefits.employer_contribution_cents, (eligible ? formula.participant_count : 0) * formula.eligible_service_weeks * formula.employer_fixed_contribution_per_eligible_week_cents);
  assert.equal(benefits.employee_deduction_cents, formula.employee_elected_weeks * formula.employee_after_tax_election_per_week_cents);
  assert.equal(benefits.employer_contribution_cents, payroll.employer_benefit_contribution_cents);
  assert.equal(benefits.employee_deduction_cents, payroll.employee_benefit_deduction_cents);
  assert.equal(benefits.counterexample.outcome, "stop-and-review");
});

test("I120 source, guide, assessment and rights boundaries remain explicit", () => {
  assert.ok(catalog.corpus_version.localeCompare(packet.package_version, 'en', {numeric: true}) >= 0);
  assert.match(catalog.coverage_note, /assets-and-workforce/i);
  assert.match(catalog.review_note, /AA-I120/);
  assert.equal(example.rights.full_text_stored, false);
  assert.deepEqual(example.data.reference_output.executed_actions, []);
  assert.deepEqual(example.data.reference_output.proposed_actions, []);
  assert.equal(example.data.reference_output.review_required, true);

  for (const sourceId of [...packet.source_updates.map((source) => source.id), ...packet.new_sources.map((source) => source.id)]) {
    const source = byId.get(sourceId);
    assert.ok(source, `missing I120 source ${sourceId}`);
    assert.equal(source.rights.full_text_stored, false, sourceId);
    assert.ok(["unknown", "unresolved-publisher-terms"].includes(source.rights.source_status), sourceId);
    assert.equal(source.data.supplemental_reviews.find((review) => review.batch === packet.issue_id)?.reviewed_at, [...packet.source_updates, ...packet.new_sources].find(s => s.id === sourceId).reviewed_at || packet.reviewed_at, sourceId);
  }
  for (const family of packet.families) {
    const guide = byId.get(family.guide_id);
    assert.ok(guide.data.research_questions.length >= 4, family.guide_id);
    assert.equal(guide.data.research_questions.filter(q => q.id.startsWith("rq-us-i120-")).length, 2, family.guide_id);
    assert.equal(guide.data.aa_i120_review.issue_id, packet.issue_id);
    assert.equal(guide.data.aa_i120_review.package_version, packet.package_version);
    assert.equal(guide.data.aa_i120_review.selected_scope.entity, packet.selected_scope.entity);
    for (const question of guide.data.research_questions.filter(q => q.id.startsWith('rq-us-i120-'))) {
      assert.equal(question.assessment.status, "partial");
      assert.equal(question.assessment.professional_review, "not-performed");
      assert.equal(question.assessment.empirical_support, "not-established");
      assert.ok(question.remaining_gaps.length >= 2);
    }
  }
  const supporting = byId.get("guide-software-subscriptions");
  assert.equal(supporting.data.research_questions.length, 6);
  assert.equal(supporting.data.aa_i120_review.issue_id, packet.issue_id);
  assert.deepEqual(supporting.data.research_questions.map((question) => question.id), packet.supporting_guide.question_ids);

  const assessments = read("data/coverage/assessments.json").assessments.filter((assessment) => assessment.id.startsWith("coverage-aa-i120-"));
  assert.equal(assessments.length, 10);
  assert.ok(assessments.every((assessment) => assessment.scope_kind === "shared-context" && assessment.industry_code === null && assessment.status === "partial"));
  assert.ok(assessments.every((assessment) => assessment.evidence_record_ids.includes(example.id)));
});

test("I120 retrieval fixtures return expected records and preserve negative scope boundaries", () => {
  for (const fixture of packet.retrieval_fixtures) {
    const args = {
      q: fixture.search_query,
      limit: 5,
      ...(fixture.kind && fixture.kind !== "context" ? { kind: fixture.kind } : {}),
      ...fixture.filters,
    };
    const ids = executeAgent("search", args).results.map((record) => record.id);
    for (const expected of fixture.expected_ids) assert.ok(ids.includes(expected), `${fixture.id}: expected ${expected}; got ${ids.join(", ")}`);
    for (const excluded of fixture.excluded_ids) assert.ok(!ids.includes(excluded), `${fixture.id}: excluded ${excluded}; got ${ids.join(", ")}`);
  }
  const leaseCell = coverage.cell("23", "q-leases");
  assert.ok(!leaseCell.assessments.some((assessment) => assessment.id.startsWith("coverage-aa-i120-") && assessment.industry_code === "23"));
  for (const guideId of packet.families.map((family) => family.guide_id)) {
    const mapping = read("data/coverage/mapping-overrides.json").records[guideId];
    assert.deepEqual(mapping.industry_codes, []);
    assert.equal(mapping.industry_scope, "shared-context");
  }
});

test("I120 package-to-canonical identifiers and retrieval registry stay aligned", () => {
  const registry = read("data/coverage/research-questions.json").questions;
  for (const family of packet.families) {
    const guide = byId.get(family.guide_id);
    for (const question of guide.data.research_questions.filter(q => q.id.startsWith('rq-us-i120-'))) {
      const row = registry.find((candidate) => candidate.id === question.id);
      assert.ok(row, question.id);
      assert.equal(row.record_id, guide.id);
      assert.equal(row.question, question.question);
      assert.deepEqual(row.source_ids, question.source_ids);
      assert.deepEqual(row.source_locators, question.source_locators);
    }
  }
  const sourceIds = new Set(records.filter((record) => record.kind === "source").map((record) => record.id));
  for (const id of example.source_ids) assert.ok(sourceIds.has(id), `example source ${id}`);
  assert.equal(new Set(records.map((record) => record.id)).size, records.length);
});
