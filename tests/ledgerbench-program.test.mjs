import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ledgerBenchProgram } from "../data/ledgerbench-program.mjs";

const workerPromise = (async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("ledgerbench-test", `${process.pid}-${Date.now()}`);
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

function uniqueIds(records, label) {
  const ids = records.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, `${label} IDs must be unique`);
}

test("LedgerBench publishes a coherent Preview program record", () => {
  assert.equal(ledgerBenchProgram.id, "ledgerbench");
  assert.equal(ledgerBenchProgram.status, "preview");
  assert.equal(ledgerBenchProgram.review_status, "maintainer-reviewed");
  assert.match(ledgerBenchProgram.applicability, /US GAAP/i);
  assert.equal(ledgerBenchProgram.reuse_status, "mixed-rights");
  assert.match(ledgerBenchProgram.version, /^\d+\.\d+\.\d+$/);
  assert.equal(ledgerBenchProgram.primary_metric.id, "accepted-work-rate");
  assert.equal(ledgerBenchProgram.primary_metric.abbreviation, "AWR");
  assert.ok(ledgerBenchProgram.products.length >= 4);
  assert.ok(ledgerBenchProgram.tracks.length >= 5);
  assert.ok(ledgerBenchProgram.divisions.length >= 3);
  assert.ok(ledgerBenchProgram.capability_dimensions.length >= 8);
  assert.ok(ledgerBenchProgram.hard_gates.length >= 10);
  assert.equal(ledgerBenchProgram.split_policy.primary_splits_are_exclusive, true);
  assert.ok(ledgerBenchProgram.precedents.length >= 10);

  uniqueIds(ledgerBenchProgram.products, "product");
  uniqueIds(ledgerBenchProgram.tracks, "track");
  uniqueIds(ledgerBenchProgram.divisions, "division");
  uniqueIds(ledgerBenchProgram.capability_dimensions, "capability");
  uniqueIds(ledgerBenchProgram.split_policy.splits, "split");
  uniqueIds(ledgerBenchProgram.submission_program.statuses, "submission status");
  uniqueIds(ledgerBenchProgram.governance, "governance body");
  uniqueIds(ledgerBenchProgram.precedents, "precedent");

  assert.deepEqual(
    ledgerBenchProgram.task_admission.map((stage) => stage.order),
    Array.from({ length: ledgerBenchProgram.task_admission.length }, (_, index) => index + 1),
  );
  assert.ok(ledgerBenchProgram.task_admission.some((stage) => stage.id === "independent-solve"));
  assert.ok(ledgerBenchProgram.task_admission.some((stage) => stage.id === "human-baseline"));
  assert.ok(ledgerBenchProgram.task_admission.some((stage) => stage.id === "adversarial-review"));

  for (const precedent of ledgerBenchProgram.precedents) {
    assert.equal(new URL(precedent.source).protocol, "https:", precedent.id);
  }

  assert.deepEqual(
    ledgerBenchProgram.submission_program.official_default,
    ["verified", "audited"],
  );
  assert.equal(
    ledgerBenchProgram.first_release.human_baseline,
    "Two independent qualified preparers and one independent reviewer per admitted episode.",
  );
});

test("LedgerBench human and machine surfaces render from one canonical record", async () => {
  const page = await request("/ledgerbench", { accept: "text/html" });
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await page.text();
  assert.equal((html.match(/<h1\b/gi) ?? []).length, 1);
  assert.match(html, /LedgerBench/);
  assert.match(html, /Accepted Work Rate/);
  assert.match(html, /Begin with the claim, not the leaderboard/);
  assert.match(html, /Preview boundary/);

  const markdown = await request("/ledgerbench.md");
  assert.equal(markdown.status, 200);
  assert.match(markdown.headers.get("content-type") ?? "", /^text\/markdown\b/i);
  const markdownText = await markdown.text();
  assert.match(markdownText, /^# LedgerBench/m);
  assert.match(markdownText, /## Task admission/);
  assert.match(markdownText, /## Statistical principles/);

  const api = await request("/api/v1/ledgerbench");
  assert.equal(api.status, 200);
  assert.equal(api.headers.get("access-control-allow-origin"), "*");
  assert.ok(api.headers.get("etag"));
  const payload = await api.json();
  assert.equal(payload.collection, "benchmark_program");
  assert.equal(payload.item.id, "ledgerbench");
  assert.equal(payload.item.status, "preview");
  assert.match(payload.links.episode_schema, /ledgerbench-episode\.schema\.json$/);

  const head = await request("/api/v1/ledgerbench", {}, "HEAD");
  assert.equal(head.status, 200);
  const options = await request("/api/v1/ledgerbench", {}, "OPTIONS");
  assert.equal(options.status, 204);
  assert.match(options.headers.get("allow") ?? "", /GET, HEAD, OPTIONS/);
});

test("LedgerBench publishes strict program, episode, result, and submission schemas", async () => {
  const schemaPaths = [
    "/schemas/ledgerbench-program.schema.json",
    "/schemas/ledgerbench-episode.schema.json",
    "/schemas/ledgerbench-result.schema.json",
    "/schemas/ledgerbench-submission.schema.json",
  ];

  for (const path of schemaPaths) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type") ?? "", /^application\/schema\+json\b/i, path);
    const schema = await response.json();
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema", path);
    assert.equal(schema.type, "object", path);
    assert.equal(schema.additionalProperties, false, path);
    assert.ok(Array.isArray(schema.required) && schema.required.length > 0, path);
  }

  const episode = await (await request(schemaPaths[1])).json();
  assert.ok(episode.required.includes("acceptance_model"));
  assert.ok(episode.required.includes("authority_envelope"));
  assert.equal(episode.properties.task_population.properties.primary_split.type, "string");

  const result = await (await request(schemaPaths[2])).json();
  assert.ok(result.required.includes("evidence_links"));
  assert.ok(result.required.includes("executed_actions"));
  assert.ok(result.required.includes("run_record"));
  assert.equal(result.description.includes("chain-of-thought"), true);

  const submission = await (await request(schemaPaths[3])).json();
  assert.ok(submission.required.includes("disclosures"));
  assert.ok(submission.required.includes("verification_requested"));
  assert.ok(submission.required.includes("submission_package"));
  assert.equal(submission.properties.submission_package.additionalProperties, false);
  for (const field of [
    "candidate_system_card", "source_or_container", "dependency_lockfiles", "configuration", "run_command",
    "tool_logs", "environment_logs", "artifact_hashes", "cost_time_records",
    "known_failures", "conformance_declaration",
  ]) {
    assert.ok(submission.properties.submission_package.required.includes(field), field);
  }
  assert.ok(submission.required.includes("confidentiality_declaration"));
  assert.ok(!submission.properties.track.enum.includes("adversarial-overlay"));
  assert.equal(submission.properties.rights_declaration.minLength, 1);
  assert.equal(submission.properties.confidentiality_declaration.minLength, 1);
  assert.deepEqual(
    submission.properties.submission_package.properties.tool_logs.items.required,
    ["path", "sha256", "media_type"],
  );

  const acceptance = episode.properties.acceptance_model;
  assert.equal(acceptance.additionalProperties, false);
  for (const field of [
    "invariants", "acceptable_values_or_tolerances", "required_evidence",
    "hierarchical_rubric", "hard_exclusions", "materiality",
  ]) {
    assert.ok(acceptance.required.includes(field), field);
  }
  assert.ok(!episode.properties.track.enum.includes("adversarial-overlay"));
  assert.ok(episode.required.includes("overlays"));
  assert.equal(episode.properties.task_population.properties.operating_context.additionalProperties, false);
  assert.equal(acceptance.properties.invariants.minItems, 1);
  assert.equal(acceptance.properties.required_evidence.minItems, 1);
  assert.equal(acceptance.properties.acceptable_values_or_tolerances.items.additionalProperties, false);

  const program = await (await request(schemaPaths[0])).json();
  for (const field of ["first_release", "provenance", "licenses"]) {
    assert.equal(program.properties[field].additionalProperties, false, field);
    assert.ok(program.properties[field].required.length > 0, field);
  }

  const executedAction = result.properties.executed_actions.items;
  for (const field of [
    "accountable_actor_id", "accountable_actor_role", "approval_evidence_id",
    "approved_scope", "receipt_id",
  ]) {
    assert.ok(executedAction.required.includes(field), field);
    assert.equal(executedAction.properties[field].minLength, 1, field);
  }

  for (const field of ["deployment_kind", "endpoint_id", "endpoint_version"]) {
    assert.ok(submission.properties.candidate.required.includes(field), field);
  }
  for (const field of ["system_id", "system_version", "model_id", "model_version"]) {
    assert.equal(submission.properties.candidate.properties[field].minLength, 1, field);
  }
});

test("LedgerBench is discoverable through the public machine interfaces", async () => {
  const sitemap = await (await request("/sitemap.xml")).text();
  assert.match(sitemap, /<loc>[^<]*\/ledgerbench<\/loc>/);

  const llms = await (await request("/llms.txt")).text();
  for (const path of ["/ledgerbench", "/ledgerbench.md", "/api/v1/ledgerbench"]) {
    assert.ok(llms.includes(path), path);
  }

  const openapi = await (await request("/openapi.json")).json();
  assert.ok(openapi.paths["/api/v1/ledgerbench"]);
  for (const name of ["LedgerBenchProgram", "LedgerBenchEpisode", "LedgerBenchResult", "LedgerBenchSubmission"]) {
    assert.ok(openapi.components.schemas[name], name);
  }

  const catalog = await (await request("/.well-known/api-catalog")).json();
  const catalogText = JSON.stringify(catalog);
  for (const path of [
    "/api/v1/ledgerbench",
    "/schemas/ledgerbench-program.schema.json",
    "/schemas/ledgerbench-episode.schema.json",
    "/schemas/ledgerbench-result.schema.json",
    "/schemas/ledgerbench-submission.schema.json",
  ]) {
    assert.ok(catalogText.includes(path), path);
  }
});

test("LedgerBench CI watches the modular source records", async () => {
  const workflow = await readFile(new URL("../.github/workflows/ledgerbench.yml", import.meta.url), "utf8");
  assert.equal((workflow.match(/data\/ledgerbench\/\*\*/g) ?? []).length, 2);
  for (const path of [
    "app/agent-interface.ts", "app/openapi.json/route.ts",
    "app/[wellKnown]/api-catalog/route.ts", "app/sitemap.ts",
  ]) {
    assert.equal(workflow.split(path).length - 1, 2, path);
  }
});
