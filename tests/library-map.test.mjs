import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { build } from "esbuild";
import { projectLibraryMap } from "../scripts/library-map.mjs";
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "aa-map-contract-"));
await build({
  entryPoints: ["src/library-map/contract.ts"],
  outfile: path.join(directory, "contract.mjs"),
  bundle: true,
  format: "esm",
  platform: "node",
});
const { isLibraryMap, mapState, mapView, matchingRecords } = await import(
  path.join(directory, "contract.mjs")
);
process.on("exit", () =>
  fs.rmSync(directory, { recursive: true, force: true }),
);
const metadata = JSON.parse(fs.readFileSync("dist/internal/library-map.json"));
const bytes = gunzipSync(fs.readFileSync("dist/client" + metadata.path)),
  data = JSON.parse(bytes);
const canonical = fs
  .readdirSync("data/corpus")
  .filter((f) => f.endsWith(".json"))
  .flatMap((f) => JSON.parse(fs.readFileSync("data/corpus/" + f)));

test("whole-library map covers every canonical record and every distinct topic membership, including isolates", () => {
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    metadata.sha256,
  );
  assert.ok(isLibraryMap(data, metadata.corpus_version, metadata.map_version));
  assert.deepEqual(
    data.records.map((r) => r.id).sort(),
    canonical.map((r) => r.id).sort(),
  );
  const titles = new Map(data.topics.map((t) => [t.id, t.title]));
  for (const r of canonical) {
    const mapped = data.records.find((n) => n.id === r.id);
    assert.deepEqual(
      mapped.topics.map((id) => titles.get(id)).sort(),
      [...r.topics].sort(),
    );
  }
  for (const t of data.topics)
    assert.equal(
      t.count,
      canonical.filter((r) => r.topics.includes(t.title)).length,
    );
  assert.ok(
    data.records.some(
      (r) => !data.edges.some((e) => e.from === r.id || e.to === r.id),
    ),
  );
  assert.equal(
    data.layout.lockfile_sha256,
    createHash("sha256")
      .update(fs.readFileSync("package-lock.json"))
      .digest("hex"),
  );
  const { map_version, ...inputs } = data;
  assert.equal(
    createHash("sha256").update(JSON.stringify(inputs)).digest("hex"),
    map_version,
  );
});
test("map preserves evidence types and collection ordering without turning memberships into support", () => {
  const graphMeta = JSON.parse(
    fs.readFileSync("dist/internal/connections-index.json"),
  );
  const graph = JSON.parse(
    gunzipSync(fs.readFileSync("dist/client" + graphMeta.path)),
  );
  assert.deepEqual(
    data.edges,
    graph.edges.map(({ id, from, to, type }) => ({ id, from, to, type })),
  );
  for (const c of data.collections) {
    const r = canonical.find((r) => r.id === c.id);
    assert.deepEqual(c.members, [...new Set(r.source_ids)]);
    assert.deepEqual(
      matchingRecords(
        data,
        mapState(new URLSearchParams({ collection: c.id })),
      ).map((r) => r.id),
      c.members,
    );
  }
});
test("map List pagination reaches the full library and global search is independent of the former neighborhood budget", () => {
  const first = mapView(data, mapState(new URLSearchParams())),
    ids = [];
  for (let page = 1; page <= first.pages; page++)
    ids.push(
      ...mapView(
        data,
        mapState(new URLSearchParams({ page: String(page) })),
      ).records.map((r) => r.id),
    );
  assert.equal(new Set(ids).size, canonical.length);
  const search = mapView(
    data,
    mapState(new URLSearchParams({ q: "bank reconciliation" })),
  );
  assert.ok(search.records.some((r) => r.id === "wf-r2r-bank-reconciliations"));
  const highDegree = data.records.reduce(
    (best, r) =>
      data.edges.filter((e) => e.from === r.id || e.to === r.id).length >
      data.edges.filter((e) => e.from === best.id || e.to === best.id).length
        ? r
        : best,
    data.records[0],
  );
  assert.ok(
    mapView(data, mapState(new URLSearchParams({ record: highDegree.id })))
      .relations.length > 80,
  );
});
test("invalid, stale-shaped and hostile map data or state fails closed", () => {
  for (const query of [
    "q=a&q=b",
    "page=NaN",
    "page=-1",
    "mode=script",
    "topic=https://bad.invalid",
    "unknown=1",
  ])
    assert.throws(() => mapState(new URLSearchParams(query)));
  assert.throws(() =>
    mapView(data, mapState(new URLSearchParams({ topic: "missing" }))),
  );
  const altered = structuredClone(data);
  altered.records[0].topics = ["missing"];
  assert.equal(
    isLibraryMap(altered, data.corpus_version, data.map_version),
    false,
  );
  altered.records[0] = structuredClone(data.records[1]);
  assert.equal(
    isLibraryMap(altered, data.corpus_version, data.map_version),
    false,
  );
  assert.equal(isLibraryMap(data, "stale", data.map_version), false);
});
test("force layout is deterministic and retains separate IDs even when display names collide", () => {
  const records = [
    {
      id: "a",
      kind: "guide",
      title: "Same title",
      summary: "A",
      topics: ["One"],
      source_ids: [],
    },
    {
      id: "b",
      kind: "source",
      title: "Same title",
      summary: "B",
      topics: ["One", "Two"],
      source_ids: [],
    },
    {
      id: "c",
      kind: "collection",
      title: "Reading order",
      summary: "C",
      topics: ["Two"],
      source_ids: ["b", "a"],
    },
  ];
  const snapshot = { corpus_version: "test", index_version: "test", edges: [] };
  const a = projectLibraryMap(records, snapshot, Buffer.from("lock")),
    b = projectLibraryMap(records, snapshot, Buffer.from("lock"));
  assert.deepEqual(a, b);
  assert.equal(a.records.length, 3);
  assert.equal(a.topics.length, 2);
  assert.notEqual(
    a.map_version,
    projectLibraryMap(records, snapshot, Buffer.from("changed lock"))
      .map_version,
  );
});
