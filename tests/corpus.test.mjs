import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { inflateRawSync } from "node:zlib";
import worker from "../dist/server/index.js";
import {
  loadRecords,
  validateCorpus,
  validateSchema,
} from "../scripts/validate.mjs";
import { sourceFiles } from "../scripts/source-archive.mjs";

const records = loadRecords(),
  byId = new Map(records.map((r) => [r.id, r]));
const catalog = JSON.parse(fs.readFileSync("data/catalog.json"));
const sourceCount = records.filter((r) => r.kind === "source").length;
const schema = JSON.parse(fs.readFileSync("schemas/record.schema.json"));
const root = path.resolve("dist/client");
const env = {
  ASSETS: {
    async fetch(request) {
      const pathname = new URL(request.url).pathname;
      const file = path.resolve(root, "." + pathname);
      if (!file.startsWith(root + path.sep) || !fs.existsSync(file))
        return new Response("Not found", { status: 404 });
      const contentType = pathname.endsWith(".json")
        ? "application/json"
        : pathname.endsWith(".zip")
          ? "application/zip"
          : "text/plain";
      return new Response(fs.readFileSync(file), {
        headers: { "Content-Type": contentType },
      });
    },
  },
};
const request = (route, options = {}) =>
  worker.fetch(new Request("https://corpus.test" + route, options), env);
const read = async (route) => {
  const r = await request(route);
  assert.equal(r.status, 200, route);
  return r.json();
};

test("all canonical records meet the public schema and reference invariants", () => {
  const result = validateCorpus();
  assert.equal(result.records, records.length);
  assert.equal(result.sources, sourceCount);
  for (const r of records) validateSchema(r, schema, r.id);
  const invalid = structuredClone(records[0]);
  delete invalid.rights;
  assert.throws(() => validateSchema(invalid, schema), /rights/);
});

test("pagination returns every source once and a usable next link", async () => {
  let route = "/api/v1/records?kind=source&limit=100",
    ids = [];
  while (route) {
    const result = await read(route);
    assert.equal(result.total, sourceCount);
    assert.equal(result.pages, Math.ceil(sourceCount / 100));
    ids.push(...result.records.map((r) => r.id));
    route = result.next;
  }
  assert.equal(new Set(ids).size, sourceCount);
  assert.equal(ids.length, sourceCount);
  assert.deepEqual(
    new Set(ids),
    new Set(records.filter((r) => r.kind === "source").map((r) => r.id)),
  );
});

test("search ranks title matches and combines exact facets", async () => {
  const result = await read(
    "/api/v1/records?q=bank+reconciliation&kind=workflow",
  );
  assert.equal(result.records[0].id, "wf-r2r-bank-reconciliations");
  const filtered = await read(
    "/api/v1/records?kind=source&topic=Controls+and+governance&jurisdiction=United+States&limit=100",
  );
  assert.ok(filtered.total > 0);
  assert.ok(
    filtered.records.every(
      (r) =>
        r.kind === "source" &&
        r.topics.includes("Controls and governance") &&
        r.jurisdiction === "United States",
    ),
  );
  const none = await read("/api/v1/records?q=unfindable_zqx_908771");
  assert.equal(none.total, 0);
  assert.deepEqual(none.records, []);
});

test("malformed and oversized queries fail clearly", async () => {
  for (const query of [
    "limit=0",
    "limit=101",
    "page=-1",
    "page=1.5",
    "page=100001",
    "kind=__proto__",
    "kind=nonsense",
    "collection=nope",
    "format=csv",
    "q=" + "a".repeat(241),
  ]) {
    const response = await request("/api/v1/records?" + query);
    assert.equal(response.status, 400, query);
    assert.ok((await response.json()).error);
  }
});

test("every record is retrievable without changing its data or provenance", async () => {
  for (const record of records) {
    const result = await read("/api/v1/records/" + record.id);
    const { corpus_version, schema_version, ...body } = result;
    assert.equal(corpus_version, catalog.corpus_version);
    assert.equal(schema_version, catalog.schema_version);
    assert.deepEqual(body, record);
  }
});

test("collections return their entire bibliography and original source records", async () => {
  const collection = await read("/api/v1/collections/collection-foundations");
  assert.equal(collection.records.length, 20);
  assert.deepEqual(
    collection.records.map((r) => r.id),
    collection.collection.source_ids,
  );
  for (const r of collection.records) assert.deepEqual(r, byId.get(r.id));
  const filtered = await read(
    "/api/v1/records?collection=collection-foundations&limit=100",
  );
  assert.equal(filtered.total, 20);
  assert.equal((await request("/api/v1/collections/src_1os761s")).status, 404);
});

test("HTML and Markdown preserve stable citations and rights", async () => {
  const html = await (await request("/records/src_1os761s")).text();
  assert.match(html, /FASB Accounting Standards Codification/);
  assert.match(html, /https:\/\/asc.fasb.org\//);
  assert.match(html, /not reverified/);
  assert.match(html, /Cite this record/);
  assert.doesNotMatch(html, /<script\b/);
  const md = await request("/records/wf-r2r-bank-reconciliations.md");
  assert.match(md.headers.get("Content-Type"), /text\/markdown/);
  const text = await md.text();
  assert.match(text, /wf-r2r-bank-reconciliations/);
  assert.ok(text.includes(catalog.corpus_version));
  assert.match(text, /CC-BY-4.0/);
});

test("all public record pages render and their internal links resolve", async () => {
  const links = new Set();
  for (const route of [
    "/",
    "/collections",
    "/about",
    "/use",
    ...records.map((r) => "/records/" + r.id),
  ]) {
    const response = await request(route);
    assert.equal(response.status, 200, route);
    const text = await response.text();
    assert.equal((text.match(/<h1[ >]/g) || []).length, 1, route);
    assert.doesNotMatch(text, /<script\b/);
    for (const match of text.matchAll(/href="(\/[^"#]*)(?:#[^"]*)?"/g))
      links.add(match[1].replaceAll("&amp;", "&"));
  }
  for (const href of links) {
    const response = await request(href, { method: "HEAD" });
    assert.ok(
      [200, 308].includes(response.status),
      `${href}: ${response.status}`,
    );
  }
});

test("query text is escaped in visible text and attribute contexts", async () => {
  const payload = '"><img src=x onerror=alert(1)>';
  const response = await request("/?q=" + encodeURIComponent(payload));
  const text = await response.text();
  assert.equal(response.status, 200);
  assert.ok(text.includes("&lt;img"));
  assert.doesNotMatch(text, /<img src=x/);
  assert.doesNotMatch(text, /<script\b/);
});

test("all routes reject mutation methods before serving data or assets", async () => {
  for (const route of [
    "/",
    "/api/v1/records",
    "/api/v1/records/src_1os761s",
    "/downloads/corpus.json",
    "/style.css",
    "/missing",
  ]) {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      const r = await request(route, { method });
      assert.equal(r.status, 405);
      assert.equal(r.headers.get("Allow"), "GET, HEAD, OPTIONS");
    }
  }
});

test("HEAD, OPTIONS, CORS, content policy, and conditional reads work", async () => {
  const get = await request("/api/v1/meta"),
    head = await request("/api/v1/meta", { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  assert.equal(head.headers.get("ETag"), get.headers.get("ETag"));
  assert.equal(get.headers.get("Access-Control-Allow-Origin"), "*");
  assert.equal(get.headers.get("X-Content-Type-Options"), "nosniff");
  assert.match(
    get.headers.get("Content-Security-Policy"),
    /default-src 'none'/,
  );
  const cached = await request("/api/v1/meta", {
    headers: { "If-None-Match": get.headers.get("ETag") },
  });
  assert.equal(cached.status, 304);
  assert.equal(await cached.text(), "");
  const options = await request("/api/v1/records", { method: "OPTIONS" });
  assert.equal(options.status, 204);
  assert.equal(await options.text(), "");
});

test("retired experiments return 410 and legacy content URLs redirect", async () => {
  for (const route of [
    "/course",
    "/atlas",
    "/tutorials/bank-reconciliation",
    "/ledgerbench",
    "/bench",
    "/api/v1/course",
    "/api/v1/benchmark",
  ])
    assert.equal((await request(route)).status, 410, route);
  const legacy = await request("/resources/src_1os761s");
  assert.equal(legacy.status, 308);
  assert.equal(legacy.headers.get("Location"), "/records/src_1os761s");
  assert.equal((await request("/api/v1/records/missing")).status, 404);
  assert.equal((await request("/nonsense")).status, 404);
});

test("machine-readable discovery exposes only retrieval operations", async () => {
  const spec = await read("/openapi.json");
  assert.equal(spec.openapi, "3.1.0");
  for (const methods of Object.values(spec.paths))
    assert.deepEqual(Object.keys(methods), ["get"]);
  assert.deepEqual(spec.components.schemas.Record, schema);
  const llms = await (await request("/llms.txt")).text();
  assert.match(llms, /downloads\/corpus.jsonl/);
  const sitemap = await (await request("/sitemap.xml")).text();
  assert.equal((sitemap.match(/<url>/g) || []).length, records.length + 4);
  assert.doesNotMatch(sitemap, /<loc>[^<]*\/(course|atlas|ledgerbench)</);
});

test("exports match canonical records, versions, and manifest hashes", async () => {
  const manifest = await read("/downloads/manifest.json");
  for (const file of manifest.files) {
    const response = await request(file.path);
    assert.equal(response.status, 200);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.length, file.bytes);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), file.sha256);
  }
  const snapshot = await read("/downloads/corpus.json");
  assert.equal(snapshot.exported_record_count, records.length);
  assert.equal(snapshot.corpus_version, catalog.corpus_version);
  assert.deepEqual(new Map(snapshot.records.map((r) => [r.id, r])), byId);
  const lines = (await (await request("/downloads/corpus.jsonl")).text())
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  assert.equal(lines.length, records.length);
  for (const r of lines) {
    assert.equal(r.schema_version, catalog.schema_version);
    assert.equal(r.corpus_version, catalog.corpus_version);
    assert.ok(r.rights);
    assert.ok(r.provenance);
  }
  const selected = await request(
    "/api/v1/records?kind=workflow&limit=2&format=jsonl",
  );
  assert.match(selected.headers.get("Content-Type"), /ndjson/);
  assert.match(selected.headers.get("Link"), /page=2/);
  assert.equal(
    selected.headers.get("X-Total-Count"),
    String(records.filter((r) => r.kind === "workflow").length),
  );
  assert.equal((await selected.text()).trim().split("\n").length, 2);
});

test("source archive includes every current source byte and no recovery files", () => {
  const bytes = fs.readFileSync(
      "dist/client/downloads/accounting-agents-source.zip",
    ),
    archived = new Map();
  let offset = 0;
  while (bytes.readUInt32LE(offset) === 0x04034b50) {
    const method = bytes.readUInt16LE(offset + 8),
      size = bytes.readUInt32LE(offset + 18),
      nameLength = bytes.readUInt16LE(offset + 26),
      extraLength = bytes.readUInt16LE(offset + 28);
    const name = bytes
      .subarray(offset + 30, offset + 30 + nameLength)
      .toString();
    const start = offset + 30 + nameLength + extraLength;
    assert.equal(method, 8);
    archived.set(name, inflateRawSync(bytes.subarray(start, start + size)));
    offset = start + size;
  }
  assert.deepEqual([...archived.keys()].sort(), sourceFiles());
  for (const [name, body] of archived) {
    assert.deepEqual(body, fs.readFileSync(name), name);
    assert.doesNotMatch(name, /^(outputs|node_modules|dist|\.git\/|work)\//);
  }
  assert.ok(archived.has("data/corpus/source.json"));
  assert.ok(archived.has("tests/corpus.test.mjs"));
});
