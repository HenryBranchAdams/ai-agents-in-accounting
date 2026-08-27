import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workerPromise = (async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("reviewer-guide-test", `${process.pid}-${Date.now()}`);
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

test("reviewer field guide is a bounded, cross-domain review procedure", async () => {
  const response = await request("/api/v1/reviewer-guide");
  assert.equal(response.status, 200);
  const payload = await response.json();
  const guide = payload.item;

  assert.equal(payload.collection, "reviewer_field_guide");
  assert.equal(guide.id, "accounting-agent-reviewer-field-guide");
  assert.equal(guide.version, "1.0.0");
  assert.equal(guide.prepared_at, "2026-08-27");
  assert.equal(guide.review_status, "maintainer-review-pending");
  assert.equal(guide.primary_mode, "how-to");
  assert.equal(guide.evidence_classification, "implementation-pattern");
  assert.match(guide.governing_rule.text, /accountable people approve conclusions and sensitive external actions/i);

  assert.equal(guide.review_sequence.length, 8);
  assert.deepEqual(
    guide.review_sequence.map((step) => step.id),
    [
      "review-step-mandate", "review-step-freeze-packet", "review-step-completeness", "review-step-reproduce",
      "review-step-exceptions", "review-step-judgment", "review-step-disposition", "review-step-record",
    ],
  );
  for (const step of guide.review_sequence) {
    assert.ok(step.challenge_questions.length >= 2, step.id);
    assert.ok(step.proceed_when.length > 20, step.id);
    assert.ok(step.stop_when.length > 20, step.id);
  }
  assert.deepEqual(
    guide.disposition_guide.map((item) => item.disposition),
    ["approve", "modify-and-resubmit", "reject", "escalate"],
  );
  assert.equal(guide.minimum_reviewer_packet.length, 12);
  assert.ok(guide.automation_bias_traps.length >= 5);
  assert.match(JSON.stringify(guide.automation_bias_traps), /confidence|anchoring|rubber-stamp/i);
  assert.equal(guide.worked_examples.length, 4);
  assert.ok(guide.worked_examples.every((item) => item.fictional && item.evidence_classification === "synthetic-example"));
  assert.deepEqual(
    guide.worked_examples.map((item) => item.disposition),
    ["approve", "escalate", "escalate", "reject"],
  );
  assert.deepEqual(
    guide.calibration_exercise.map((item) => item.domain),
    ["Reconciliation", "Accrual", "Technical research", "Control assessment"],
  );
  assert.deepEqual(
    guide.review_program_scaffold.review_states.map((item) => item.state),
    ["proposed", "appointed", "completed", "expired", "superseded", "unavailable"],
  );
  assert.equal(guide.review_program_scaffold.approval_status, "maintainer-approval-required");
  assert.equal(guide.review_program_scaffold.current_project_claim_state.state, "unavailable");
  assert.match(guide.review_program_scaffold.current_project_claim_state.note, /no subject-matter reviewer appointment/i);
  assert.deepEqual(
    guide.source_basis.map((item) => item.id),
    ["src_1qpx6gc", "src_0vf7hhg", "src_1l42i21", "src_1l45nk0", "src_0gq92vl", "src_secsab0099", "src_1f8xnth"],
  );
});

test("reviewer HTML, Markdown, and JSON preserve material meaning and stable IDs", async () => {
  const page = await request("/reviewer-guide", { accept: "text/html" });
  assert.equal(page.status, 200);
  const html = await page.text();

  assert.match(html, /<h1>Review agent-prepared accounting work<\/h1>/);
  assert.match(html, /Content mode: <strong>How-to<\/strong>/);
  assert.match(html, /Approve, modify and resubmit, reject, or escalate/);
  assert.match(html, /Proposed, appointed, completed, expired, superseded, and unavailable review states/);
  assert.match(html, /data-evidence-classification="editorial-recommendation"/);
  assert.match(html, /data-evidence-classification="synthetic-example"/);
  for (const id of [
    "accounting-agent-reviewer-field-guide", "review-governing-rule", "review-step-mandate",
    "review-step-completeness", "review-step-reproduce", "review-step-judgment", "review-step-record",
    "disposition-approve", "disposition-modify", "disposition-reject", "disposition-escalate",
    "packet-sources", "packet-checks", "packet-disposition", "trap-confidence-score", "trap-rubber-stamp",
    "review-example-good-accrual", "review-example-stop-reconciliation", "review-example-conflict-control",
    "review-example-reject-research", "calibration-reconciliation", "calibration-accrual",
    "calibration-research", "calibration-control", "review-state-proposed", "review-state-completed",
    "review-state-unavailable", "review-link-template", "review-link-bank-case",
  ]) assert.match(html, new RegExp(`id="${id}"`), id);
  assert.equal((html.match(/<details id="calibration-/g) ?? []).length, 4);

  const markdown = await request("/reviewer-guide.md");
  assert.equal(markdown.status, 200);
  const markdownText = await markdown.text();
  assert.match(markdownText, /^# Review agent-prepared accounting work/m);
  assert.match(markdownText, /## Ordered review procedure/);
  assert.match(markdownText, /## Minimum reviewer packet/);
  assert.match(markdownText, /## Automation-bias traps/);
  assert.match(markdownText, /## Calibration exercise/);
  assert.match(markdownText, /## Subject-matter review program scaffold/);
  assert.match(markdownText, /`review-step-completeness`/);
  assert.match(markdownText, /`review-example-good-accrual`/);
  assert.match(markdownText, /Current project claim state: unavailable/);

  const apiMarkdown = await request("/api/v1/reviewer-guide?format=markdown");
  assert.equal(apiMarkdown.status, 200);
  assert.equal(await apiMarkdown.text(), markdownText);
  assert.equal((await request("/api/v1/reviewer-guide", {}, "HEAD")).status, 200);
  assert.equal((await request("/api/v1/reviewer-guide", {}, "OPTIONS")).status, 204);
  assert.equal((await request("/api/v1/reviewer-guide?format=xml")).status, 400);
  assert.equal((await request("/api/v1/reviewer-guide", { accept: "application/pdf" })).status, 406);
});

test("reviewer guide is fully discoverable without asserting subject-matter review", async () => {
  const guide = (await (await request("/api/v1/reviewer-guide")).json()).item;
  const corpus = await (await request("/downloads/corpus.json")).json();
  assert.equal(corpus.counts.reviewer_guides, 1);
  assert.equal(corpus.counts.reviewer_packet_fields, 12);
  assert.equal(corpus.counts.reviewer_calibration_cases, 4);
  assert.equal(corpus.counts.reviewer_program_states, 6);
  assert.deepEqual(corpus.reviewer_guide, guide);

  const meta = await (await request("/api/v1/meta")).json();
  assert.equal(meta.reviewer_guide_version, "1.0.0");
  assert.equal(meta.reviewer_guide_review_status, "maintainer-review-pending");
  assert.equal(meta.record_counts.reviewer_guides, 1);
  assert.equal(meta.links.reviewer_guide, "https://accounting-agents.madebyhenry.chatgpt.site/reviewer-guide");

  const openapi = await (await request("/openapi.json")).json();
  assert.equal(openapi.components.schemas.ReviewerFieldGuide.properties.id.const, guide.id);
  assert.equal(
    openapi.paths["/api/v1/reviewer-guide"].get.responses["200"].content["application/json"].schema.properties.item.$ref,
    "#/components/schemas/ReviewerFieldGuide",
  );
  const apiCatalog = await (await request("/.well-known/api-catalog")).json();
  assert.match(JSON.stringify(apiCatalog), /\/api\/v1\/reviewer-guide/);

  const search = await (await request("/api/v1/search?q=review%20agent-prepared%20accounting%20work")).json();
  assert.ok(search.items.some((item) => item.canonical_path === "/reviewer-guide"));
  const contentContract = await (await request("/api/v1/content-contract")).json();
  assert.ok(contentContract.item.page_assignments.some((item) => item.path === "/reviewer-guide" && item.primary_mode === "how-to"));

  const sitemap = await (await request("/sitemap.xml")).text();
  assert.match(sitemap, /<loc>https:\/\/accounting-agents\.madebyhenry\.chatgpt\.site\/reviewer-guide<\/loc>/);
  assert.equal((sitemap.match(/<url>/g) ?? []).length, 597);
  for (const path of ["/llms.txt", "/agent-context.md", "/AGENTS.md", "/machine-access"]) {
    const body = await (await request(path)).text();
    assert.match(body, /reviewer field guide/i, path);
    assert.match(body, /subject-matter|professional review/i, path);
  }

  for (const source of guide.source_basis) {
    assert.equal((await request(source.href, { accept: "text/html" })).status, 200, source.id);
  }
  for (const item of guide.related_material) {
    const [path, fragment] = item.href.split("#");
    const response = await request(path, { accept: "text/html" });
    assert.equal(response.status, 200, item.href);
    if (fragment) assert.match(await response.text(), new RegExp(`id="${fragment}"`), item.href);
  }

  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  assert.match(readme, /reviewer field guide/i);
  assert.match(readme, /does not claim subject-matter or professional review/i);
});

test("reviewer guide responsive styles keep procedure, decisions, and calibration readable", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.review-sequence[\s\S]*grid-template-columns:\s*2rem 1fr/);
  assert.match(css, /\.review-branches[\s\S]*grid-template-columns:\s*1fr 1fr/);
  assert.match(css, /\.review-card-grid[\s\S]*grid-template-columns:\s*1fr 1fr/);
  assert.match(css, /\.review-calibration[\s\S]*summary/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.review-branches,[\s\S]*\.review-card-grid,[\s\S]*\.review-program-grid[\s\S]*grid-template-columns:\s*1fr/);
});
