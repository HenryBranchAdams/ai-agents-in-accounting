import { readSnapshotHistory } from "../scripts/snapshot-history.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { meta, getRecord } from "../dist/internal/corpus.mjs";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

test("AA-INT97 preserves the accepted education package and prior history while adding agriculture", () => {
  assert.equal(meta.corpus_version, read("data/catalog.json").corpus_version);
  for (const id of [
    "guide-us-education-tuition-aid",
    "example-us-education-tuition-aid-clearing",
    "src_education_fsa_2526_disbursement",
    "src_education_fsa_2526_withdrawal",
    "guide-i97-crop-producer",
    "guide-i97-harvesting-contractor",
    "guide-i97-resource-dispositions",
  ]) assert.ok(getRecord(id), `${id}: canonical record missing`);

  assert.ok(fs.existsSync("data/research/education-2026-09-18.json"));
  assert.ok(fs.existsSync("tests/education.test.mjs"));
  for (const file of [
    "docs/research/aa-i111-delivery-2026-09-18.md",
    "docs/research/aa-i111-research-notes-2026-09-18.md",
    "docs/research/orchestration-handoff-2026-09-17.md",
    "docs/research/us-backlog-execution-2026-09-16.md",
  ]) assert.ok(fs.existsSync(file), `${file}: preserved public document missing`);

  const releases = read("data/releases/index.json");
  assert.equal(releases.current_version, meta.corpus_version);
  for (const version of ["2026-09-18.97", "2026-09-18.111", "2026-09-18.1111", "2026-09-19.1112", "2026-09-19.1113", "2026-09-19.1114", "2026-09-19.1115", "2026-09-19.9804", "2026-09-19.12401", "2026-09-19.12402"]) {
    assert.ok(releases.versions.includes(version), `${version}: release missing`);
    assert.ok(fs.existsSync(`data/releases/${version}/manifest.json`), `${version}: manifest missing`);
  }

  const snapshots = readSnapshotHistory().snapshots;
  for (const version of ["2026-09-18.97", "2026-09-18.111", "2026-09-18.1111", "2026-09-19.1112", "2026-09-19.1113", "2026-09-19.1114", "2026-09-19.1115", "2026-09-19.9804", "2026-09-19.12401", "2026-09-19.12402"]) {
    assert.ok(snapshots.some((snapshot) => snapshot.id === version), `${version}: snapshot missing`);
  }
  assert.equal(read("data/coverage/research-questions.json").question_set_version, meta.corpus_version);
  assert.equal(read("data/coverage/assessments.json").assessment_version, meta.corpus_version);
  assert.equal(read("data/coverage/mapping-overrides.json").mapping_version, meta.corpus_version);
  assert.equal(crypto.createHash("sha256").update(fs.readFileSync("data/research/agriculture-i97.json")).digest("hex"), "2d0ecce7ca5538339a8bad54bcbb39e5d1dcf018abd01f8460ce017ba06f5ece");
});
