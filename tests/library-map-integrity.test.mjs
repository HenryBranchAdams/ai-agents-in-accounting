import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { gzipSync, gunzipSync } from "node:zlib";
import { build } from "esbuild";
import worker from "./worker-fixture.mjs";

const directory = fs.mkdtempSync(path.join(os.tmpdir(), "aa-map-integrity-"));
const metadata = JSON.parse(fs.readFileSync("dist/internal/library-map.json"));
await build({
  entryPoints: ["src/library-map/service.ts"],
  outfile: path.join(directory, "service.mjs"),
  bundle: true,
  format: "esm",
  define: { LIBRARY_MAP: JSON.stringify(metadata) },
});
const { loadLibraryMap } = await import(path.join(directory, "service.mjs"));
process.on("exit", () =>
  fs.rmSync(directory, { recursive: true, force: true }),
);
const request = new Request("https://corpus.example/map");

test("map storage rejects missing, malformed, stale, oversized and corrupted objects before caching", async () => {
  await assert.rejects(loadLibraryMap(request), /temporarily unavailable/);
  for (const response of [
    () => new Response(null, { status: 404 }),
    () => new Response("not gzip"),
    () => new Response(gzipSync("{}")),
    () => new Response(gzipSync(Buffer.alloc(metadata.bytes + 1))),
  ]) {
    await assert.rejects(
      loadLibraryMap(request, { fetch: async () => response() }),
      /temporarily unavailable/,
    );
  }
  const valid = fs.readFileSync("dist/client" + metadata.path);
  const corrupted = gunzipSync(valid);
  corrupted[30] ^= 1;
  await assert.rejects(
    loadLibraryMap(request, {
      fetch: async () => new Response(gzipSync(corrupted)),
    }),
    /temporarily unavailable/,
  );
  let calls = 0;
  const map = await loadLibraryMap(request, {
    fetch: async (r) => {
      calls++;
      assert.equal(new URL(r.url).pathname, metadata.path);
      return new Response(valid);
    },
  });
  assert.equal(map.map_version, metadata.map_version);
  assert.equal(
    await loadLibraryMap(request, {
      fetch() {
        throw new Error("Must not retain request bindings");
      },
    }),
    map,
  );
  assert.equal(calls, 1);
  await assert.rejects(
    loadLibraryMap(request, undefined, "0".repeat(64)),
    /map changed/,
  );
});

test("map routes retain stable identity, cache validation, security headers and exact evidence", async () => {
  const get = (route, options) =>
    worker.fetch(new Request("https://corpus.example" + route, options));
  const response = await get("/api/v1/library-map");
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.map_version, metadata.map_version);
  assert.ok(
    response.headers
      .get("Content-Security-Policy")
      .includes("connect-src 'self'"),
  );
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(
    (
      await get("/api/v1/library-map", {
        headers: { "If-None-Match": response.headers.get("ETag") },
      })
    ).status,
    304,
  );
  assert.equal(
    await (await get("/api/v1/library-map", { method: "HEAD" })).text(),
    "",
  );
  assert.equal(
    (await get("/api/v1/library-map", { method: "POST" })).status,
    405,
  );
  assert.equal((await get(metadata.path)).status, 404);
  for (const suffix of ["map", "api/v1/library-map"]) {
    assert.equal(
      (await get("/" + suffix + "?map=" + "0".repeat(64))).status,
      409,
    );
    assert.equal((await get("/" + suffix + "?q=a&q=b")).status, 400);
  }
  const edge = data.edges.find(
    (e) =>
      e.from === "wf-r2r-bank-reconciliations" ||
      e.to === "wf-r2r-bank-reconciliations",
  );
  const detail = await (
    await get(
      "/api/v1/library-map/record?" +
        new URLSearchParams({
          record: "wf-r2r-bank-reconciliations",
          edge: edge.id,
          map: data.map_version,
        }),
    )
  ).json();
  assert.equal(detail.node.href, "/records/wf-r2r-bank-reconciliations");
  assert.equal(detail.index_version, data.index_version);
  assert.equal(detail.edge.id, edge.id);
  assert.ok(detail.edge.assertions.length);
  assert.ok(detail.edge.assertions.every((a) => a.owner_file && a.stored_at));
  assert.equal(
    (
      await get(
        "/api/v1/library-map/record?record=wf-r2r-bank-reconciliations&edge=missing",
      )
    ).status,
    400,
  );
  const listHTML = await (await get("/map?mode=list")).text();
  assert.ok(
    !/<script[^>]+src="[^"]*library-map/.test(listHTML),
    "Initial List mode does not fetch map code",
  );
  const hostile = "<img src=x onerror=alert(1)><script>alert(2)</script>";
  const html = await (
    await get("/map?" + new URLSearchParams({ q: hostile, mode: "list" }))
  ).text();
  assert.ok(!html.includes(hostile));
  assert.ok(html.includes("&lt;img"));
});
