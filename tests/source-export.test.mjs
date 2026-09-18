import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  allSourceFiles,
  SOURCE_EXPORT_MANIFEST_NAME,
  SOURCE_PART_LIMIT_BYTES,
  readSourceArchiveMembers,
  sourceFiles,
  writeSourceExport,
} from "../scripts/source-archive.mjs";

const manifestPath = path.resolve("dist/client/downloads", SOURCE_EXPORT_MANIFEST_NAME);
const readManifest = (directory = path.dirname(manifestPath)) =>
  JSON.parse(fs.readFileSync(path.join(directory, SOURCE_EXPORT_MANIFEST_NAME), "utf8"));
const copyExport = (destination) => {
  fs.mkdirSync(destination, { recursive: true });
  const manifest = readManifest();
  fs.copyFileSync(manifestPath, path.join(destination, SOURCE_EXPORT_MANIFEST_NAME));
  for (const part of manifest.parts) {
    fs.copyFileSync(
      path.join(path.dirname(manifestPath), part.name),
      path.join(destination, part.name),
    );
  }
  return manifest;
};
const digest = (body) => createHash("sha256").update(body).digest("hex");

test("multipart source export reconstructs in a clean temp directory with complete membership", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "accounting-agents-source-export-"));
  try {
    const manifest = copyExport(root);
    assert.equal(manifest.mode, "multipart");
    const output = path.join(root, "reconstructed-accounting-agents-source.zip");
    const result = execFileSync(
      process.execPath,
      ["scripts/reconstruct-source-archive.mjs", path.join(root, SOURCE_EXPORT_MANIFEST_NAME), output],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    const summary = JSON.parse(result);
    const archive = fs.readFileSync(output);
    assert.equal(summary.archive_bytes, archive.length);
    assert.equal(summary.archive_sha256, digest(archive));
    assert.equal(digest(archive), manifest.archive_sha256);
    assert.deepEqual(
      readSourceArchiveMembers(archive),
      manifest.source_membership
        .filter((entry) => entry.included)
        .map(({ path: file, bytes, sha256 }) => ({ path: file, bytes, sha256 })),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("source reconstruction rejects a missing part and a corrupted part", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "accounting-agents-source-failure-"));
  try {
    const manifest = copyExport(root);
    const script = path.resolve("scripts/reconstruct-source-archive.mjs");
    const output = path.join(root, "reconstructed.zip");
    fs.rmSync(path.join(root, manifest.parts[0].name));
    assert.throws(
      () => execFileSync(process.execPath, [script, path.join(root, SOURCE_EXPORT_MANIFEST_NAME), output], { cwd: process.cwd(), stdio: "pipe" }),
      /Missing source export part/,
    );

    copyExport(root);
    const corruptedPath = path.join(root, manifest.parts[0].name);
    const corrupted = fs.readFileSync(corruptedPath);
    corrupted[0] ^= 0xff;
    fs.writeFileSync(corruptedPath, corrupted);
    assert.throws(
      () => execFileSync(process.execPath, [script, path.join(root, SOURCE_EXPORT_MANIFEST_NAME), output], { cwd: process.cwd(), stdio: "pipe" }),
      /SHA-256 does not match/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("source export generation is deterministic, cleans only generated stale parts, and keeps the single ZIP mode", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "accounting-agents-source-determinism-"));
  const first = path.join(root, "first");
  const second = path.join(root, "second");
  try {
    const firstManifest = writeSourceExport(first);
    fs.writeFileSync(path.join(first, "accounting-agents-source.zip.part-999"), "stale");
    fs.writeFileSync(path.join(first, "keep.txt"), "unrelated");
    const replayManifest = writeSourceExport(first);
    const secondManifest = writeSourceExport(second);
    assert.deepEqual(replayManifest, firstManifest);
    assert.deepEqual(secondManifest, firstManifest);
    for (const name of [SOURCE_EXPORT_MANIFEST_NAME, ...firstManifest.parts.map((part) => part.name)]) {
      assert.deepEqual(fs.readFileSync(path.join(first, name)), fs.readFileSync(path.join(second, name)), name);
    }
    assert.equal(fs.existsSync(path.join(first, "accounting-agents-source.zip.part-999")), false);
    assert.equal(fs.readFileSync(path.join(first, "keep.txt"), "utf8"), "unrelated");

    const single = path.join(root, "single");
    const singleManifest = writeSourceExport(single, { hostLimitBytes: firstManifest.archive_bytes + 1 });
    assert.equal(singleManifest.mode, "single");
    assert.equal(singleManifest.parts.length, 0);
    assert.ok(fs.existsSync(path.join(single, "accounting-agents-source.zip")));
    assert.equal(
      fs.statSync(path.join(single, "accounting-agents-source.zip")).size,
      singleManifest.archive_bytes,
    );
    assert.ok(SOURCE_PART_LIMIT_BYTES < singleManifest.host_limit_bytes);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("current source export inventory covers every promised file and preserves historical release bytes", () => {
  const manifest = readManifest();
  assert.deepEqual(manifest.source_membership.map((entry) => entry.path), allSourceFiles());
  assert.deepEqual(
    manifest.source_membership.filter((entry) => entry.included).map((entry) => entry.path),
    sourceFiles(),
  );
  assert.deepEqual(
    manifest.source_membership.filter((entry) => !entry.included).map((entry) => entry.path),
    [`data/releases/${manifest.corpus_version}/corpus.json.gz`],
  );
  for (const entry of fs.readdirSync("data/releases", { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === manifest.corpus_version) continue;
    const releaseGzip = `data/releases/${entry.name}/corpus.json.gz`;
    if (fs.existsSync(releaseGzip))
      assert.ok(manifest.source_membership.some((member) => member.path === releaseGzip && member.included));
  }
});
