import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { releaseOverview, updateOverview, checkReleaseOverview } from "../scripts/release-overview.mjs";

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "release-overview-"));
  const version = "2026-09-30.10";
  const directory = path.join(root, "data/releases", version);
  fs.mkdirSync(directory, { recursive: true });
  const write = (file, value) => fs.writeFileSync(path.join(root, file), JSON.stringify(value));
  const snapshot = { corpus_version: version, record_count: 2, exported_record_count: 2, counts: { source: 1, guide: 1 }, records: [{ id: "s", kind: "source" }, { id: "g", kind: "guide" }] };
  const bytes = gzipSync(JSON.stringify(snapshot));
  write("data/catalog.json", { corpus_version: version });
  write("data/releases/index.json", { current_version: version, versions: [version, "2026-09-30.2"] });
  fs.writeFileSync(path.join(directory, "corpus.json.gz"), bytes);
  write(`data/releases/${version}/manifest.json`, { corpus_version: version, record_count: 2, files: [{ path: "corpus.json.gz", bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") }] });
  fs.writeFileSync(path.join(root, "README.md"), "Before\n<!-- release-overview:start -->\nstale\n<!-- release-overview:end -->\nAfter\n");
  return { root, version, write, snapshot };
}
const temporary = action => {
  const context = fixture();
  try { action(context); } finally { fs.rmSync(context.root, { recursive: true, force: true }); }
};

test("README generation uses verified current-release counts and numeric predecessor order", () => temporary(({ root }) => {
  const overview = releaseOverview({ root });
  assert.match(overview, /\*\*2 records\*\*/);
  assert.match(overview, /\| guide \| 1 \|/);
  assert.match(overview, /\| source \| 1 \|/);
  assert.match(overview, /predecessor is \[`2026-09-30\.2`\]/);
  assert.throws(() => checkReleaseOverview({ root }), /overview is stale/);
  checkReleaseOverview({ root, write: true });
  checkReleaseOverview({ root });
  const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
  assert.ok(readme.startsWith("Before\n"));
  assert.ok(readme.endsWith("\nAfter\n"));
  checkReleaseOverview({ root, write: true });
  assert.equal(fs.readFileSync(path.join(root, "README.md"), "utf8"), readme);
}));

test("overview rejects stale editions, counts, kind summaries and tampered release artifacts", () => {
  for (const defect of ["catalog", "index", "manifest", "count", "kinds", "artifact"]) temporary(({ root, version, write, snapshot }) => {
    const manifestFile = `data/releases/${version}/manifest.json`;
    const manifest = JSON.parse(fs.readFileSync(path.join(root, manifestFile)));
    if (defect === "catalog") write("data/catalog.json", { corpus_version: "2026-09-30.2" });
    if (defect === "index") write("data/releases/index.json", { current_version: version, versions: [version, version] });
    if (defect === "manifest") { manifest.corpus_version = "2026-09-30.2"; write(manifestFile, manifest); }
    if (defect === "count") { manifest.record_count = 3; write(manifestFile, manifest); }
    if (defect === "kinds") {
      snapshot.counts.source = 2;
      const bytes = gzipSync(JSON.stringify(snapshot));
      fs.writeFileSync(path.join(root, `data/releases/${version}/corpus.json.gz`), bytes);
      manifest.files[0].bytes = bytes.length;
      manifest.files[0].sha256 = createHash("sha256").update(bytes).digest("hex");
      write(manifestFile, manifest);
    }
    if (defect === "artifact") fs.appendFileSync(path.join(root, `data/releases/${version}/corpus.json.gz`), "tampered");
    assert.throws(() => releaseOverview({ root }), undefined, defect);
  });
});

test("overview refuses missing or duplicate markers and preserves unrelated prose", () => {
  assert.throws(() => updateOverview("no markers", "new"), /markers/);
  assert.throws(() => updateOverview("<!-- release-overview:start --><!-- release-overview:start --><!-- release-overview:end -->", "new"), /Duplicate/);
});

test("committed README matches current preserved release metadata", () => checkReleaseOverview());
