import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workerPromise = (async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("bank-reconciliation-tutorial-test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
})();

async function request(path, headers = {}, method = "GET") {
  const worker = await workerPromise;
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers, method }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("bank-reconciliation tutorial reuses the canonical clean-room pack without expanding benchmark scope", async () => {
  const payload = await (await request("/api/v1/tutorials/bank-reconciliation")).json();
  const tutorial = payload.item;
  const pack = (await (await request("/api/v1/packs/bank-reconciliation")).json()).item;
  const missingCase = JSON.parse(await readFile(new URL("../packs/bank-reconciliation/cases/missing-wrong-period.json", import.meta.url), "utf8"));

  assert.equal(payload.collection, "accounting_agents_tutorials");
  assert.equal(tutorial.id, "bank-reconciliation-guided-lesson");
  assert.equal(tutorial.version, "1.0.0");
  assert.equal(tutorial.prepared_at, "2026-08-27");
  assert.equal(tutorial.review_status, "maintainer-review-pending");
  assert.equal(tutorial.primary_mode, "tutorial");
  assert.equal(tutorial.evidence_classification, "implementation-pattern");
  assert.equal(tutorial.environment.fictional, true);
  assert.equal(tutorial.environment.pack_id, pack.id);
  assert.equal(tutorial.environment.pack_version, pack.version);
  assert.equal(tutorial.environment.authority_level, pack.authority_level);
  assert.equal(tutorial.environment.scope, pack.scope);
  assert.deepEqual(tutorial.evidence_register.map((item) => item.id), pack.fixture.source_record_ids);
  assert.deepEqual(tutorial.known_answer_work.result, pack.reference_output);
  assert.equal(tutorial.known_answer_work.rows.find((row) => row.id === "adjusted-bank").amount, 436800);
  assert.equal(tutorial.known_answer_work.rows.find((row) => row.id === "adjusted-book").amount, 436800);
  assert.equal(tutorial.known_answer_work.rows.find((row) => row.id === "difference").amount, 0);
  assert.equal(tutorial.known_answer_work.equation, "428500 + 12500 - 4200 = 436800");
  assert.equal(tutorial.guided_steps.length, 8);
  assert.deepEqual(tutorial.guided_steps.map((step) => step.order), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(new Set(tutorial.guided_steps.map((step) => step.id)).size, 8);

  assert.equal(tutorial.deliberate_stop.id, missingCase.id);
  assert.equal(tutorial.deliberate_stop.expected_outcome, missingCase.expected.outcome);
  assert.deepEqual(tutorial.deliberate_stop.exception_codes, missingCase.expected.exception_codes);
  assert.equal(tutorial.deliberate_stop.minimum_evidence_links, missingCase.expected.minimum_evidence_links);
  assert.equal(tutorial.deliberate_stop.review_required, true);
  assert.deepEqual(tutorial.deliberate_stop.executed_actions, []);
  assert.deepEqual(tutorial.prepared_workpaper.executed_actions, []);
  assert.deepEqual(tutorial.reviewer_packet.complete_fixture_disposition.separately_authorized_actions, []);
  assert.deepEqual(tutorial.reviewer_packet.deliberate_stop_disposition.separately_authorized_actions, []);
  assert.equal(tutorial.reviewer_packet.complete_fixture_disposition.disposition, "approve");
  assert.match(tutorial.reviewer_packet.complete_fixture_disposition.scope, /synthetic training artifact/i);
  assert.equal(tutorial.reviewer_packet.deliberate_stop_disposition.disposition, "reject");
  assert.match(tutorial.reviewer_packet.deliberate_stop_disposition.rationale, /missing/i);
  assert.equal(tutorial.knowledge_check.length, 4);
  assert.ok(tutorial.knowledge_check.every((question) => question.options.some((option) => option.id === question.correct_option_id)));
  assert.match(tutorial.governing_rule.text, /Accountable people approve conclusions and sensitive external actions/);
  assert.match(tutorial.completion_artifact.interpretation_boundary, /does not establish accounting competence/i);
  assert.doesNotMatch(JSON.stringify(tutorial), /ledgerbench/i);
});

test("human, Markdown, and JSON tutorial surfaces preserve the guided lesson and authority boundary", async () => {
  const tutorial = (await (await request("/api/v1/tutorials/bank-reconciliation")).json()).item;
  const page = await request("/tutorials/bank-reconciliation", { accept: "text/html" });
  assert.equal(page.status, 200);
  const html = await page.text();

  assert.match(html, /<h1>Tutorial: prepare and review a synthetic bank reconciliation<\/h1>/);
  assert.match(html, /Content mode: <strong>Tutorial<\/strong>/);
  assert.match(html, /bank-reconciliation-guided-lesson/);
  assert.match(html, /Evidence register/);
  assert.match(html, /Known-answer work/);
  assert.match(html, /Deliberate missing-evidence stop/);
  assert.match(html, /Prepared workpaper/);
  assert.match(html, /Reviewer challenge and disposition/);
  assert.match(html, /\$436,800/);
  assert.match(html, /EVIDENCE_INCOMPLETE/);
  assert.match(html, /PERIOD_MISMATCH/);
  assert.match(html, /data-evidence-classification="editorial-recommendation"/);
  assert.match(html, /data-evidence-classification="synthetic-example"/);
  for (const id of [
    ...tutorial.guided_steps.map((step) => step.id),
    ...tutorial.evidence_register.map((item) => `evidence-${item.id}`),
    ...tutorial.known_answer_work.rows.map((row) => row.id),
    ...tutorial.knowledge_check.map((question) => question.id),
  ]) {
    assert.match(html, new RegExp(`id="${id}"`), id);
  }
  assert.equal((html.match(/<fieldset/g) ?? []).length, 4);
  assert.equal((html.match(/type="radio"/g) ?? []).length, 12);
  assert.match(html, /Lesson complete\./);

  const markdown = await request("/tutorials/bank-reconciliation.md");
  assert.equal(markdown.status, 200);
  assert.match(markdown.headers.get("content-type") ?? "", /^text\/markdown\b/i);
  const markdownText = await markdown.text();
  assert.match(markdownText, /^# Tutorial: prepare and review a synthetic bank reconciliation/m);
  assert.match(markdownText, /## Evidence register/);
  assert.match(markdownText, /## Guided lesson/);
  assert.match(markdownText, /### 5\. Practice the deliberate stop/);
  assert.match(markdownText, /428500 \+ 12500 - 4200 = 436800/);
  assert.match(markdownText, /## Reviewer challenge and dispositions/);
  assert.match(markdownText, /Separately authorized actions: 0/);
  assert.match(markdownText, /## Transfer limits/);

  const apiMarkdown = await request("/api/v1/tutorials/bank-reconciliation", { accept: "text/markdown" });
  assert.equal(apiMarkdown.status, 200);
  assert.equal(await apiMarkdown.text(), markdownText);
  assert.equal((await request("/api/v1/tutorials/bank-reconciliation", {}, "HEAD")).status, 200);
  assert.equal((await request("/api/v1/tutorials/bank-reconciliation", {}, "OPTIONS")).status, 204);
  assert.equal((await request("/api/v1/tutorials/bank-reconciliation?format=bad")).status, 400);
  assert.equal((await request("/api/v1/tutorials/bank-reconciliation", { accept: "image/png" })).status, 406);
});

test("bank-reconciliation tutorial is discoverable across the knowledge hub and machine corpus", async () => {
  const homepage = await (await request("/")).text();
  assert.match(homepage, /href="\/tutorials\/bank-reconciliation"/);
  assert.match(homepage, /Practice a complete accounting lesson/);

  const contentContract = (await (await request("/api/v1/content-contract")).json()).item;
  assert.ok(contentContract.page_assignments.some((assignment) => assignment.path === "/tutorials/bank-reconciliation" && assignment.primary_mode === "tutorial"));

  const sitemap = await (await request("/sitemap.xml")).text();
  assert.match(sitemap, /<loc>[^<]*\/tutorials\/bank-reconciliation<\/loc>/);
  assert.equal((sitemap.match(/<url>/g) ?? []).length, 596);

  const llms = await (await request("/llms.txt")).text();
  for (const path of ["/tutorials/bank-reconciliation", "/tutorials/bank-reconciliation.md", "/api/v1/tutorials/bank-reconciliation"]) {
    assert.ok(llms.includes(path), path);
  }
  const instructions = await (await request("/AGENTS.md")).text();
  assert.match(instructions, /Use \/tutorials\/bank-reconciliation for a complete clean-room lesson/);
  const catalog = await (await request("/.well-known/api-catalog")).json();
  assert.ok(JSON.stringify(catalog).includes("/api/v1/tutorials/bank-reconciliation"));

  const search = await (await request("/api/v1/search?q=missing%20evidence%20stop")).json();
  assert.ok(search.items.some((item) => item.canonical_path === "/tutorials/bank-reconciliation"));

  const metadata = await (await request("/api/v1/meta")).json();
  assert.equal(metadata.record_counts.tutorials, 1);
  assert.equal(metadata.record_counts.tutorial_steps, 8);
  assert.equal(metadata.record_counts.tutorial_evidence_records, 3);
  assert.equal(metadata.record_counts.tutorial_questions, 4);
  assert.match(metadata.links.bank_reconciliation_tutorial_api, /\/api\/v1\/tutorials\/bank-reconciliation$/);

  const corpus = await (await request("/downloads/corpus.json")).json();
  assert.equal(corpus.counts.tutorials, 1);
  assert.equal(corpus.counts.tutorial_steps, 8);
  assert.equal(corpus.bank_reconciliation_tutorial.id, "bank-reconciliation-guided-lesson");
  assert.deepEqual(corpus.bank_reconciliation_tutorial, (await (await request("/api/v1/tutorials/bank-reconciliation")).json()).item);

  const openapi = await (await request("/openapi.json")).json();
  assert.ok(openapi.paths["/api/v1/tutorials/bank-reconciliation"]);
  assert.equal(openapi.components.schemas.BankReconciliationTutorial.properties.id.const, "bank-reconciliation-guided-lesson");
  assert.equal(openapi.components.schemas.BankReconciliationTutorial.properties.guided_steps.minItems, 8);
});

test("tutorial documentation names the local, educational, and review boundaries", async () => {
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  const testing = await readFile(new URL("../TESTING.md", import.meta.url), "utf8");
  assert.match(readme, /synthetic bank-reconciliation tutorial/);
  assert.match(readme, /deliberate missing\/wrong-period stop/);
  assert.match(testing, /Bank-reconciliation tutorial/);
  assert.match(testing, /\$436,800 known answer/);
});
