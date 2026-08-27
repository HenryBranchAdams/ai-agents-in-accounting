import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workerPromise = (async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("authority-guide-test", `${process.pid}-${Date.now()}`);
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

test("authority decision guide classifies actions without granting approval authority", async () => {
  const response = await request("/api/v1/authority-levels?limit=200");
  assert.equal(response.status, 200);
  const payload = await response.json();
  const guide = payload.decision_guide;

  assert.equal(payload.items.length, 6);
  assert.equal(guide.id, "authority-decision-guide");
  assert.equal(guide.version, "1.0.0");
  assert.equal(guide.prepared_at, "2026-08-27");
  assert.equal(guide.review_status, "maintainer-review-pending");
  assert.equal(guide.primary_mode, "reference");
  assert.equal(guide.evidence_classification, "implementation-pattern");
  assert.match(guide.operating_rule.text, /accountable people approve conclusions and sensitive external actions/i);
  assert.equal(guide.operating_rule.evidence_classification, "editorial-recommendation");

  const stepIds = new Set(guide.decision_steps.map((step) => step.id));
  const authorityIds = new Set(["A0", "A1", "A2", "A3", "A4", "human-only"]);
  assert.equal(stepIds.size, 7);
  for (const step of guide.decision_steps) {
    for (const branch of [step.yes, step.no]) {
      assert.ok(["step", "authority", "stop"].includes(branch.kind));
      if (branch.kind === "step") assert.ok(stepIds.has(branch.target), `${step.id}:${branch.target}`);
      if (branch.kind === "authority") assert.ok(authorityIds.has(branch.target), `${step.id}:${branch.target}`);
      if (branch.kind === "stop") assert.match(branch.target, /^stop-/);
    }
  }

  assert.deepEqual(guide.execution_comparison.map((item) => item.level_id), ["A3", "A4", "human-only"]);
  assert.ok(guide.execution_comparison.every((item) => item.evidence_classification === "implementation-pattern"));
  assert.ok(guide.execution_comparison.every((item) => item.accounting_example_classification === "synthetic-example"));
  assert.match(guide.execution_comparison[0].entry_condition, /approved the exact action or immutable payload/i);
  assert.match(guide.execution_comparison[1].decision_owner, /policy engine, not the model/i);
  assert.match(guide.execution_comparison[2].permitted_effect, /may not click, sign, attest, certify, approve, or impersonate/i);

  assert.equal(guide.mixed_level_workflow.fictional, true);
  assert.equal(guide.mixed_level_workflow.evidence_classification, "synthetic-example");
  assert.deepEqual(
    [...new Set(guide.mixed_level_workflow.actions.map((item) => item.level_id))].sort(),
    ["A0", "A1", "A2", "A3", "A4", "human-only"].sort(),
  );
  assert.ok(guide.common_misclassifications.length >= 6);
  assert.match(JSON.stringify(guide.common_misclassifications), /confidence/i);
  assert.ok(guide.segregation_of_duties_examples.length >= 4);
  assert.deepEqual(
    guide.sensitive_action_mappings.map((item) => item.sensitive_action_id),
    ["sa-journal-posting", "sa-cash-movement", "sa-final-approval", "sa-certification", "sa-unsupervised-close"],
  );
  assert.deepEqual(guide.source_basis.map((item) => item.id), ["src_1v1zwt5", "src_gaogb25", "src_075usnq", "src_0pywo86"]);
  assert.ok(guide.stop_conditions.some((item) => /model confidence/i.test(item)));
  assert.ok(guide.limitations.length >= 4);
});

test("authority HTML, Markdown, and JSON preserve the canonical decision guide", async () => {
  const page = await request("/authority", { accept: "text/html" });
  assert.equal(page.status, 200);
  const html = await page.text();

  assert.match(html, /<h1>Authority ladder and decision tree<\/h1>/);
  assert.match(html, /Content mode: <strong>Reference<\/strong>/);
  assert.match(html, /authority-decision-guide/);
  assert.match(html, /Constrained execution, policy execution, and human-owned responsibility/);
  assert.match(html, /comparison criteria are implementation patterns; the accounting examples are[\s\S]*synthetic examples/i);
  assert.match(html, /editorial implementation pattern prepared[\s\S]*maintainer review is pending/i);
  assert.match(html, /Claims that overstate or blur agent authority/);
  assert.match(html, /data-evidence-classification="editorial-recommendation"/);
  assert.match(html, /data-evidence-classification="synthetic-example"/);
  assert.match(html, /data-evidence-classification="authoritative-requirement"/);
  for (const id of [
    "authority-decision-guide",
    "decision-smallest-action", "decision-human-owned", "decision-after-approval", "decision-policy-execution",
    "compare-a3", "compare-a4", "compare-human-only", "synthetic-accrual-authority-walkthrough",
    "mixed-prepare-entry", "mixed-approve-entry", "mixed-submit-entry", "mixed-update-task",
    "misclassification-confidence", "misclassification-whole-agent", "sod-entry-approval", "sod-payload-change",
    "mapping-journal-posting", "mapping-cash-movement", "mapping-certification",
  ]) assert.match(html, new RegExp(`id="${id}"`), id);

  const markdown = await request("/authority-levels.md");
  assert.equal(markdown.status, 200);
  const markdownText = await markdown.text();
  assert.match(markdownText, /^# Authority ladder and decision tree/m);
  assert.match(markdownText, /## Decision tree/);
  assert.match(markdownText, /## A3, A4, and human-only/);
  assert.match(markdownText, /Pattern classification[\s\S]*Example classification/);
  assert.doesNotMatch(markdownText, /The A0–A4 labels[^\n]*reviewed/i);
  assert.match(markdownText, /## Synthetic scenario: Synthetic accrual entry and close-task walkthrough/);
  assert.match(markdownText, /## Common misclassifications/);
  assert.match(markdownText, /## Segregation-of-duties comparisons/);
  assert.match(markdownText, /`decision-after-approval`/);
  assert.match(markdownText, /`mixed-submit-entry`/);

  const apiMarkdown = await request("/api/v1/authority-levels?format=markdown&limit=200");
  assert.equal(apiMarkdown.status, 200);
  assert.equal(await apiMarkdown.text(), markdownText);
  assert.equal((await request("/api/v1/authority-levels", {}, "HEAD")).status, 200);
  assert.equal((await request("/api/v1/authority-levels", {}, "OPTIONS")).status, 204);
});

test("authority guide is discoverable and links to canonical sensitive actions and primary sources", async () => {
  const corpus = await (await request("/downloads/corpus.json")).json();
  const api = await (await request("/api/v1/authority-levels?limit=200")).json();
  assert.equal(corpus.counts.authority_decision_guides, 1);
  assert.deepEqual(corpus.authority_decision_guide, api.decision_guide);

  const meta = await (await request("/api/v1/meta")).json();
  assert.equal(meta.record_counts.authority_decision_guides, 1);
  assert.equal(meta.authority_decision_guide_version, "1.0.0");
  assert.equal(meta.authority_decision_guide_review_status, "maintainer-review-pending");

  const openapi = await (await request("/openapi.json")).json();
  assert.equal(openapi.components.schemas.AuthorityDecisionGuide.properties.id.const, "authority-decision-guide");
  assert.equal(
    openapi.paths["/api/v1/authority-levels"].get.responses["200"].content["application/json"].schema.properties.decision_guide.$ref,
    "#/components/schemas/AuthorityDecisionGuide",
  );

  const search = await (await request("/api/v1/search?q=authority%20decision%20tree")).json();
  assert.ok(search.items.some((item) => item.canonical_path === "/authority"));
  for (const path of ["/llms.txt", "/AGENTS.md", "/machine-access", "/start-here", "/content-contract"]) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
  }
  const llms = await (await request("/llms.txt")).text();
  assert.match(llms, /Authority model.*action decision tree/i);
  const instructions = await (await request("/AGENTS.md")).text();
  assert.match(instructions, /Use \/authority to classify one observable action at a time/);

  const sensitiveActions = await (await request("/sensitive-actions", { accept: "text/html" })).text();
  for (const mapping of api.decision_guide.sensitive_action_mappings) {
    assert.match(sensitiveActions, new RegExp(`id="${mapping.sensitive_action_id}"`), mapping.sensitive_action_id);
  }
  for (const source of api.decision_guide.source_basis) {
    assert.equal((await request(`/resources/${source.id}`, { accept: "text/html" })).status, 200, source.id);
  }

  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  assert.match(readme, /authority ladder and decision tree/i);
  assert.match(readme, /A3 execution after approval from A4 policy execution and human-only responsibility/i);
});

test("authority guide responsive styles keep branches and action records readable", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.authority-decision-tree[\s\S]*grid-template-columns:\s*2rem 1fr/);
  assert.match(css, /\.authority-branches[\s\S]*grid-template-columns:\s*1fr 1fr/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.authority-branches[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(css, /\.authority-sod-grid > article[\s\S]*border-top:/);
});
