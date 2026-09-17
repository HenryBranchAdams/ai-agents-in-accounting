import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { executeAgent } from "../dist/internal/agent.mjs";

const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const packet = read("data/research/management-accounting-2026-09-17.json");
const canonical = [
  ...read("data/corpus/source.json"),
  ...read("data/corpus/guide.json"),
  ...read("data/corpus/example.json"),
];
const byId = id => {
  const record = canonical.find(candidate => candidate.id === id);
  assert.ok(record, `missing ${id}`);
  return record;
};

test("AA-I125 canonical guides, importer input, registry, and evidence packet stay synchronized", () => {
  const registry = read("data/coverage/research-questions.json");
  assert.equal(registry.question_set_version, packet.package_version);
  assert.equal(registry.corpus_version, packet.corpus_edition);
  for (const family of packet.families) {
    const guide = byId(family.guide_id);
    const input = read("data/research/foundations.json").families.find(candidate => candidate.family_id === family.family_id);
    assert.ok(input);
    assert.equal(guide.data.issue_id, packet.issue_id);
    assert.equal(guide.data.package_version, packet.package_version);
    assert.deepEqual(guide.data.source_ids, family.source_ids);
    assert.deepEqual(input.source_ids, family.source_ids);
    assert.deepEqual(
      guide.data.research_questions.map(question => question.id),
      family.research_questions.map(question => question.id),
    );
    for (const question of family.research_questions) {
      const canonicalQuestion = guide.data.research_questions.find(candidate => candidate.id === question.id);
      const row = registry.questions.find(candidate => candidate.id === question.id);
      assert.deepEqual(canonicalQuestion.source_ids, question.source_ids, question.id);
      assert.equal(row.record_id, guide.id, question.id);
      assert.equal(row.pointer, `/data/research_questions/${guide.data.research_questions.indexOf(canonicalQuestion)}`);
      assert.deepEqual(row.dimensions, question.assessment.dimensions, question.id);
    }
  }
  assert.equal(read("data/coverage/assessments.json").assessment_version, packet.package_version);
  for (const assessment of packet.assessments) assert.ok(read("data/coverage/assessments.json").assessments.some(candidate => candidate.id === assessment.id));
  const inventory = packet.baseline_inventory;
  const dispositionIds = Object.values(inventory.record_dispositions).flat();
  assert.equal(inventory.record_count, 51);
  assert.equal(new Set(dispositionIds).size, inventory.record_count);
  assert.equal(inventory.question_dispositions.length, 7);
  assert.deepEqual(inventory.question_dispositions.map(question => question.question_id), [
    "rq-cost-allocation-allocation-base",
    "rq-cost-allocation-unit-cost",
    "rq-planning-driver-model",
    "rq-planning-uncertainty",
    "rq-performance-margin-definition",
    "rq-performance-materiality",
    "rq-mfg-cost",
  ]);
  assert.deepEqual(inventory.replacement_records, []);
  assert.deepEqual(packet.coordination.map(issue => issue.issue_number), [101, 109, 117]);
  assert.ok(packet.coordination.every(issue => issue.completion_claimed === false));
});

test("AA-I125 importer refuses newer canonical metadata without rewriting a newer-state harness", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aa-i125-newer-state-"));
  const files = [
    "data/research/management-accounting-2026-09-17.json",
    "data/corpus/source.json",
    "data/corpus/guide.json",
    "data/corpus/example.json",
    "data/research/foundations.json",
    "data/coverage/research-questions.json",
    "data/coverage/mapping-overrides.json",
    "data/coverage/assessments.json",
    "data/research-questions.json",
  ];
  const versionTargets = [
    ["data/research/foundations.json", "question_set_version"],
    ["data/coverage/research-questions.json", "question_set_version"],
    ["data/coverage/mapping-overrides.json", "mapping_version"],
    ["data/coverage/assessments.json", "assessment_version"],
  ];
  try {
    for (const file of files) {
      const destination = path.join(root, file);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(file, destination);
    }
    for (const [file, field] of versionTargets) {
      const destination = path.join(root, file);
      const value = JSON.parse(fs.readFileSync(destination, "utf8"));
      value[field] = "2026-09-18.1";
      fs.writeFileSync(destination, JSON.stringify(value, null, 2) + "\n");
    }
    const before = new Map(files.map(file => [file, fs.readFileSync(path.join(root, file))]));
    let error;
    try {
      execFileSync(process.execPath, [path.resolve("scripts/integrate-management-accounting.mjs")], {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (candidate) {
      error = candidate;
    }
    assert.ok(error, "newer canonical state must stop the importer");
    assert.match(String(error.stderr), /newer than packet/);
    for (const file of files) assert.deepEqual(fs.readFileSync(path.join(root, file)), before.get(file), file);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("AA-I125 synthetic allocation, variance, restatement, margin, and cash arithmetic reconcile", () => {
  const example = byId(packet.example.id).data;
  assert.equal(example.cost_pool.pool_total, 120000);
  assert.equal(example.allocation.beneficiaries.reduce((sum, item) => sum + item.allocated_amount, 0), 120000);
  assert.deepEqual(example.allocation.beneficiaries.map(item => item.allocated_amount), [72000, 48000]);
  assert.equal(example.allocation.sensitivity.population.reduce((sum, item) => sum + item.allocated_amount, 0), 120000);
  assert.deepEqual(example.allocation.sensitivity.population.map(item => item.allocated_amount), [36000, 84000]);

  const bridge = example.variance_bridge;
  assert.equal(bridge.budget_revenue, 100000);
  assert.equal(bridge.actual_revenue, 99000);
  assert.equal(bridge.volume_effect, -10000);
  assert.equal(bridge.price_effect, 9000);
  assert.equal(bridge.volume_effect + bridge.price_effect, bridge.total_effect);
  assert.equal(bridge.total_effect, -1000);
  assert.notEqual(bridge.invalid_alternative.amount, bridge.price_effect);

  const budget = example.budget_actual.budget_v1;
  const actual = example.budget_actual.actual_v1;
  const restated = example.budget_actual.actual_v2_restatement;
  assert.equal(budget.units * budget.price_per_unit, budget.revenue);
  assert.equal(actual.units * actual.price_per_unit, actual.revenue);
  assert.equal(restated.direct_cost - actual.direct_cost, 1000);
  assert.equal(restated.closing_cash, actual.closing_cash);
  assert.equal(example.profit_bridge.components.reduce((sum, component) => sum + component.amount, 0), example.profit_bridge.budget_to_actual_v1_change);
  assert.equal(example.profit_bridge.restated_components.reduce((sum, component) => sum + component.amount, 0), example.profit_bridge.restated_actual_change);
  assert.equal(example.cash_bridge.budget.profit - example.cash_bridge.budget.ar_increase + example.cash_bridge.budget.ap_increase + example.cash_bridge.budget.noncash_items, example.cash_bridge.budget.cash_change);
  assert.equal(example.cash_bridge.actual_v1.profit - example.cash_bridge.actual_v1.ar_increase + example.cash_bridge.actual_v1.ap_increase + example.cash_bridge.actual_v1.noncash_items, example.cash_bridge.actual_v1.cash_change);
  assert.equal(example.cash_bridge.restated_actual_v2.profit - example.cash_bridge.restated_actual_v2.ar_increase + example.cash_bridge.restated_actual_v2.ap_increase + example.cash_bridge.restated_actual_v2.noncash_items, example.cash_bridge.restated_actual_v2.cash_change);
  assert.equal(example.margin_definitions.unit_a_operating_margin.allocated_support_once, 72000);
  assert.equal(example.margin_definitions.entity_operating_profit.support_pool_counted, 1);
  const margins = example.margin_definitions;
  const inputs = margins.input_basis;
  assert.equal(inputs.period, "2026-01-01/2026-01-31");
  assert.equal(inputs.budget_as_of, "2025-12-15");
  assert.equal(inputs.actual_v1_as_of, "2026-02-02");
  assert.equal(inputs.budget_v1.unit_a.revenue + inputs.budget_v1.unit_b.revenue, inputs.budget_v1.entity.revenue);
  assert.equal(inputs.budget_v1.unit_a.direct_cost + inputs.budget_v1.unit_b.direct_cost, inputs.budget_v1.entity.direct_cost);
  assert.equal(inputs.actual_v1.unit_a.revenue + inputs.actual_v1.unit_b.revenue, inputs.actual_v1.entity.revenue);
  assert.equal(inputs.actual_v1.unit_a.direct_cost + inputs.actual_v1.unit_b.direct_cost, inputs.actual_v1.entity.direct_cost);
  assert.equal(inputs.budget_v1.unit_a.revenue - inputs.budget_v1.unit_a.direct_cost - inputs.budget_v1.unit_a.allocated_support, margins.unit_a_operating_margin.budget_dollars);
  assert.equal(inputs.actual_v1.unit_a.revenue - inputs.actual_v1.unit_a.direct_cost - inputs.actual_v1.unit_a.allocated_support, margins.unit_a_operating_margin.actual_v1_dollars);
  assert.equal(inputs.budget_v1.entity.revenue - inputs.budget_v1.entity.direct_cost, margins.gross_margin.budget_dollars);
  assert.equal(inputs.actual_v1.entity.revenue - inputs.actual_v1.entity.direct_cost, margins.gross_margin.actual_v1_dollars);
  assert.equal(inputs.budget_v1.entity.revenue - inputs.budget_v1.entity.direct_cost - inputs.budget_v1.entity.support_pool, margins.entity_operating_profit.budget_dollars);
  assert.equal(inputs.actual_v1.entity.revenue - inputs.actual_v1.entity.direct_cost - inputs.actual_v1.entity.support_pool, margins.entity_operating_profit.actual_v1_dollars);
  assert.equal(margins.contribution_margin.status, "not separately asserted");
});

test("AA-I125 retrieval, direct source pointers, counterexample, and rights boundaries hold", () => {
  for (const fixture of packet.retrieval_fixtures) {
    const result = executeAgent("search", { q: fixture.search_query, kind: fixture.kind, limit: 5 });
    for (const expected of fixture.expected_ids) assert.ok(result.results.some(hit => hit.id === expected), `${fixture.id}: ${expected}`);
    for (const excluded of fixture.excluded_ids) assert.ok(!result.results.some(hit => hit.id === excluded), `${fixture.id}: excluded ${excluded}`);
  }
  const direct = executeAgent("get", { id: packet.example.id, limit: 20 });
  assert.equal(direct.record.id, packet.example.id);
  assert.ok(direct.record.source_ids.includes("src_cfr200grants"));
  const allocation = executeAgent("get", { id: packet.example.id, section: "data.allocation", limit: 20 });
  assert.ok(allocation.passages.some(passage => passage.text.includes("72000")));
  const context = executeAgent("context", { ids: [packet.example.id], include_sources: true, max_chars: 40000 });
  assert.ok(context.records.some(entry => entry.record.id === "src_cfr200grants"));
  assert.ok(context.records.some(entry => entry.record.id === "src_far_31203_indirect_costs"));
  assert.ok(context.records.every(entry => entry.record.rights.full_text_stored === false));
  const external = executeAgent("search", { q: "FAR 31.203 indirect costs", kind: "source", limit: 5 });
  assert.ok(external.results.some(result => result.id === "src_far_31203_indirect_costs"));
  const counterexample = byId(packet.example.id).data.counterexamples.find(item => item.id === "external-federal-award");
  assert.equal(counterexample.outcome, "stop-and-review");
  assert.ok(counterexample.reason.includes("2 CFR"));
});
