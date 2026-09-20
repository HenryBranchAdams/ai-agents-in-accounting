import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { applyToRoot, integratedVersion, packetFiles } from "../scripts/integrate-professional-arts-other-current.mjs";

const base = "50c911efc3d630fddce3fbcbcc7202ecc39c3b8f";
const baseDataFiles = execFileSync("git", ["ls-tree", "-r", "--name-only", base, "data"], { encoding: "utf8" }).trim().split("\n");
const files = ["data/catalog.json", ...fs.readdirSync("data/corpus").filter(name => name.endsWith(".json")).map(name => `data/corpus/${name}`), "data/coverage/research-questions.json", "data/coverage/assessments.json", "data/coverage/mapping-overrides.json", "data/coverage/research-criteria.json", "data/coverage/subsector-profiles.json", "data/coverage/subsector-screening.json", "data/research-questions.json"];
const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const fixture = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aa-int108113115-current-"));
  const archivePath = path.join(dir, "base-data.tar");
  const archiveFd = fs.openSync(archivePath, "w");
  try { execFileSync("git", ["archive", "--format=tar", base, "data"], { stdio: ["ignore", archiveFd, "pipe"] }); }
  finally { fs.closeSync(archiveFd); }
  execFileSync("tar", ["-xf", archivePath, "-C", dir]);
  fs.rmSync(archivePath, { force: true });
  for (const file of packetFiles) { fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true }); fs.copyFileSync(file, path.join(dir, file)); }
  for (const directory of ["src", "scripts", "schemas"]) fs.cpSync(directory, path.join(dir, directory), { recursive: true });
  fs.symlinkSync(path.resolve("node_modules"), path.join(dir, "node_modules"), "dir");
  return dir;
};
const snapshot = dir => new Map(files.map(file => [file, fs.readFileSync(path.join(dir, file))]));
const snapshotBaseData = dir => new Map(baseDataFiles.map(file => [file, fs.readFileSync(path.join(dir, file))]));

test("combined current import preserves base objects and replays byte-idempotently", () => {
  const dir = fixture();
  try {
    const before = snapshot(dir);
    const result = applyToRoot(dir, { currentMode: true });
    assert.equal(result.version, integratedVersion);
    assert.equal(read(path.join(dir, "data/catalog.json")).corpus_version, integratedVersion);
    assert.equal(read(path.join(dir, "data/coverage/research-questions.json")).questions.length, 367);
    assert.equal(read(path.join(dir, "data/coverage/assessments.json")).assessments.length, 174);
    const beforeBase = snapshotBaseData(dir);
    for (const file of files.filter(file => file.startsWith("data/corpus/"))) {
      const after = read(path.join(dir, file));
      for (const old of JSON.parse(before.get(file))) assert.deepEqual(after.find(row => row.id === old.id), old, `${file}:${old.id}`);
    }
    for (const [file, bytes] of beforeBase) if (!result.files.includes(file)) assert.deepEqual(fs.readFileSync(path.join(dir, file)), bytes, file);
    const first = snapshot(dir);
    applyToRoot(dir, { currentMode: true });
    for (const [file, bytes] of first) assert.deepEqual(fs.readFileSync(path.join(dir, file)), bytes, file);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("combined current import refuses late record, mapping, retrieval and edition conflicts before writes", () => {
  for (const type of ["record", "mapping", "retrieval", "edition"]) {
    const dir = fixture();
    try {
      const target = type === "record" ? "data/corpus/guide.json" : type === "mapping" ? "data/coverage/mapping-overrides.json" : type === "retrieval" ? "data/research-questions.json" : "data/catalog.json";
      let value = read(path.join(dir, target));
      if (type === "record") {
        const packet = read(path.join(dir, packetFiles[0]));
        const candidate = packet.records[0];
        value.push({ ...candidate, summary: "conflict injected" });
      }
      if (type === "mapping") value.records["guide-us-professional-services-contract-to-ledger"] = { conflict: true };
      if (type === "retrieval") value.push({ id: "rq-professional-services-retrieval-0", expected_ids: ["wrong"] });
      if (type === "edition") value.corpus_version = "unknown";
      fs.writeFileSync(path.join(dir, target), JSON.stringify(value, null, 2) + "\n");
      const before = snapshot(dir);
      let error;
      try { applyToRoot(dir, { currentMode: true }); } catch (caught) { error = caught; }
      assert.ok(error, `${type}: expected a pre-write conflict`);
      for (const [file, bytes] of before) assert.deepEqual(fs.readFileSync(path.join(dir, file)), bytes, `${type}:${file}`);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  }
});

test("source packages retain current status and retrieval limits", () => {
  for (const file of packetFiles) {
    const packet = read(file);
    assert.equal(packet.status, "source-only-pending-integration");
    assert.ok(packet.assessments.every(assessment => assessment.status === "partial" && assessment.source_currency));
    for (const fixture of packet.retrieval_fixtures.search || []) assert.ok(fixture.limit <= 20);
  }
});

test("frozen applied corpus validates and uses the real bundled agent", async () => {
  const dir = fixture();
  try {
    applyToRoot(dir, { currentMode: true });
    execFileSync(process.execPath, ["scripts/coverage-mappings.mjs"], { cwd: dir, stdio: "pipe" });
    const validated = execFileSync(process.execPath, ["scripts/validate.mjs"], { cwd: dir, encoding: "utf8" });
    assert.match(validated, /Corpus integrity verified/);
    const bundle = path.join(dir, "agent.mjs");
    execFileSync(path.resolve("node_modules/.bin/esbuild"), ["src/agent.ts", "--bundle", "--platform=node", "--format=esm", `--outfile=${bundle}`], { cwd: dir, stdio: "pipe" });
    const { executeAgent } = await import(`${pathToFileURL(bundle).href}?int108113115=${Date.now()}`);
    const globalFixtures = read(path.join(dir, "data/research-questions.json"))
      .filter(row => /^rq-(professional-services|arts-recreation|other-services)-retrieval-/.test(row.id));
    assert.equal(globalFixtures.length, 8);
    for (const row of globalFixtures) {
      assert.ok(row.user_question.endsWith("?"), `${row.id}: user-facing question`);
      assert.notEqual(row.user_question, row.search_query);
      const result = executeAgent("search", { q: row.search_query, limit: 5, ...(row.kind ? { kind: row.kind } : {}), ...row.filters });
      for (const id of row.expected_ids) assert.ok(result.results.some(hit => hit.id === id), `${row.id}: missing ${id}`);
      for (const id of row.excluded_ids) assert.ok(!result.results.some(hit => hit.id === id), `${row.id}: excluded ${id}`);
    }
    for (const file of packetFiles) {
      const packet = read(file);
      for (const fixture of packet.retrieval_fixtures.search || []) {
        const result = executeAgent("search", { q: fixture.query, limit: fixture.limit });
        for (const id of fixture.expected_record_ids || []) assert.ok(result.results.some(row => row.id === id), `${file}:${id}`);
        for (const id of fixture.excluded_record_ids || []) assert.ok(!result.results.some(row => row.id === id), `${file}:${id}: excluded result`);
      }
      for (const fixture of packet.retrieval_fixtures.get || []) {
        const got = executeAgent("get", { id: fixture.record_id || fixture.id, limit: fixture.limit });
        assert.equal(got.record.id, fixture.record_id || fixture.id);
        assert.ok(got.passages.length);
        for (const id of fixture.required_source_ids || []) assert.ok(got.passages.some(passage => JSON.stringify(passage).includes(id)), `${file}:${id}: get source`);
      }
      for (const fixture of packet.retrieval_fixtures.context || []) {
        const ids = fixture.record_ids || fixture.ids || (fixture.id ? [fixture.id] : []);
        const context = executeAgent("context", { ids, include_sources: fixture.include_sources !== false, max_chars: fixture.max_chars || 40000 });
        for (const id of fixture.required_record_ids || ids) assert.ok(context.records.some(entry => entry.record.id === id), `${file}:${id}: context record`);
        for (const id of fixture.expected_source_ids || []) assert.ok(context.records.some(entry => entry.record.id === id && entry.record.citation?.original_source_url), `${file}:${id}: context source`);
      }
    }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
