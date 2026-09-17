import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { executeAgent } from "../dist/internal/agent.mjs";

const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const packet = read("data/research/management-accounting-2026-09-17.json");
const catalog = read("data/catalog.json");
const versionPattern = /^(\d{4}-\d{2}-\d{2})\.(\d+)$/;
const compareVersion = (left, right) => {
  const leftMatch = versionPattern.exec(left), rightMatch = versionPattern.exec(right);
  assert.ok(leftMatch && rightMatch);
  return leftMatch[1] === rightMatch[1]
    ? Number(leftMatch[2]) - Number(rightMatch[2])
    : leftMatch[1].localeCompare(rightMatch[1]);
};
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
const integrationFiles = [
  "data/catalog.json",
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
const integrationScript = path.resolve("scripts/integrate-management-accounting.mjs");
const makeIntegrationHarness = mutate => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aa-i125-importer-"));
  for (const file of integrationFiles) {
    const destination = path.join(root, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(file, destination);
  }
  mutate?.(root);
  return root;
};
const editHarnessJson = (root, file, edit) => {
  const destination = path.join(root, file);
  const value = JSON.parse(fs.readFileSync(destination, "utf8"));
  edit(value);
  fs.writeFileSync(destination, JSON.stringify(value, null, 2) + "\n");
};
const snapshotHarnessFiles = root => new Map(integrationFiles.map(file => [file, fs.readFileSync(path.join(root, file))]));
const runHarnessImporter = (root, args = []) => {
  try {
    execFileSync(process.execPath, [integrationScript, ...args], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return null;
  } catch (error) {
    return error;
  }
};

test("AA-I125 canonical guides, importer input, registry, and evidence packet stay synchronized", () => {
  const registry = read("data/coverage/research-questions.json");
  assert.ok(compareVersion(registry.question_set_version, packet.package_version) >= 0);
  assert.equal(registry.corpus_version, catalog.corpus_version);
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
  assert.ok(compareVersion(read("data/coverage/assessments.json").assessment_version, packet.package_version) >= 0);
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

test("AA-I125 strict importer rejects newer top-level and nested review metadata before writing", () => {
  const cases = [
    {
      label: "top-level version",
      mutate: root => editHarnessJson(root, "data/research/foundations.json", value => { value.question_set_version = "2026-09-17.1253"; }),
    },
    {
      label: "top-level review date",
      mutate: root => editHarnessJson(root, "data/research/foundations.json", value => { value.reviewed_at = "2026-09-18"; }),
    },
    {
      label: "mapping override review date",
      mutate: root => editHarnessJson(root, "data/coverage/mapping-overrides.json", value => { value.records["guide-q-cost-allocation"].reviewed_at = "2026-09-18"; }),
    },
    {
      label: "assessment review date",
      mutate: root => editHarnessJson(root, "data/coverage/assessments.json", value => {
        value.assessments.find(assessment => assessment.id === "coverage-management-accounting-cost-allocation-2026-09-17").reviewed_at = "2026-09-18";
      }),
    },
  ];
  for (const { label, mutate } of cases) {
    const root = makeIntegrationHarness(mutate);
    try {
      const before = snapshotHarnessFiles(root);
      const error = runHarnessImporter(root);
      assert.ok(error, `${label}: newer canonical state must stop the importer`);
      assert.match(String(error.stderr), /newer than packet/);
      for (const [file, bytes] of before) assert.deepEqual(fs.readFileSync(path.join(root, file)), bytes, `${label}: ${file}`);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test("AA-I125 integration importer preserves newer top-level metadata and unrelated IDs", () => {
  const root = makeIntegrationHarness();
  try {
    const before = {
      example: JSON.stringify(read(path.join(root, "data/corpus/example.json")).find(record => record.id === "example-cash-forecast-liquidity")),
      family: JSON.stringify(read(path.join(root, "data/research/foundations.json")).families.find(family => family.family_id === "q-evaluation")),
      mapping: JSON.stringify(read(path.join(root, "data/coverage/mapping-overrides.json")).records["guide-manufacturing-conversion"]),
      fixture: JSON.stringify(read(path.join(root, "data/research-questions.json")).find(fixture => fixture.id === "rq-bank-reconciliation-workflow")),
      assessmentVersion: read(path.join(root, "data/coverage/assessments.json")).assessment_version,
    };
    const error = runHarnessImporter(root, ["--integrate-into-newer-corpus"]);
    assert.equal(error, null, String(error?.stderr || error?.message));
    assert.equal(JSON.stringify(read(path.join(root, "data/corpus/example.json")).find(record => record.id === "example-cash-forecast-liquidity")), before.example);
    assert.equal(JSON.stringify(read(path.join(root, "data/research/foundations.json")).families.find(family => family.family_id === "q-evaluation")), before.family);
    assert.equal(JSON.stringify(read(path.join(root, "data/coverage/mapping-overrides.json")).records["guide-manufacturing-conversion"]), before.mapping);
    assert.equal(JSON.stringify(read(path.join(root, "data/research-questions.json")).find(fixture => fixture.id === "rq-bank-reconciliation-workflow")), before.fixture);
    assert.equal(read(path.join(root, "data/coverage/assessments.json")).assessment_version, before.assessmentVersion);
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
