import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { validateSchema } from "../scripts/validate.mjs";
import { applyToRoot, packetFile } from "../scripts/integrate-government.mjs";

const root = process.cwd();
const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const packet = read(packetFile);
const recordSchema = read("schemas/record.schema.json");
const coverageSchema = read("schemas/coverage.schema.json");

function resolve(schema) {
  if (Array.isArray(schema)) return schema.map(resolve);
  if (!schema || typeof schema !== "object") return schema;
  if (schema.$ref) {
    assert.equal(schema.$ref.split("/")[1], "$defs");
    return resolve(coverageSchema.$defs[schema.$ref.split("/").at(-1)]);
  }
  return Object.fromEntries(Object.entries(schema).filter(([key]) => key !== "$defs").map(([key, value]) => [key, resolve(value)]));
}

function archiveHarness() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "government-source-"));
  const archive = path.join(dir, "base.tar");
  execFileSync("git", ["archive", "-o", archive, packet.base_commit, "data/corpus", "data/coverage", "data/reviews", "data/vocabulary.json", "src", "scripts", "schemas", "data/catalog.json", "data/migration.json", "data/relationships.json", "data/source-observations.json"], { cwd: root });
  execFileSync("tar", ["-x", "-f", archive], { cwd: dir });
  fs.rmSync(archive);
  fs.mkdirSync(path.join(dir, "data/research"), { recursive: true });
  fs.copyFileSync(packetFile, path.join(dir, packetFile));
  fs.copyFileSync("scripts/integrate-government.mjs", path.join(dir, "scripts/integrate-government.mjs"));
  fs.symlinkSync(path.join(root, "node_modules"), path.join(dir, "node_modules"), "dir");
  return dir;
}

test("government records, references, locators and assessment refs are structurally valid", () => {
  for (const record of [...packet.sources, ...packet.records]) {
    validateSchema(record, recordSchema, record.id);
    assert.equal(record.data.id, record.id);
    assert.equal(record.rights.full_text_stored, false);
  }
  const assessmentSchema = resolve(coverageSchema.$defs.assessment);
  for (const assessment of packet.assessments) {
    validateSchema(assessment, assessmentSchema, assessment.id);
    assert.equal(assessment.status, "partial");
    assert.equal(assessment.source_currency, "unknown");
  }
  const sources = new Map(read("data/corpus/source.json").map((record) => [record.id, record]));
  for (const question of packet.question_rows) {
    for (const locator of question.source_locators) {
      assert.equal(sources.get(locator.source_id)?.source_url, locator.url, `${question.id}: URL identity`);
      assert.ok(locator.locator && locator.effective_period && locator.access_limits);
    }
    assert.ok(packet.records.find((record) => record.id === question.example_id));
  }
  const guide = packet.records.find((record) => record.kind === "guide");
  assert.deepEqual(guide.data.research_questions, packet.question_rows);
  const example = packet.records.find((record) => record.kind === "example");
  assert.ok(example.data.examples.length > 0);
  assert.ok(example.data.limitations.some((text) => text.includes("Synthetic")));
});

test("baseline and selected government scope remain bounded", () => {
  assert.equal(packet.baseline.associated_record_count, 10);
  assert.equal(packet.baseline.linked_question_count, 9);
  assert.equal(packet.question_rows.length, 6);
  assert.equal(packet.assessments.length, 6);
  const text = JSON.stringify(packet).toLowerCase();
  for (const term of ["federal", "state/local", "proprietary", "fiduciary", "appropriation", "budget-to-actual", "government-wide", "custodial"]) assert.match(text, new RegExp(term.replace("-", "[- ]")));
  assert.match(text, /no 50-state survey/);
});

function balanced(journal) {
  const total = journal.lines.reduce((sum, line) => sum + line.debit_cents - line.credit_cents, 0);
  assert.equal(total, 0, journal.id);
}

test("state/local, federal and custodial branches recompute from inputs", () => {
  const example = packet.records.find((record) => record.id === "example-government-fund-federal-bridge").data;
  const state = example.cases.find((item) => item.id === "state-local-general-fund");
  const s = state.inputs;
  assert.equal(s.actual_inflows_cents - s.actual_outflows_cents, state.budget_bridge.actual_surplus_cents);
  assert.equal(s.actual_inflows_cents - s.final_budget_inflows_cents, state.budget_bridge.inflow_variance_cents);
  assert.equal(s.final_budget_outflows_cents - s.actual_outflows_cents, state.budget_bridge.outflow_variance_cents);
  assert.equal(s.beginning_fund_balance_cents + state.budget_bridge.actual_surplus_cents, state.budget_bridge.ending_fund_balance_cents);
  assert.equal(state.budget_bridge.ending_fund_balance_cents + s.capital_asset_additions_cents - s.depreciation_cents - s.government_wide_long_term_debt_cents, state.budget_bridge.government_wide_net_position_bridge_cents);
  const federal = example.cases.find((item) => item.id === "federal-component-award-and-budget");
  const f = federal.inputs;
  assert.equal(f.appropriation_authority_cents - f.obligations_cents, federal.budget_accrual_bridge.unobligated_authority_cents);
  assert.equal(f.net_cost_cents - f.depreciation_cents - f.increase_unpaid_current_expense_cents + f.capital_acquisitions_cents, federal.budget_accrual_bridge.net_outlays_cents);
  assert.equal(f.federal_award_cents - f.allowable_award_costs_cents, f.unspent_award_cents);
  const custody = example.cases.find((item) => item.id === "local-custodial-tax");
  assert.equal(custody.inputs.tax_collected_cents - custody.inputs.remitted_cents, custody.inputs.ending_custodial_payable_cents);
  for (const item of example.cases) for (const journal of item.journals) balanced(journal);
  assert.equal(example.scope_counterexamples.length, 5);
});

test("source helper stages additively, replays byte-stably and rejects conflicts before writes", () => {
  const dir = archiveHarness();
  try {
    const catalogBefore = fs.readFileSync(path.join(dir, "data/catalog.json"));
    const first = applyToRoot(dir);
    assert.equal(first.records, 4);
    const second = applyToRoot(dir);
    assert.equal(second.changed, 0);
    assert.deepEqual(fs.readFileSync(path.join(dir, "data/catalog.json")), catalogBefore);
    const guide = read(path.join(dir, "data/corpus/guide.json"));
    assert.equal(guide.filter((record) => record.id === "guide-us-government-public-administration").length, 1);

    const conflict = archiveHarness();
    try {
      const file = path.join(conflict, "data/corpus/guide.json");
      const rows = read(file);
      rows.push({ ...packet.records[0], title: "conflicting title" });
      fs.writeFileSync(file, JSON.stringify(rows, null, 2) + "\n");
      const before = fs.readFileSync(file);
      assert.throws(() => applyToRoot(conflict, { dryRun: true }), /preflight conflict/);
      assert.deepEqual(fs.readFileSync(file), before);
    } finally { fs.rmSync(conflict, { recursive: true, force: true }); }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("applied source fixture passes repository validation and real agent search/context/get", async () => {
  const dir = archiveHarness();
  try {
    applyToRoot(dir);
    execFileSync(process.execPath, ["scripts/coverage-mappings.mjs"], { cwd: dir, stdio: "pipe" });
    execFileSync(process.execPath, ["scripts/validate.mjs"], { cwd: dir, stdio: "pipe" });
    const bundle = path.join(dir, "government-agent.mjs");
    execFileSync(path.join(root, "node_modules/.bin/esbuild"), ["src/agent.ts", "--bundle", "--platform=node", "--format=esm", `--outfile=${bundle}`], { cwd: dir, stdio: "pipe" });
    const { executeAgent } = await import(pathToFileURL(bundle));
    for (const fixture of packet.retrieval_fixtures.search) {
      assert.ok(fixture.limit <= 20);
      const result = executeAgent("search", { q: fixture.query, limit: fixture.limit });
      for (const id of fixture.expected_record_ids) assert.ok(result.results.some((row) => row.id === id), `${id}: ${result.results.map((row) => row.id).join(",")}`);
    }
    const context = executeAgent("context", { ids: ["guide-us-government-public-administration"], include_sources: true, max_chars: 40000 });
    assert.ok(context.records.some((row) => row.record.id === "src_roadmap_fasab53"));
    const got = executeAgent("get", { id: "example-government-fund-federal-bridge", limit: 20 });
    assert.match(JSON.stringify(got), /Synthetic/);
    assert.match(JSON.stringify(got), /custodial/);
    assert.match(JSON.stringify(got), /Do not infer FASAB or GASB/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
