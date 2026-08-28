import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const siteOrigin = "https://accounting-agents.madebyhenry.chatgpt.site";
const evidenceClassifications = new Set([
  "authoritative-requirement",
  "official-guidance",
  "editorial-recommendation",
  "implementation-pattern",
  "synthetic-example",
  "empirical-evidence",
  "unresolved-question",
]);
const edgeEvidenceClassifications = new Set(["editorial-recommendation", "implementation-pattern"]);

const workerPromise = (async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("atlas-test", `${process.pid}-${Date.now()}`);
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

async function atlasPayload(path = "/api/v1/atlas", headers = {}) {
  const response = await request(path, headers);
  assert.equal(response.status, 200, path);
  assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/i, path);
  return { response, payload: await response.json() };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertViewIntegrity(view, label) {
  assert.equal(view.counts.nodes, view.nodes.length, `${label} node count`);
  assert.equal(view.counts.edges, view.edges.length, `${label} edge count`);
  assert.equal(view.counts.source_nodes, view.nodes.filter((node) => node.kind === "source").length, `${label} source count`);
  const nodeIds = new Set(view.nodes.map((node) => node.id));
  assert.equal(nodeIds.size, view.nodes.length, `${label} unique node IDs`);
  assert.equal(new Set(view.edges.map((edge) => edge.id)).size, view.edges.length, `${label} unique edge IDs`);
  for (const edge of view.edges) {
    assert.ok(nodeIds.has(edge.source), `${label} source endpoint ${edge.id}`);
    assert.ok(nodeIds.has(edge.target), `${label} target endpoint ${edge.id}`);
  }
}

test("Atlas graph has stable IDs, canonical provenance, evidence classes, and governed boundaries", async () => {
  const { response, payload } = await atlasPayload();
  assert.equal(payload.collection, "accounting_agents_living_atlas");
  assert.equal(payload.schema_version, "1.0");
  assert.equal(payload.item.id, "accounting-agents-living-atlas");
  assert.equal(payload.item.version, "1.0.0");
  assert.equal(payload.item.title, "The Living Atlas");
  assert.equal(payload.item.primary_mode, "reference");
  assert.equal(payload.item.evidence_classification, "editorial-recommendation");
  assert.equal(payload.item.review_status, "maintainer-review-pending");
  assert.match(payload.item.review_note, /independent, professional, audit, certification, or assurance review is not claimed/i);
  assert.match(payload.item.operating_rule.text, /Agents may prepare accounting work; accountable people approve conclusions and sensitive external actions\./);
  assert.equal(payload.item.operating_rule.evidence_classification, "editorial-recommendation");
  assert.equal(payload.item.path.node_ids.length, 4);
  assert.deepEqual(payload.item.path.node_ids.map((id) => id.startsWith("atlas-")), [true, true, true, true]);
  assert.equal(payload.item.default_state.node_id, "atlas-step-exception-handling");
  assert.equal(payload.item.default_state.industry, "general");
  assert.equal(payload.item.default_state.time_layer, "all");
  assert.equal(payload.item.default_state.view, "map");
  assert.ok(response.headers.get("etag"));
  assert.equal(response.headers.get("access-control-allow-origin"), "*");

  const graph = payload.item.full_graph;
  assert.equal(graph.counts.nodes, graph.nodes.length);
  assert.equal(graph.counts.edges, graph.edges.length);
  assert.equal(graph.counts.path_nodes, payload.item.path.node_ids.length);
  assert.equal(graph.counts.source_nodes, graph.nodes.filter((node) => node.kind === "source").length);
  assert.equal(graph.counts.industries, payload.item.industry_lenses.length);

  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  assert.equal(nodeIds.size, graph.nodes.length, "node IDs are unique");
  assert.equal(new Set(graph.edges.map((edge) => edge.id)).size, graph.edges.length, "edge IDs are unique");
  assert.ok(payload.item.path.node_ids.every((id) => nodeIds.has(id)), "guided path node IDs resolve");

  for (const node of graph.nodes) {
    assert.match(node.id, /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/, `${node.id} stable ID`);
    assert.ok(node.canonical_record_id, `${node.id} canonical record`);
    assert.ok(node.label.trim(), `${node.id} label`);
    assert.ok(node.short_label.trim(), `${node.id} short label`);
    assert.ok(node.summary.trim(), `${node.id} summary`);
    assert.ok(node.detail.trim(), `${node.id} detail`);
    assert.ok(evidenceClassifications.has(node.evidence_classification), `${node.id} evidence classification`);
    assert.ok(node.industries.length > 0, `${node.id} applicability`);
    assert.match(node.reviewed_at, /^\d{4}-\d{2}-\d{2}$/, `${node.id} review date`);
    assert.ok(node.review_status.trim(), `${node.id} review status`);
    assert.ok(["core", "context", "extended"].includes(node.mobile_priority), `${node.id} mobile priority`);
    assert.equal(typeof node.position.x, "number", `${node.id} x position`);
    assert.equal(typeof node.position.y, "number", `${node.id} y position`);
    assert.match(node.provenance.source_file, /^app\//, `${node.id} provenance source file`);
    assert.ok(node.provenance.derivation.trim(), `${node.id} provenance derivation`);
    assert.ok(node.provenance.source_record_id || node.canonical_record_id, `${node.id} provenance record`);
    if (node.href) assert.match(node.href, /^\//, `${node.id} canonical destination`);
    if (node.source) {
      for (const field of ["publisher", "published_or_status", "source_type", "method", "transfer_limit", "lifecycle"]) {
        assert.ok(node.source[field]?.trim(), `${node.id} source ${field}`);
      }
      assert.match(node.source.original_href, /^https:\/\//, `${node.id} primary source link`);
    }
    if (node.example) {
      assert.equal(node.example.evidence_classification, "synthetic-example", `${node.id} example classification`);
      assert.match(node.example.text, /fictional|synthetic/i, `${node.id} example is synthetic`);
    }
    if (node.guide) {
      assert.ok(node.guide.questions.length > 0, `${node.id} guide questions`);
      if (node.guide.next_href) assert.match(node.guide.next_href, /^\//, `${node.id} guide destination`);
    }
  }

  for (const edge of graph.edges) {
    assert.match(edge.id, /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/, `${edge.id} stable ID`);
    assert.ok(nodeIds.has(edge.source), `${edge.id} source endpoint`);
    assert.ok(nodeIds.has(edge.target), `${edge.id} target endpoint`);
    assert.ok(edge.relationship.trim(), `${edge.id} relationship`);
    assert.ok(edge.label.trim(), `${edge.id} label`);
    assert.ok(edgeEvidenceClassifications.has(edge.evidence_classification), `${edge.id} evidence classification`);
    assert.equal(typeof edge.path_edge, "boolean", `${edge.id} path edge flag`);
  }

  for (let index = 0; index < payload.item.path.node_ids.length - 1; index += 1) {
    const source = payload.item.path.node_ids[index];
    const target = payload.item.path.node_ids[index + 1];
    assert.ok(
      graph.edges.some((edge) => edge.source === source && edge.target === target && edge.path_edge),
      `guided path relationship ${source} -> ${target}`,
    );
  }

  const graphText = JSON.stringify({ nodes: graph.nodes, edges: graph.edges });
  assert.doesNotMatch(graphText, /\b(?:ranking|ranked|efficacy)\b/i, "graph does not make ranking or efficacy claims");
  assert.match(payload.item.limitations.join(" "), /not importance, effectiveness, adoption, authority, or prevalence rankings/i);
  assert.match(payload.item.limitations.join(" "), /not a complete map/i);
  assert.match(payload.item.limitations.join(" "), /synthetic example is fictional/i);
});

test("Atlas default, industry, and time-layer views are deterministic filtered graph slices", async () => {
  const { payload: defaultPayload } = await atlasPayload();
  const defaultView = defaultPayload.item.view;
  assert.equal(defaultView.industry, "general");
  assert.equal(defaultView.time_layer, "all");
  assertViewIntegrity(defaultView, "default view");
  assert.ok(defaultView.nodes.some((node) => node.id === defaultPayload.item.default_state.node_id));
  assert.ok(defaultView.nodes.some((node) => node.id === "atlas-industry-general"));
  assert.ok(defaultView.nodes.every((node) => node.kind !== "source" || node.industries.includes("general")));

  const repeat = await atlasPayload();
  assert.deepEqual(
    repeat.payload.item.view.nodes.map((node) => node.id),
    defaultView.nodes.map((node) => node.id),
    "default node order is deterministic",
  );
  assert.deepEqual(
    repeat.payload.item.view.edges.map((edge) => edge.id),
    defaultView.edges.map((edge) => edge.id),
    "default edge order is deterministic",
  );

  const foundational = (await atlasPayload("/api/v1/atlas?industry=general&time_layer=foundational")).payload.item.view;
  assert.equal(foundational.industry, "general");
  assert.equal(foundational.time_layer, "foundational");
  assertViewIntegrity(foundational, "foundational view");
  assert.ok(foundational.nodes.filter((node) => node.kind === "source").length > 0);
  assert.ok(foundational.nodes.filter((node) => node.kind === "source").every((node) => ["foundational", "evergreen"].includes(node.temporal_role)));

  const current = (await atlasPayload("/api/v1/atlas?industry=general&time_layer=current-development")).payload.item.view;
  assert.equal(current.industry, "general");
  assert.equal(current.time_layer, "current-development");
  assertViewIntegrity(current, "current-development view");
  assert.ok(current.nodes.filter((node) => node.kind === "source").length > 0);
  assert.ok(current.nodes.filter((node) => node.kind === "source").every((node) => node.temporal_role === "current-development"));

  const banking = (await atlasPayload("/api/v1/atlas?industry=banking-credit-unions&time_layer=current-development")).payload.item.view;
  assert.equal(banking.industry, "banking-credit-unions");
  assert.equal(banking.time_layer, "current-development");
  assertViewIntegrity(banking, "banking current-development view");
  assert.ok(banking.nodes.some((node) => node.id === "atlas-industry-general"));
  assert.ok(banking.nodes.some((node) => node.id === "atlas-industry-banking-credit-unions"));
  assert.ok(banking.nodes.filter((node) => node.kind === "source").length > 0);
  assert.ok(banking.nodes.filter((node) => node.kind === "source").every((node) => (
    node.industries.includes("banking-credit-unions") && node.temporal_role === "current-development"
  )));
});

test("Atlas HTML, Markdown, and JSON preserve the same learning path and provenance", async () => {
  const { payload } = await atlasPayload();
  const htmlResponse = await request("/atlas", { accept: "text/html" });
  assert.equal(htmlResponse.status, 200);
  assert.match(htmlResponse.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await htmlResponse.text();
  assert.equal((html.match(/<h1\b/gi) ?? []).length, 1);
  assert.match(html, /<main[^>]+id="main-content"/i);
  assert.match(html, /<h1[^>]+id="atlas-explorer-title">The Living Atlas<\/h1>/i);
  assert.match(html, /Content mode:[\s\S]*Reference/);
  assert.match(html, /<nav[^>]+aria-label="Guided Atlas path"/i);
  assert.match(html, /<details[^>]+class="atlas-linear-fallback"/i);
  assert.match(html, /<summary>Browse the guided path as a linear index<\/summary>/i);
  assert.match(html, /<ol>[\s\S]*atlas-linear-atlas-path-bank-reconciliation/);
  assert.match(html, /Agents may prepare accounting work; accountable people approve conclusions and sensitive external actions\./);
  assert.match(html, /href="\/atlas\.md"/);
  assert.match(html, /href="\/api\/v1\/atlas"/);
  for (const nodeId of payload.item.path.node_ids) {
    assert.match(html, new RegExp(`atlas-linear-${escapeRegExp(nodeId)}`), `${nodeId} HTML fallback`);
  }

  const markdownResponse = await request("/atlas.md");
  assert.equal(markdownResponse.status, 200);
  assert.match(markdownResponse.headers.get("content-type") ?? "", /^text\/markdown\b/i);
  const markdown = await markdownResponse.text();
  assert.match(markdown, /^# The Living Atlas/m);
  assert.match(markdown, /- Atlas ID: `accounting-agents-living-atlas`/);
  assert.match(markdown, /- Primary mode: reference/);
  assert.match(markdown, /## Guided path/);
  assert.match(markdown, /## Nodes/);
  assert.match(markdown, /## Relationships/);
  assert.match(markdown, /## Limitations/);
  assert.match(markdown, /> Agents may prepare accounting work; accountable people approve conclusions and sensitive external actions\./);
  for (const nodeId of payload.item.path.node_ids) {
    assert.match(markdown, new RegExp("`" + escapeRegExp(nodeId) + "`"), `${nodeId} Markdown`);
  }
  for (const node of payload.item.view.nodes) {
    assert.match(markdown, new RegExp("`" + escapeRegExp(node.id) + "`"), `${node.id} JSON/Markdown parity`);
  }

  const apiMarkdown = await request("/api/v1/atlas?format=markdown", { accept: "application/json" });
  assert.equal(apiMarkdown.status, 200);
  assert.equal(await apiMarkdown.text(), markdown);

  const filteredMarkdown = await request("/atlas.md?industry=banking-credit-unions&time_layer=current-development");
  assert.equal(filteredMarkdown.status, 200);
  const filteredText = await filteredMarkdown.text();
  assert.match(filteredText, /- Industry lens: banking-credit-unions/);
  assert.match(filteredText, /- Time layer: current-development/);
  assert.match(filteredText, /`src_osfi26agent`/);
});

test("Atlas API format negotiation, errors, caching, and CORS are explicit", async () => {
  const markdown = await request("/api/v1/atlas", { accept: "text/markdown" });
  assert.equal(markdown.status, 200);
  assert.match(markdown.headers.get("content-type") ?? "", /^text\/markdown\b/i);
  const jsonFormat = await request("/api/v1/atlas?format=json", { accept: "text/markdown" });
  assert.equal(jsonFormat.status, 200);
  assert.match(jsonFormat.headers.get("content-type") ?? "", /^application\/json\b/i);

  const get = await request("/api/v1/atlas");
  const head = await request("/api/v1/atlas", {}, "HEAD");
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("content-type"), get.headers.get("content-type"));
  const options = await request("/api/v1/atlas", {}, "OPTIONS");
  assert.equal(options.status, 204);
  assert.equal(options.headers.get("access-control-allow-origin"), "*");
  assert.match(options.headers.get("allow") ?? "", /GET, HEAD, OPTIONS/);
  const notModified = await request("/api/v1/atlas", { "if-none-match": get.headers.get("etag") });
  assert.equal(notModified.status, 304);

  for (const [path, title, allowed] of [
    ["/api/v1/atlas?format=bad", "Invalid format", ["json", "markdown"]],
    ["/api/v1/atlas?industry=bad", "Invalid industry", ["general", "banking-credit-unions", "healthcare-life-sciences", "manufacturing"]],
    ["/api/v1/atlas?time_layer=bad", "Invalid time layer", ["all", "foundational", "current-development"]],
  ]) {
    const response = await request(path);
    assert.equal(response.status, 400, path);
    assert.match(response.headers.get("content-type") ?? "", /^application\/problem\+json\b/i, path);
    const problem = await response.json();
    assert.equal(problem.title, title, path);
    assert.equal(problem.status, 400, path);
    assert.deepEqual(problem.allowed_values, allowed, path);
    assert.match(problem.type, /^https:\/\//, path);
  }

  const unacceptable = await request("/api/v1/atlas", { accept: "image/png" });
  assert.equal(unacceptable.status, 406);
  assert.match(unacceptable.headers.get("content-type") ?? "", /^application\/problem\+json\b/i);
  const unacceptableProblem = await unacceptable.json();
  assert.equal(unacceptableProblem.title, "Not acceptable");
  assert.deepEqual(unacceptableProblem.available_types, ["application/json", "text/markdown"]);
});

test("Atlas is discoverable through site navigation, search, content contract, and machine projections", async () => {
  const homepage = await request("/", { accept: "text/html" });
  assert.equal(homepage.status, 200);
  const homepageHtml = await homepage.text();
  assert.match(homepageHtml, /href="\/atlas"/);
  assert.match(homepageHtml, /Living Atlas/i);

  const contentContract = await (await request("/api/v1/content-contract")).json();
  assert.ok(contentContract.item.page_assignments.some((assignment) => (
    assignment.path === "/atlas" && assignment.primary_mode === "reference" && assignment.page_kind === "static"
  )));

  const sitemap = await (await request("/sitemap.xml")).text();
  assert.match(sitemap, /<loc>[^<]*\/atlas<\/loc>/);
  assert.equal((sitemap.match(/<url>/g) ?? []).length, 598);

  const llms = await (await request("/llms.txt")).text();
  for (const path of ["/atlas", "/atlas.md", "/api/v1/atlas"]) assert.ok(llms.includes(path), path);

  const search = await (await request("/api/v1/search?q=Living%20Atlas")).json();
  assert.ok(search.items.some((item) => item.canonical_path === "/atlas"), "Atlas is indexed in search");

  const catalog = await (await request("/.well-known/api-catalog")).json();
  assert.ok(JSON.stringify(catalog).includes("/api/v1/atlas"), "Atlas API is in the Linkset catalog");

  const metadata = await (await request("/api/v1/meta")).json();
  const metadataLinks = Object.values(metadata.links ?? {});
  assert.ok(metadataLinks.includes(`${siteOrigin}/atlas`), "Atlas human link is in metadata");
  assert.ok(metadataLinks.includes(`${siteOrigin}/atlas.md`), "Atlas Markdown link is in metadata");
  assert.ok(metadataLinks.includes(`${siteOrigin}/api/v1/atlas`), "Atlas API link is in metadata");

  const corpus = await (await request("/downloads/corpus.json")).json();
  const corpusAtlas = Object.values(corpus).find((value) => value && typeof value === "object" && value.id === "accounting-agents-living-atlas");
  assert.ok(corpusAtlas, "Atlas is projected into the canonical corpus");
  const apiAtlasRecord = (await atlasPayload()).payload.item;
  delete apiAtlasRecord.view;
  assert.deepEqual(corpusAtlas, apiAtlasRecord, "corpus Atlas equals the stable API Atlas record");

  const openapi = await (await request("/openapi.json")).json();
  const atlasPath = openapi.paths["/api/v1/atlas"];
  assert.ok(atlasPath?.get, "Atlas OpenAPI GET path");
  assert.ok(atlasPath?.head, "Atlas OpenAPI HEAD path");
  assert.ok(atlasPath?.options, "Atlas OpenAPI OPTIONS path");
  assert.ok(atlasPath.get.parameters.some((parameter) => parameter.name === "format"));
  assert.ok(atlasPath.get.parameters.some((parameter) => parameter.name === "industry"));
  assert.ok(atlasPath.get.parameters.some((parameter) => parameter.name === "time_layer"));
  for (const status of ["200", "400", "406"]) assert.ok(atlasPath.get.responses[status], `Atlas OpenAPI ${status}`);
  assert.match(JSON.stringify(atlasPath.get.responses["200"]), /Atlas(?:Payload|Record)/);
  for (const schemaName of ["AtlasSource", "AtlasExample", "AtlasGuide", "AtlasNode", "AtlasEdge", "AtlasView", "AtlasIndustryLens", "AtlasTimeLayer", "AtlasRecord"]) {
    assert.equal(openapi.components.schemas[schemaName]?.type, "object", schemaName);
  }
});

test("Atlas responsive, keyboard, reduced-motion, and semantic-list contracts are present", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.atlas-explorer\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) clamp\(360px, 29vw, 424px\)/s);
  assert.match(css, /\.atlas-map-pane\s*\{[^}]*min-height:\s*680px/s);
  assert.match(css, /\.atlas-lens-button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.atlas-path-progress button\s*\{[^}]*height:\s*44px/s);
  assert.match(css, /\.atlas-view-controls button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.atlas-map \.react-flow__node:focus-visible/);
  assert.match(css, /\.atlas-node-card:focus-visible/);
  assert.match(css, /\.atlas-map \.react-flow__controls-button:focus-visible/);
  assert.match(css, /\.atlas-linear-fallback summary:focus-visible/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.atlas-workspace\s*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.atlas-map,[\s\S]*height:\s*520px/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.atlas-page \*[\s\S]*transition-duration:\s*0\.01ms/s);
  assert.match(css, /@media \(forced-colors: active\)[\s\S]*\.atlas-node-orb/);

  const explorer = await readFile(new URL("../app/atlas/AtlasExplorer.tsx", import.meta.url), "utf8");
  assert.match(explorer, /new URLSearchParams\(window\.location\.search\)/);
  assert.match(explorer, /window\.addEventListener\("popstate"/);
  assert.match(explorer, /window\.history\.replaceState/);
  for (const parameter of ["node", "industry", "time_layer", "view"]) assert.match(explorer, new RegExp(`parameters\\.(?:get|set)\\("${parameter}"`), parameter);
  assert.match(explorer, /role="radiogroup"/);
  assert.match(explorer, /aria-pressed=/);
  assert.match(explorer, /aria-live="polite"/);
  assert.match(explorer, /data-atlas-list/);
  assert.match(explorer, /nodesFocusable=\{false\}/);
  assert.match(explorer, /<button[\s\S]*className="atlas-node-card nodrag nopan"[\s\S]*onSelect\(record\.id\)[\s\S]*type="button"/);
  assert.match(explorer, /onKeyDownCapture=\{\(event\) => \{[\s\S]*event\.key !== "Enter" && event\.key !== " "[\s\S]*onSelect\(nodeId\)/);
  assert.match(explorer, /selectedNode\.kind === "source"[\s\S]*\? selectedNode[\s\S]*: relatedEdges/);
  assert.match(explorer, /edgesFocusable/);
  assert.match(explorer, /aria-label="Living Atlas knowledge graph/);
});
