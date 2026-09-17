import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repository = process.cwd();
const read = (root, file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const write = (root, file, value) => fs.writeFileSync(path.join(root, file), JSON.stringify(value, null, 2) + "\n");

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

function createFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "accounting-research-import-"));
  linkStaticDirectory(path.join(repository, "data/corpus"), path.join(root, "data/corpus"), new Set(["source.json", "guide.json"]));
  linkStaticDirectory(path.join(repository, "data/coverage"), path.join(root, "data/coverage"), new Set(["mapping-overrides.json", "research-questions.json"]));
  fs.mkdirSync(path.join(root, "data/research"), { recursive: true });
  for (const entry of fs.readdirSync(path.join(repository, "data/research"), { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".json")) fs.copyFileSync(path.join(repository, "data/research", entry.name), path.join(root, "data/research", entry.name));
  }
  fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
  fs.copyFileSync(path.join(repository, "scripts/import-research-packages.mjs"), path.join(root, "scripts/import-research-packages.mjs"));
  return root;
}

function runImporter(root) {
  const result = spawnSync(process.execPath, ["scripts/import-research-packages.mjs"], { cwd: root, encoding: "utf8" });
  assert.ok(result.status === 0, JSON.stringify({ status: result.status, error: result.error?.message, stderr: result.stderr, stdout: result.stdout }));
  return JSON.parse(result.stdout);
}

function packageReview(source, packageName, url) {
  return source.data.supplemental_reviews.find((review) => review.batch === packageName && review.checked_url === url);
}

test("research package importer replays the current packages without legacy metadata downgrade", () => {
  const root = createFixture();
  try {
    const beforeRegistry = read(root, "data/coverage/research-questions.json");
    const beforeSources = read(root, "data/corpus/source.json");
    const nonPackageReviews = new Map(beforeSources.map((source) => [source.id, (source.data?.supplemental_reviews || [])
      .filter((review) => !["foundations", "industries", "jurisdictions", "empirical"].includes(review.batch))]));
    const empirical = read(root, "data/research/empirical.json");
    const output = runImporter(root);
    const registry = read(root, "data/coverage/research-questions.json");
    const guides = read(root, "data/corpus/guide.json");
    const sources = read(root, "data/corpus/source.json");
    const aliases = read(root, "data/research/source-aliases.json");
    const guide = guides.find((record) => record.id === "guide-independent-deployment-evidence");

    assert.equal(output.preserved_newer_metadata, 0);
    assert.equal(registry.question_set_version, empirical.version);
    assert.equal(registry.corpus_version, beforeRegistry.corpus_version);
    assert.equal(registry.reviewed_at, empirical.reviewed_at);
    assert.equal(guide.data.version, empirical.version);
    assert.equal(guide.reviewed_at, empirical.reviewed_at);
    assert.equal(aliases.src_roadmap_naics2022, "src_roadmap_naics2022_manual");
    assert.equal(aliases.src_roadmap_naics_311, "src_roadmap_naics2022_manual");

    for (const input of empirical.sources) {
      const canonicalId = aliases[input.id] || input.id;
      const source = sources.find((record) => record.id === canonicalId);
      assert.ok(source, `Missing canonical source for ${input.id}`);
      const review = packageReview(source, "empirical", input.source_url);
      assert.ok(review, `Missing replayed empirical review for ${input.id}`);
      assert.equal(review.reviewed_at, empirical.reviewed_at);
      assert.equal(review.review_level, input.review_level);
    }
    for (const [id, reviews] of nonPackageReviews) {
      const replayed = (sources.find((source) => source.id === id)?.data?.supplemental_reviews || [])
        .filter((review) => !["foundations", "industries", "jurisdictions", "empirical"].includes(review.batch));
      assert.deepEqual(replayed, reviews, `Non-package supplemental review changed for ${id}`);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("research package importer preserves newer canonical metadata and reports conflicts", () => {
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
    write(root, "data/corpus/guide.json", guides);

    const overrides = read(root, "data/coverage/mapping-overrides.json");
    overrides.records[guide.id].reviewed_at = "2026-09-18";
    write(root, "data/coverage/mapping-overrides.json", overrides);

    const sources = read(root, "data/corpus/source.json");
    const source = sources.find((record) => record.id === "src_1sbtyzp");
    source.reviewed_at = "2026-09-18";
    const currentReview = packageReview(source, "empirical", "https://onlinelibrary.wiley.com/doi/abs/10.1111/1475-679x.70052");
    currentReview.reviewed_at = "2026-09-18";
    currentReview.preservation_marker = "keep-newer-state";
    write(root, "data/corpus/source.json", sources);

    const output = runImporter(root);
    const afterRegistry = read(root, "data/coverage/research-questions.json");
    const afterGuide = read(root, "data/corpus/guide.json").find((record) => record.id === guide.id);
    const afterOverrides = read(root, "data/coverage/mapping-overrides.json");
    const afterSource = read(root, "data/corpus/source.json").find((record) => record.id === source.id);
    const afterReview = packageReview(afterSource, "empirical", currentReview.checked_url);

    assert.ok(output.preserved_newer_metadata >= 5);
    assert.ok(output.conflicts.some((conflict) => conflict.target === "research-questions:question_set_version"));
    assert.equal(afterRegistry.question_set_version, "2026-09-18.9");
    assert.equal(afterRegistry.corpus_version, "2026-09-18.9");
    assert.equal(afterRegistry.reviewed_at, "2026-09-18");
    assert.equal(afterGuide.data.version, "2026-09-18.9");
    assert.equal(afterGuide.reviewed_at, "2026-09-18");
    assert.equal(afterOverrides.records[guide.id].reviewed_at, "2026-09-18");
    assert.equal(afterSource.reviewed_at, "2026-09-18");
    assert.equal(afterReview.reviewed_at, "2026-09-18");
    assert.equal(afterReview.preservation_marker, "keep-newer-state");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
