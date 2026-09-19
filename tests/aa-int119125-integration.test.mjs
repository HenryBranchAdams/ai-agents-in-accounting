import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { gunzipSync } from "node:zlib";

const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const catalog = read("data/catalog.json");
const integrationFiles = [
  "data/catalog.json",
  "data/research/management-accounting-2026-09-17.json",
  "data/corpus/source.json",
  "data/corpus/guide.json",
  "data/corpus/example.json",
  "data/research/foundations.json",
  "data/coverage/research-questions.json",
  "data/coverage/mapping-overrides.json",
  "data/coverage/assessments.json",
  "data/research-questions.json",
  "data/releases/2026-09-17.3/corpus.json",
  "data/releases/2026-09-17.4/corpus.json",
];
const expectedAcceptedState = new Map(
  integrationFiles.map(file => [file, read(file)]),
);
const makeIntegrationHarness = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aa-r136-clean-integration-"));
  for (const file of integrationFiles) {
    const destination = path.join(root, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(file, destination);
  }
  const sourceFile = path.join(root, "data/corpus/source.json");
  const sourceRecords = read(sourceFile);
  assert.ok(sourceRecords.some(record => record.id === "src_far_31203_indirect_costs"));
  fs.writeFileSync(
    sourceFile,
    `${JSON.stringify(sourceRecords.filter(record => record.id !== "src_far_31203_indirect_costs"), null, 2)}\n`,
  );
  return root;
};
const assertAcceptedState = root => {
  for (const file of integrationFiles) {
    assert.deepEqual(
      read(path.join(root, file)),
      expectedAcceptedState.get(file),
      `${file}: first clean integration must preserve the accepted/current state`,
    );
  }
};
const corpusDirectory = "data/corpus";
const corpusFiles = fs.readdirSync(corpusDirectory).filter(file => file.endsWith(".json")).sort();
const canonical = corpusFiles.flatMap(file => {
  const records = read(`${corpusDirectory}/${file}`);
  assert.ok(Array.isArray(records), `${file} must contain a record array`);
  return records;
});
const byId = new Map(canonical.map(record => [record.id, record]));

test("AA-I119, AA-I125, and AA-I127 preserve canonical IDs without collisions or lost nonprofit records", () => {
  assert.equal(canonical.length, read("dist/client/downloads/corpus.json").exported_record_count);
  assert.equal(byId.size, canonical.length, "canonical record IDs must be globally unique");

  for (const id of [
    "guide-q-revenue",
    "guide-q-project-wip",
    "guide-q-purchasing-payables",
    "guide-q-receivables-credit",
    "guide-q-cash-settlement",
    "guide-q-inventory",
    "guide-q-cost-allocation",
    "guide-q-planning",
    "guide-q-performance",
    "src_nonprofit_fasb_2018_08",
    "src_nonprofit_fasb_2016_14",
    "src_nonprofit_irs_990_2025",
    "guide-us-nonprofit-contributions-close",
    "example-us-nonprofit-restricted-award-close",
  ]) assert.ok(byId.has(id), `expected preserved or integrated record ${id}`);

  for (const id of [
    "src_fasb_asu2016_08_principal_agent",
    "src_fasb_asu2015_11_inventory",
    "src_fasb_asu2016_13_credit_losses",
    "src_fasb_concepts8_elements",
    "src_fasb_bmho20241218_topic330",
    "example-us-operating-transactions-ledger",
    "example-us-project-wip-ledger",
    "example-us-management-allocation-budget-actual",
    "guide-q-cost-allocation",
    "guide-q-planning",
    "guide-q-performance",
  ]) assert.ok(byId.has(id), `expected accepted integration record ${id}`);
});

test("clean AA-I125 integration preserves the new FAR source supplemental review", () => {
  const root = makeIntegrationHarness();
  try {
    const script = path.resolve("scripts/integrate-management-accounting.mjs");
    assert.equal(
      read(path.join(root, "data/corpus/source.json")).some(record => record.id === "src_far_31203_indirect_costs"),
      false,
      "the regression must start with the new FAR source absent",
    );
    execFileSync(process.execPath, [script, "--integrate-into-newer-corpus"], { cwd: root, stdio: "pipe" });
    assertAcceptedState(root);
    const source = read(path.join(root, "data/corpus/source.json")).find(record => record.id === "src_far_31203_indirect_costs");
    const packet = read(path.join(root, "data/research/management-accounting-2026-09-17.json"));
    const update = packet.sources.find(candidate => candidate.id === "src_far_31203_indirect_costs");
    const expectedSource = expectedAcceptedState.get("data/corpus/source.json").find(record => record.id === "src_far_31203_indirect_costs");
    assert.ok(source, "clean integration must add the FAR source");
    assert.deepEqual(source.data.supplemental_reviews, expectedSource.data.supplemental_reviews);
    assert.deepEqual(source.data.supplemental_reviews.find(review => review.batch === packet.issue_id), {
      batch: packet.issue_id,
      reviewed_at: packet.reviewed_at,
      review_level: "substantive-excerpt",
      checked_url: update.checked_url,
      locator: update.source_locator,
      publication_or_edition: update.publication_or_edition,
      effective_period: update.effective_period,
      evidence_summary: update.evidence_summary,
      limitations: update.limitations,
      checks: [{ url: update.checked_url, method: "live page read", outcome: update.check_outcome, material_read: true }],
      rights_review: {
        status: "unresolved",
        license: null,
        license_url: null,
        scope: null,
        note: "Public accessibility does not establish reuse permission; external content remains under publisher terms.",
      },
    });
    const firstReplay = new Map(integrationFiles.map(file => [file, fs.readFileSync(path.join(root, file))]));
    execFileSync(process.execPath, [script, "--integrate-into-newer-corpus"], { cwd: root, stdio: "pipe" });
    for (const [file, bytes] of firstReplay) {
      assert.deepEqual(fs.readFileSync(path.join(root, file)), bytes, `${file}: repeat clean integration must be byte-stable`);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("clean AA-I125 integration is sensitive to new-source supplemental-review loss", () => {
  const root = makeIntegrationHarness();
  try {
    const script = path.resolve("scripts/integrate-management-accounting.mjs");
    const mutatedScript = path.join(root, "integrate-management-accounting.mjs");
    const original = fs.readFileSync(script, "utf8");
    const mutation = "supplemental_reviews: [\n        supplementalReview(update),\n        foundationSupplementalReview(update),\n      ].filter(Boolean),";
    assert.equal(original.split(mutation).length - 1, 1, "the mutation probe must target the new-source assignment");
    fs.writeFileSync(mutatedScript, original.replace(mutation, "supplemental_reviews: [foundationSupplementalReview(update)].filter(Boolean),"));
    execFileSync(process.execPath, [mutatedScript, "--integrate-into-newer-corpus"], { cwd: root, stdio: "pipe" });

    assert.throws(
      () => assertAcceptedState(root),
      /data\/corpus\/source\.json: first clean integration must preserve the accepted\/current state/,
      "the all-file invariant must fail when new-source supplemental review assignment is removed",
    );
    const expectedSource = expectedAcceptedState.get("data/corpus/source.json").find(record => record.id === "src_far_31203_indirect_costs");
    const mutatedSource = read(path.join(root, "data/corpus/source.json")).find(record => record.id === "src_far_31203_indirect_costs");
    assert.notDeepEqual(mutatedSource.data.supplemental_reviews, expectedSource.data.supplemental_reviews);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("current release and snapshot match the local capital-financing integration build", () => {
  const index = read("data/releases/index.json");
  assert.equal(index.current_version, catalog.corpus_version);
  assert.deepEqual(index.versions.slice(-4), ["2026-09-17.4", "2026-09-17.5", "2026-09-18.1", catalog.corpus_version]);

  const currentRelease = `data/releases/${catalog.corpus_version}`;
  const currentBytes = fs.readFileSync(`${currentRelease}/corpus.json`);
  assert.deepEqual(currentBytes, fs.readFileSync("dist/client/downloads/corpus.json"));
  assert.deepEqual(gunzipSync(fs.readFileSync(`${currentRelease}/corpus.json.gz`)), currentBytes);

  for (const priorRelease of ["data/releases/2026-09-17.1", "data/releases/2026-09-17.2", "data/releases/2026-09-17.3", "data/releases/2026-09-17.4"]) {
    const priorBytes = fs.readFileSync(`${priorRelease}/corpus.json`);
    assert.deepEqual(gunzipSync(fs.readFileSync(`${priorRelease}/corpus.json.gz`)), priorBytes);
  }

  const snapshot = read("data/coverage/snapshots.json").snapshots.find(item => item.id === catalog.corpus_version);
  assert.ok(snapshot);
  assert.equal(snapshot.summary.record_count, canonical.length);
  assert.equal(snapshot.summary.scoped_assessments, read("data/coverage/assessments.json").assessments.length);
  const collisionSnapshot = read("data/coverage/snapshots.json").snapshots.find(item => item.id === "2026-09-17.6");
  assert.ok(collisionSnapshot);
  assert.equal(collisionSnapshot.provenance.collision_snapshot_id, "2026-09-17.1");
  assert.deepEqual(
    collisionSnapshot.provenance.source_receipts.map(receipt => receipt.reviewed_head),
    [
      "0de408bf3f00928f41ac90d2c0b5ccde338b58e1",
      "f294a687ce48d5400daaa5d7a56bb90f6029cff",
    ],
  );
});
