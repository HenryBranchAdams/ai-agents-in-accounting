import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { gunzipSync } from "node:zlib";

const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const corpusDirectory = "data/corpus";
const corpusFiles = fs.readdirSync(corpusDirectory).filter(file => file.endsWith(".json")).sort();
const canonical = corpusFiles.flatMap(file => {
  const records = read(`${corpusDirectory}/${file}`);
  assert.ok(Array.isArray(records), `${file} must contain a record array`);
  return records;
});
const byId = new Map(canonical.map(record => [record.id, record]));

test("AA-I119 and AA-I125 preserve canonical IDs without collisions or lost nonprofit records", () => {
  assert.equal(canonical.length, 1095);
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

test("2026-09-17.2 release and snapshot match the corrected canonical build", () => {
  const index = read("data/releases/index.json");
  assert.equal(index.current_version, "2026-09-17.2");
  assert.deepEqual(index.versions.slice(-2), ["2026-09-17.1", "2026-09-17.2"]);

  const currentRelease = "data/releases/2026-09-17.2";
  const currentBytes = fs.readFileSync(`${currentRelease}/corpus.json`);
  assert.deepEqual(currentBytes, fs.readFileSync("dist/client/downloads/corpus.json"));
  assert.deepEqual(gunzipSync(fs.readFileSync(`${currentRelease}/corpus.json.gz`)), currentBytes);

  const priorRelease = "data/releases/2026-09-17.1";
  const priorBytes = fs.readFileSync(`${priorRelease}/corpus.json`);
  assert.deepEqual(gunzipSync(fs.readFileSync(`${priorRelease}/corpus.json.gz`)), priorBytes);

  const snapshot = read("data/coverage/snapshots.json").snapshots.find(item => item.id === "2026-09-17.2");
  assert.ok(snapshot);
  assert.equal(snapshot.summary.record_count, 1095);
  assert.equal(snapshot.summary.scoped_assessments, 8);
});
