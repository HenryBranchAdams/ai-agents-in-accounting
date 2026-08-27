import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workerPromise = (async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("core-course-test", `${process.pid}-${Date.now()}`);
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

test("core course is a bounded twenty-source bridge with explicit evidence weight and limits", async () => {
  const response = await request("/api/v1/course");
  assert.equal(response.status, 200);
  const payload = await response.json();
  const course = payload.item;
  const readings = course.modules.flatMap((module) => module.readings);

  assert.equal(payload.collection, "accounting_agents_core_course");
  assert.equal(course.id, "accounting-agents-core-course");
  assert.equal(course.version, "1.0.0");
  assert.equal(course.prepared_at, "2026-08-27");
  assert.equal(course.review_status, "maintainer-review-pending");
  assert.equal(course.primary_mode, "tutorial");
  assert.equal(course.evidence_classification, "editorial-recommendation");
  assert.match(course.review_note, /subject-matter, independent, professional, audit, certification, or assurance review is not claimed/i);
  assert.equal(course.modules.length, 5);
  assert.equal(course.audience_lenses.length, 4);
  assert.equal(readings.length, 20);
  assert.deepEqual(readings.map((reading) => reading.order), Array.from({ length: 20 }, (_, index) => index + 1));
  assert.equal(new Set(readings.map((reading) => reading.id)).size, 20);
  assert.equal(new Set(readings.map((reading) => reading.resource_id)).size, 20);
  assert.equal(readings.filter((reading) => reading.relationship_profiled).length, 14);
  assert.deepEqual(
    Object.fromEntries(["tier-1-authority", "tier-2-official-guidance", "tier-3-research", "tier-4-technical-practice"].map((tier) => [tier, readings.filter((reading) => reading.evidence_tier === tier).length])),
    { "tier-1-authority": 7, "tier-2-official-guidance": 4, "tier-3-research": 7, "tier-4-technical-practice": 2 },
  );
  assert.equal(readings.filter((reading) => reading.role === "framework-choice").length, 2);
  assert.equal(readings.filter((reading) => reading.role === "case-comparison").length, 3);
  assert.ok(readings.every((reading) => reading.contribution && reading.why_it_matters && reading.key_limitation && reading.learning_outcome));
  assert.ok(readings.every((reading) => reading.estimated_reading_minutes > 0));
  assert.ok(readings.every((reading) => reading.catalog_href === `/resources/${reading.resource_id}`));
  assert.ok(readings.every((reading) => reading.original_href.startsWith("https://")));
  assert.ok(readings.every((reading) => reading.related_workflow_ids.length > 0));
  assert.ok(readings.every((reading) => reading.audience_lenses.length > 0));
  assert.equal(course.capstone.fictional, true);
  assert.equal(course.capstone.evidence_classification, "synthetic-example");
  assert.match(course.capstone.deliberate_exception, /missing bank evidence/i);
  assert.ok(course.capstone.finished_artifact.fields.length >= 7);
  assert.equal(course.knowledge_check.length, 4);
  assert.ok(course.knowledge_check.every((question) => question.options.some((option) => option.id === question.correct_option_id)));
  assert.match(course.governing_rule.text, /Accountable people approve conclusions and sensitive external actions/);
  assert.doesNotMatch(JSON.stringify(course), /ledgerbench/i);
});

test("human, Markdown, and JSON core-course surfaces preserve the same deliberate sequence", async () => {
  const payload = await (await request("/api/v1/course")).json();
  const course = payload.item;
  const readings = course.modules.flatMap((module) => module.readings);
  const page = await request("/course", { accept: "text/html" });
  assert.equal(page.status, 200);
  const html = await page.text();

  assert.match(html, /<h1>Core course: accounting agents from evidence to governed work<\/h1>/);
  assert.match(html, /Content mode: <strong>Tutorial<\/strong>/);
  assert.match(html, /accounting-agents-core-course/);
  assert.match(html, /Why these twenty sources/);
  assert.match(html, /Agent systems for accountants/);
  assert.match(html, /Accounting systems for builders/);
  assert.match(html, /Governed accounting-agent transfer brief/);
  assert.match(html, /data-evidence-classification="editorial-recommendation"/);
  assert.match(html, /data-evidence-classification="synthetic-example"/);
  for (const id of [...course.modules.map((module) => module.id), ...course.audience_lenses.map((lens) => `lens-${lens.id}`), ...readings.map((reading) => reading.id)]) {
    assert.match(html, new RegExp(`id="${id}"`), id);
  }
  assert.equal((html.match(/class="course-reading-details"/g) ?? []).length, 20);
  assert.equal((html.match(/<fieldset/g) ?? []).length, 4);
  assert.equal((html.match(/type="radio"/g) ?? []).length, 12);

  const markdown = await request("/course.md");
  assert.equal(markdown.status, 200);
  assert.match(markdown.headers.get("content-type") ?? "", /^text\/markdown\b/i);
  const markdownText = await markdown.text();
  assert.match(markdownText, /^# Core course: accounting agents from evidence to governed work/m);
  assert.match(markdownText, /Readings: 20/);
  assert.match(markdownText, /## 1\. Professional and reporting boundary/);
  assert.match(markdownText, /### 20\. Close Automation — General Availability/);
  assert.match(markdownText, /## Synthetic capstone: bound a cash-reconciliation assistant/);
  assert.match(markdownText, /## Knowledge check/);
  assert.match(markdownText, /tier-4-technical-practice|Tier 4 · Technical or practice evidence/);

  const apiMarkdown = await request("/api/v1/course", { accept: "text/markdown" });
  assert.equal(apiMarkdown.status, 200);
  assert.equal(await apiMarkdown.text(), markdownText);
  assert.equal((await request("/api/v1/course", {}, "HEAD")).status, 200);
  assert.equal((await request("/api/v1/course", {}, "OPTIONS")).status, 204);
  assert.equal((await request("/api/v1/course?format=bad")).status, 400);
  assert.equal((await request("/api/v1/course", { accept: "image/png" })).status, 406);
});

test("core course is discoverable and projected into the canonical corpus without a dashboard", async () => {
  const homepage = await (await request("/")).text();
  assert.match(homepage, /href="\/course"/);
  assert.match(homepage, /Take the core course/);

  const contentContract = (await (await request("/api/v1/content-contract")).json()).item;
  assert.ok(contentContract.page_assignments.some((assignment) => assignment.path === "/course" && assignment.primary_mode === "tutorial"));

  const sitemap = await (await request("/sitemap.xml")).text();
  assert.match(sitemap, /<loc>[^<]*\/course<\/loc>/);
  const llms = await (await request("/llms.txt")).text();
  for (const path of ["/course", "/course.md", "/api/v1/course"]) assert.ok(llms.includes(path), path);
  const instructions = await (await request("/AGENTS.md")).text();
  assert.match(instructions, /Use \/course for the deliberate twenty-source bridge/);
  const catalog = await (await request("/.well-known/api-catalog")).json();
  assert.ok(JSON.stringify(catalog).includes("/api/v1/course"));

  const search = await (await request("/api/v1/search?q=bridge%20course")).json();
  assert.ok(search.items.some((item) => item.canonical_path === "/course"));

  const metadata = await (await request("/api/v1/meta")).json();
  assert.equal(metadata.record_counts.core_courses, 1);
  assert.equal(metadata.record_counts.core_course_modules, 5);
  assert.equal(metadata.record_counts.core_course_readings, 20);
  assert.equal(metadata.record_counts.core_course_audience_lenses, 4);
  assert.equal(metadata.record_counts.core_course_questions, 4);
  assert.match(metadata.links.core_course_api, /\/api\/v1\/course$/);

  const corpus = await (await request("/downloads/corpus.json")).json();
  assert.equal(corpus.counts.core_courses, 1);
  assert.equal(corpus.counts.core_course_readings, 20);
  assert.equal(corpus.core_course.id, "accounting-agents-core-course");
  assert.deepEqual(corpus.core_course, (await (await request("/api/v1/course")).json()).item);

  const openapi = await (await request("/openapi.json")).json();
  assert.ok(openapi.paths["/api/v1/course"]);
  assert.equal(openapi.components.schemas.CoreCourse.properties.id.const, "accounting-agents-core-course");
  assert.equal(openapi.components.schemas.CoreCourse.properties.modules.minItems, 5);

  for (const sourceId of corpus.core_course.modules.flatMap((module) => module.readings.map((reading) => reading.resource_id))) {
    assert.equal((await request(`/api/v1/resources/${sourceId}`)).status, 200, sourceId);
  }
});

test("core course has responsive reading cards and explicit qualification boundaries", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.course-bridge-grid[\s\S]*grid-template-columns:\s*1fr 1fr/);
  assert.match(css, /\.course-reading-details > summary:focus-visible[\s\S]*outline:/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.course-bridge-grid[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.course-reading-details dl > div[\s\S]*grid-template-columns:\s*1fr/);

  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  assert.match(readme, /core course/);
  assert.match(readme, /20 primary, original-research, official, and first-party practice sources/);
  assert.match(readme, /accountable-human boundary/);
});
