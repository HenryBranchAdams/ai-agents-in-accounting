import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { pathToFileURL } from "node:url";

const start = "<!-- release-overview:start -->";
const end = "<!-- release-overview:end -->";
const json = file => JSON.parse(fs.readFileSync(file, "utf8"));
const number = value => value.toLocaleString("en-US");

export function releaseOverview({ root = process.cwd() } = {}) {
  const index = json(path.join(root, "data/releases/index.json"));
  const version = index.current_version;
  assert.match(version, /^\d{4}-\d{2}-\d{2}\.\d+$/, "Invalid current release edition");
  const versions = [...index.versions].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  assert.equal(new Set(versions).size, versions.length, "Duplicate preserved release edition");
  assert.equal(versions.at(-1), version, "Current release must be newest preserved edition");
  assert.equal(json(path.join(root, "data/catalog.json")).corpus_version, version, "Catalog and release index editions differ");
  const directory = path.join(root, "data/releases", version);
  const manifest = json(path.join(directory, "manifest.json"));
  assert.equal(manifest.corpus_version, version, "Manifest edition differs");
  const artifact = manifest.files.find(file => file.path === "corpus.json.gz");
  assert.ok(artifact, "Release corpus artifact missing from manifest");
  const bytes = fs.readFileSync(path.join(directory, artifact.path));
  assert.equal(bytes.length, artifact.bytes, "Release corpus artifact size differs");
  assert.equal(createHash("sha256").update(bytes).digest("hex"), artifact.sha256, "Release corpus artifact hash differs");
  const snapshot = JSON.parse(gunzipSync(bytes));
  assert.equal(snapshot.corpus_version, version, "Snapshot edition differs");
  assert.equal(snapshot.records.length, manifest.record_count, "Manifest record count differs from snapshot");
  assert.equal(snapshot.record_count, manifest.record_count, "Snapshot metadata record count differs");
  assert.equal(snapshot.exported_record_count, manifest.record_count, "Snapshot exported record count differs");
  const counts = snapshot.records.reduce((result, record) => {
    result[record.kind] = (result[record.kind] || 0) + 1;
    return result;
  }, {});
  assert.deepEqual(snapshot.counts, counts, "Release kind counts differ from snapshot");
  const kinds = Object.keys(counts).sort().map(kind => `| ${kind} | ${number(counts[kind])} |`).join("\n");
  const previous = versions.at(-2);
  return `${start}\nThe canonical edition is **\`${version}\`**, with **${number(manifest.record_count)} records**. These counts come from the [release manifest](data/releases/${version}/manifest.json) and its verified snapshot.\n\n| Record kind | Count |\n| --- | ---: |\n${kinds}\n\nThere are **${number(versions.length)} preserved editions**${previous ? `; the current edition's preserved predecessor is [\`${previous}\`](data/releases/${previous}/manifest.json)` : ""}. Release history records corpus changes; it does not establish source currency, professional review or deployment.\n${end}`;
}

export function updateOverview(readme, overview) {
  const first = readme.indexOf(start), last = readme.indexOf(end);
  assert.ok(first >= 0 && last > first, "README release overview markers missing or reversed");
  assert.equal(readme.indexOf(start, first + start.length), -1, "Duplicate README overview start marker");
  assert.equal(readme.indexOf(end, last + end.length), -1, "Duplicate README overview end marker");
  return readme.slice(0, first) + overview + readme.slice(last + end.length);
}

export function checkReleaseOverview({ root = process.cwd(), write = false } = {}) {
  const file = path.join(root, "README.md");
  const readme = fs.readFileSync(file, "utf8");
  const updated = updateOverview(readme, releaseOverview({ root }));
  if (write) fs.writeFileSync(file, updated);
  else assert.equal(readme, updated, "README release overview is stale; run node scripts/release-overview.mjs --write");
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  assert.ok(process.argv.slice(2).every(argument => argument === "--write"), "Usage: release-overview.mjs [--write]");
  checkReleaseOverview({ write: process.argv.includes("--write") });
  console.log("Release overview parity verified");
}
