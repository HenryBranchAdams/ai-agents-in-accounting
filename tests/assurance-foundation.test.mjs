import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { executeAgent } from "../dist/internal/agent.mjs";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const example = read("data/corpus/example.json").find(
  (record) => record.id === "example-assurance-evidence-packet",
);
const data = example.data;

test("family guide package indexes retain every top-level source citation", () => {
  const guides = read("data/corpus/guide.json");
  for (const id of [
    "guide-q-audit-assertions",
    "guide-q-controls-fraud",
    "guide-q-compliance-assurance",
    "guide-q-professional-governance",
  ]) {
    const guide = guides.find((record) => record.id === id);
    assert.ok(guide, `${id} missing`);
    assert.deepEqual(
      [...new Set(guide.data.source_ids)].sort(),
      [...new Set(guide.source_ids)].sort(),
      `${id} package source index is incomplete`,
    );
  }
});

test("family review bases distinguish inherited undated source checks", () => {
  const guides = read("data/corpus/guide.json");
  const sources = read("data/corpus/source.json");
  const expected = new Map([
    ["guide-q-controls-fraud", ["src_1wj6irw", "src_nachafm"]],
    ["guide-q-compliance-assurance", ["src_0ww9s76", "src_1ky30oj"]],
    ["guide-q-professional-governance", ["src_06tnkx2", "src_0xkvmih"]],
  ]);

  for (const [id, sourceIds] of expected) {
    const guide = guides.find((record) => record.id === id);
    assert.ok(guide, `${id} missing`);
    assert.match(guide.data.review_basis, /inherited.*evidence/i);
    assert.match(guide.data.review_basis, /not newly reverified/i);
    const checks = new Map(
      (guide.data.source_checks || []).map((check) => [check.existing_record_id, check]),
    );
    for (const sourceId of sourceIds) {
      const check = checks.get(sourceId);
      assert.ok(check, `${id} missing source check for ${sourceId}`);
      assert.ok(
        check.checks.every((entry) => !entry.checked_at),
        `${id}:${sourceId} must remain undated inherited evidence`,
      );
      assert.equal(check.checks[0].evidence_ref, "existing-corpus-source-review");
      assert.match(check.checks[0].outcome, /Inherited source-review evidence retained/);

      const source = sources.find((record) => record.id === sourceId);
      assert.ok(source, `${sourceId} missing`);
      assert.equal(source.data.source_review.effective_period, null);
      assert.equal(source.rights.source_status, "unknown");
    }
  }
});

test("assurance packet reconciles integer-cent totals and preserves omission evidence", () => {
  const { control_totals: totals, ar_rollforward: ar } = data.packet;
  assert.equal(
    ar.opening_cents + ar.sales_cents + ar.credits_cents + ar.collections_cents,
    ar.computed_closing_cents,
  );
  assert.equal(ar.computed_closing_cents, ar.reported_closing_cents);
  assert.equal(ar.difference_cents, 0);
  assert.deepEqual(
    [totals.sales_invoices.record_count, totals.shipping.record_count],
    [100, 100],
  );
  assert.deepEqual(
    [totals.sales_invoices.total_cents, totals.shipping.total_cents],
    [12500000, 12500000],
  );
  assert.equal(totals.ap_invoices.record_count - totals.receiving.record_count, 1);
  assert.equal(totals.ap_invoices.total_cents - totals.receiving.total_cents, 60000);
  assert.deepEqual(
    data.packet.events.map((event) => event.id),
    ["INV-DUP-017", "RCV-OMIT-003", "SHIP-BACK-088", "AR-CONTR-004"],
  );
  assert.ok(data.packet.events.every((event) => event.status === "open-unresolved"));
  assert.ok(data.packet.events.every((event) => event.automated_action === "none"));
});

test("assurance contexts and control states remain bounded", () => {
  assert.deepEqual(
    data.contexts.map((context) => context.id),
    ["pcaob-issuer-audit", "aicpa-nonissuer-audit", "federal-award-compliance"],
  );
  assert.ok(data.contexts.every((context) => context.not_claimed));
  assert.ok(data.contexts[0].framework.includes("PCAOB"));
  assert.ok(data.contexts[1].framework.includes("AICPA"));
  assert.ok(data.contexts[2].framework.includes("2 CFR"));
  assert.equal(data.reference_output.assurance_conclusion, null);
  assert.equal(data.reference_output.operating_effectiveness_conclusion, null);
  assert.ok(data.control_designs.every((control) => control.design_status === "proposed"));
  assert.ok(
    data.control_designs.every(
      (control) =>
        ["not-observed", "not-concluded"].includes(control.execution_evidence) &&
        ["not-assessed", "not-concluded"].includes(control.operating_effectiveness) &&
        control.software_test.promotion_to_live_evidence === false,
    ),
  );
  assert.match(JSON.stringify(data.limitations), /not an audit sample/);
  assert.equal(example.rights.full_text_stored, false);
});

test("assurance packet is retrievable with source-linked guide context", () => {
  const search = executeAgent("search", {
    q: "recorded omitted contradictory evidence assurance",
    kind: "example",
    limit: 5,
  });
  assert.ok(
    search.results.some((record) => record.id === "example-assurance-evidence-packet"),
    search.results.map((record) => record.id).join(", "),
  );

  const guideSearch = executeAgent("search", {
    q: "PCAOB nonissuer federal award",
    kind: "guide",
    limit: 10,
  });
  const guideIds = new Set(guideSearch.results.map((record) => record.id));
  for (const id of [
    "guide-q-audit-assertions",
    "guide-q-controls-fraud",
    "guide-q-professional-governance",
  ]) assert.ok(guideIds.has(id), `${id} missing from scoped context search`);
  const complianceSearch = executeAgent("search", {
    q: "federal award compliance",
    kind: "guide",
    limit: 10,
  });
  assert.ok(
    complianceSearch.results.some(
      (record) => record.id === "guide-q-compliance-assurance",
    ),
  );
  const pcaobInCompliance = executeAgent("search", {
    q: "PCAOB",
    kind: "guide",
    question_family: "q-compliance-assurance",
    limit: 10,
  });
  assert.equal(
    pcaobInCompliance.results.length,
    0,
    "PCAOB-only material must not appear in the compliance-assurance family filter",
  );

  const packet = executeAgent("get", {
    id: "example-assurance-evidence-packet",
    section: "data.packet",
    limit: 20,
  });
  assert.equal(packet.record.citation.record_id, "example-assurance-evidence-packet");
  assert.ok(packet.record.source_ids.includes("src_0vf7hhg"));
  assert.ok(packet.passages.some((passage) => passage.text.includes("INV-DUP-017")));
  assert.ok(
    packet.passages.every((passage) =>
      passage.source_pointers.every((pointer) => pointer.startsWith("/data/packet/")),
    ),
  );
});
