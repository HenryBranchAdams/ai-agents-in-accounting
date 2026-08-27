import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workerPromise = (async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("start-here-test", `${process.pid}-${Date.now()}`);
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

test("Start here is a bounded five-minute tutorial record", async () => {
  const response = await request("/api/v1/start-here");
  assert.equal(response.status, 200);
  const payload = await response.json();
  const lesson = payload.item;

  assert.equal(payload.collection, "start_here_orientation");
  assert.equal(lesson.id, "accounting-agents-start-here");
  assert.equal(lesson.version, "1.0.0");
  assert.equal(lesson.prepared_at, "2026-08-27");
  assert.equal(lesson.review_status, "maintainer-review-pending");
  assert.equal(lesson.primary_mode, "tutorial");
  assert.match(lesson.review_note, /independent, professional, audit, or assurance review is not claimed/i);
  assert.match(lesson.definition.text, /governed system/i);
  assert.match(lesson.definition.text, /accountable people retain conclusions and sensitive external actions/i);
  assert.equal(lesson.definition.evidence_classification, "implementation-pattern");
  assert.deepEqual(lesson.comparisons.map((item) => item.id), [
    "comparison-chat", "comparison-copilot", "comparison-fixed-workflow", "comparison-accounting-agent",
  ]);
  assert.equal(lesson.evidence_to_decision_chain.length, 6);
  assert.equal(lesson.evidence_to_decision_chain.at(-1).label, "Action and record");
  assert.equal(lesson.scenario.fictional, true);
  assert.equal(lesson.scenario.evidence_classification, "synthetic-example");
  assert.match(lesson.scenario.deliberate_exception, /missing/i);
  assert.ok(lesson.scenario.guided_steps.length >= 5);
  assert.ok(lesson.scenario.finished_artifact.fields.length >= 6);
  assert.equal(lesson.knowledge_check.length, 3);
  assert.ok(lesson.knowledge_check.every((question) => question.options.some((option) => option.id === question.correct_option_id)));
  assert.equal(lesson.audience_paths.length, 5);
  assert.ok(lesson.audience_paths.every((path) => path.href.startsWith("/")));
  assert.doesNotMatch(JSON.stringify(lesson.audience_paths), /ledgerbench|benchmark/i);
  assert.ok(lesson.limitations.length >= 4);
  assert.deepEqual(lesson.source_basis.map((source) => source.id), ["src_1v1zwt5", "src_0vf7hhg"]);
});

test("human, Markdown, and JSON Start here surfaces preserve material meaning", async () => {
  const page = await request("/start-here", { accept: "text/html" });
  assert.equal(page.status, 200);
  const html = await page.text();

  assert.match(html, /<h1>Start here: accounting agents in five minutes<\/h1>/);
  assert.match(html, /Content mode: <strong>Tutorial<\/strong>/);
  assert.match(html, /accounting-agents-start-here/);
  assert.match(html, /synthetic-cash-exception-orientation/);
  for (const id of [
    "comparison-chat", "comparison-copilot", "comparison-fixed-workflow", "comparison-accounting-agent",
    "chain-evidence", "chain-decision", "chain-action-record",
    "check-accountable-decision", "check-missing-evidence", "check-agent-distinction",
    "path-accounting-practitioner", "path-transformation-leader", "path-agent-builder",
    "path-risk-assurance", "path-research-education",
  ]) assert.match(html, new RegExp(`id="${id}"`), id);
  for (const classification of ["implementation-pattern", "editorial-recommendation", "synthetic-example", "authoritative-requirement"]) {
    assert.match(html, new RegExp(`data-evidence-classification="${classification}"`), classification);
  }
  assert.equal((html.match(/<fieldset/g) ?? []).length, 3);
  assert.equal((html.match(/type="radio"/g) ?? []).length, 9);
  assert.match(html, /<button type="submit">Check answers<\/button>/);
  assert.match(html, /<button type="button">Reset<\/button>/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /<caption>Chat, copilot, fixed workflow, and accounting agent<\/caption>/);
  assert.match(html, /href="\/packs\/bank-reconciliation"/);
  assert.doesNotMatch(html, /href="\/ledgerbench"[^>]*>[^<]*(?:next|continue|start)/i);

  const markdown = await request("/start-here.md");
  assert.equal(markdown.status, 200);
  assert.match(markdown.headers.get("content-type") ?? "", /^text\/markdown\b/i);
  const markdownText = await markdown.text();
  assert.match(markdownText, /^# Start here: accounting agents in five minutes/m);
  assert.match(markdownText, /## Chat, copilot, fixed workflow, and accounting agent/);
  assert.match(markdownText, /## Evidence-to-decision chain/);
  assert.match(markdownText, /## Two-minute knowledge check/);
  assert.match(markdownText, /## Choose your next path/);
  assert.match(markdownText, /synthetic-example/);

  const apiMarkdown = await request("/api/v1/start-here", { accept: "text/markdown" });
  assert.equal(apiMarkdown.status, 200);
  assert.equal(await apiMarkdown.text(), markdownText);
  assert.equal((await request("/api/v1/start-here", {}, "HEAD")).status, 200);
  assert.equal((await request("/api/v1/start-here", {}, "OPTIONS")).status, 204);
  assert.equal((await request("/api/v1/start-here?format=bad")).status, 400);
  assert.equal((await request("/api/v1/start-here", { accept: "image/png" })).status, 406);
});

test("Start here is integrated into navigation, discovery, search, and corpus projections", async () => {
  const homepage = await (await request("/")).text();
  assert.match(homepage, /href="\/start-here"/);
  assert.match(homepage, /Benchmark expansion is deferred/);

  const contentContract = (await (await request("/api/v1/content-contract")).json()).item;
  assert.ok(contentContract.page_assignments.some((assignment) => assignment.path === "/start-here" && assignment.primary_mode === "tutorial"));

  const sitemap = await (await request("/sitemap.xml")).text();
  assert.match(sitemap, /<loc>[^<]*\/start-here<\/loc>/);
  const llms = await (await request("/llms.txt")).text();
  for (const path of ["/start-here", "/start-here.md", "/api/v1/start-here"]) assert.ok(llms.includes(path), path);
  const instructions = await (await request("/AGENTS.md")).text();
  assert.match(instructions, /Use \/start-here for the bounded definition/);
  const catalog = await (await request("/.well-known/api-catalog")).json();
  assert.ok(JSON.stringify(catalog).includes("/api/v1/start-here"));

  const search = await (await request("/api/v1/search?q=start%20here%20accounting%20agents")).json();
  assert.ok(search.items.some((item) => item.canonical_path === "/start-here"));

  const metadata = await (await request("/api/v1/meta")).json();
  assert.equal(metadata.record_counts.orientation_lessons, 1);
  assert.equal(metadata.record_counts.orientation_questions, 3);
  assert.equal(metadata.record_counts.orientation_audience_paths, 5);
  assert.match(metadata.links.start_here_api, /\/api\/v1\/start-here$/);

  const corpus = await (await request("/downloads/corpus.json")).json();
  assert.equal(corpus.counts.orientation_lessons, 1);
  assert.equal(corpus.start_here.id, "accounting-agents-start-here");
  assert.deepEqual(corpus.start_here, (await (await request("/api/v1/start-here")).json()).item);

  const openapi = await (await request("/openapi.json")).json();
  assert.ok(openapi.paths["/api/v1/start-here"]);
  assert.equal(openapi.components.schemas.StartHereOrientation.properties.id.const, "accounting-agents-start-here");

  for (const path of ["/resources/src_1v1zwt5", "/resources/src_0vf7hhg"]) {
    assert.equal((await request(path, { accept: "text/html" })).status, 200, path);
  }
});

test("Start here remains responsive and the active program is knowledge-hub first", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.knowledge-check fieldset[\s\S]*border-bottom:/);
  assert.match(css, /\.knowledge-check label[\s\S]*grid-template-columns:\s*1rem 1fr/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.knowledge-check-actions[\s\S]*flex-direction:\s*column/);
  assert.match(css, /\.knowledge-check-actions button[\s\S]*font-size:\s*0\.78rem/);

  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  assert.match(readme, /five-minute Start here orientation/);
  assert.match(readme, /Further LedgerBench and benchmark development is deferred/);
  assert.match(readme, /active product program is the educational hub, source archive, practice observatory, and resource wiki/);
});
