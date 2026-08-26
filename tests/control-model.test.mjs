import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const elementIds = ["objective", "scope", "evidence", "procedure", "checks", "authority", "review", "action", "record"];

const workerPromise = (async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("control-model-test", `${process.pid}-${Date.now()}`);
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

test("canonical Control Model preserves nine elements, two synthetic scenarios, and the accountable boundary", async () => {
  const payload = await (await request("/api/v1/control-model")).json();
  assert.equal(payload.collection, "control_model");
  assert.equal(payload.item.id, "accounting-agent-control-model");
  assert.equal(payload.item.version, "1.0.0");
  assert.equal(payload.item.review_status, "maintainer-review-pending");
  assert.match(payload.item.review_note, /Independent or professional review is not claimed/i);
  assert.match(payload.item.governing_invariant, /accountable people approve conclusions and sensitive external actions/i);
  assert.deepEqual(payload.item.elements.map((element) => element.id), elementIds);
  assert.ok(payload.item.elements.every((element) => element.evidence_classification === "implementation-pattern"));
  assert.equal(payload.item.scenarios.length, 2);
  for (const scenario of payload.item.scenarios) {
    assert.equal(scenario.fictional, true);
    assert.equal(scenario.evidence_classification, "synthetic-example");
    assert.deepEqual(scenario.elements.map((element) => element.element_id), elementIds);
    assert.match(scenario.accountable_conclusion, /agent (?:does not|cannot)/i);
  }
  const accrual = payload.item.scenarios.find((scenario) => scenario.id === "synthetic-accrual-entry");
  assert.match(accrual.elements.find((element) => element.element_id === "checks").application, /two accepted months equal a \$24,000 cumulative accrual/i);
  assert.match(accrual.elements.find((element) => element.element_id === "review").application, /prior-period implications/i);
});

test("human, Markdown, and JSON Control Model surfaces preserve stable meaning", async () => {
  const page = await request("/control-model", { accept: "text/html" });
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /Content mode: <strong>Reference<\/strong>/);
  assert.match(html, /Printable one-page reference/);
  assert.match(html, /data-evidence-classification="implementation-pattern"/);
  assert.match(html, /data-evidence-classification="synthetic-example"/);
  assert.equal((html.match(/id="element-(?:objective|scope|evidence|procedure|checks|authority|review|action|record)"/g) ?? []).length, 9);
  assert.ok((html.match(/<caption>/g) ?? []).length >= 3);

  const markdown = await request("/control-model.md");
  assert.equal(markdown.status, 200);
  const markdownText = await markdown.text();
  assert.match(markdownText, /^# Accounting Agent Control Model/m);
  assert.match(markdownText, /## Nine elements/);
  for (const id of elementIds) assert.match(markdownText, new RegExp(`\\| \`${id}\` \\|`), id);
  assert.match(markdownText, /## Synthetic scenarios/);
  assert.match(markdownText, /All 60 workflow records/);

  const apiMarkdown = await request("/api/v1/control-model", { accept: "text/markdown" });
  assert.equal(await apiMarkdown.text(), markdownText);
  assert.equal((await request("/api/v1/control-model", {}, "HEAD")).status, 200);
  assert.equal((await request("/api/v1/control-model", {}, "OPTIONS")).status, 204);
  assert.equal((await request("/api/v1/control-model?format=bad")).status, 400);
  assert.equal((await request("/api/v1/control-model", { accept: "image/png" })).status, 406);
});

test("all workflow surfaces map the exact nine Control Model elements", async () => {
  const workflows = await (await request("/api/v1/workflows?limit=60")).json();
  assert.equal(workflows.items.length, 60);
  for (const workflow of workflows.items) {
    assert.equal(workflow.control_model.model_id, "accounting-agent-control-model");
    assert.equal(workflow.control_model.model_version, "1.0.0");
    assert.deepEqual(workflow.control_model.elements.map((element) => element.element_id), elementIds);
    assert.ok(workflow.control_model.elements.every((element) => element.source_fields.length > 0));
  }

  const journal = workflows.items.find((workflow) => workflow.id === "wf-r2r-journal-entry");
  const markdown = await (await request(`/api/v1/workflows/${journal.id}?format=markdown`)).text();
  assert.match(markdown, /Accounting Agent Control Model \(accounting-agent-control-model v1\.0\.0\)/);
  for (const id of elementIds) assert.match(markdown, new RegExp(`- ${id}:`), id);
  const html = await (await request(`/workflows/${journal.family}/${journal.id}`, { accept: "text/html" })).text();
  assert.match(html, /id="control-model"/);
  assert.match(html, /Control-model elements mapped to/);
});

test("Control Model is present in discovery, corpus, taxonomy, OpenAPI, and print contracts", async () => {
  const sitemap = await (await request("/sitemap.xml")).text();
  assert.match(sitemap, /\/control-model<\/loc>/);
  const llms = await (await request("/llms.txt")).text();
  for (const path of ["/control-model", "/control-model.md", "/api/v1/control-model"]) assert.ok(llms.includes(path), path);
  const instructions = await (await request("/AGENTS.md")).text();
  assert.match(instructions, /\/control-model/);
  const catalog = await (await request("/.well-known/api-catalog")).json();
  assert.ok(JSON.stringify(catalog).includes("/api/v1/control-model"));

  const metadata = await (await request("/api/v1/meta")).json();
  assert.equal(metadata.record_counts.control_model_elements, 9);
  assert.equal(metadata.record_counts.control_model_scenarios, 2);
  const taxonomy = await (await request("/api/v1/taxonomy")).json();
  assert.deepEqual(taxonomy.control_model_elements.map((element) => element.value), elementIds);
  const corpus = await (await request("/downloads/corpus.json")).json();
  assert.equal(corpus.control_model.id, "accounting-agent-control-model");
  assert.ok(corpus.workflows.every((workflow) => workflow.control_model.elements.length === 9));
  const openapi = await (await request("/openapi.json")).json();
  assert.ok(openapi.paths["/api/v1/control-model"]);
  assert.ok(openapi.components.schemas.ControlModel);
  assert.ok(openapi.components.schemas.Workflow.required.includes("control_model"));

  const bundle = await (await request("/downloads/context-bundle.md")).text();
  assert.equal((bundle.match(/^## Accounting Agent Control Model$/gm) ?? []).length, 1);

  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /@media print[\s\S]*\.doc-body:has\(\.control-model-print-reference\)/);
  assert.match(css, /\.control-model-quick-list[\s\S]*grid-template-columns:\s*repeat\(3/);
});
