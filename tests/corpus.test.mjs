import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { gunzipSync, gzipSync, inflateRawSync } from "node:zlib";
import worker from "./worker-fixture.mjs";
import {
  loadRecords,
  validateCorpus,
  validateSchema,
} from "../scripts/validate.mjs";
import {
  allSourceFiles,
  currentCorpusVersion,
  currentReleaseGzipPath,
  SOURCE_EXPORT_MANIFEST_NAME,
  SOURCE_HOST_LIMIT_BYTES,
  SOURCE_PART_LIMIT_BYTES,
  readSourceArchiveMembers,
  sourceFiles,
} from "../scripts/source-archive.mjs";

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
      const body = fs.readFileSync(file);
      return new Response(body, {
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(body.length),
        },
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
        (r.jurisdiction === "United States" ||
          /United States|US GAAP|U\.S\./i.test(r.jurisdiction || "")),
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
  assert.ok(html.includes("AI-assisted source check"));
  assert.match(html, /Cite this record/);
  assert.doesNotMatch(
    html,
    /<script\b(?! type="module" src="\/assets\/navigation-[A-Z0-9]{8}\.js"><\/script>)/,
  );
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
    assert.doesNotMatch(
      text,
      /<script\b(?! type="module" src="\/assets\/navigation-[A-Z0-9]{8}\.js"><\/script>)/,
    );
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
  const payload = '"><img src=x onerror=alert(1)>"';
  const response = await request("/?q=" + encodeURIComponent(payload));
  const text = await response.text();
  assert.equal(response.status, 200);
  assert.ok(text.includes("&lt;img"));
  assert.doesNotMatch(text, /<img src=x/);
  assert.doesNotMatch(
    text,
    /<script\b(?! type="module" src="\/assets\/navigation-[A-Z0-9]{8}\.js"><\/script>)/,
  );
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
  assert.equal((sitemap.match(/<url>/g) || []).length, records.length + 9);
  assert.ok(sitemap.includes(`${catalog.site_url}/coverage</loc>`));
  assert.ok(sitemap.includes(`${catalog.site_url}/map</loc>`));
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

test("source export includes every current source byte and no recovery files", () => {
  const sourceExport = JSON.parse(
    fs.readFileSync(`dist/client/downloads/${SOURCE_EXPORT_MANIFEST_NAME}`, "utf8"),
  );
  const archive = sourceExport.mode === "single"
    ? fs.readFileSync("dist/client/downloads/accounting-agents-source.zip")
    : Buffer.concat(sourceExport.parts.map((part) => fs.readFileSync(`dist/client/downloads/${part.name}`)));
  assert.equal(sourceExport.source_file_count, allSourceFiles().length);
  assert.equal(sourceExport.included_source_file_count, sourceFiles().length);
  assert.equal(sourceExport.omitted_source_file_count, 1);
  assert.deepEqual(
    sourceExport.source_membership.map((entry) => entry.path),
    allSourceFiles(),
  );
  assert.deepEqual(
    sourceExport.source_membership.filter((entry) => entry.included).map((entry) => entry.path),
    sourceFiles(),
  );
  assert.equal(archive.length, sourceExport.archive_bytes);
  assert.equal(createHash("sha256").update(archive).digest("hex"), sourceExport.archive_sha256);
  assert.deepEqual(
    readSourceArchiveMembers(archive),
    sourceExport.source_membership
      .filter((entry) => entry.included)
      .map(({ path: file, bytes, sha256 }) => ({ path: file, bytes, sha256 })),
  );
  if (sourceExport.mode === "single") {
    assert.ok(archive.length <= SOURCE_HOST_LIMIT_BYTES);
    assert.equal(sourceExport.parts.length, 0);
  } else {
    assert.equal(fs.existsSync("dist/client/downloads/accounting-agents-source.zip"), false);
    assert.ok(sourceExport.parts.length > 1);
    assert.deepEqual(
      sourceExport.parts.map((part) => part.order),
      sourceExport.parts.map((_, index) => index + 1),
    );
    assert.equal(sourceExport.parts[0].archive_offset, 0);
    for (const [index, part] of sourceExport.parts.entries()) {
      const bytes = fs.readFileSync(`dist/client/downloads/${part.name}`);
      assert.ok(bytes.length <= SOURCE_PART_LIMIT_BYTES);
      assert.ok(bytes.length <= SOURCE_HOST_LIMIT_BYTES);
      assert.equal(bytes.length, part.bytes);
      assert.equal(part.archive_offset, sourceExport.parts.slice(0, index).reduce((total, previous) => total + previous.bytes, 0));
      assert.equal(createHash("sha256").update(bytes).digest("hex"), part.sha256);
    }
  }
  const archivePath = "dist/client/downloads/accounting-agents-source.zip";
  const bytes = sourceExport.mode === "single" ? fs.readFileSync(archivePath) : archive,
    archived = new Map();
  const archivedBytes = bytes;
  let offset = 0;
  while (archivedBytes.readUInt32LE(offset) === 0x04034b50) {
    const method = archivedBytes.readUInt16LE(offset + 8),
      size = archivedBytes.readUInt32LE(offset + 18),
      nameLength = archivedBytes.readUInt16LE(offset + 26),
      extraLength = archivedBytes.readUInt16LE(offset + 28);
    const name = archivedBytes
      .subarray(offset + 30, offset + 30 + nameLength)
      .toString();
    const start = offset + 30 + nameLength + extraLength;
    assert.equal(method, 8);
    archived.set(name, inflateRawSync(archivedBytes.subarray(start, start + size)));
    offset = start + size;
  }
  const omitted = allSourceFiles().filter(name => !archived.has(name));
  assert.deepEqual(omitted, [currentReleaseGzipPath], "only the current redundant release gzip may be omitted");
  assert.equal(archived.has(currentReleaseGzipPath), false);
  assert.deepEqual([...archived.keys()].sort(), sourceFiles());
  for (const [name, body] of archived) {
    assert.deepEqual(body, fs.readFileSync(name), name);
    assert.doesNotMatch(name, /^(outputs|node_modules|dist|\.git\/|work)\//);
  }
  assert.ok(archived.has("data/corpus/source.json"));
  assert.ok(archived.has("tests/corpus.test.mjs"));

  const currentReleaseJsonPath = `data/releases/${currentCorpusVersion}/corpus.json`;
  const currentReleaseManifestPath = `data/releases/${currentCorpusVersion}/manifest.json`;
  const currentReleaseGzip = fs.readFileSync(currentReleaseGzipPath);
  const currentReleaseJson = fs.readFileSync(currentReleaseJsonPath);
  assert.deepEqual(archived.get(currentReleaseJsonPath), currentReleaseJson);
  assert.deepEqual(gunzipSync(currentReleaseGzip), archived.get(currentReleaseJsonPath));
  assert.deepEqual(gunzipSync(gzipSync(archived.get(currentReleaseJsonPath), { level: 9, mtime: 0 })), archived.get(currentReleaseJsonPath));

  const currentManifest = JSON.parse(archived.get(currentReleaseManifestPath));
  const currentGzipEntry = currentManifest.files.find(file => file.path === "corpus.json.gz");
  assert.ok(currentGzipEntry, "current release manifest must describe the omitted gzip");
  assert.equal(currentGzipEntry.bytes, currentReleaseGzip.length);
  assert.equal(currentGzipEntry.sha256, createHash("sha256").update(currentReleaseGzip).digest("hex"));

  for (const entry of fs.readdirSync("data/releases", { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === currentCorpusVersion) continue;
    const priorGzipPath = `data/releases/${entry.name}/corpus.json.gz`;
    if (fs.existsSync(priorGzipPath)) {
      assert.deepEqual(archived.get(priorGzipPath), fs.readFileSync(priorGzipPath), `${priorGzipPath}: prior release gzip must be retained byte-for-byte`);
    }
  }
  const archiveManifest = JSON.parse(fs.readFileSync("dist/client/downloads/manifest.json", "utf8"));
  const exportEntry = archiveManifest.files.find(file => file.path === `/downloads/${SOURCE_EXPORT_MANIFEST_NAME}`);
  assert.ok(exportEntry);
  assert.equal(exportEntry.bytes, fs.statSync(`dist/client/downloads/${SOURCE_EXPORT_MANIFEST_NAME}`).size);
  assert.deepEqual(archiveManifest.source_export, {
    manifest: `/downloads/${SOURCE_EXPORT_MANIFEST_NAME}`,
    mode: sourceExport.mode,
    archive_name: sourceExport.archive_name,
    archive_path: sourceExport.archive_path,
    archive_bytes: sourceExport.archive_bytes,
    archive_sha256: sourceExport.archive_sha256,
    part_count: sourceExport.parts.length,
    source_file_count: sourceExport.source_file_count,
    included_source_file_count: sourceExport.included_source_file_count,
    omitted_source_file_count: sourceExport.omitted_source_file_count,
  });
  for (const part of sourceExport.parts) {
    const entry = archiveManifest.files.find((file) => file.path === part.path);
    assert.ok(entry, part.name);
    assert.equal(entry.bytes, part.bytes);
    assert.equal(entry.sha256, part.sha256);
  }
});


test("multipart source parts use binary MIME with stable GET, HEAD, and cache headers", async () => {
  const sourceExport = JSON.parse(
    fs.readFileSync(`dist/client/downloads/${SOURCE_EXPORT_MANIFEST_NAME}`, "utf8"),
  );
  assert.equal(sourceExport.mode, "multipart");
  const part = sourceExport.parts[0];
  const expected = fs.readFileSync(`dist/client/downloads/${part.name}`);
  const get = await request(part.path);
  assert.equal(get.status, 200);
  assert.equal(get.headers.get("Content-Type"), "application/octet-stream");
  assert.equal(get.headers.get("Content-Length"), String(expected.length));
  const etag = get.headers.get("ETag");
  assert.ok(etag);
  assert.deepEqual(Buffer.from(await get.arrayBuffer()), expected);

  const head = await request(part.path, { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("Content-Type"), "application/octet-stream");
  assert.equal(head.headers.get("Content-Length"), String(expected.length));
  assert.equal(head.headers.get("ETag"), etag);
  assert.equal(await head.text(), "");

  const cached = await request(part.path, { headers: { "If-None-Match": etag } });
  assert.equal(cached.status, 304);
  assert.equal(cached.headers.get("Content-Type"), "application/octet-stream");
  assert.equal(cached.headers.get("Content-Length"), String(expected.length));
  assert.equal(cached.headers.get("ETag"), etag);
  assert.equal(await cached.text(), "");

  const manifest = await request(`/downloads/${SOURCE_EXPORT_MANIFEST_NAME}`);
  assert.equal(manifest.headers.get("Content-Type"), "application/json");
});

test("oversized download storage stays within host limits and preserves streaming HTTP semantics", async () => {
  const file = (await read("/downloads/manifest.json")).files.find((f) => f.path === "/downloads/agent-passages.jsonl");
  assert.ok(file.bytes > 25 * 1024 * 1024);
  const storage = JSON.parse(fs.readFileSync("dist/storage/manifest.json"));
  const stored = storage.files[file.path];
  assert.equal(stored.sha256, file.sha256);
  assert.equal(stored.bytes, file.bytes);
  assert.ok(stored.chunks.length > 1);
  for (const key of stored.chunks) assert.ok(fs.statSync(`dist/client/assets/objects/${key}`).size <= 5 * 1024 * 1024);
  let fetched = false;
  const noFetch = { ASSETS: { fetch() { fetched = true; throw new Error("Unexpected body read"); } } };
  const head = await worker.fetch(new Request(`https://corpus.test${file.path}`, { method: "HEAD" }), noFetch);
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("Content-Length"), String(file.bytes));
  assert.equal(head.headers.get("Content-Type"), "application/x-ndjson; charset=utf-8");
  assert.equal(await head.text(), "");
  const cached = await worker.fetch(new Request(`https://corpus.test${file.path}`, { headers: { "If-None-Match": head.headers.get("ETag") } }), noFetch);
  assert.equal(cached.status, 304);
  assert.equal(fetched, false);
  const unavailable = await worker.fetch(new Request(`https://corpus.test${file.path}`), { ASSETS: { fetch: async () => new Response(null, {status:404}) } });
  assert.equal(unavailable.status, 503);
  assert.equal((await request("/assets/downloads/agent-passages.jsonl.gz")).status, 404);
});
