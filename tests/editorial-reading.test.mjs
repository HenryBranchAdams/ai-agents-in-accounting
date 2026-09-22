import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import worker from "./worker-fixture.mjs";
import {
  records,
  getRecord,
  recordMarkdown,
  search,
} from "../dist/internal/corpus.mjs";
import {
  editorialHash,
  editorialReviewReport,
} from "../scripts/editorial-review.mjs";
import { validateSchema } from "../scripts/validate.mjs";
const htmlText = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");
const ids = [
  "wf-r2r-bank-reconciliations",
  "guide-construction-connected-close",
];
const page = async (path) =>
  (await worker.fetch(new Request("https://corpus.example" + path))).text();

test("editorial home and full library preserve legacy query meanings", async () => {
  const home = await page("/");
  assert.match(home, /What should an accounting agent do/);
  for (const id of ids)
    assert.ok(home.includes(htmlText(getRecord(id).data.editorial_brief.answer)));
  assert.match(home, /action="\/library"/);
  assert.match(home, /href="\/library"/);
  for (const route of [
    "/library",
    "/?q=",
    "/?kind=source",
    "/?page=2",
    "/?q=bank&kind=workflow",
    "/?unknown=kept",
  ]) {
    const html = await page(route);
    assert.doesNotMatch(
      html,
      /What should an accounting agent do/,
      route,
    );
    assert.match(html, /role="search"/, route);
  }
  const combined = await page(
    "/?q=bank&kind=source&jurisdiction=United+States&limit=1",
  );
  assert.match(
    combined,
    /href="\/library\?q=bank&amp;kind=source&amp;jurisdiction=United\+States&amp;limit=1&amp;page=2"/,
  );
  assert.match(combined, /href="\/library\?q=bank&amp;limit=1"/);
  const empty = await page("/library?q=zzzz_nonexistent_170&kind=workflow");
  assert.match(empty, /No records match/);
  assert.match(empty, /href="\/library"[^>]*>Browse all records/);
  assert.match(combined, /name="limit" value="1"/);
  const browse = await page("/library");
  assert.ok(
    browse.includes(search(new URLSearchParams()).total.toLocaleString()),
  );
});
test("both pilots put the useful answer and limit before administrative material", async () => {
  for (const id of ids) {
    const b = getRecord(id).data.editorial_brief,
      html = await page("/records/" + id);
    for (const value of [
      b.question,
      b.answer,
      b.reading.critical_limitation,
      b.reading.exception.title,
    ])
      assert.ok(html.includes(htmlText(value)), value);
    assert.ok(
      html.indexOf(htmlText(b.answer)) < html.indexOf('aria-label="Review and rights"'),
    );
    assert.ok(
      html.indexOf(htmlText(b.reading.critical_limitation)) <
        html.indexOf('id="record-actions"'),
    );
    assert.match(html, /<details><summary>Complete record details/);
    for (const anchor of [
      "answer",
      "findings",
      "qualifications",
      "unknowns",
      "record-content",
      "rights",
      "citation",
      "responsibility",
      "worked-example",
    ])
      assert.ok(html.includes(`id="${anchor}"`));
    assert.match(html, /Original synthetic example/);
    assert.match(html, /Project-proposed responsibility boundaries/);
    for (const f of b.findings)
      for (const source of f.source_ids)
        assert.ok(html.includes("/records/" + source));
    const md = recordMarkdown(getRecord(id));
    assert.ok(md.indexOf(b.answer) < md.indexOf("## Rights"));
    for (const row of b.reading.example.rows)
      for (const cell of row) assert.ok(md.includes(cell));
    assert.ok(md.includes("## Who does what"));
  }
  const guide = await page("/records/" + ids[1]);
  assert.match(guide, /id="research-questions"/);
  assert.match(guide, /id="detail-four_gap_ledger"/);
  const ordinary = records.find(
    (r) => r.kind === "workflow" && !r.data.editorial_brief,
  );
  const fallback = await page("/records/" + ordinary.id);
  assert.ok(fallback.includes(ordinary.summary));
  assert.doesNotMatch(fallback, /id="worked-example"/);
  assert.match(fallback, /<details><summary>Complete record details/);
});
test("synthetic arithmetic agrees with the retained construction branch and distinct balances", () => {
  const b = getRecord(ids[0]).data.editorial_brief.reading.example.values;
  assert.equal(b.book_cash - b.fee, b.statement_cash);
  assert.equal(b.proposed_debit, b.proposed_credit);
  assert.equal(b.proposed_credit, b.fee);
  const e = getRecord("example-construction-contract-ledger").data.examples;
  const base = e.find((x) => x.id === "construction-close-one"),
    revision = e.find((x) => x.id === "construction-estimate-revision");
  const revenue =
    (revision.input.cost / revision.input.new_estimate) * revision.input.price;
  assert.equal(revenue, 324000);
  assert.equal(revenue - revision.input.prior_revenue, -36000);
  assert.equal(revenue - base.input.billings, 24000);
  assert.equal(base.input.billings - base.input.receipts, 60000);
  const table = getRecord(ids[1]).data.editorial_brief.reading.example.rows;
  assert.deepEqual(
    table.find((r) => r[0] === "Cumulative revenue"),
    ["Cumulative revenue", "$360,000", "$324,000"],
  );
  assert.deepEqual(
    table.find((r) => r[0] === "Contract asset"),
    ["Contract asset", "$60,000", "$24,000"],
  );
  assert.deepEqual(
    table.find((r) => r[0] === "Receivable / cash"),
    ["Receivable / cash", "$60,000 / $130,000", "$60,000 / $130,000"],
  );
});
test("editorial dependencies detect source, example and self changes without upgrading reviews", () => {
  const before = structuredClone(records);
  assert.ok(
    editorialReviewReport(records).every(
      (r) => r.status === "dependencies-unchanged",
    ),
  );
  for (const id of [
    "src_0vf7hhg",
    "example-construction-contract-ledger",
    ids[0],
  ]) {
    const changed = structuredClone(records);
    const r = changed.find((r) => r.id === id);
    r.summary += " changed";
    assert.ok(
      editorialReviewReport(changed).some((x) =>
        x.changed_dependencies.includes(id),
      ),
    );
    assert.equal(r.review_status, getRecord(id).review_status);
  }
  const removed = records.filter((r) => r.id !== "src_0vf7hhg");
  assert.ok(
    editorialReviewReport(removed).some((r) =>
      r.changed_dependencies.includes("src_0vf7hhg"),
    ),
  );
  assert.deepEqual(records, before);
  const r = getRecord(ids[0]),
    reordered = Object.fromEntries(Object.entries(r).reverse());
  assert.equal(editorialHash(r), editorialHash(reordered));
  const report = JSON.parse(
    fs.readFileSync("dist/client/downloads/maintenance.json"),
  ).editorial_reviews;
  assert.deepEqual(report, editorialReviewReport(records));
});
test("optional reading schema rejects malformed fields and preserves old record shapes", () => {
  const schema = JSON.parse(fs.readFileSync("schemas/record.schema.json"));
  for (const id of ids) validateSchema(getRecord(id), schema);
  const invalid = structuredClone(getRecord(ids[0]));
  invalid.data.editorial_brief.reading.review.dependencies[0].sha256 =
    "not-a-hash";
  assert.throws(() => validateSchema(invalid, schema));
  delete invalid.data.editorial_brief;
  validateSchema(invalid, schema);
});
test("pilot rights and historical records are preserved; public entry routes stay read-only", async () => {
  const prior = JSON.parse(
    fs.readFileSync("data/releases/2026-09-19.12427/corpus.json"),
  );
  const current = new Map(records.map((r) => [r.id, r]));
  // Explicit issue173 amendments may deepen current records. They must not
  // erase identity, rights or the reviewed historical statements. All other
  // records retain the original pilot-only preservation contract.
  const amendments = new Map([
    ['example-us-operating-transactions-ledger','discovery_summary_review_173'],
    ...['src_1rrurlr','src_1sbtyzp','src_0eqyd2f','src_095yto0'].map(id=>[id,'empirical_review_173']),
    ...['src_0qwi4ry','src_finqa2021','src_apexaccounting_paper2026'].map(id=>[id,'benchmark_review_173']),
    ...['ctrl-tool-authorization','ctrl-human-approval','ctrl-segregation-duties','ctrl-exception-routing','ctrl-version-evidence'].map(id=>[id,'accounting_action_boundary_173']),
    ['src_06fwpim','issue_173_identity_review'],['src_0pywo86','issue_173_control_review'],
    ['src_oracle26b_journal_headers','supplemental_reviews'],['src_oracle_collection_paging_25d','supplemental_reviews'],
    ['src_xero_journals_completeness','reviewed_object'],['src_xero_bank_statement_boundary','review_trigger'],
    ['guide-independent-deployment-evidence','accounting_evidence_update_173'],
  ]);
  for (const previous of prior.records) {
    const r = current.get(previous.id);
    assert.ok(r, `Historical record removed: ${previous.id}`);
    assert.equal(r.kind, previous.kind);
    assert.deepEqual(r.rights, previous.rights, r.id);
    assert.equal(r.source_url, previous.source_url);
    if (amendments.has(r.id)) {
      assert.ok(r.data[amendments.get(r.id)], `${r.id}: missing scoped amendment evidence`);
      assert.equal(r.provenance.imported_on, previous.provenance.imported_on);
      assert.equal(r.provenance.previous_corpus_version, previous.provenance.previous_corpus_version);
      if (r.data.discovery_summary_review_173) {
        assert.equal(r.data.discovery_summary_review_173.previous_summary, previous.summary);
        const retained = structuredClone(r); retained.summary = previous.summary;
        delete retained.data.discovery_summary_review_173;
        assert.deepEqual(retained, previous, "Settlement discovery amendment only changes its summary and review receipt");
      }
      if (r.data.empirical_review_173)
        assert.deepEqual(r.data.previous_source_review_173, previous.data.source_review, `${r.id}: earlier source review lost`);
      if (r.data.accounting_action_boundary_173)
        assert.deepEqual(r.data.previous_editorial_review_173, previous.data.editorial_review, `${r.id}: earlier editorial review lost`);
    } else {
      assert.deepEqual(r.provenance, previous.provenance, r.id);
      assert.equal(r.review_status, previous.review_status);
      assert.equal(r.reviewed_at, previous.reviewed_at);
      if (!ids.includes(r.id)) assert.deepEqual(r, previous, r.id);
    }
  }
  for (const route of ["/", "/library", ...ids.map((id) => "/records/" + id)]) {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"])
      assert.equal(
        (
          await worker.fetch(
            new Request("https://corpus.example" + route, { method }),
          )
        ).status,
        405,
      );
    assert.equal(
      (
        await worker.fetch(
          new Request("https://corpus.example" + route, { method: "HEAD" }),
        )
      ).status,
      200,
    );
  }
});
