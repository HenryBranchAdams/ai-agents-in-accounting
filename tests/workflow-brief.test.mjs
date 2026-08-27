import assert from "node:assert/strict";
import test from "node:test";

const workerPromise = (async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("workflow-brief-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
})();

async function request(path, headers = {}, method = "GET") {
  const worker = await workerPromise;
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers, method }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

const workflowId = "wf-r2r-bank-reconciliations";
const workflowPath = `/workflows/record-to-report/${workflowId}`;

test("bank reconciliation has the single canonical one-minute workflow brief pilot", async () => {
  const payload = await (await request(`/api/v1/workflows/${workflowId}`)).json();
  const brief = payload.item.brief;

  assert.equal(brief.id, `brief-${workflowId}`);
  assert.equal(brief.content_mode, "how-to");
  assert.equal(brief.evidence_classification, "implementation-pattern");
  assert.equal(brief.pilot_suitability.rating, "good-supervised-pilot");
  assert.equal(brief.synthetic_example.fictional, true);
  assert.equal(brief.synthetic_example.evidence_classification, "synthetic-example");
  assert.match(brief.default_boundary, /Posting.*bank contact.*cash movement.*final approval/i);
  assert.match(brief.synthetic_example.decision, /stop the conclusion/i);
  assert.match(brief.review_note, /professional.*not claimed/i);
  assert.deepEqual(brief.source_basis.map((source) => source.id), ["src_0vf7hhg", "src_075usnq"]);
  assert.ok(brief.source_basis.every((source) => /Binding only/i.test(source.applicability)));

  const collection = await (await request("/api/v1/workflows?limit=200")).json();
  assert.equal(collection.items.filter((workflow) => workflow.brief).length, 1);
});

test("human, Markdown, and JSON surfaces preserve the brief's material meaning", async () => {
  const apiBrief = (await (await request(`/api/v1/workflows/${workflowId}`)).json()).item.brief;
  const html = await (await request(workflowPath, { accept: "text/html" })).text();
  for (const text of [
    "One-minute workflow brief",
    "Should you keep reading?",
    "Good supervised pilot",
    "Default authority boundary",
    "Book receipt has no bank-side match",
    "Primary-source basis",
  ]) assert.match(html, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), text);
  assert.match(html, /<summary>Open prerequisites, example, sources, and transfer limits<\/summary>/);
  assert.match(html, /data-content-mode="how-to"/);
  assert.match(html, /data-evidence-classification="implementation-pattern"/);
  assert.match(html, /href="\/resources\/src_0vf7hhg"/);
  assert.match(html, /href="\/reviewer-guide"/);
  assert.match(html, /Content mode: <strong>Reference<\/strong>/);

  const markdown = await request(`/api/v1/workflows/${workflowId}?format=markdown`);
  assert.match(markdown.headers.get("content-type") ?? "", /^text\/markdown\b/i);
  const markdownText = await markdown.text();
  assert.match(markdownText, /#### One-minute workflow brief/);
  assert.ok(markdownText.includes(apiBrief.default_boundary));
  assert.ok(markdownText.includes(apiBrief.top_check));
  assert.ok(markdownText.includes(apiBrief.synthetic_example.decision));
  assert.ok(markdownText.includes(apiBrief.source_basis[0].applicability));
});

test("brief discovery, counts, and OpenAPI are current", async () => {
  const search = await (await request("/api/v1/search?q=good%20supervised%20pilot")).json();
  assert.ok(search.items.some((item) => item.id === workflowId));

  const meta = await (await request("/api/v1/meta")).json();
  assert.equal(meta.record_counts.workflow_briefs, 1);
  const corpus = await (await request("/downloads/corpus.json")).json();
  assert.equal(corpus.counts.workflow_briefs, 1);
  assert.equal(corpus.workflows.find((workflow) => workflow.id === workflowId).brief.id, `brief-${workflowId}`);

  const openapi = await (await request("/openapi.json")).json();
  const briefSchema = openapi.components.schemas.Workflow.properties.brief;
  assert.equal(briefSchema.properties.content_mode.const, "how-to");
  assert.equal(briefSchema.properties.synthetic_example.properties.fictional.const, true);
  assert.equal(briefSchema.properties.pilot_suitability.properties.rating.enum[0], "good-supervised-pilot");
});

test("every related workflow-brief target resolves and fragments are present", async () => {
  const brief = (await (await request(`/api/v1/workflows/${workflowId}`)).json()).item.brief;
  for (const related of brief.related_material) {
    const [path, fragment] = related.href.split("#");
    const response = await request(path, { accept: "text/html" });
    assert.equal(response.status, 200, related.href);
    if (fragment) {
      const html = await response.text();
      assert.match(html, new RegExp(`id=["']${fragment}["']`), related.href);
    }
  }
});
