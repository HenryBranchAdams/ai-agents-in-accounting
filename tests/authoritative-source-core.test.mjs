import assert from "node:assert/strict";
import test from "node:test";

const workerPromise = (async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("authoritative-source-core-test", `${process.pid}-${Date.now()}`);
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

const coreIds = [
  "src_0n4x3cf",
  "src_0vf7hhg",
  "src_1l45nk0",
  "src_075usnq",
  "src_1v1zwt5",
  "src_10b9y2x",
];

test("six high-use authoritative sources have bounded relationship profiles", async () => {
  const catalog = await (await request("/downloads/resources.json")).json();
  const byId = new Map(catalog.items.map((source) => [source.id, source]));

  for (const id of coreIds) {
    const source = byId.get(id);
    assert.ok(source, id);
    assert.equal(source.curation.profile_status, "relationship-profiled", id);
    assert.equal(source.curation.review_status, "maintainer-review-pending", id);
    assert.equal(source.relationship_profile.evidence_tier, "tier-1-authority", id);
    assert.equal(source.relationship_profile.importance, "core", id);
    assert.ok(source.relationship_profile.questions.length >= 2, id);
    assert.ok(source.relationship_profile.claims.length >= 2, id);
    assert.ok(source.relationship_profile.contrary_claims.length >= 1, id);
    assert.ok(source.relationship_profile.workflow_ids.length >= 3, id);
    assert.equal(source.relationship_profile.review_status, "maintainer-review-pending", id);
    assert.equal(source.relationship_profile.accounting_example.evidence_classification, "synthetic-example", id);
    assert.equal(source.source_rights.status, "unknown", id);
    assert.equal(source.source_rights.full_text_stored, false, id);
    assert.equal(source.verified_at, "2026-08-27", id);
    assert.match(source.curation.next_review_at, /^202[67]-\d{2}-\d{2}$/, id);
  }
});

test("current, amended, and superseded states remain explicit", async () => {
  const get = async (id) => (await (await request(`/api/v1/resources/${id}`)).json()).item;
  const evidence = await get("src_0vf7hhg");
  assert.equal(evidence.curation.lifecycle, "current");
  assert.match(evidence.curation.publication_status, /paragraph \.10A.*2025 implementation guidance/i);

  for (const id of ["src_1l45nk0", "src_075usnq"]) {
    const source = await get(id);
    assert.equal(source.curation.lifecycle, "amended", id);
    assert.match(source.curation.publication_status, /effective 2026-12-15/i, id);
    assert.equal(source.curation.next_review_at, "2026-11-27", id);
  }

  const coso = await get("src_1v1zwt5");
  assert.equal(coso.curation.lifecycle, "current");
  assert.match(coso.curation.publication_status, /1992 framework was superseded in 2014/i);
  assert.match(coso.relationship_profile.limitations.join(" "), /predecessor is not a separate record/i);

  const aicpa = await get("src_10b9y2x");
  assert.match(aicpa.curation.publication_status, /Continuously updated/i);
  assert.match(aicpa.curation.transfer_limit, /membership.*role.*service.*jurisdiction/i);
});

test("human, Markdown, and JSON surfaces preserve each core profile", async () => {
  for (const id of coreIds) {
    const api = (await (await request(`/api/v1/resources/${id}`)).json()).item;
    const html = await (await request(`/resources/${id}`, { accept: "text/html" })).text();
    assert.match(html, /Questions, claims, and relationships/, id);
    assert.match(html, /Maintainer review pending/, id);
    assert.ok(html.includes(api.relationship_profile.questions[0]), `${id} first question`);
    assert.ok(html.includes(api.relationship_profile.claims[0].text), `${id} first claim`);
    assert.ok(html.includes(api.curation.publication_status), `${id} publication status`);

    const markdown = await request(`/api/v1/resources/${id}?format=markdown`);
    assert.equal(markdown.status, 200, id);
    const markdownText = await markdown.text();
    assert.ok(markdownText.includes(api.relationship_profile.claims[0].text), `${id} Markdown claim`);
    assert.ok(markdownText.includes(api.curation.transfer_limit), `${id} Markdown transfer limit`);
    assert.match(markdownText, /Source license: unknown; check the publisher's terms/, id);
  }
});

test("authoritative profiles are counted and discoverable without a dashboard", async () => {
  const taxonomy = await (await request("/api/v1/taxonomy")).json();
  assert.equal(taxonomy.source_relationship_profile_count, 14);
  assert.equal(taxonomy.source_evidence_tiers.find((tier) => tier.value === "tier-1-authority").record_count, 7);

  const meta = await (await request("/api/v1/meta")).json();
  assert.equal(meta.record_counts.source_relationship_profiles, 14);
  const corpus = await (await request("/downloads/corpus.json")).json();
  assert.equal(corpus.counts.source_relationship_profiles, 14);

  const amendmentSearch = await (await request("/api/v1/search?q=approved%20amendments%202026-12-15")).json();
  for (const id of ["src_1l45nk0", "src_075usnq"]) {
    assert.ok(amendmentSearch.items.some((item) => item.id === id), id);
  }

  const library = await (await request("/resources", { accept: "text/html" })).text();
  assert.match(library, /14<!-- --> relationship-profiled sources include six core authorities/);
  assert.doesNotMatch(library, /freshness dashboard/i);
});
