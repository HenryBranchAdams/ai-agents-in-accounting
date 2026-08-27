import assert from "node:assert/strict";
import test from "node:test";
const modeLabels = [
  "Tutorial", "How-to", "Explanation", "Reference", "Case study", "Evidence synthesis", "Program documentation",
];
const evidenceLabels = [
  "Authoritative requirement", "Official guidance", "Editorial recommendation", "Implementation pattern",
  "Synthetic example", "Empirical evidence", "Unresolved question",
];

const workerPromise = (async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("content-contract-test", `${process.pid}-${Date.now()}`);
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

test("canonical content contract has seven modes, seven classifications, and a bounded release gate", async () => {
  const payload = await (await request("/api/v1/content-contract")).json();
  const contract = payload.item;
  assert.equal(contract.modes.length, 7);
  assert.deepEqual(contract.modes.map((mode) => mode.label), modeLabels);
  assert.equal(contract.evidence_classifications.length, 7);
  assert.deepEqual(contract.evidence_classifications.map((classification) => classification.label), evidenceLabels);
  assert.equal(contract.release_gate.qualifying_improvements.length, 6);
  assert.match(contract.release_gate.non_qualifying_basis, /count alone/i);
  assert.equal(contract.review_status, "maintainer-review-pending");
  assert.equal(contract.prepared_at, "2026-08-25");
  assert.equal("reviewed_at" in contract, false);
  assert.match(contract.review_note, /Independent or professional review is not claimed/i);
  assert.equal(contract.success_measures.length, 9);
  for (const measure of [
    "orientation-completion", "case-completion", "time-to-useful-material", "reviewer-understanding",
    "pilot-selection", "source-to-claim-coverage", "freshness", "review-status", "practitioner-use",
  ]) assert.ok(contract.success_measures.some((item) => item.id === measure), measure);
  assert.ok(contract.page_assignments.some((assignment) => assignment.path === "/content-contract"));
});

test("human, Markdown, and JSON content-contract surfaces preserve canonical meaning", async () => {
  const page = await request("/content-contract", { accept: "text/html" });
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /Content mode: <strong>Program documentation<\/strong>/);
  for (const label of [...modeLabels, ...evidenceLabels]) {
    assert.match(html, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), label);
  }
  assert.match(html, /Instrumentation and results are not currently claimed/);
  assert.match(html, /Maintainer review pending; independent or professional review is not claimed/);
  const renderedGap = "(?:<!-- -->|\\s)+";
  assert.match(html, new RegExp(`Prepared${renderedGap}Aug 25, 2026`));
  assert.doesNotMatch(html, new RegExp(`Reviewed${renderedGap}Aug 25, 2026`));

  const markdown = await request("/content-contract.md");
  assert.equal(markdown.status, 200);
  assert.match(markdown.headers.get("content-type") ?? "", /^text\/markdown\b/i);
  const markdownText = await markdown.text();
  assert.match(markdownText, /^# Educational content contract/m);
  assert.match(markdownText, /## Primary content modes/);
  assert.match(markdownText, /## Evidence classifications/);
  assert.match(markdownText, /Corpus count alone/);
  assert.match(markdownText, /- Prepared: 2026-08-25/);

  const api = await request("/api/v1/content-contract");
  assert.equal(api.status, 200);
  assert.equal(api.headers.get("access-control-allow-origin"), "*");
  assert.ok(api.headers.get("etag"));
  const payload = await api.json();
  assert.equal(payload.collection, "content_contract");
  assert.equal(payload.item.id, "content-contract");
  assert.equal(payload.item.version, "1.0.0");
  assert.equal(payload.item.modes.length, 7);
  assert.match(payload.item.measurement_status, /Instrumentation and results are not currently claimed/);

  const apiMarkdown = await request("/api/v1/content-contract", { accept: "text/markdown" });
  assert.equal(apiMarkdown.status, 200);
  assert.equal(await apiMarkdown.text(), markdownText);
  const head = await request("/api/v1/content-contract", {}, "HEAD");
  assert.equal(head.status, 200);
  const options = await request("/api/v1/content-contract", {}, "OPTIONS");
  assert.equal(options.status, 204);
});

test("content contract is exposed through shared-shell labels and discovery projections", async () => {
  const staticModeLabels = {
    "/": "Explanation",
    "/start-here": "Tutorial",
    "/course": "Tutorial",
    "/fundamentals": "Explanation",
    "/lifecycle": "Reference",
    "/authority": "Reference",
    "/workflows": "Reference",
    "/controls": "Reference",
    "/sensitive-actions": "Reference",
    "/evidence-assurance": "Explanation",
    "/security-identity": "Reference",
    "/architecture": "Explanation",
    "/ecosystem": "Reference",
    "/evaluation": "Explanation",
    "/pilot": "How-to",
    "/operations": "How-to",
    "/templates": "Reference",
    "/glossary": "Reference",
    "/resources": "Reference",
    "/reading-room": "Evidence synthesis",
    "/machine-access": "Program documentation",
    "/packs": "Reference",
    "/bench": "Program documentation",
    "/ledgerbench": "Program documentation",
    "/spec": "Program documentation",
    "/methodology": "Program documentation",
    "/changes": "Program documentation",
    "/open-source": "Program documentation",
    "/content-contract": "Program documentation",
    "/control-model": "Reference",
    "/coverage": "Reference",
  };
  for (const [path, mode] of Object.entries(staticModeLabels)) {
    const html = await (await request(path, { accept: "text/html" })).text();
    assert.match(html, /class=["']content-mode["']/i, path);
    assert.match(html, new RegExp(`Content mode: <strong>${mode}<\\/strong>`), path);
  }
  for (const path of [
    "/workflows/record-to-report", "/workflows/record-to-report/wf-r2r-bank-reconciliations",
    "/resources/src_ifrs15a", "/packs/bank-reconciliation",
  ]) {
    const response = await request(path, { accept: "text/html" });
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), /Content mode: <strong>Reference<\/strong>/, path);
  }

  const sitemap = await (await request("/sitemap.xml")).text();
  assert.match(sitemap, /\/content-contract<\/loc>/);
  const llms = await (await request("/llms.txt")).text();
  for (const path of ["/content-contract", "/content-contract.md", "/api/v1/content-contract"]) assert.ok(llms.includes(path), path);
  const catalog = await (await request("/.well-known/api-catalog")).json();
  assert.ok(JSON.stringify(catalog).includes("/api/v1/content-contract"));

  const metadata = await (await request("/api/v1/meta")).json();
  assert.equal(metadata.record_counts.workflows, 60);
  assert.equal(metadata.record_counts.source_records, 489);
  assert.equal(metadata.record_counts.workflow_packs, 6);
  assert.equal(metadata.record_counts.benchmark_cases, 30);
  assert.match(metadata.links.content_contract_api, /\/api\/v1\/content-contract$/);

  const corpus = await (await request("/downloads/corpus.json")).json();
  assert.deepEqual(corpus.content_contract, (await (await request("/api/v1/content-contract")).json()).item);
  const taxonomy = await (await request("/api/v1/taxonomy")).json();
  assert.equal(taxonomy.content_modes.length, 7);
  assert.equal(taxonomy.evidence_classifications.length, 7);
  const openapi = await (await request("/openapi.json")).json();
  assert.ok(openapi.paths["/api/v1/content-contract"]);
  assert.ok(openapi.components.schemas.ContentContract);
});
