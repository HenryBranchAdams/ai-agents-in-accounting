import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  allSourceFiles,
  createSourceArchive,
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
      [path.resolve("scripts/reconstruct-source-archive.mjs"), path.join(root, SOURCE_EXPORT_MANIFEST_NAME), output],
      { cwd: root, encoding: "utf8" },
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
      () => execFileSync(process.execPath, [script, path.join(root, SOURCE_EXPORT_MANIFEST_NAME), output], { cwd: root, stdio: "pipe" }),
      /Missing source export part/,
    );

    copyExport(root);
    const corruptedPath = path.join(root, manifest.parts[0].name);
    const corrupted = fs.readFileSync(corruptedPath);
    corrupted[0] ^= 0xff;
    fs.writeFileSync(corruptedPath, corrupted);
    assert.throws(
      () => execFileSync(process.execPath, [script, path.join(root, SOURCE_EXPORT_MANIFEST_NAME), output], { cwd: root, stdio: "pipe" }),
      /SHA-256 does not match/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

const fixtureSource = (root) => {
  const input = path.join(root, "input");
  const files = {
    "package.json": "{}", "package-lock.json": "{}", "tsconfig.json": "{}",
    "eslint.config.mjs": "export default []", "components.json": "{}", ".gitignore": "outputs/",
    "LICENSE": "Original test fixture", "README.md": "Deterministic fixture source",
    "data/catalog.json": JSON.stringify({ corpus_version: "2099-01-01.1" }),
    "data/releases/2098-01-01.1/corpus.json.gz": "historical bytes",
    "data/releases/2099-01-01.1/corpus.json.gz": "omitted duplicate",
    "src/nested/text.txt": "A small UTF-8 source: café\n",
    "public/binary.bin": Buffer.concat(Array.from({ length: 128 }, (_, i) => createHash("sha256").update(String(i)).digest())),
  };
  for (const [file, body] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(input, file)), { recursive: true });
    fs.writeFileSync(path.join(input, file), body);
  }
  return { root: input, partLimitBytes: 512, hostLimitBytes: 1024 };
};

test("source export generation is deterministic, cleans only generated stale parts, and keeps the single ZIP mode", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "accounting-agents-source-determinism-"));
  const first = path.join(root, "first");
  const second = path.join(root, "second");
  try {
    const options = fixtureSource(root);
    const firstManifest = writeSourceExport(first, options);
    assert.equal(firstManifest.mode, "multipart");
    assert.equal(firstManifest.corpus_version, "2099-01-01.1");
    fs.writeFileSync(path.join(first, "accounting-agents-source.zip.part-999"), "stale");
    fs.writeFileSync(path.join(first, "keep.txt"), "unrelated");
    const replayManifest = writeSourceExport(first, options);
    const secondManifest = writeSourceExport(second, options);
    assert.deepEqual(replayManifest, firstManifest);
    assert.deepEqual(secondManifest, firstManifest);
    for (const name of [SOURCE_EXPORT_MANIFEST_NAME, ...firstManifest.parts.map((part) => part.name)]) {
      assert.deepEqual(fs.readFileSync(path.join(first, name)), fs.readFileSync(path.join(second, name)), name);
    }
    assert.equal(fs.existsSync(path.join(first, "accounting-agents-source.zip.part-999")), false);
    assert.equal(fs.readFileSync(path.join(first, "keep.txt"), "utf8"), "unrelated");

    const single = path.join(root, "single");
    const singleManifest = writeSourceExport(single, { ...options, hostLimitBytes: firstManifest.archive_bytes });
    assert.equal(singleManifest.mode, "single");
    assert.equal(singleManifest.parts.length, 0);
    assert.ok(fs.existsSync(path.join(single, "accounting-agents-source.zip")));
    assert.equal(
      fs.statSync(path.join(single, "accounting-agents-source.zip")).size,
      singleManifest.archive_bytes,
    );
    assert.ok(options.partLimitBytes < singleManifest.host_limit_bytes);
    assert.deepEqual(readSourceArchiveMembers(fs.readFileSync(path.join(single, "accounting-agents-source.zip"))), firstManifest.source_membership.filter(e => e.included).map(({path, bytes, sha256}) => ({path, bytes, sha256})));
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


test("fixture export validates limits, exact boundaries, ordered parts and symlink safety", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "aa-archive-boundaries-"));
  try {
    const options = fixtureSource(temp);
    const output = path.join(temp, "output");
    for (const partLimitBytes of [0, -1, 1.5, NaN, Infinity, SOURCE_PART_LIMIT_BYTES + 1])
      assert.throws(() => writeSourceExport(output, { ...options, partLimitBytes }), /part limit/);
    for (const hostLimitBytes of [0, 512, 1.5, NaN, Infinity])
      assert.throws(() => writeSourceExport(output, { ...options, hostLimitBytes }), /host limit/);
    const archive = createSourceArchive(options.root);
    assert.equal(writeSourceExport(output, { ...options, hostLimitBytes: archive.bytes.length }).mode, "single");
    const manifest = writeSourceExport(output, { ...options, hostLimitBytes: archive.bytes.length - 1 });
    assert.equal(manifest.mode, "multipart");
    assert.deepEqual(Buffer.concat(manifest.parts.map((part, i) => {
      const body = fs.readFileSync(path.join(output, part.name));
      assert.equal(part.order, i + 1);
      assert.equal(part.archive_offset, i * options.partLimitBytes);
      assert.equal(part.sha256, digest(body));
      assert.equal(part.bytes, body.length);
      assert.ok(body.length <= options.partLimitBytes);
      return body;
    })), archive.bytes);
    const reconstruct = path.resolve("scripts/reconstruct-source-archive.mjs");
    const run = () => execFileSync(process.execPath, [reconstruct, path.join(output, SOURCE_EXPORT_MANIFEST_NAME), path.join(temp, "restored.zip")], { cwd: temp, stdio: "pipe" });
    run();
    assert.deepEqual(fs.readFileSync(path.join(temp, "restored.zip")), archive.bytes);
    for (const mutate of [m => { m.parts.reverse(); }, m => { m.parts[0].name = "../escape"; }, m => { m.parts[0].sha256 = "0".repeat(64); }]) {
      const changed = structuredClone(manifest); mutate(changed);
      fs.writeFileSync(path.join(output, SOURCE_EXPORT_MANIFEST_NAME), JSON.stringify(changed));
      assert.throws(run);
    }
    fs.symlinkSync(path.join(options.root, "LICENSE"), path.join(options.root, "src/link"));
    assert.throws(() => createSourceArchive(options.root), /disallows symlinks/);
    fs.unlinkSync(path.join(options.root, "src/link"));
    fs.unlinkSync(path.join(options.root, "LICENSE"));
    fs.symlinkSync(path.join(options.root, "README.md"), path.join(options.root, "LICENSE"));
    assert.throws(() => createSourceArchive(options.root), /disallows symlinks/);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
