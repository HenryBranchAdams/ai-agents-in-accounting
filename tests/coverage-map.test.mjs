import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stateIds = ["deep", "canonical-reference", "source-library-only", "planned", "out-of-scope"];

const workerPromise = (async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("coverage-map-test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
})();

async function request(path, headers = {}, method = "GET") {
  const worker = await workerPromise;
  return worker.fetch(new Request(`http://localhost${path}`, { headers, method }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("coverage map has five stable states and reconciles the canonical corpus", async () => {
  const payload = await (await request("/api/v1/coverage")).json();
  const map = payload.item;
  assert.equal(payload.collection, "coverage_map");
  assert.equal(map.id, "accounting-agents-coverage-map");
  assert.equal(map.version, "2026-08-25.1");
  assert.equal(map.review_status, "maintainer-review-pending");
  assert.match(map.review_note, /Subject-matter, independent, professional, audit, or assurance review is not claimed/i);
  assert.deepEqual(map.state_definitions.map((state) => state.id), stateIds);
  assert.equal(map.family_coverage.length, 8);
  assert.equal(map.family_coverage.reduce((sum, family) => sum + family.workflow_count, 0), 60);
  assert.ok(map.family_coverage.every((family) => family.state === "canonical-reference"));
  assert.equal(map.deep_coverage.current_count, 0);
  assert.equal(map.deep_coverage.planned_candidates.length, 12);
  assert.equal(new Set(map.deep_coverage.planned_candidates.map((item) => item.id)).size, 12);
  assert.equal(map.expansion_coverage.length, 8);
  assert.ok(map.expansion_coverage.every((item) => ["source-library-only", "planned"].includes(item.current_state)));
  for (const item of map.expansion_coverage.filter((candidate) => candidate.current_state === "source-library-only")) {
    assert.ok(item.source_query, `${item.id} source query`);
    const sources = await (await request(`/api/v1/resources?q=${encodeURIComponent(item.source_query)}&limit=1`)).json();
    assert.ok(sources.items.length > 0, `${item.id} source-library evidence`);
  }
  assert.ok(map.expansion_coverage.filter((item) => item.current_state === "planned").every((item) => item.source_query === null));
  assert.equal(map.out_of_scope.length, 4);
  assert.match(map.governing_invariant, /accountable people approve conclusions and sensitive external actions/i);
});

test("coverage map preserves meaning across human, Markdown, and JSON surfaces", async () => {
  const page = await request("/coverage", { accept: "text/html" });
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /Content mode: <strong>Reference<\/strong>/);
  assert.match(html, /data-evidence-classification="editorial-recommendation"/);
  for (const id of stateIds) assert.match(html, new RegExp(`id="state-${id}"`), id);
  assert.equal((html.match(/id="coverage-family-/g) ?? []).length, 8);
  assert.ok((html.match(/<caption>/g) ?? []).length >= 2);
  for (const href of ["/packs/bank-reconciliation", "/controls", "/templates", "/api/v1/resources?q=payroll", "/sensitive-actions", "/evidence-assurance"]) assert.match(html, new RegExp(`href="${href.replace(/[?]/g, "\\?")}"`), href);

  const markdown = await request("/coverage.md");
  assert.equal(markdown.status, 200);
  const markdownText = await markdown.text();
  assert.match(markdownText, /^# Accounting Agents coverage and gaps map/m);
  for (const id of stateIds) assert.match(markdownText, new RegExp(`\\| \`${id}\` \\|`), id);
  assert.match(markdownText, /Current deep workflows: \*\*0\*\*/);
  assert.match(markdownText, /## Out of scope/);

  const apiMarkdown = await request("/api/v1/coverage", { accept: "text/markdown" });
  assert.equal(await apiMarkdown.text(), markdownText);
  assert.equal((await request("/api/v1/coverage", {}, "HEAD")).status, 200);
  assert.equal((await request("/api/v1/coverage", {}, "OPTIONS")).status, 204);
  assert.equal((await request("/api/v1/coverage?format=bad")).status, 400);
  assert.equal((await request("/api/v1/coverage", { accept: "image/png" })).status, 406);
});

test("lifecycle claims are qualified and coverage is fully discoverable", async () => {
  for (const path of ["/", "/lifecycle", "/workflows"]) {
    const html = await (await request(path, { accept: "text/html" })).text();
    assert.doesNotMatch(html, /(?:full accounting lifecycle|complete lifecycle coverage|covers the complete accounting lifecycle)/i, path);
    assert.match(html, /href="\/coverage"/, path);
  }
  const fullScope = await readFile(new URL("../docs/full-scope-goal.md", import.meta.url), "utf8");
  assert.doesNotMatch(fullScope, /covers the full accounting lifecycle/i);

  const sitemap = await (await request("/sitemap.xml")).text();
  assert.match(sitemap, /\/coverage<\/loc>/);
  const llms = await (await request("/llms.txt")).text();
  for (const path of ["/coverage", "/coverage.md", "/api/v1/coverage"]) assert.ok(llms.includes(path), path);
  const instructions = await (await request("/AGENTS.md")).text();
  assert.match(instructions, /Use \/coverage before claiming/);
  const catalog = await (await request("/.well-known/api-catalog")).json();
  assert.ok(JSON.stringify(catalog).includes("/api/v1/coverage"));
  const search = await (await request("/api/v1/search?q=coverage%20gaps")).json();
  assert.ok(search.items.some((item) => item.canonical_path === "/coverage"));

  const metadata = await (await request("/api/v1/meta")).json();
  assert.equal(metadata.record_counts.coverage_states, 5);
  assert.equal(metadata.record_counts.coverage_family_boundaries, 8);
  assert.match(metadata.links.coverage_api, /\/api\/v1\/coverage$/);
  const taxonomy = await (await request("/api/v1/taxonomy")).json();
  assert.deepEqual(taxonomy.coverage_states.map((state) => state.value), stateIds);
  const corpus = await (await request("/downloads/corpus.json")).json();
  assert.equal(corpus.coverage_map.id, "accounting-agents-coverage-map");
  const openapi = await (await request("/openapi.json")).json();
  assert.ok(openapi.paths["/api/v1/coverage"]);
  assert.ok(openapi.components.schemas.CoverageMap);

  const lifecycle = await (await request("/lifecycle")).text();
  const authority = await (await request("/authority")).text();
  assert.match(lifecycle, /href="\/coverage"[^>]*>Coverage and gaps/);
  assert.match(authority, /href="\/coverage"[^>]*>Coverage and gaps/);
});

test("coverage map responsive styles and rights boundaries are explicit", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.coverage-state-grid[\s\S]*grid-template-columns:\s*repeat\(2/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.coverage-state-grid[\s\S]*grid-template-columns:\s*1fr/);
  const map = (await (await request("/api/v1/coverage")).json()).item;
  assert.equal(map.rights.editorial_content, "CC-BY-4.0");
  assert.equal(map.rights.factual_metadata, "CC0-1.0");
  assert.match(map.applicability, /exact version/i);
});
