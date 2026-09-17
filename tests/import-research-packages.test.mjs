import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repository = process.cwd();
const packageBatches = new Set(["foundations", "industries", "jurisdictions", "empirical"]);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const read = (root, file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const write = (root, file, value) => fs.writeFileSync(path.join(root, file), JSON.stringify(value, null, 2) + "\n");
const bytes = (root, file) => fs.readFileSync(path.join(root, file));
const mutableOutputs = [
  "data/corpus/source.json",
  "data/corpus/guide.json",
  "data/coverage/mapping-overrides.json",
  "data/coverage/research-questions.json",
  "data/coverage/record-mappings.json",
  "data/research/source-aliases.json",
];

function linkStaticDirectory(sourceDirectory, targetDirectory, copiedFiles) {
  fs.mkdirSync(targetDirectory, { recursive: true });
  for (const entry of fs.readdirSync(sourceDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const source = path.join(sourceDirectory, entry.name);
    const target = path.join(targetDirectory, entry.name);
    if (copiedFiles.has(entry.name)) fs.copyFileSync(source, target);
    else fs.symlinkSync(source, target);
  }
}

function linkFile(root, relativePath) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.symlinkSync(path.join(repository, relativePath), target);
}

function createFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "accounting-research-import-"));
  linkStaticDirectory(path.join(repository, "data/corpus"), path.join(root, "data/corpus"), new Set(["source.json", "guide.json"]));
  linkStaticDirectory(path.join(repository, "data/coverage"), path.join(root, "data/coverage"), new Set(["mapping-overrides.json", "research-questions.json", "record-mappings.json"]));
  fs.mkdirSync(path.join(root, "data/research"), { recursive: true });
  for (const entry of fs.readdirSync(path.join(repository, "data/research"), { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".json")) fs.copyFileSync(path.join(repository, "data/research", entry.name), path.join(root, "data/research", entry.name));
  }
  fs.mkdirSync(path.join(root, "data/reviews"), { recursive: true });
  for (const entry of fs.readdirSync(path.join(repository, "data/reviews"), { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".json")) fs.symlinkSync(path.join(repository, "data/reviews", entry.name), path.join(root, "data/reviews", entry.name));
  }
  for (const file of [
    "data/catalog.json",
    "data/migration.json",
    "data/relationships.json",
    "data/source-observations.json",
    "data/vocabulary.json",
    "schemas",
    "src",
    "scripts",
  ]) linkFile(root, file);
  return root;
}

function run(root, args, label) {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  assert.equal(result.status, 0, `${label} failed: ${JSON.stringify({status: result.status, error: result.error?.message, stderr: result.stderr, stdout: result.stdout})}`);
  return result;
}

function runImporter(root) {
  const result = run(root, ["scripts/import-research-packages.mjs"], "research package importer");
  return JSON.parse(result.stdout);
}

function runReplay(root) {
  const output = runImporter(root);
  run(root, ["scripts/coverage-mappings.mjs"], "coverage mapping replay");
  run(root, ["scripts/validate.mjs"], "corpus and coverage validation");
  return output;
}

function packageReview(source, packageName, url) {
  return source.data.supplemental_reviews.find((review) => review.batch === packageName && review.checked_url === url);
}

function withoutSupplementalReviews(source) {
  const data = { ...(source.data || {}) };
  delete data.supplemental_reviews;
  return { ...source, data };
}

function snapshots(root) {
  return new Map(mutableOutputs.map((file) => [file, bytes(root, file)]));
}

function assertByteStable(root, before, message) {
  for (const [file, expected] of before) assert.deepEqual(bytes(root, file), expected, `${message}: ${file}`);
}

function assertReviewedMappingsAreSubstantiated(root) {
  const overrides = read(root, "data/coverage/mapping-overrides.json");
  for (const [recordId, override] of Object.entries(overrides.records)) {
    const reviewed = [...(override.reviewed_question_ids || []), ...(override.reviewed_industry_codes || [])];
    if (!reviewed.length) continue;
    assert.match(override.reviewed_at || "", datePattern, `${recordId}: reviewed mapping date`);
    assert.ok(override.review_note, `${recordId}: reviewed mapping note`);
  }
}

test("research package replay validates the full clean corpus and is idempotent", () => {
  const root = createFixture();
  try {
    const beforeSources = read(root, "data/corpus/source.json");
    const beforePrimary = new Map(beforeSources.map((source) => [source.id, withoutSupplementalReviews(source)]));
    const nonPackageReviews = new Map(beforeSources.map((source) => [source.id, (source.data?.supplemental_reviews || [])
      .filter((review) => !packageBatches.has(review.batch))]));
    const empirical = read(root, "data/research/empirical.json");

    const output = runReplay(root);
    const afterSources = read(root, "data/corpus/source.json");
    const registry = read(root, "data/coverage/research-questions.json");
    const guides = read(root, "data/corpus/guide.json");
    const aliases = read(root, "data/research/source-aliases.json");
    const guide = guides.find((record) => record.id === "guide-independent-deployment-evidence");

    assert.equal(output.preserved_newer_metadata, 0);
    assert.deepEqual(output.changes.guide_records, []);
    assert.deepEqual(output.changes.registry_rows, []);
    assert.deepEqual(output.changes.registry_fields, []);
    assert.ok(output.changes.source_records.length > 0);
    assert.ok(output.changes.mapping_records.length > 0);
    assert.equal(registry.question_set_version, empirical.version);
    assert.equal(registry.reviewed_at, empirical.reviewed_at);
    assert.equal(guide.data.version, empirical.version);
    assert.equal(aliases.src_roadmap_naics2022, "src_roadmap_naics2022_manual");
    assert.equal(aliases.src_roadmap_naics_311, "src_roadmap_naics2022_manual");
    assertReviewedMappingsAreSubstantiated(root);

    for (const source of afterSources) {
      assert.deepEqual(withoutSupplementalReviews(source), beforePrimary.get(source.id), `Primary provenance changed for ${source.id}`);
      for (const review of source.data?.supplemental_reviews || []) {
        if (review.review_level && review.batch === "empirical") assert.match(review.reviewed_at || "", datePattern);
      }
    }
    for (const input of empirical.sources) {
      const canonicalId = aliases[input.id] || input.id;
      const source = afterSources.find((record) => record.id === canonicalId);
      assert.ok(source, `Missing canonical source for ${input.id}`);
      const review = packageReview(source, "empirical", input.source_url);
      assert.ok(review, `Missing replayed empirical review for ${input.id}`);
      assert.equal(review.reviewed_at, empirical.reviewed_at);
      assert.equal(review.review_level, input.review_level);
    }
    for (const [id, reviews] of nonPackageReviews) {
      const replayed = (afterSources.find((source) => source.id === id)?.data?.supplemental_reviews || [])
        .filter((review) => !packageBatches.has(review.batch));
      assert.deepEqual(replayed, reviews, `Non-package supplemental review changed for ${id}`);
    }

    const afterFirstReplay = snapshots(root);
    runReplay(root);
    assertByteStable(root, afterFirstReplay, "Repeat replay changed canonical output");
    assert.equal(read(root, "data/coverage/mapping-overrides.json").records.src_oracle26b_journal_headers, undefined);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("replay preserves nested guide, mapping, registry, undated, and same-date metadata", () => {
  const root = createFixture();
  try {
    const guides = read(root, "data/corpus/guide.json");
    const guide = guides.find((record) => record.id === "guide-independent-deployment-evidence");
    guide.data.replay_marker = { owner: "canonical", nested: { keep: true } };
    guide.data.research_questions[0].replay_marker = { question: "keep" };
    write(root, "data/corpus/guide.json", guides);

    const overrides = read(root, "data/coverage/mapping-overrides.json");
    overrides.records[guide.id].replay_marker = { owner: "mapping", nested: { keep: true } };
    write(root, "data/coverage/mapping-overrides.json", overrides);

    const registry = read(root, "data/coverage/research-questions.json");
    registry.replay_marker = { owner: "registry", nested: { keep: true } };
    registry.questions[0].replay_marker = { row: "keep" };
    write(root, "data/coverage/research-questions.json", registry);

    const empirical = read(root, "data/research/empirical.json");
    empirical.version = "2026-09-17.1273";
    write(root, "data/research/empirical.json", empirical);

    const sources = read(root, "data/corpus/source.json");
    const undated = sources.find((record) => record.id === "src_1l0q90c");
    const undatedReview = packageReview(undated, "empirical", "https://arxiv.org/abs/2304.11771");
    delete undatedReview.reviewed_at;
    undatedReview.replay_marker = { date: "undated", nested: { keep: true } };
    const sameDate = sources.find((record) => record.id === "src_1v8cm5i");
    const sameDateReview = packageReview(sameDate, "empirical", "https://www.microsoft.com/en/customers/story/20600-us-venture-microsoft-365-copilot-for-finance");
    sameDateReview.replay_marker = { date: "same-date", nested: { keep: true } };
    write(root, "data/corpus/source.json", sources);

    const first = runReplay(root);
    const afterGuide = read(root, "data/corpus/guide.json").find((record) => record.id === guide.id);
    const afterOverrides = read(root, "data/coverage/mapping-overrides.json");
    const afterRegistry = read(root, "data/coverage/research-questions.json");
    const afterSources = read(root, "data/corpus/source.json");
    const afterUndated = packageReview(afterSources.find((record) => record.id === undated.id), "empirical", undatedReview.checked_url);
    const afterSameDate = packageReview(afterSources.find((record) => record.id === sameDate.id), "empirical", sameDateReview.checked_url);

    assert.ok(first.preserved_newer_metadata >= 1);
    assert.deepEqual(afterGuide.data.replay_marker, { owner: "canonical", nested: { keep: true } });
    assert.deepEqual(afterGuide.data.research_questions[0].replay_marker, { question: "keep" });
    assert.deepEqual(afterOverrides.records[guide.id].replay_marker, { owner: "mapping", nested: { keep: true } });
    assert.deepEqual(afterRegistry.replay_marker, { owner: "registry", nested: { keep: true } });
    assert.deepEqual(afterRegistry.questions[0].replay_marker, { row: "keep" });
    assert.equal(afterUndated.reviewed_at, "2026-09-17");
    assert.deepEqual(afterUndated.replay_marker, { date: "undated", nested: { keep: true } });
    assert.deepEqual(afterSameDate.replay_marker, { date: "same-date", nested: { keep: true } });

    const afterFirstReplay = snapshots(root);
    runReplay(root);
    assertByteStable(root, afterFirstReplay, "Marker replay changed canonical output on repeat");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("replay preserves newer canonical metadata and reports only bounded conflicts", () => {
  const root = createFixture();
  try {
    const registry = read(root, "data/coverage/research-questions.json");
    registry.question_set_version = "2026-09-18.9";
    registry.corpus_version = "2026-09-18.9";
    registry.reviewed_at = "2026-09-18";
    write(root, "data/coverage/research-questions.json", registry);

    const guides = read(root, "data/corpus/guide.json");
    const guide = guides.find((record) => record.id === "guide-independent-deployment-evidence");
    guide.data.version = "2026-09-18.9";
    guide.reviewed_at = "2026-09-18";
    guide.data.replay_marker = { owner: "newer-guide" };
    write(root, "data/corpus/guide.json", guides);

    const overrides = read(root, "data/coverage/mapping-overrides.json");
    overrides.records[guide.id].reviewed_at = "2026-09-18";
    overrides.records[guide.id].replay_marker = { owner: "newer-mapping" };
    const sourceOverride = overrides.records.src_1sbtyzp;
    sourceOverride.reviewed_at = "2026-09-18";
    sourceOverride.replay_marker = { owner: "newer-source-mapping" };
    write(root, "data/coverage/mapping-overrides.json", overrides);

    const sources = read(root, "data/corpus/source.json");
    const source = sources.find((record) => record.id === "src_1sbtyzp");
    const currentReview = packageReview(source, "empirical", "https://onlinelibrary.wiley.com/doi/abs/10.1111/1475-679x.70052");
    currentReview.reviewed_at = "2026-09-18";
    currentReview.preservation_marker = "keep-newer-state";
    write(root, "data/corpus/source.json", sources);

    const output = runReplay(root);
    const afterRegistry = read(root, "data/coverage/research-questions.json");
    const afterGuide = read(root, "data/corpus/guide.json").find((record) => record.id === guide.id);
    const afterOverrides = read(root, "data/coverage/mapping-overrides.json");
    const afterSource = read(root, "data/corpus/source.json").find((record) => record.id === source.id);
    const afterReview = packageReview(afterSource, "empirical", currentReview.checked_url);

    assert.ok(output.preserved_newer_metadata >= 4);
    assert.ok(output.conflicts.some((conflict) => conflict.target === "research-questions:question_set_version"));
    assert.equal(afterRegistry.question_set_version, "2026-09-18.9");
    assert.equal(afterRegistry.corpus_version, "2026-09-18.9");
    assert.equal(afterRegistry.reviewed_at, "2026-09-18");
    assert.equal(afterGuide.data.version, "2026-09-18.9");
    assert.equal(afterGuide.reviewed_at, "2026-09-18");
    assert.deepEqual(afterGuide.data.replay_marker, { owner: "newer-guide" });
    assert.equal(afterOverrides.records[guide.id].reviewed_at, "2026-09-18");
    assert.deepEqual(afterOverrides.records[guide.id].replay_marker, { owner: "newer-mapping" });
    assert.equal(afterOverrides.records.src_1sbtyzp.reviewed_at, "2026-09-18");
    assert.deepEqual(afterOverrides.records.src_1sbtyzp.replay_marker, { owner: "newer-source-mapping" });
    assert.equal(afterReview.reviewed_at, "2026-09-18");
    assert.equal(afterReview.preservation_marker, "keep-newer-state");
    assertReviewedMappingsAreSubstantiated(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
