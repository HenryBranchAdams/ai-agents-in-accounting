#!/usr/bin/env node
import assert from "node:assert/strict";
import { ledgerBenchProgram } from "../data/ledgerbench-program.mjs";

function unique(records, label) {
  const ids = records.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, `${label} IDs must be unique`);
  assert.ok(ids.every((id) => /^[a-z0-9-]+$/.test(id)), `${label} IDs must be stable slugs`);
}

function validate() {
  assert.equal(ledgerBenchProgram.id, "ledgerbench");
  assert.equal(ledgerBenchProgram.status, "preview");
  assert.equal(ledgerBenchProgram.review_status, "maintainer-reviewed");
  assert.match(ledgerBenchProgram.applicability, /US GAAP/i);
  assert.equal(ledgerBenchProgram.reuse_status, "mixed-rights");
  assert.match(ledgerBenchProgram.version, /^\d+\.\d+\.\d+$/);
  assert.match(ledgerBenchProgram.reviewed_at, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(ledgerBenchProgram.measurement_claim.length > 80);
  assert.ok(ledgerBenchProgram.non_claims.length >= 4);

  unique(ledgerBenchProgram.products, "product");
  unique(ledgerBenchProgram.tracks, "track");
  unique(ledgerBenchProgram.divisions, "division");
  unique(ledgerBenchProgram.capability_dimensions, "capability dimension");
  unique(ledgerBenchProgram.split_policy.splits, "split");
  unique(ledgerBenchProgram.submission_program.statuses, "submission status");
  unique(ledgerBenchProgram.governance, "governance body");
  unique(ledgerBenchProgram.precedents, "precedent");

  assert.equal(ledgerBenchProgram.products.filter((item) => item.ranking).length, 1);
  assert.equal(ledgerBenchProgram.products.find((item) => item.ranking)?.id, "capability-benchmark");
  assert.equal(ledgerBenchProgram.primary_metric.id, "accepted-work-rate");
  assert.equal(ledgerBenchProgram.primary_metric.abbreviation, "AWR");
  assert.ok(ledgerBenchProgram.primary_metric.episode_acceptance_conditions.length >= 6);
  assert.equal(new Set(ledgerBenchProgram.hard_gates).size, ledgerBenchProgram.hard_gates.length);
  assert.ok(ledgerBenchProgram.hard_gates.length >= 10);

  assert.deepEqual(
    ledgerBenchProgram.task_admission.map((item) => item.order),
    Array.from({ length: ledgerBenchProgram.task_admission.length }, (_, index) => index + 1),
  );
  assert.equal(ledgerBenchProgram.task_admission.at(-1)?.id, "admission");
  assert.equal(ledgerBenchProgram.split_policy.primary_splits_are_exclusive, true);
  assert.equal(ledgerBenchProgram.split_policy.splits.filter((item) => item.visibility === "public").length, 1);
  assert.equal(ledgerBenchProgram.split_policy.splits.find((item) => item.visibility === "public")?.id, "development");

  const submissionStatuses = new Set(ledgerBenchProgram.submission_program.statuses.map((item) => item.id));
  for (const status of ledgerBenchProgram.submission_program.official_default) {
    assert.ok(submissionStatuses.has(status), `unknown official-default status ${status}`);
  }
  assert.deepEqual(ledgerBenchProgram.submission_program.official_default, ["verified", "audited"]);

  const trackIds = new Set(ledgerBenchProgram.tracks.map((item) => item.id));
  for (const item of ledgerBenchProgram.first_release.episode_plan) {
    if (item.track !== "development") assert.ok(trackIds.has(item.track), `unknown first-release track ${item.track}`);
  }
  assert.ok(ledgerBenchProgram.first_release.minimum_operating_models >= 3);
  assert.ok(ledgerBenchProgram.first_release.minimum_organizational_contexts >= 3);

  for (const precedent of ledgerBenchProgram.precedents) {
    assert.equal(new URL(precedent.source).protocol, "https:", precedent.id);
  }
  assert.ok(ledgerBenchProgram.launch_gates.length >= 8);
  assert.equal(ledgerBenchProgram.provenance.review_process.includes("Preview"), true);

  return {
    id: ledgerBenchProgram.id,
    version: ledgerBenchProgram.version,
    status: ledgerBenchProgram.status,
    products: ledgerBenchProgram.products.length,
    tracks: ledgerBenchProgram.tracks.length,
    divisions: ledgerBenchProgram.divisions.length,
    capability_dimensions: ledgerBenchProgram.capability_dimensions.length,
    hard_gates: ledgerBenchProgram.hard_gates.length,
    admission_stages: ledgerBenchProgram.task_admission.length,
    splits: ledgerBenchProgram.split_policy.splits.length,
    precedents: ledgerBenchProgram.precedents.length,
    validation: "passed",
  };
}

try {
  process.stdout.write(`${JSON.stringify(validate(), null, 2)}\n`);
} catch (error) {
  process.stderr.write(`LedgerBench validation failed: ${error.message}\n`);
  process.exitCode = 1;
}
