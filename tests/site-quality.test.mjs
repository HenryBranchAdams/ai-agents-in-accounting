import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

const siteOrigin = "https://accounting-agents.madebyhenry.chatgpt.site";

const workerPromise = (async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("quality-test", `${process.pid}-${Date.now()}`);
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

function localPath(value) {
  const url = new URL(value, siteOrigin);
  return `${url.pathname}${url.search}`;
}

function attributes(html, element, attribute) {
  const matches = html.matchAll(new RegExp(`<${element}\\b[^>]*\\b${attribute}=["']([^"']+)["'][^>]*>`, "gi"));
  return [...matches].map((match) => match[1]);
}

async function mapInBatches(items, batchSize, task) {
  const results = [];
  for (let index = 0; index < items.length; index += batchSize) {
    results.push(...await Promise.all(items.slice(index, index + batchSize).map(task)));
  }
  return results;
}

test("every canonical sitemap page renders a complete semantic document", async () => {
  const sitemapResponse = await request("/sitemap.xml");
  assert.equal(sitemapResponse.status, 200);
  const sitemap = await sitemapResponse.text();
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.equal(locations.length, 597);
  assert.equal(new Set(locations).size, locations.length);

  await mapInBatches(locations, 20, async (location) => {
    const path = localPath(location);
    const response = await request(path, { accept: "text/html" });
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i, path);
    const html = await response.text();
    assert.match(html, /<title>[^<]+<\/title>/i, `${path} title`);
    assert.match(html, /<main\b[^>]*id=["']main-content["']/i, `${path} main landmark`);
    assert.equal((html.match(/<h1\b/gi) ?? []).length, 1, `${path} h1 count`);
    assert.doesNotMatch(html, /(?:Internal Server Error|Application error|vite-error-overlay|nextjs-portal)/i, path);

    const ids = attributes(html, "[a-z][a-z0-9-]*", "id");
    assert.equal(new Set(ids).size, ids.length, `${path} duplicate element IDs`);
  });
});

test("primary documentation links and fragment targets resolve", async () => {
  const primaryPages = [
    "/", "/start-here", "/course", "/fundamentals", "/lifecycle", "/authority", "/workflows", "/controls",
    "/sensitive-actions", "/evidence-assurance", "/security-identity", "/architecture",
    "/ecosystem", "/evaluation", "/pilot", "/operations", "/templates", "/glossary",
    "/resources", "/reading-room", "/observatory", "/machine-access", "/packs", "/bench", "/spec",
    "/methodology", "/changes", "/open-source", "/content-contract", "/control-model", "/coverage",
  ];
  const targets = new Map();

  for (const sourcePath of primaryPages) {
    const response = await request(sourcePath, { accept: "text/html" });
    const html = await response.text();
    for (const href of attributes(html, "a", "href")) {
      if (!href.startsWith("/") || href.startsWith("//")) continue;
      const url = new URL(href, siteOrigin);
      if (/\.(?:zip|json|md|xml|txt)$/i.test(url.pathname)) continue;
      const key = `${url.pathname}${url.search}`;
      const fragments = targets.get(key) ?? new Set();
      if (url.hash) fragments.add(decodeURIComponent(url.hash.slice(1)));
      targets.set(key, fragments);
    }
  }

  await mapInBatches([...targets], 20, async ([path, fragments]) => {
    const response = await request(path, { accept: "text/html" });
    if (response.status === 404) {
      const pathname = new URL(path, siteOrigin).pathname;
      await assert.doesNotReject(access(new URL(`../public${pathname}`, import.meta.url)), path);
      return;
    }
    assert.equal(response.status, 200, path);
    const html = await response.text();
    const ids = new Set(attributes(html, "[a-z][a-z0-9-]*", "id"));
    for (const fragment of fragments) assert.ok(ids.has(fragment), `${path} missing #${fragment}`);
  });
});

test("all published local images exist and include useful alternative text", async () => {
  const sitemap = await (await request("/sitemap.xml")).text();
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const images = new Map();

  await mapInBatches(locations, 20, async (location) => {
    const path = localPath(location);
    const html = await (await request(path, { accept: "text/html" })).text();
    for (const tag of html.matchAll(/<img\b[^>]*>/gi)) {
      const src = tag[0].match(/\bsrc=["']([^"']+)["']/i)?.[1];
      const alt = tag[0].match(/\balt=["']([^"']*)["']/i)?.[1];
      assert.ok(src, `${path} image source`);
      assert.ok(alt?.trim(), `${path} image alternative`);
      if (src?.startsWith("/")) images.set(src, path);
    }
  });

  assert.ok(images.size >= 13);
  for (const [src, page] of images) {
    await assert.doesNotReject(
      access(new URL(`../public${src}`, import.meta.url)),
      `${page} references missing ${src}`,
    );
  }
});

test("public API surfaces honor HTTP, CORS, and caching contracts", async () => {
  const endpoints = [
    "/api/v1/meta", "/api/v1/taxonomy", "/api/v1/resources?limit=1",
    "/api/v1/workflows?limit=1", "/api/v1/authority-levels?limit=1",
    "/api/v1/sensitive-actions?limit=1", "/api/v1/controls?limit=1",
    "/api/v1/templates?limit=1", "/api/v1/glossary?limit=1",
    "/api/v1/packs?limit=1", "/api/v1/benchmark?limit=1",
    "/api/v1/ecosystem?limit=1", "/api/v1/search?q=accounting&limit=1",
    "/api/v1/content-contract", "/api/v1/control-model", "/api/v1/coverage", "/api/v1/start-here", "/api/v1/course", "/api/v1/observatory",
  ];

  for (const endpoint of endpoints) {
    const get = await request(endpoint);
    assert.equal(get.status, 200, `GET ${endpoint}`);
    assert.equal(get.headers.get("access-control-allow-origin"), "*", endpoint);
    assert.equal(get.headers.get("x-content-type-options"), "nosniff", endpoint);
    assert.ok(get.headers.get("etag"), endpoint);
    assert.ok(get.headers.get("last-modified"), endpoint);

    const head = await request(endpoint, {}, "HEAD");
    assert.equal(head.status, 200, `HEAD ${endpoint}`);
    assert.equal(head.headers.get("content-type"), get.headers.get("content-type"), `HEAD ${endpoint} content type`);

    const options = await request(endpoint, {}, "OPTIONS");
    assert.equal(options.status, 204, `OPTIONS ${endpoint}`);
    assert.match(options.headers.get("allow") ?? "", /GET, HEAD, OPTIONS/, endpoint);
    assert.equal(options.headers.get("access-control-allow-origin"), "*", endpoint);
  }

  const initial = await request("/api/v1/meta");
  const unchangedByEtag = await request("/api/v1/meta", { "if-none-match": initial.headers.get("etag") });
  assert.equal(unchangedByEtag.status, 304);
  const unchangedByDate = await request("/api/v1/meta", { "if-modified-since": initial.headers.get("last-modified") });
  assert.equal(unchangedByDate.status, 304);
});

test("API filters, negotiation, pagination, and problem details cover edge cases", async () => {
  const markdown = await request("/api/v1/resources?format=markdown&limit=1", { accept: "application/json" });
  assert.match(markdown.headers.get("content-type") ?? "", /^text\/markdown\b/i);

  const browserNavigation = await request("/api/v1/resources?limit=1", { accept: "text/html,application/xhtml+xml" });
  assert.equal(browserNavigation.status, 200);
  assert.match(browserNavigation.headers.get("content-type") ?? "", /^application\/json\b/i);

  const filtered = await request(`/api/v1/resources?topic=${encodeURIComponent("Audit and assurance")}&kind=${encodeURIComponent("Research paper")}&limit=200`);
  const filteredPayload = await filtered.json();
  assert.ok(filteredPayload.items.length > 0);
  assert.ok(filteredPayload.items.every((item) => item.topic === "Audit and assurance" && item.source_type === "Research paper"));

  const industryFiltered = await request("/api/v1/resources?industry=insurance&time_role=foundational&limit=200");
  const industryPayload = await industryFiltered.json();
  assert.ok(industryPayload.items.length > 0);
  assert.deepEqual(industryPayload.filters, {
    q: null,
    topic: null,
    kind: null,
    industry: "insurance",
    time_role: "foundational",
  });
  assert.ok(industryPayload.items.every((item) => (
    item.curation.applicability.includes("insurance")
    && item.curation.temporal_role === "foundational"
  )));

  const first = await request("/api/v1/search?q=agent&limit=3");
  const firstPayload = await first.json();
  assert.equal(firstPayload.items.length, 3);
  assert.ok(firstPayload.next_cursor);
  const second = await request(`/api/v1/search?q=agent&limit=3&cursor=${encodeURIComponent(firstPayload.next_cursor)}`);
  const secondPayload = await second.json();
  assert.equal(firstPayload.items.some((item) => secondPayload.items.some((next) => next.id === item.id && next.record_type === item.record_type)), false);

  for (const [path, status, title] of [
    ["/api/v1/search", 400, "Query required"],
    ["/api/v1/search?q=agent&type=unknown", 400, "Invalid record type"],
    ["/api/v1/resources?topic=unknown", 400, "Invalid topic"],
    ["/api/v1/resources?kind=unknown", 400, "Invalid source type"],
    ["/api/v1/resources?industry=unknown", 400, "Invalid industry"],
    ["/api/v1/resources?time_role=unknown", 400, "Invalid time role"],
    ["/api/v1/workflows?limit=0", 400, "Invalid limit"],
    ["/api/v1/resources/src_missing", 404, "Resource not found"],
    ["/api/v1/workflows/wf-missing", 404, "Workflow not found"],
    ["/api/v1/packs/missing", 404, "Pack not found"],
  ]) {
    const response = await request(path);
    assert.equal(response.status, status, path);
    assert.match(response.headers.get("content-type") ?? "", /^application\/problem\+json\b/i, path);
    const problem = await response.json();
    assert.equal(problem.status, status, path);
    assert.equal(problem.title, title, path);
    assert.ok(problem.detail, path);
    assert.match(problem.type, /^https:\/\//, path);
  }
});

test("source records are unique, complete, rights-aware, and provenance-linked", async () => {
  const catalog = await (await request("/downloads/resources.json")).json();
  assert.equal(catalog.items.length, 489);
  assert.equal(new Set(catalog.items.map((item) => item.id)).size, catalog.items.length);
  assert.equal(new Set(catalog.items.map((item) => item.canonical_source_url)).size, catalog.items.length);

  for (const source of catalog.items) {
    for (const field of ["id", "topic", "source_type", "owner", "title", "published_or_status", "jurisdiction", "access", "summary", "reviewed_at", "canonical_source_url"]) {
      assert.equal(typeof source[field], "string", `${source.id}.${field}`);
      assert.ok(source[field].trim(), `${source.id}.${field}`);
    }
    assert.match(source.id, /^src_[a-z0-9]+$/);
    assert.equal(new URL(source.canonical_source_url).protocol, "https:", source.id);
    assert.equal(source.provenance.source_url, source.canonical_source_url, source.id);
    assert.equal(source.source_rights.full_text_stored, false, source.id);
    assert.equal(source.metadata_rights.license_id, "CC0-1.0", source.id);
    assert.equal(source.annotation_rights.license_id, "CC-BY-4.0", source.id);
    assert.equal(source.catalog_url, `${siteOrigin}/resources/${source.id}`, source.id);
    assert.equal(source.record_url, `${siteOrigin}/api/v1/resources/${source.id}`, source.id);
  }

  const newSourceIds = new Set([
    "src_agenticaudit", "src_auditflow26", "src_finagentbench", "src_nocodeacct25",
    "src_netsuite26ai", "src_sageclose25", "src_digitsagents25", "src_prophixagents25",
    "src_ifrsconcept18", "src_ifrsmc2025", "src_ifrss12023", "src_ifrss22023",
    "src_ifrsstax24", "src_secsab0099", "src_secsab0108", "src_irspub1075",
    "src_oecdtax30", "src_fasbtax2025", "src_xbrloim10", "src_xbrltaxpkg",
    "src_iso20022", "src_datasheets21", "src_modelcards19", "src_ibmfactsheets",
    "src_crfmfoundation", "src_react2023", "src_toolformer23", "src_reflexion23",
    "src_mllifecycle", "src_trustautomation", "src_humanaiguides", "src_ncuai2026",
    "src_banktprm23", "src_naicaibull", "src_ifrs17impl", "src_ioscoai2021",
    "src_ioscoai2025", "src_hipaaba", "src_cmsmcref", "src_aicpacon25",
    "src_ricsai2025", "src_asu201815", "src_focusv14", "src_fercacct",
    "src_doeeai2024", "src_nistmfg2", "src_socsupply", "src_pcidss401",
    "src_irsretail", "src_cfr200grants", "src_gasb0096", "src_asu202308",
    "src_secsab122", "src_taxpraben26", "src_workiva26agents", "src_irsopr26ai",
  ]);
  assert.equal(newSourceIds.size, 56);
  for (const source of catalog.items.filter((item) => newSourceIds.has(item.id))) {
    assert.notEqual(source.curation.profile_status, "unclassified", source.id);
    assert.equal(source.curation.review_status, "maintainer-review-pending", source.id);
    assert.ok(source.curation.applicability.length > 0, source.id);
    assert.ok(source.curation.temporal_role, source.id);
    assert.ok(source.curation.lifecycle, source.id);
    assert.ok(source.curation.method, source.id);
    assert.ok(source.curation.transfer_limit, source.id);
    assert.match(source.curation.next_review_at, /^\d{4}-\d{2}-\d{2}$/, source.id);
  }
});

test("source curation taxonomy and pilot relationships stay internally consistent", async () => {
  const catalog = await (await request("/downloads/resources.json")).json();
  const taxonomy = await (await request("/api/v1/taxonomy")).json();
  const sourceIds = new Set(catalog.items.map((item) => item.id));
  const industryIds = new Set(taxonomy.industries.map((item) => item.value));
  const timeRoleIds = new Set(taxonomy.time_roles.map((item) => item.value));
  const lifecycleIds = new Set(taxonomy.lifecycle_states.map((item) => item.value));
  const evidenceTierIds = new Set(taxonomy.source_evidence_tiers.map((item) => item.value));
  const workflowIds = new Set(taxonomy.workflows.map((item) => item.value));
  const evidenceClassificationIds = new Set([
    "authoritative-requirement", "official-guidance", "editorial-recommendation",
    "implementation-pattern", "synthetic-example", "empirical-evidence", "unresolved-question",
  ]);

  assert.equal(industryIds.size, 12);
  assert.equal(timeRoleIds.size, 4);
  assert.equal(lifecycleIds.size, 6);
  assert.equal(evidenceTierIds.size, 5);
  assert.equal(taxonomy.source_relationship_profile_count, 14);
  assert.equal(taxonomy.source_curation_contract.status, "pilot");
  assert.equal(taxonomy.source_curation_contract.curation_review_status, "maintainer-review-pending");
  assert.equal(taxonomy.source_curation_contract.relationship_profile_review_status, "maintainer-review-pending");
  assert.equal(taxonomy.source_curation_contract.unclassified_records_are_not_assumed_general, true);

  const profiled = catalog.items.filter((item) => item.relationship_profile);
  assert.equal(profiled.length, 14);
  for (const source of catalog.items) {
    for (const industry of source.curation.applicability) assert.ok(industryIds.has(industry), `${source.id} -> ${industry}`);
    if (source.curation.temporal_role) assert.ok(timeRoleIds.has(source.curation.temporal_role), source.id);
    if (source.curation.lifecycle) assert.ok(lifecycleIds.has(source.curation.lifecycle), source.id);
  }
  for (const source of profiled) {
    const profile = source.relationship_profile;
    assert.ok(evidenceTierIds.has(profile.evidence_tier), source.id);
    assert.ok(profile.questions.length > 0, source.id);
    assert.ok(profile.claims.length > 0, source.id);
    assert.equal(new Set(profile.claims.map((claim) => claim.id)).size, profile.claims.length, source.id);
    for (const relatedId of profile.related_source_ids) {
      assert.ok(sourceIds.has(relatedId), `${source.id} -> ${relatedId}`);
      assert.notEqual(relatedId, source.id, `${source.id} related source self-reference`);
    }
    for (const claim of profile.contrary_claims) {
      assert.ok(evidenceClassificationIds.has(claim.evidence_classification), `${source.id} contrary evidence classification`);
      for (const relatedId of claim.source_ids) {
        assert.ok(sourceIds.has(relatedId), `${source.id} -> ${relatedId}`);
        assert.notEqual(relatedId, source.id, `${source.id} contrary evidence self-reference`);
      }
    }
    for (const workflowId of profile.workflow_ids) assert.ok(workflowIds.has(workflowId), `${source.id} -> ${workflowId}`);
    assert.equal(profile.review_status, "maintainer-review-pending", source.id);
    assert.equal(profile.accounting_example.evidence_classification, "synthetic-example", source.id);
  }
});

test("all corpus relationships resolve to canonical records", async () => {
  const corpus = await (await request("/downloads/corpus.json")).json();
  const readingRoom = await (await request("/downloads/reading-room.json")).json();
  const ids = (items) => new Set(items.map((item) => item.id));
  const sourceIds = ids(corpus.sources);
  const workflowIds = ids(corpus.workflows);
  const packIds = ids(corpus.workflow_packs);
  const collections = [
    corpus.process_families, corpus.workflows, corpus.authority_levels, corpus.sensitive_actions,
    corpus.control_patterns, corpus.templates, corpus.glossary, corpus.sources,
    corpus.workflow_packs, corpus.benchmark.cases, corpus.ecosystem_layers,
  ];

  for (const collection of collections) {
    assert.equal(ids(collection).size, collection.length, "duplicate record ID in collection");
    for (const record of collection) {
      for (const sourceId of record.source_ids ?? []) assert.ok(sourceIds.has(sourceId), `${record.id} -> ${sourceId}`);
    }
  }

  for (const workflow of corpus.workflows) {
    assert.deepEqual(workflow.provenance.source_basis, workflow.source_ids, workflow.id);
    assert.deepEqual(workflow.source_links.map((link) => link.source_id), workflow.source_ids, workflow.id);
  }
  for (const pack of corpus.workflow_packs) {
    for (const workflowId of pack.workflow_ids) assert.ok(workflowIds.has(workflowId), `${pack.id} -> ${workflowId}`);
  }
  for (const benchmarkCase of corpus.benchmark.cases) {
    assert.ok(packIds.has(benchmarkCase.pack_id), `${benchmarkCase.id} -> ${benchmarkCase.pack_id}`);
    assert.ok(benchmarkCase.assertions.some((item) => item.id === "NO_EXECUTION" && item.severity === "authority_gate"), benchmarkCase.id);
    assert.equal(benchmarkCase.expected.executed_actions_must_be_empty, true, benchmarkCase.id);
  }

  const readingIds = readingRoom.sections.flatMap((section) => section.source_ids);
  assert.equal(readingIds.length, readingRoom.total_records);
  assert.equal(new Set(readingIds).size, readingIds.length);
  for (const sourceId of readingIds) assert.ok(sourceIds.has(sourceId), `reading room -> ${sourceId}`);
});

test("representative pages publish complete discovery and social metadata", async () => {
  for (const path of ["/", "/reading-room", "/resources/src_ifrs15a", "/workflows/record-to-report/wf-r2r-journal-entry", "/packs/bank-reconciliation"]) {
    const html = await (await request(path, { accept: "text/html" })).text();
    assert.match(html, /<meta[^>]+name=["']description["'][^>]+content=["'][^"']+["']/i, `${path} description`);
    assert.match(html, /<meta[^>]+property=["']og:title["'][^>]+content=["'][^"']+["']/i, `${path} og:title`);
    assert.match(html, /<meta[^>]+property=["']og:description["'][^>]+content=["'][^"']+["']/i, `${path} og:description`);
    assert.match(html, /<meta[^>]+name=["']twitter:card["'][^>]+content=["']summary(?:_large_image)?["']/i, `${path} twitter card`);
    assert.match(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']https:\/\/[^"']+["']/i, `${path} canonical`);
    assert.match(html, /<link[^>]+rel=["']api-catalog["']/i, `${path} API discovery`);
    assert.match(html, /<link[^>]+rel=["']service-desc["']/i, `${path} OpenAPI discovery`);
  }
});
