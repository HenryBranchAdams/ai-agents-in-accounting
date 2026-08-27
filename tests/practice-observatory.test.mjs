import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workerPromise = (async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("practice-observatory-test", `${process.pid}-${Date.now()}`);
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

function collectKeys(value, keys = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      keys.add(key);
      collectKeys(item, keys);
    }
  }
  return keys;
}

test("practice observatory is exactly the reviewed current-development cohort", async () => {
  const payload = await (await request("/api/v1/observatory")).json();
  const observatory = payload.item;
  const currentDevelopment = await (await request("/api/v1/resources?time_role=current-development&limit=200")).json();
  const items = observatory.items;

  assert.equal(payload.collection, "accounting_agents_practice_observatory");
  assert.equal(observatory.id, "accounting-agents-practice-observatory");
  assert.equal(observatory.version, "1.0.0");
  assert.equal(observatory.snapshot_as_of, "2026-08-27");
  assert.equal(observatory.review_status, "maintainer-review-pending");
  assert.equal(observatory.primary_mode, "evidence-synthesis");
  assert.equal(observatory.evidence_classification, "editorial-recommendation");
  assert.equal(items.length, 31);
  assert.equal(observatory.counts.records, items.length);
  assert.equal(new Set(items.map((item) => item.id)).size, items.length);
  assert.equal(new Set(items.map((item) => item.resource_id)).size, items.length);
  assert.deepEqual(
    [...items.map((item) => item.resource_id)].sort(),
    [...currentDevelopment.items.map((item) => item.id)].sort(),
  );
  assert.ok(currentDevelopment.items.every((item) => item.curation.temporal_role === "current-development"));

  assert.deepEqual(observatory.counts.lane_records, {
    "official-standard": 15,
    research: 7,
    product: 5,
    "disclosed-practice": 1,
    "technical-development": 3,
  });
  assert.equal(observatory.lanes.length, 5);
  assert.equal(observatory.counts.relationship_profiled_records, 7);
  assert.equal(items.filter((item) => item.relationship_profiled).length, 7);
  assert.ok(items.some((item) => item.applicability.some((facet) => facet.id === "general")));
  assert.ok(items.some((item) => item.applicability.some((facet) => facet.id !== "general")));

  for (const item of items) {
    assert.equal(item.catalog_href, `/resources/${item.resource_id}`);
    assert.match(item.original_source_href, /^https:\/\//);
    assert.ok(item.method);
    assert.ok(item.transfer_limit);
    assert.ok(item.applicability.length > 0);
    assert.equal(item.review_status, "maintainer-review-pending");
    if (item.relationship_profiled) {
      assert.ok(item.evidence_tier);
      assert.doesNotMatch(item.evidence_tier_label, /pending/i);
    } else {
      assert.equal(item.evidence_tier, null);
      assert.match(item.evidence_tier_label, /not assigned.*pending/i);
    }
  }

  const normalizedDates = items.map((item) => item.source_updated_at);
  const firstMissingDate = normalizedDates.findIndex((value) => value === null);
  if (firstMissingDate >= 0) assert.ok(normalizedDates.slice(firstMissingDate).every((value) => value === null));
  const dated = normalizedDates.filter(Boolean);
  assert.deepEqual(dated, [...dated].sort((left, right) => right.localeCompare(left)));

  const keys = collectKeys(observatory);
  for (const forbidden of ["rank", "ranking", "score", "leaderboard", "adoption_rate", "market_share", "roi"]) {
    assert.equal(keys.has(forbidden), false, forbidden);
  }
  assert.match(observatory.governing_rule.text, /accountable people approve conclusions and sensitive external actions/i);
  assert.match(observatory.freshness.monitoring_boundary, /not an automatic alerting service/i);
});

test("human, Markdown, and JSON observatory surfaces preserve provenance and limits", async () => {
  const observatory = (await (await request("/api/v1/observatory")).json()).item;
  const page = await request("/observatory", { accept: "text/html" });
  assert.equal(page.status, 200);
  const html = await page.text();

  assert.match(html, /<h1>Practice observatory: current accounting-agent developments<\/h1>/);
  assert.match(html, /Content mode: <strong>Evidence synthesis<\/strong>/);
  assert.match(html, /A dated field index, not a leaderboard/);
  assert.match(html, /Industry applicability/);
  assert.match(html, /Method, freshness, and transfer limit/);
  assert.equal((html.match(/class="observatory-card"/g) ?? []).length, 31);
  for (const lane of observatory.lanes) assert.match(html, new RegExp(`id="lane-${lane.id}"`), lane.id);
  for (const item of observatory.items) assert.match(html, new RegExp(`id="${item.id}"`), item.id);
  assert.equal((html.match(/target="_blank"/g) ?? []).length >= 31, true);

  const markdown = await request("/observatory.md");
  assert.equal(markdown.status, 200);
  assert.match(markdown.headers.get("content-type") ?? "", /^text\/markdown\b/i);
  const markdownText = await markdown.text();
  assert.match(markdownText, /^# Practice observatory: current accounting-agent developments/m);
  assert.match(markdownText, /Coverage: 31 records across 5 lanes/);
  assert.match(markdownText, /## Official and standards developments \(15\)/);
  assert.match(markdownText, /## Disclosed practice \(1\)/);
  assert.match(markdownText, /Not assigned · relationship profile pending/);
  assert.match(markdownText, /Original source: https:\/\//);

  const apiMarkdown = await request("/api/v1/observatory", { accept: "text/markdown" });
  assert.equal(apiMarkdown.status, 200);
  assert.equal(await apiMarkdown.text(), markdownText);
  assert.equal((await request("/api/v1/observatory", {}, "HEAD")).status, 200);
  assert.equal((await request("/api/v1/observatory", {}, "OPTIONS")).status, 204);
  assert.equal((await request("/api/v1/observatory?format=bad")).status, 400);
  assert.equal((await request("/api/v1/observatory", { accept: "image/png" })).status, 406);
});

test("practice observatory is discoverable across the knowledge hub and canonical corpus", async () => {
  const homepage = await (await request("/")).text();
  assert.match(homepage, /href="\/observatory"/);
  assert.match(homepage, /Practice observatory/);
  assert.match(homepage, /31/);
  assert.match(homepage, /current developments/);

  const contentContract = (await (await request("/api/v1/content-contract")).json()).item;
  assert.ok(contentContract.page_assignments.some((assignment) => assignment.path === "/observatory" && assignment.primary_mode === "evidence-synthesis"));

  const sitemap = await (await request("/sitemap.xml")).text();
  assert.match(sitemap, /<loc>[^<]*\/observatory<\/loc>/);
  assert.equal((sitemap.match(/<url>/g) ?? []).length, 597);

  const llms = await (await request("/llms.txt")).text();
  for (const path of ["/observatory", "/observatory.md", "/api/v1/observatory"]) assert.ok(llms.includes(path), path);
  const instructions = await (await request("/AGENTS.md")).text();
  assert.match(instructions, /Use \/observatory for a dated view of current official developments/);
  const catalog = await (await request("/.well-known/api-catalog")).json();
  assert.ok(JSON.stringify(catalog).includes("/api/v1/observatory"));

  const search = await (await request("/api/v1/search?q=current%20accounting-agent%20developments")).json();
  assert.ok(search.items.some((item) => item.canonical_path === "/observatory"));

  const metadata = await (await request("/api/v1/meta")).json();
  assert.equal(metadata.record_counts.practice_observatories, 1);
  assert.equal(metadata.record_counts.practice_observatory_records, 31);
  assert.equal(metadata.record_counts.practice_observatory_lanes, 5);
  assert.equal(metadata.record_counts.practice_observatory_profiled_records, 7);
  assert.match(metadata.links.practice_observatory_api, /\/api\/v1\/observatory$/);

  const corpus = await (await request("/downloads/corpus.json")).json();
  assert.equal(corpus.counts.practice_observatories, 1);
  assert.equal(corpus.counts.practice_observatory_records, 31);
  assert.equal(corpus.practice_observatory.id, "accounting-agents-practice-observatory");
  assert.deepEqual(corpus.practice_observatory, (await (await request("/api/v1/observatory")).json()).item);

  const openapi = await (await request("/openapi.json")).json();
  assert.ok(openapi.paths["/api/v1/observatory"]);
  assert.equal(openapi.components.schemas.PracticeObservatory.properties.id.const, "accounting-agents-practice-observatory");
  assert.equal(openapi.components.schemas.PracticeObservatory.properties.lanes.minItems, 5);
});

test("practice observatory stays responsive and documents the knowledge-hub boundary", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.observatory-controls[\s\S]*grid-template-columns:/);
  assert.match(css, /\.observatory-details > summary:focus-visible[\s\S]*outline:/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.observatory-details dl > div[\s\S]*grid-template-columns:\s*1fr/);

  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  assert.match(readme, /practice observatory/);
  assert.match(readme, /dated, filterable index of 31 catalog records/);
  assert.match(readme, /not a ranking, adoption dashboard, or automatic news monitor/);
});
