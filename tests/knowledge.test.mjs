import test from "node:test";
import assert from "node:assert/strict";
import { records, knowledge, expandQuery, search } from "../dist/internal/corpus.mjs";
import { executeAgent } from "../dist/internal/agent.mjs";

const resolve = (record, pointer) => pointer.slice(1).split("/").map((x) => x.replace(/~1/g, "/").replace(/~0/g, "~")).reduce((v, key) => v?.[key], record);

test("knowledge profiles normalize product scopes and retain raw jurisdictions", () => {
  const byId = new Map(records.map((r) => [r.id, r]));
  for (const id of ["src_xero_journals_completeness", "src_sap_journal_entry_views_2608", "src_oracle_collection_paging_25d"]) {
    const p = knowledge.profile(id);
    assert.deepEqual(p.scope.jurisdictions, []);
    assert.ok(p.scope.products.length);
    assert.ok(p.scope.products[0].length < byId.get(id).jurisdiction.length || p.scope.products[0] === byId.get(id).jurisdiction);
  }
  assert.deepEqual(knowledge.profile("src_eiopa_dpm210_2026").scope.jurisdictions, ["European Union"]);
  assert.deepEqual(knowledge.profile("src_0n4x3cf").scope.frameworks, ["IFRS"]);
  assert.deepEqual(knowledge.profile("src_1os761s").scope.frameworks, ["US GAAP"]);
  assert.deepEqual(knowledge.profile("src_naic_sap_hierarchy_2026").scope.entities, ["Insurance"]);
});

test("profile basis pointers resolve against every canonical record", () => {
  for (const record of records) {
    const p = knowledge.profile(record.id);
    for (const field of Object.values(p.scope.basis)) for (const pointer of field.pointers) assert.notEqual(resolve(record, pointer), undefined, `${record.id}: ${pointer}`);
  }
});

test("aliases expand within longer queries and quoted phrases stay literal", () => {
  assert.deepEqual(expandQuery("bank rec evidence"), ["bank", "reconciliation", "evidence"]);
  assert.deepEqual(expandQuery('"bank rec" evidence'), ["bank rec", "evidence"]);
  assert.deepEqual(expandQuery("IFRS"), ["ifrs"]);
  assert.deepEqual(expandQuery('"SoD"'), ["sod"]);
});

test("invalid calendar dates fail before retrieval in agent and reading search", () => {
  for (const as_of of ["2026-9-1", "2025-02-29", "2025-02-30", "1900-02-29", "2025-04-31", "2025-00-01", "2025-13-01", "2025-01-00", "2025-01-32", "2025-01-01T00:00:00Z"]) {
    for (const op of ["search", "context"])
      assert.throws(() => executeAgent(op, { q: "SEC family office", as_of }), (e) => e.code === "INVALID_ARGUMENT", `${op}: ${as_of}`);
    assert.throws(() => search(new URLSearchParams({ q: "SEC family office", as_of })), /valid YYYY-MM-DD/, as_of);
  }
});

test("valid leap days and year boundaries retain dated retrieval and omission reporting", () => {
  for (const as_of of ["2000-02-29", "2024-02-29", "2025-01-01", "2025-12-31"]) {
    const reading = search(new URLSearchParams({ q: "SEC family office", as_of }));
    const agent = executeAgent("search", { q: "SEC family office", as_of });
    assert.equal(agent.total, reading.total, as_of);
    assert.equal(agent.temporal_filter.as_of, as_of);
    const context = executeAgent("context", { q: "SEC family office", as_of });
    assert.equal(context.temporal_filter.as_of, as_of);
  }
});

test("legacy workflow and explicit supersedes edges are exposed", () => {
  const workflow = records.find((r) => Array.isArray(r.data?.workflow_ids) && r.data.workflow_ids.length);
  assert.ok(workflow);
  assert.ok(knowledge.relations(workflow.id, { direction: "out" }).some((e) => e.type === "related"));
  assert.ok(knowledge.relations("src_1os761s", { direction: "out" }).some((e) => e.to === "src_netsuite26ai" && e.type === "qualifies"));
});

test("as_of excludes publication/status notes without a complete effective date", () => {
  const result = search(new URLSearchParams({ q: "FASB Accounting Standards Codification", as_of: "1900-01-01" }));
  assert.equal(result.total, 0);
  const p = knowledge.profile("src_1os761s");
  assert.equal(p.scope.period.effective_from, null);
  assert.equal(p.scope.period.effective_note, "Continuously updated");
});
