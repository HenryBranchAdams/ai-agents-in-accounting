import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import { pathToFileURL } from "node:url";

export const packetFile = "data/research/government-2026-09-19.json";

export function applyToRoot(root, { expectedVersion, dryRun = false } = {}) {
  const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
  const packet = read(packetFile);
  const catalog = read("data/catalog.json");
  assert.equal(packet.status, "source-only-pending-integration");
  assert.equal(
    catalog.corpus_version,
    expectedVersion || packet.current_corpus_version,
    "Refuse unexpected government source integration edition before writes",
  );
  assert.equal(packet.integration_contract.catalog_write, false);
  assert.equal(packet.integration_contract.release_write, false);
  assert.equal(packet.integration_contract.snapshot_write, false);

  const stage = new Map();
  const index = new Map();
  for (const name of fs.readdirSync(path.join(root, "data/corpus")).filter((n) => n.endsWith(".json"))) {
    const file = `data/corpus/${name}`;
    const rows = read(file);
    stage.set(file, rows);
    for (const row of rows) {
      assert.ok(!index.has(row.id), `Duplicate stable record ${row.id}`);
      index.set(row.id, row);
    }
  }
  const sourceUrls = new Map(
    [...index.values()]
      .filter((row) => row.kind === "source" && row.source_url)
      .map((row) => [row.source_url, row.id]),
  );
  const add = (rows, row, label) => {
    const old = rows.find((candidate) => candidate.id === row.id);
    assert.ok(
      !old || isDeepStrictEqual(old, row),
      `Government preflight conflict: ${label}:${row.id}`,
    );
    if (!old) rows.push(structuredClone(row));
  };

  for (const row of [...packet.sources, ...packet.records]) {
    const file = `data/corpus/${row.kind}.json`;
    assert.ok(stage.has(file), `Unsupported government record kind ${row.kind}`);
    if (row.kind === "source") {
      assert.ok(
        !sourceUrls.has(row.source_url) || sourceUrls.get(row.source_url) === row.id,
        `Government source URL identity conflict: ${row.id}`,
      );
      sourceUrls.set(row.source_url, row.id);
      for (const locator of row.data.locators || row.data.source_locators || []) {
        if (locator.url) assert.equal(locator.url, row.source_url, `${row.id}: locator URL identity`);
      }
    }
    add(stage.get(file), row, "record");
    index.set(row.id, row);
  }
  for (const row of [...packet.sources, ...packet.records]) {
    for (const sourceId of row.source_ids) {
      assert.equal(index.get(sourceId)?.kind, "source", `${row.id}: missing source ${sourceId}`);
    }
    for (const relatedId of row.related_ids) {
      assert.ok(index.has(relatedId), `${row.id}: missing related record ${relatedId}`);
    }
  }
  const examples = new Set(
    packet.records.filter((row) => row.kind === "example").map((row) => row.id),
  );
  for (const question of packet.question_rows) {
    const guide = index.get(question.record_id);
    assert.equal(guide?.kind, "guide", `${question.id}: missing guide`);
    const pointed = question.pointer
      .split("/")
      .slice(1)
      .reduce((node, key) => node?.[key], guide);
    assert.deepEqual(pointed, question, `${question.id}: embedded question pointer differs`);
    assert.ok(examples.has(question.example_id), `${question.id}: missing example`);
    for (const locator of question.source_locators) {
      assert.equal(index.get(locator.source_id)?.kind, "source", `${question.id}: missing locator source`);
      assert.equal(locator.url, index.get(locator.source_id).source_url, `${question.id}: locator URL mismatch`);
      assert.ok(locator.effective_period && locator.access_limits, `${question.id}: incomplete locator limits`);
    }
  }

  const questionsFile = "data/coverage/research-questions.json";
  const questions = read(questionsFile);
  for (const question of packet.question_rows) add(questions.questions, question, "question");
  stage.set(questionsFile, questions);
  const assessmentsFile = "data/coverage/assessments.json";
  const assessments = read(assessmentsFile);
  for (const assessment of packet.assessments) add(assessments.assessments, assessment, "assessment");
  stage.set(assessmentsFile, assessments);
  const criteriaFile = "data/coverage/research-criteria.json";
  const criteria = read(criteriaFile);
  criteria.population.named_research_questions = questions.questions.length;
  stage.set(criteriaFile, criteria);
  const mappingsFile = "data/coverage/mapping-overrides.json";
  const mappings = read(mappingsFile);
  for (const [id, row] of Object.entries(packet.mapping_overrides)) {
    assert.ok(!mappings.records[id] || isDeepStrictEqual(mappings.records[id], row), `Government mapping conflict: ${id}`);
    mappings.records[id] = row;
  }
  stage.set(mappingsFile, mappings);

  let changed = 0;
  if (!dryRun) {
    for (const [file, value] of stage) {
      const old = fs.readFileSync(path.join(root, file), "utf8");
      const next = JSON.stringify(value, null, 2) + "\n";
      if (old !== next) {
        fs.writeFileSync(path.join(root, file), next);
        changed += 1;
      }
    }
  } else {
    for (const [file, value] of stage) {
      if (fs.readFileSync(path.join(root, file), "utf8") !== JSON.stringify(value, null, 2) + "\n") changed += 1;
    }
  }
  return { dryRun, changed, records: packet.records.length, questions: packet.question_rows.length, assessments: packet.assessments.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const value = (flag) => {
    const index = process.argv.indexOf(flag);
    return index < 0 ? undefined : process.argv[index + 1];
  };
  console.log(JSON.stringify(applyToRoot(value("--root") || process.cwd(), {
    expectedVersion: value("--expected-version"),
    dryRun: process.argv.includes("--dry-run"),
  }), null, 2));
}
