#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";
import { buildReviewQueue } from "./maintenance.mjs";

const CATEGORY_FIELDS = {
  editorial: ["title", "summary", "topics"],
  provenance: ["review_status", "reviewed_at", "provenance"],
  "source-claims": ["source_url", "publisher", "source_type"],
  rights: ["rights"],
  applicability: ["jurisdiction", "industries"],
  relations: ["related_ids", "source_ids"],
};
const sorted = (value) => {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((k) => [k, sorted(value[k])]));
  return value;
};
const equal = (a, b) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));

export function compareCorpus(previous, current) {
  const before = new Map((previous.records || []).map((r) => [r.id, r]));
  const after = new Map((current.records || []).map((r) => [r.id, r]));
  const changes = [];
  for (const id of [...new Set([...before.keys(), ...after.keys()])].sort()) {
    if (!before.has(id)) { changes.push({ id, change: "added", categories: [] }); continue; }
    if (!after.has(id)) { changes.push({ id, change: "removed", categories: [] }); continue; }
    const oldRecord = before.get(id), newRecord = after.get(id);
    const categories = Object.entries(CATEGORY_FIELDS).filter(([, fields]) => fields.some((f) => !equal(oldRecord?.[f], newRecord?.[f]))).map(([name]) => name);
    if (!equal(oldRecord?.data, newRecord?.data)) categories.push(oldRecord?.kind === "source" || newRecord?.kind === "source" ? "source-claims" : "editorial-data");
    categories.splice(0, categories.length, ...[...new Set(categories)]);
    if (categories.length) changes.push({ id, change: "modified", categories });
  }
  return changes;
}

function artifactSet(version, current, changes) {
  const json = JSON.stringify(current, null, 2) + "\n";
  const jsonl = (current.records || []).map((record) => JSON.stringify({ schema_version: current.schema_version, corpus_version: current.corpus_version, ...record })).join("\n") + "\n";
  const history = changes.map((change) => JSON.stringify({ corpus_version: version, ...change })).join("\n") + (changes.length ? "\n" : "");
  return { "corpus.json": Buffer.from(json), "corpus.jsonl": Buffer.from(jsonl), "changes.json": Buffer.from(JSON.stringify({ schema_version: "1.0.0", corpus_version: version, changes }, null, 2) + "\n"), "record-history.jsonl": Buffer.from(history) };
}

export function writeReleaseArtifacts(currentExport, destination = "data/releases", { previousExport = null } = {}) {
  const version = currentExport.corpus_version;
  if (!/^\d{4}-\d{2}-\d{2}\.\d+$/.test(version)) throw new Error(`Invalid corpus version: ${version}`);
  const dir = path.join(destination, version);
  const changes = previousExport ? compareCorpus(previousExport, currentExport) : [];
  const artifacts = artifactSet(version, currentExport, changes);
  const gzip = gzipSync(artifacts["corpus.json"], { level: 9, mtime: 0 });
  const gzipFile = path.join(dir, "corpus.json.gz");
  const generated = { ...artifacts, "corpus.json.gz": gzip };
  // zlib versions can emit different gzip bytes for the same JSON payload.
  // Preserve an existing immutable representation only after its decompressed
  // bytes match the canonical corpus exactly; all other artifact mismatches
  // remain fatal below.
  if (fs.existsSync(gzipFile)) {
    const existingGzip = Buffer.from(fs.readFileSync(gzipFile));
    if (!existingGzip.equals(gzip) && gunzipSync(existingGzip).equals(artifacts["corpus.json"])) generated["corpus.json.gz"] = existingGzip;
  }
  const files = Object.keys(generated).sort().map((name) => { const body = generated[name]; return { path: name, bytes: body.length, sha256: createHash("sha256").update(body).digest("hex") }; });
  const manifest = { schema_version: "1.0.0", corpus_version: version, record_count: currentExport.records?.length || 0, files, historical_snapshot: false };
  const manifestBody = Buffer.from(JSON.stringify(manifest, null, 2) + "\n");
  const expected = { ...generated, "manifest.json": manifestBody };
  // Preflight every existing byte before creating or changing any artifact.
  for (const [name, body] of Object.entries(expected)) {
    const file = path.join(dir, name);
    if (fs.existsSync(file) && !Buffer.from(fs.readFileSync(file)).equals(body)) throw new Error(`Immutable release artifact differs: ${file}`);
  }
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, body] of Object.entries(expected)) {
    const file = path.join(dir, name);
    if (!fs.existsSync(file)) fs.writeFileSync(file, body);
  }
  const indexFile = path.join(destination, "index.json");
  const versions = fs.readdirSync(destination, { withFileTypes: true }).filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}\.\d+$/.test(e.name)).map((e) => e.name).sort();
  const indexBody = Buffer.from(JSON.stringify({ schema_version: "1.0.0", current_version: version, versions }, null, 2) + "\n");
  fs.writeFileSync(indexFile, indexBody);
  return { version, changes, directory: dir, files };
}

export function preparePublication(records, previousExport = null, observations = { observations: [] }) {
  const current = { records };
  const changes = previousExport ? compareCorpus(previousExport, current) : [];
  const before = new Map((previousExport?.records || []).map((r) => [r.id, r]));
  const after = new Map(records.map((r) => [r.id, r]));
  const record_history = changes.map((change) => ({ id: change.id, change: change.change, categories: change.categories }));
  return { queue: buildReviewQueue(records, observations), changes, record_history };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [currentFile, previousFile] = process.argv.slice(2);
  if (!currentFile) throw new Error("Usage: node scripts/release-history.mjs CURRENT_EXPORT.json [PREVIOUS_EXPORT.json]");
  const result = writeReleaseArtifacts(JSON.parse(fs.readFileSync(currentFile, "utf8")), "data/releases", previousFile ? { previousExport: JSON.parse(fs.readFileSync(previousFile, "utf8")) } : {});
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}
