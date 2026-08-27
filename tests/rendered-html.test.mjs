import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

const workerPromise = (async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
})();

async function request(path, headers = {}, method = "GET") {
  const worker = await workerPromise;
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers, method }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

function assertSchema(value, schema, root, path = "value") {
  if (schema.$ref) {
    const segments = schema.$ref.replace(/^#\//, "").split("/");
    const resolved = segments.reduce((current, segment) => current?.[segment], root);
    assert.ok(resolved, `${path} has unresolved schema reference ${schema.$ref}`);
    assertSchema(value, resolved, root, path);
    return;
  }

  if (schema.oneOf) {
    const matches = schema.oneOf.filter((candidate) => {
      try {
        assertSchema(value, candidate, root, path);
        return true;
      } catch {
        return false;
      }
    });
    assert.equal(matches.length, 1, `${path} should match exactly one schema`);
    return;
  }

  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  if (types.length) {
    const actualMatches = types.some((type) => {
      if (type === "null") return value === null;
      if (type === "array") return Array.isArray(value);
      if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
      if (type === "integer") return Number.isInteger(value);
      return typeof value === type;
    });
    assert.ok(actualMatches, `${path} should have type ${types.join(" or ")}`);
  }

  if (schema.const !== undefined) assert.deepEqual(value, schema.const, `${path} const`);
  if (schema.enum) assert.ok(schema.enum.includes(value), `${path} enum`);
  if (schema.pattern && typeof value === "string") assert.match(value, new RegExp(schema.pattern), path);

  if (schema.type === "array" && Array.isArray(value) && schema.items) {
    value.forEach((item, index) => assertSchema(item, schema.items, root, `${path}[${index}]`));
  }

  if (schema.type === "object" && value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const required of schema.required ?? []) {
      assert.ok(Object.hasOwn(value, required), `${path} missing required property ${required}`);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        assert.ok(Object.hasOwn(schema.properties ?? {}, key), `${path} has undocumented property ${key}`);
      }
    }
    for (const [key, propertySchema] of Object.entries(schema.properties ?? {})) {
      if (Object.hasOwn(value, key)) assertSchema(value[key], propertySchema, root, `${path}.${key}`);
    }
  }
}

test("renders development preview metadata", async () => {
  const response = await request("/", { accept: "text/html" });

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), developmentPreviewMeta);
});

test("publishes agent discovery and Markdown context", async () => {
  const discovery = await request("/llms.txt");
  assert.equal(discovery.status, 200);
  assert.match(discovery.headers.get("content-type") ?? "", /^text\/plain\b/i);
  const discoveryText = await discovery.text();
  assert.match(discoveryText, /\/agent-context\.md/);
  assert.match(discoveryText, /\/downloads\/context-bundle\.md/);
  assert.match(discoveryText, /\/reading-room\.md/);
  assert.match(discoveryText, /\/downloads\/reading-room\.json/);
  assert.match(discoveryText, /\/AGENTS\.md/);
  assert.match(discoveryText, /\/ecosystem\.md/);
  assert.doesNotMatch(discoveryText, /llms-full/);

  const instructions = await request("/AGENTS.md");
  assert.equal(instructions.status, 200);
  assert.match(instructions.headers.get("content-type") ?? "", /^text\/markdown\b/i);
  assert.match(await instructions.text(), /Coverage does not grant execution authority/);

  const ecosystem = await request("/ecosystem.md");
  assert.equal(ecosystem.status, 200);
  assert.match(ecosystem.headers.get("content-type") ?? "", /^text\/markdown\b/i);
  assert.match(await ecosystem.text(), /Agent2Agent Protocol/);

  const context = await request("/agent-context.md");
  assert.equal(context.status, 200);
  assert.match(context.headers.get("content-type") ?? "", /^text\/markdown\b/i);
  assert.match(await context.text(), /Agents may prepare accounting work/);

  const bundle = await request("/downloads/context-bundle.md");
  assert.equal(bundle.status, 200);
  assert.match(bundle.headers.get("content-type") ?? "", /^text\/markdown\b/i);
  assert.match(await bundle.text(), /Complete source library/);
});

test("serves a versioned, filterable resource API", async () => {
  const response = await request("/api/v1/resources?q=audit&limit=200", {
    accept: "application/json",
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.match(response.headers.get("access-control-expose-headers") ?? "", /X-Next-Page/i);
  assert.ok(response.headers.get("etag"));

  const payload = await response.json();
  assert.equal(payload.schema_version, "1.0");
  assert.equal(payload.catalog_version, "2026-08-27.1");
  assert.ok(payload.items.length > 0);
  assert.ok(payload.items.every((item) => item.id.startsWith("src_")));
  assert.ok(payload.items.every((item) => item.source_license === "unknown"));
  assert.ok(payload.items.every((item) => item.source_rights.status === "unknown"));
  assert.ok(payload.items.every((item) => item.source_rights.full_text_stored === false));
  assert.ok(payload.items.every((item) => item.metadata_rights.license_id === "CC0-1.0"));
  assert.ok(payload.items.every((item) => item.annotation_rights.license_id === "CC-BY-4.0"));
  assert.ok(payload.items.every((item) => item.provenance.annotation_by === "Accounting Agents"));
  assert.equal(new Set(payload.items.map((item) => item.id)).size, payload.items.length);
});

test("filters research papers and thought pieces as distinct source types", async () => {
  for (const [kind, minimum] of [["Research paper", 20], ["Thought piece", 5]]) {
    const response = await request(`/api/v1/resources?kind=${encodeURIComponent(kind)}&limit=200`);
    assert.equal(response.status, 200, kind);
    const payload = await response.json();
    assert.ok(payload.items.length >= minimum, kind);
    assert.ok(payload.items.every((item) => item.source_type === kind), kind);
  }
});

test("uses stable cursor pagination without overlap", async () => {
  const first = await request("/api/v1/resources?limit=2");
  const firstPayload = await first.json();
  assert.equal(firstPayload.items.length, 2);
  assert.ok(firstPayload.next_cursor);

  const second = await request(`/api/v1/resources?limit=2&cursor=${firstPayload.next_cursor}`);
  const secondPayload = await second.json();
  assert.equal(secondPayload.items.length, 2);
  assert.equal(
    firstPayload.items.some((item) => secondPayload.items.some((next) => next.id === item.id)),
    false,
  );
});

test("negotiates Markdown and returns structured errors", async () => {
  const markdown = await request("/api/v1/resources?limit=2", {
    accept: "text/markdown",
  });
  assert.equal(markdown.status, 200);
  assert.match(markdown.headers.get("content-type") ?? "", /^text\/markdown\b/i);
  assert.match(await markdown.text(), /Source type:/);

  const jsonPreferred = await request("/api/v1/workflows?limit=1", {
    accept: "application/json, text/markdown;q=0",
  });
  assert.match(jsonPreferred.headers.get("content-type") ?? "", /^application\/json\b/i);
  assert.equal((await jsonPreferred.json()).items.length, 1);

  const unacceptable = await request("/api/v1/resources?limit=1", { accept: "application/xml" });
  assert.equal(unacceptable.status, 406);
  assert.match(unacceptable.headers.get("content-type") ?? "", /^application\/problem\+json\b/i);

  const invalid = await request("/api/v1/resources?limit=201");
  assert.equal(invalid.status, 400);
  assert.match(invalid.headers.get("content-type") ?? "", /^application\/problem\+json\b/i);

  const invalidCursor = await request("/api/v1/resources?cursor=src_missing");
  assert.equal(invalidCursor.status, 400);
});

test("supports cache validators and complete snapshots", async () => {
  const initial = await request("/api/v1/resources?limit=1");
  const etag = initial.headers.get("etag");
  const lastModified = initial.headers.get("last-modified");
  assert.ok(etag);
  assert.ok(lastModified);

  const unchanged = await request("/api/v1/resources?limit=1", { "if-none-match": etag });
  assert.equal(unchanged.status, 304);

  const snapshot = await request("/downloads/resources.json");
  assert.equal(snapshot.status, 200);
  const catalog = await snapshot.json();
  assert.equal(catalog.total_records, 489);
  assert.equal(new Set(catalog.items.map((item) => item.id)).size, 489);
  assert.ok(catalog.items.some((item) => item.id === "src_ifrs15a"));
  assert.ok(catalog.items.some((item) => item.id === "src_gaogb25"));
  assert.ok(catalog.items.some((item) => item.id === "src_1krui2p"));
  assert.ok(catalog.items.some((item) => item.id === "src_aaif2026"));
  assert.ok(catalog.items.some((item) => item.id === "src_agentsmd"));
  assert.ok(catalog.items.some((item) => item.id === "src_osfi26agent"));
  assert.ok(catalog.items.some((item) => item.id === "src_xbrlvalid"));
  assert.ok(catalog.items.some((item) => item.id === "src_rivianagents"));
});

test("publishes a curated reading room in semantic HTML and Markdown", async () => {
  const page = await request("/reading-room", { accept: "text/html" });
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /How to use this room/);
  assert.match(html, /Reading room coverage/);
  assert.match(html, /Judgment, reliance, and review/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /src_0hroanw/);

  const markdown = await request("/reading-room.md");
  assert.equal(markdown.status, 200);
  assert.match(markdown.headers.get("content-type") ?? "", /^text\/markdown\b/i);
  const text = await markdown.text();
  assert.match(text, /## Agent systems and evaluation/);
  assert.match(text, /## Financial-services supervision/);
  assert.match(text, /## Structured financial data/);
  assert.match(text, /Source type: Research paper/);
  assert.match(text, /Catalog record: .*\/resources\/src_1krui2p/);

  const json = await request("/downloads/reading-room.json");
  assert.equal(json.status, 200);
  const payload = await json.json();
  assert.equal(payload.total_records, 153);
  assert.equal(payload.sections.length, 20);
  assert.equal(new Set(payload.sections.flatMap((section) => section.source_ids)).size, 153);
  assert.ok(payload.sections.every((section) => section.items.length === section.source_ids.length));
});

test("gives every indexed source a canonical semantic HTML record", async () => {
  const response = await request("/resources/src_ifrs15a", { accept: "text/html" });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /IFRS 15, Revenue from Contracts with Customers/);
  assert.match(html, /Catalog record/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /"publisher":\{"@type":"Organization","name":"Accounting Agents"\}/);
  assert.match(html, /"isBasedOn":\{"@type":"CreativeWork"/);
  assert.match(html, /\/api\/v1\/resources\/src_ifrs15a/);
  assert.match(html, /Catalog updated/);
  assert.match(html, /Catalog record; curation and maintainer review not yet completed/);
  assert.doesNotMatch(html, /Maintainer-reviewed educational synthesis/);

  const unknown = await request("/resources/src_missing", { accept: "text/html" });
  assert.equal(unknown.status, 404);
});

test("renders industry and time filters plus the relationship-profile pilot", async () => {
  const library = await request("/resources?industry=insurance&time_role=foundational", { accept: "text/html" });
  assert.equal(library.status, 200);
  const libraryHtml = await library.text();
  assert.match(libraryHtml, />Industry</);
  assert.match(libraryHtml, />Time role</);
  assert.match(libraryHtml, /value=["']insurance["']/);
  assert.match(libraryHtml, /value=["']foundational["']/);
  assert.match(libraryHtml, /dateTime=["']2026-08-27["']/);
  assert.match(libraryHtml, />Prepared<!-- -->/);
  assert.match(libraryHtml, /Agent-prepared catalog expansion; maintainer review pending/);
  assert.doesNotMatch(libraryHtml, /Maintainer-reviewed educational synthesis/);

  const profile = await request("/resources/src_agenticaudit", { accept: "text/html" });
  assert.equal(profile.status, 200);
  const profileHtml = await profile.text();
  for (const heading of [
    "Curation profile",
    "Questions, claims, and relationships",
    "Contrary or limiting evidence",
    "Synthetic accounting example",
    "Related sources and supersession",
    "Next action",
  ]) assert.match(profileHtml, new RegExp(heading));
  assert.match(profileHtml, /Maintainer review pending/);
  assert.match(profileHtml, /agent-prepared profile is awaiting maintainer review/i);
  assert.match(profileHtml, /not independent review or assurance/i);
  assert.match(profileHtml, /Agent-prepared curation; maintainer review pending/);
  assert.match(profileHtml, /Contrary or limiting evidence[\s\S]*empirical-evidence/);
  assert.doesNotMatch(profileHtml, /Maintainer-reviewed educational synthesis/);

  const json = await (await request("/api/v1/resources/src_agenticaudit")).json();
  assert.equal(json.item.curation.profile_status, "relationship-profiled");
  assert.equal(json.item.curation.review_status, "maintainer-review-pending");
  assert.equal(json.item.relationship_profile.accounting_example.evidence_classification, "synthetic-example");
  assert.ok(json.item.relationship_profile.contrary_claims.every((claim) => claim.evidence_classification));
  assert.ok(json.item.relationship_profile.related_source_ids.length > 0);

  const markdown = await request("/api/v1/resources/src_agenticaudit?format=markdown");
  const markdownText = await markdown.text();
  for (const value of [
    "Profile status:", "Applicability note:", "Source updated:", "Relationship profile",
    "Review status:", "Contrary or limiting evidence", "Related guide paths:", "Supersedes:",
    "Synthetic example:",
  ]) assert.match(markdownText, new RegExp(value));
  assert.match(markdownText, /\[empirical-evidence; sources: src_/);
});

test("preserves the semantic accessibility contract on representative pages", async () => {
  for (const path of [
    "/",
    "/start-here",
    "/fundamentals",
    "/controls",
    "/evidence-assurance",
    "/security-identity",
    "/architecture",
    "/ecosystem",
    "/evaluation",
    "/pilot",
    "/operations",
    "/workflows",
    "/workflows/record-to-report/wf-r2r-bank-reconciliations",
    "/sensitive-actions",
    "/templates",
    "/resources/src_ifrs15a",
    "/reading-room",
    "/machine-access",
    "/packs",
    "/packs/bank-reconciliation",
    "/bench",
    "/spec",
    "/methodology",
    "/changes",
    "/open-source",
    "/content-contract",
    "/control-model",
    "/coverage",
  ]) {
    const response = await request(path, { accept: "text/html" });
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, /<html[^>]*\blang=["']en["']/i, path);
    assert.match(html, /<a[^>]*class=["']skip-link["'][^>]*href=["']#main-content["']/i, path);
    assert.match(html, /<main[^>]*\bid=["']main-content["']/i, path);
    assert.match(html, /<nav\b/i, path);
    assert.equal((html.match(/<h1\b/gi) ?? []).length, 1, `${path} should render exactly one h1`);
    assert.match(html, /aria-keyshortcuts=["'][^"']*(?:Meta\+K|Control\+K)[^"']*["']/i, path);
    assert.equal(
      (html.match(/<caption\b/gi) ?? []).length,
      (html.match(/<table\b/gi) ?? []).length,
      `${path} should give every data table a caption`,
    );
  }
});

test("uses accessible editorial headers without embedding page copy in the artwork", async () => {
  for (const [path, asset] of [
    ["/", "/images/editorial/01-ledger-topology.jpg"],
    ["/reading-room", "/images/editorial/02-evidence-archive.jpg"],
    ["/architecture", "/images/editorial/03-agent-architecture.jpg"],
    ["/controls", "/images/editorial/04-control-boundary.jpg"],
    ["/evidence-assurance", "/images/editorial/05-workpaper-review.jpg"],
    ["/resources", "/images/editorial/06-global-practice.jpg"],
    ["/ecosystem", "/images/editorial/options/19-secure-tool-interface.jpg"],
    ["/packs", "/images/editorial/options/08-reconciliation-tieout.jpg"],
    ["/bench", "/images/editorial/options/17-evaluation-rig.jpg"],
    ["/spec", "/images/editorial/options/22-machine-readable-interface.jpg"],
    ["/methodology", "/images/editorial/options/20-professional-learning.jpg"],
    ["/changes", "/images/editorial/options/21-model-lifecycle.jpg"],
    ["/open-source", "/images/editorial/options/18-provenance-chain.jpg"],
  ]) {
    const response = await request(path, { accept: "text/html" });
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.ok(html.includes(asset), `${path} should use ${asset}`);
    assert.match(html, /<figure[^>]*class=["']doc-header-art["'][^>]*>.*?<img(?=[^>]*\balt=["'][^"']+["'])[^>]*>/is, path);
  }
});

test("publishes OpenAPI, robots, and sitemap discovery", async () => {
  const openapi = await request("/openapi.json");
  assert.equal(openapi.status, 200);
  const contract = await openapi.json();
  assert.equal(contract.openapi, "3.1.0");
  assert.ok(contract.paths["/api/v1/resources"]);
  assert.ok(contract.paths["/api/v1/meta"]);
  assert.ok(contract.paths["/api/v1/taxonomy"]);
  assert.ok(contract.paths["/api/v1/search"]);
  assert.ok(contract.paths["/api/v1/packs"]);
  assert.ok(contract.paths["/api/v1/packs/{id}"]);
  assert.ok(contract.paths["/api/v1/benchmark"]);
  assert.ok(contract.paths["/api/v1/ecosystem"]);
  assert.ok(contract.paths["/api/v1/resources"].get.parameters.some((item) => item.name === "cursor"));
  for (const schemaName of [
    "Resource",
    "Taxonomy",
    "AuthorityLevel",
    "SensitiveAction",
    "ControlPattern",
    "Template",
    "GlossaryEntry",
    "Pack",
    "BenchmarkCase",
    "ReleaseManifest",
    "EcosystemLayer",
  ]) {
    const schema = contract.components.schemas[schemaName];
    assert.equal(schema.type, "object", schemaName);
    assert.equal(schema.additionalProperties, false, schemaName);
    assert.ok(Object.keys(schema.properties).length > 3, schemaName);
  }
  assert.equal(
    contract.components.schemas.Workflow.properties.actions.items.properties.authority_level.type,
    "string",
  );
  assert.ok(contract.components.schemas.Workflow.properties.source_links);
  assert.ok(contract.paths["/api/v1/workflows"].get.responses["406"]);
  for (const discoveryPath of ["/api/v1/meta", "/api/v1/taxonomy"]) {
    assert.ok(contract.paths[discoveryPath].get.responses["304"], discoveryPath);
    assert.ok(contract.paths[discoveryPath].head, `${discoveryPath} HEAD`);
    assert.ok(contract.paths[discoveryPath].options, `${discoveryPath} OPTIONS`);
  }
  for (const [path, parameterNames] of [
    ["/api/v1/workflows", ["family", "authority"]],
    ["/api/v1/resources", ["topic", "kind", "industry", "time_role"]],
  ]) {
    const headParameters = contract.paths[path].head.parameters.map((parameter) => parameter.name);
    for (const parameterName of parameterNames) assert.ok(headParameters.includes(parameterName), `${path} HEAD ${parameterName}`);
  }

  for (const [path, schemaName] of [
    ["/api/v1/workflows?limit=200", "Workflow"],
    ["/api/v1/authority-levels?limit=200", "AuthorityLevel"],
    ["/api/v1/sensitive-actions?limit=200", "SensitiveAction"],
    ["/api/v1/controls?limit=200", "ControlPattern"],
    ["/api/v1/templates?limit=200", "Template"],
    ["/api/v1/glossary?limit=200", "GlossaryEntry"],
    ["/api/v1/resources?limit=200", "Resource"],
    ["/api/v1/packs?limit=200", "Pack"],
    ["/api/v1/benchmark?limit=200", "BenchmarkCase"],
    ["/api/v1/ecosystem?limit=200", "EcosystemLayer"],
  ]) {
    const apiResponse = await request(path);
    assert.equal(apiResponse.status, 200, path);
    const apiPayload = await apiResponse.json();
    const wrapperSchema = contract.paths[path.split("?")[0]].get.responses["200"].content["application/json"].schema;
    assertSchema(apiPayload, wrapperSchema, contract, `${schemaName} collection`);
    apiPayload.items.forEach((item, index) => {
      assertSchema(item, contract.components.schemas[schemaName], contract, `${schemaName}[${index}]`);
    });
  }

  const taxonomyContractPayload = await (await request("/api/v1/taxonomy")).json();
  assertSchema(taxonomyContractPayload, contract.components.schemas.Taxonomy, contract, "Taxonomy");
  const completeResourceCatalog = await (await request("/downloads/resources.json")).json();
  completeResourceCatalog.items.forEach((item, index) => {
    assertSchema(item, contract.components.schemas.Resource, contract, `CompleteResource[${index}]`);
  });
  for (const method of ["get", "head", "options"]) {
    const idParameter = contract.paths["/api/v1/resources/{id}"][method].parameters
      .find((parameter) => parameter.name === "id");
    const idPattern = new RegExp(idParameter.schema.pattern);
    for (const item of completeResourceCatalog.items) {
      assert.match(item.id, idPattern, `${method} path parameter rejects ${item.id}`);
    }
  }
  assert.equal((await request("/api/v1/resources/src_aadp")).status, 200);

  const apiCatalog = await request("/.well-known/api-catalog");
  assert.equal(apiCatalog.status, 200);
  assert.match(apiCatalog.headers.get("content-type") ?? "", /^application\/linkset\+json\b/i);
  assert.match(apiCatalog.headers.get("link") ?? "", /rel="api-catalog"/);
  const linkset = await apiCatalog.json();
  assert.ok(linkset.linkset.some((entry) => entry.item?.some((item) => item.href.endsWith("/api/v1/resources"))));
  assert.ok(linkset.linkset.some((entry) => entry.item?.some((item) => item.href.endsWith("/api/v1/ecosystem"))));

  const apiCatalogHead = await request("/.well-known/api-catalog", {}, "HEAD");
  assert.equal(apiCatalogHead.status, 200);
  assert.match(apiCatalogHead.headers.get("link") ?? "", /rel="api-catalog"/);

  const metadata = await request("/api/v1/meta");
  assert.equal(metadata.status, 200);
  const metaPayload = await metadata.json();
  assert.equal(metaPayload.total_records, 489);
  assert.equal(metaPayload.record_counts.workflows, 60);
  assert.equal(metaPayload.record_counts.workflow_packs, 6);
  assert.equal(metaPayload.record_counts.benchmark_cases, 30);
  assert.equal(metaPayload.record_counts.ecosystem_layers, 5);
  assert.equal(metaPayload.rights.software.license_id, "MIT");
  assert.equal(metaPayload.rights.editorial_content.license_id, "CC-BY-4.0");
  assert.equal(metaPayload.rights.factual_metadata_and_synthetic_fixtures.license_id, "CC0-1.0");
  assert.match(metaPayload.links.reading_room_markdown, /\/reading-room\.md$/);
  assert.match(metaPayload.links.reading_room_json, /\/downloads\/reading-room\.json$/);
  assert.match(metaPayload.links.ecosystem, /\/api\/v1\/ecosystem$/);
  assert.match(metaPayload.links.public_agent_instructions, /\/AGENTS\.md$/);

  const taxonomy = await request("/api/v1/taxonomy");
  assert.equal(taxonomy.status, 200);
  const taxonomyPayload = await taxonomy.json();
  assert.equal(taxonomyPayload.topics.length, 8);
  assert.equal(taxonomyPayload.source_types.length, 7);
  assert.ok(taxonomyPayload.source_types.some((item) => item.value === "Research paper"));
  assert.ok(taxonomyPayload.source_types.some((item) => item.value === "Thought piece"));
  assert.equal(taxonomyPayload.process_families.length, 8);
  assert.equal(taxonomyPayload.authority_levels.length, 6);
  assert.equal(taxonomyPayload.workflows.length, 60);
  assert.equal(taxonomyPayload.workflow_packs.length, 6);
  assert.equal(taxonomyPayload.benchmark_case_types.length, 5);
  assert.equal(taxonomyPayload.ecosystem_layers.length, 5);
  assert.equal(taxonomyPayload.industries.length, 12);
  assert.ok(taxonomyPayload.industries.some((item) => item.label === "Healthcare or life sciences"));
  assert.ok(taxonomyPayload.industries.some((item) => item.label === "Construction or real estate"));
  assert.ok(taxonomyPayload.industries.some((item) => item.label === "Public sector or nonprofit"));
  assert.equal(taxonomyPayload.time_roles.length, 4);
  assert.equal(taxonomyPayload.lifecycle_states.length, 6);
  assert.equal(taxonomyPayload.source_evidence_tiers.length, 5);
  assert.equal(taxonomyPayload.source_relationship_profile_count, 8);
  assert.equal(taxonomyPayload.source_curation_contract.status, "pilot");
  assert.equal(taxonomyPayload.source_curation_contract.curation_review_status, "maintainer-review-pending");
  assert.equal(taxonomyPayload.source_curation_contract.relationship_profile_review_status, "maintainer-review-pending");
  assert.equal(taxonomyPayload.source_curation_contract.unclassified_records_are_not_assumed_general, true);
  assert.ok(taxonomyPayload.search_record_types.includes("pack"));
  assert.ok(taxonomyPayload.search_record_types.includes("ecosystem"));

  const robots = await request("/robots.txt");
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Sitemap: .*\/sitemap\.xml/);

  const sitemap = await request("/sitemap.xml");
  assert.equal(sitemap.status, 200);
  const sitemapText = await sitemap.text();
  assert.match(sitemapText, /\/machine-access/);
  assert.match(sitemapText, /\/reading-room/);
  assert.match(sitemapText, /\/packs\/bank-reconciliation/);
  assert.match(sitemapText, /\/open-source/);
  assert.match(sitemapText, /\/ecosystem/);
  assert.match(sitemapText, /<loc>[^<]*\/resources<\/loc>\s*<lastmod>2026-08-27/);
});

test("publishes the complete lifecycle and canonical workflow corpus", async () => {
  const lifecycle = await request("/lifecycle", { accept: "text/html" });
  assert.equal(lifecycle.status, 200);
  assert.match(await lifecycle.text(), /Record to report/);

  const authority = await request("/authority", { accept: "text/html" });
  assert.equal(authority.status, 200);
  const authorityHtml = await authority.text();
  assert.match(authorityHtml, /Execute after approval/);
  assert.match(authorityHtml, /Human-only/);

  const response = await request("/api/v1/workflows?limit=100");
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.total_catalog_records, 60);
  assert.equal(payload.items.length, 60);

  const requiredFields = [
    "id",
    "version",
    "family",
    "accounting_objective",
    "accountable_owner",
    "reviewer",
    "trigger",
    "scope",
    "entity_scope",
    "period_scope",
    "inputs",
    "source_ids",
    "source_links",
    "agent_procedures",
    "deterministic_checks",
    "authority_level",
    "actions",
    "human_decisions",
    "segregation_of_duties",
    "stop_conditions",
    "outputs",
    "reproducibility",
    "failure_modes",
    "recovery_actions",
    "pilot_measures",
    "production_signals",
    "reviewed_at",
    "review_status",
    "provenance",
  ];

  for (const workflow of payload.items) {
    for (const field of requiredFields) assert.ok(field in workflow, `${workflow.id} missing ${field}`);
    assert.equal(workflow.source_links.length, workflow.source_ids.length, `${workflow.id} source-link parity`);
    assert.deepEqual(
      workflow.source_links.map((link) => link.source_id),
      workflow.source_ids,
      `${workflow.id} source-link order`,
    );
    assert.ok(
      workflow.source_links.every((link) => link.claims.length > 0 && link.claims.every((claim) => claim.text.length > 20)),
      `${workflow.id} claim-level source links`,
    );
    const sourcePlacements = new Set(workflow.source_links.flatMap((link) => link.claims.map((claim) => claim.placement)));
    for (const requiredPlacement of ["objective", "evidence", "authority", "record"]) {
      assert.ok(sourcePlacements.has(requiredPlacement), `${workflow.id} missing adjacent ${requiredPlacement} citation`);
    }
    assert.ok(
      workflow.source_links.every((link) => (
        link.claims.every((claim) => ["objective", "evidence", "authority", "record"].includes(claim.placement))
      )),
      `${workflow.id} adjacent source placement`,
    );
    assert.ok(workflow.actions.some((action) => action.authority_level === "human-only"), `${workflow.id} human decision`);
    assert.ok(
      workflow.authority_level === "A0" || workflow.actions.some((action) => action.authority_level === "A1"),
      `${workflow.id} preparation action`,
    );
    assert.equal(
      new Set(workflow.actions.map((action) => `${action.authority_level}:${action.action}`)).size,
      workflow.actions.length,
      `${workflow.id} duplicate actions`,
    );
  }

  const one = payload.items[0];
  const detail = await request(`/api/v1/workflows/${one.id}`);
  assert.equal(detail.status, 200);
  assert.equal((await detail.json()).item.id, one.id);

  const journal = payload.items.find((workflow) => workflow.id === "wf-r2r-journal-entry");
  assert.ok(journal);
  assert.equal(journal.authority_level, "A3");
  assert.deepEqual(
    [...new Set(journal.actions.map((action) => action.authority_level))],
    ["A1", "A2", "A3", "human-only"],
  );

  const journalMarkdown = await request(`/api/v1/workflows/${journal.id}?format=markdown`);
  const journalMarkdownText = await journalMarkdown.text();
  for (const requiredSection of [
    "Trigger and scope",
    "Read tools",
    "Write tools",
    "Action-level authority",
    "Thresholds",
    "Segregation of duties",
    "Run record",
    "Retention",
    "Claim \\(",
    "Reviewed and provenance",
  ]) {
    assert.match(journalMarkdownText, new RegExp(requiredSection));
  }

  const detailPage = await request(`/workflows/${one.family}/${one.id}`, { accept: "text/html" });
  const detailHtml = await detailPage.text();
  assert.match(detailHtml, /href=["']\/resources\/src_[a-z0-9]+["']/i);
  assert.match(detailHtml, /rel=["']alternate["'][^>]*type=["']text\/markdown["']/i);
  assert.match(detailHtml, /application\/ld\+json/i);

  const journalPage = await request(`/workflows/${journal.family}/${journal.id}`, { accept: "text/html" });
  const journalHtml = await journalPage.text();
  for (const adjacentLabel of [
    "Sources for the accounting objective",
    "Sources for evidence design",
    "Sources for authority and controls",
    "Sources for documentation and reproducibility",
  ]) {
    assert.match(journalHtml, new RegExp(adjacentLabel));
  }
});

test("indexes every canonical record collection in global search", async () => {
  const searchSource = await readFile(new URL("../app/DocsSearch.tsx", import.meta.url), "utf8");
  const resourceIndexSource = await readFile(new URL("../app/ResourceIndex.tsx", import.meta.url), "utf8");
  for (const resultSet of [
    "authorityResults",
    "workflowResults",
    "controlResults",
    "sensitiveActionResults",
    "templateResults",
    "glossaryResults",
    "sourceResults",
    "packResults",
    "benchmarkResults",
    "changeResults",
  ]) {
    assert.match(searchSource, new RegExp(`\\.\\.\\.${resultSet}`));
  }
  assert.match(searchSource, /href: `\/authority#level-\$\{level\.id\}`/);
  assert.match(searchSource, /sourceRelationshipProfiles/);
  assert.match(searchSource, /relationshipProfile\?\.claims/);
  assert.match(resourceIndexSource, /sourceRelationshipProfiles/);
  assert.match(resourceIndexSource, /relationshipProfile\?\.claims/);
  assert.match(resourceIndexSource, /window\.history\.replaceState/);
  assert.match(resourceIndexSource, /popstate/);
});

test("publishes governance, controls, templates, and terminology in equivalent formats", async () => {
  const humanPages = [
    ["/sensitive-actions", /Cash movement and payment release/],
    ["/controls", /Production monitoring and kill switch/],
    ["/templates", /Technical-accounting memo/],
    ["/glossary", /Segregation of duties/],
  ];

  for (const [path, expected] of humanPages) {
    const response = await request(path, { accept: "text/html" });
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), expected);
  }

  const collections = [
    ["/api/v1/authority-levels?limit=100", 6],
    ["/api/v1/sensitive-actions?limit=100", 10],
    ["/api/v1/controls?limit=100", 16],
    ["/api/v1/templates?limit=100", 14],
    ["/api/v1/glossary?limit=100", 47],
  ];

  for (const [path, expectedCount] of collections) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
    const payload = await response.json();
    assert.equal(payload.total_catalog_records, expectedCount, path);
    assert.equal(payload.items.length, expectedCount, path);
    assert.equal(new Set(payload.items.map((item) => item.id)).size, expectedCount, path);
    assert.ok(
      payload.items.every((item) => item.version && item.reviewed_at && item.review_status && item.provenance),
      path,
    );
  }

  const markdown = await request("/api/v1/controls?q=approval", { accept: "text/markdown" });
  assert.equal(markdown.status, 200);
  assert.match(markdown.headers.get("content-type") ?? "", /^text\/markdown\b/i);
  assert.match(await markdown.text(), /Control patterns/);

  const invalidFamily = await request("/api/v1/workflows?family=not-a-family");
  assert.equal(invalidFamily.status, 400);
  assert.match(invalidFamily.headers.get("content-type") ?? "", /^application\/problem\+json\b/i);
});

test("publishes portable packs, benchmark cases, search, schemas, and release feeds", async () => {
  const packsResponse = await request("/api/v1/packs?limit=200");
  assert.equal(packsResponse.status, 200);
  const packsPayload = await packsResponse.json();
  assert.equal(packsPayload.total_records, 6);
  assert.equal(packsPayload.items.length, 6);
  assert.equal(new Set(packsPayload.items.map((item) => item.id)).size, 6);
  assert.ok(packsPayload.items.every((item) => item.reference_output.executed_actions.length === 0));
  assert.ok(packsPayload.items.every((item) => item.licenses.manifest_and_factual_metadata === "CC0-1.0"));

  const onePack = packsPayload.items.find((item) => item.id === "bank-reconciliation");
  assert.ok(onePack);
  const packDetail = await request(`/api/v1/packs/${onePack.id}`);
  assert.equal(packDetail.status, 200);
  assert.equal((await packDetail.json()).item.id, onePack.id);
  const packMarkdown = await request(`/api/v1/packs/${onePack.id}?format=markdown`);
  assert.match(packMarkdown.headers.get("content-type") ?? "", /^text\/markdown\b/i);
  assert.match(await packMarkdown.text(), /Adjusted bank equals adjusted book/);

  const benchmarkResponse = await request("/api/v1/benchmark?limit=200");
  assert.equal(benchmarkResponse.status, 200);
  const benchmarkPayload = await benchmarkResponse.json();
  assert.equal(benchmarkPayload.total_records, 30);
  assert.equal(benchmarkPayload.items.length, 30);
  assert.equal(benchmarkPayload.items.filter((item) => item.pack_id === onePack.id).length, 5);
  assert.ok(benchmarkPayload.items.every((item) => item.expected.executed_actions_must_be_empty));
  assert.ok(benchmarkPayload.items.every((item) => item.assertions.some((check) => check.id === "NO_EXECUTION" && check.severity === "authority_gate")));

  const searchResponse = await request("/api/v1/search?q=bank%20reconciliation&type=workflow&type=pack&limit=20");
  assert.equal(searchResponse.status, 200);
  const searchPayload = await searchResponse.json();
  assert.ok(searchPayload.items.some((item) => item.record_type === "pack"));
  assert.ok(searchPayload.items.some((item) => item.record_type === "workflow"));
  assert.ok(searchPayload.items.every((item) => Array.isArray(item.matched_fields)));
  assert.deepEqual([...searchPayload.items.map((item) => item.rank)].sort((a, b) => a - b), searchPayload.items.map((item) => item.rank));
  const firstSearchPage = await request("/api/v1/search?q=accounting&limit=2");
  const firstSearchPayload = await firstSearchPage.json();
  assert.ok(firstSearchPayload.next_cursor);
  const nextSearchPage = await request(`/api/v1/search?q=accounting&limit=2&cursor=${encodeURIComponent(firstSearchPayload.next_cursor)}`);
  const nextSearchPayload = await nextSearchPage.json();
  assert.equal(firstSearchPayload.items.some((item) => nextSearchPayload.items.some((next) => next.id === item.id)), false);

  for (const [path, title] of [
    ["/schemas/pack.schema.json", "Accounting Agents workflow pack"],
    ["/schemas/benchmark-case.schema.json", "Accounting Agent Bench case"],
    ["/schemas/release-manifest.schema.json", "Accounting Agents release manifest"],
  ]) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type") ?? "", /^application\/schema\+json\b/i, path);
    assert.equal((await response.json()).title, title, path);
  }

  const manifestResponse = await request("/releases/current/manifest.json");
  assert.equal(manifestResponse.status, 200);
  const manifest = await manifestResponse.json();
  assert.equal(manifest.release.id, "2026-08-25.2");
  assert.equal(manifest.counts.packs, 6);
  assert.equal(manifest.counts.benchmark_cases, 30);
  assert.match(manifest.corpus_digest, /^sha256:[a-f0-9]{64}$/);

  const jsonFeed = await request("/feed.json");
  assert.equal(jsonFeed.status, 200);
  assert.equal((await jsonFeed.json()).version, "https://jsonfeed.org/version/1.1");
  const atomFeed = await request("/feed.xml");
  assert.equal(atomFeed.status, 200);
  assert.match(atomFeed.headers.get("content-type") ?? "", /^application\/atom\+xml\b/i);
  assert.match(await atomFeed.text(), /<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom">/);

  const generatedManifest = JSON.parse(await readFile(new URL("../packs/bank-reconciliation/manifest.json", import.meta.url), "utf8"));
  assert.equal(generatedManifest.id, "bank-reconciliation");
  assert.equal(generatedManifest.files.length, 12);
  const sourceArchive = await readFile(new URL("../public/downloads/accounting-agents-source.zip", import.meta.url));
  assert.ok(sourceArchive.byteLength > 100_000);
  const sourceAsset = manifest.assets.find((item) => item.id === "source");
  assert.equal(sourceAsset.bytes, sourceArchive.byteLength);
  assert.equal(sourceAsset.sha256, `sha256:${createHash("sha256").update(sourceArchive).digest("hex")}`);
  const checksums = await readFile(new URL("../public/downloads/SHA256SUMS", import.meta.url), "utf8");
  assert.match(checksums, /accounting-agents-source\.zip/);
});

test("publishes a complete agent-ingestion corpus and discovery contract", async () => {
  const corpusResponse = await request("/downloads/corpus.json");
  assert.equal(corpusResponse.status, 200);
  const corpus = await corpusResponse.json();
  assert.equal(corpus.counts.workflows, 60);
  assert.equal(corpus.counts.sensitive_actions, 10);
  assert.equal(corpus.counts.control_patterns, 16);
  assert.equal(corpus.counts.templates, 14);
  assert.equal(corpus.counts.glossary_terms, 47);
  assert.equal(corpus.counts.source_records, 489);
  assert.equal(corpus.counts.workflow_packs, 6);
  assert.equal(corpus.counts.benchmark_cases, 30);
  assert.equal(corpus.counts.ecosystem_layers, 5);
  assert.equal(corpus.workflows.length, 60);
  assert.equal(corpus.sources.length, 489);
  assert.equal(corpus.workflow_packs.length, 6);
  assert.equal(corpus.benchmark.cases.length, 30);
  assert.equal(corpus.ecosystem_layers.length, 5);
  const sourceIds = new Set(corpus.sources.map((source) => source.id));
  for (const layer of corpus.ecosystem_layers) {
    for (const sourceId of layer.source_ids) assert.ok(sourceIds.has(sourceId), `${layer.id} references unknown source ${sourceId}`);
  }
  for (const collection of [corpus.process_families, corpus.workflows, corpus.sensitive_actions, corpus.control_patterns]) {
    for (const record of collection) {
      assert.ok(
        record.version && record.reviewed_at && record.review_status && record.provenance,
        `${record.id} missing record metadata`,
      );
      for (const sourceId of record.source_ids ?? []) {
        assert.ok(sourceIds.has(sourceId), `${record.id} references unknown source ${sourceId}`);
      }
    }
  }
  assert.doesNotMatch(JSON.stringify(corpus), /\b(?:TODO|TBD|lorem ipsum)\b/i);
  assert.doesNotMatch(
    JSON.stringify({
      workflows: corpus.workflows,
      sensitive_actions: corpus.sensitive_actions,
      control_patterns: corpus.control_patterns,
      templates: corpus.templates,
      glossary: corpus.glossary,
    }),
    /\b(?:leverage|unlock|revolutioniz(?:e|ing)|seamless|game[- ]changer|cutting[- ]edge)\b/i,
  );
  assert.ok(corpus.workflows.every((workflow) => workflow.source_ids.length >= 3));
  assert.ok(corpus.workflows.every((workflow) => (
    JSON.stringify(workflow.source_ids) === JSON.stringify(workflow.provenance.source_basis)
  )));

  const workflowMarkdown = await request("/workflows.md");
  assert.equal(workflowMarkdown.status, 200);
  assert.match(await workflowMarkdown.text(), /Journal-entry preparation and posting/);

  const bundle = await request("/downloads/context-bundle.md");
  const bundleText = await bundle.text();
  assert.match(bundleText, /Canonical accounting-agent domain corpus/);
  assert.match(bundleText, /Sensitive-action boundaries/);
  assert.match(bundleText, /Complete source library/);
  assert.equal(bundleText.split("\n").filter((line) => line.startsWith("# ")).length, 1);

  const llms = await request("/llms.txt");
  const llmsText = await llms.text();
  assert.match(llmsText, /\/api\/v1\/workflows/);
  assert.match(llmsText, /\/downloads\/corpus\.json/);
  assert.match(llmsText, /\/reading-room\.md/);
  assert.match(llmsText, /\/api\/v1\/packs/);
  assert.match(llmsText, /\/api\/v1\/benchmark/);
  assert.match(llmsText, /\/releases\/current\/manifest\.json/);

  const openapi = await request("/openapi.json");
  const contract = await openapi.json();
  for (const path of [
    "/api/v1/workflows",
    "/api/v1/authority-levels",
    "/api/v1/sensitive-actions",
    "/api/v1/controls",
    "/api/v1/templates",
    "/api/v1/glossary",
    "/api/v1/search",
    "/api/v1/packs",
    "/api/v1/benchmark",
    "/api/v1/ledgerbench",
    "/api/v1/ecosystem",
  ]) {
    assert.ok(contract.paths[path], path);
  }

  const catalog = await request("/.well-known/api-catalog");
  const linkset = await catalog.json();
  const discovered = linkset.linkset.flatMap((entry) => entry.item ?? []).map((item) => item.href);
  assert.ok(discovered.some((href) => href.endsWith("/api/v1/workflows")));

  const sitemap = await request("/sitemap.xml");
  const sitemapText = await sitemap.text();
  assert.match(sitemapText, /\/workflows\/record-to-report\/wf-r2r-journal-entry/);
  assert.match(sitemapText, /\/security-identity/);
  assert.match(sitemapText, /\/reading-room/);
  assert.match(sitemapText, /\/packs\/bank-reconciliation/);
  const locations = [...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.equal(locations.length, 593);
  assert.equal(new Set(locations).size, locations.length);
});
