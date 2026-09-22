import test from "node:test";
import assert from "node:assert/strict";
import { search, meta } from "../dist/internal/corpus.mjs";
import worker from "./worker-fixture.mjs";
const request = (query, init) => worker.fetch(new Request(`https://corpus.example/api/v1/search-suggestions${query}`, init));

test("suggestions preserve canonical ranking, aliases, phrases and full totals with bounded metadata", async () => {
  for (const q of ["bank reconciliation", "AP", '"QuickBooks Online"', "accounting", "unlikely-nonexistent-record-xyz"]) {
    const response = await request("?" + new URLSearchParams({ q }));
    assert.equal(response.status, 200);
    const data = await response.json();
    const canonical = search(new URLSearchParams({ q, limit: "12" }));
    assert.equal(data.corpus_version, meta.corpus_version);
    assert.equal(data.total, canonical.total);
    assert.deepEqual(data.items.map(r => r.id), canonical.records.map(r => r.id));
    assert.ok(Buffer.byteLength(JSON.stringify(data)) < 32768);
    for (const [index, item] of data.items.entries()) {
      const record = canonical.records[index];
      assert.deepEqual(Object.keys(item).sort(), ["has_brief", "href", "id", "kind", "summary", "title"]);
      assert.equal(item.has_brief, !!record.data.editorial_brief?.reading);
      assert.equal(item.title, record.title);
      assert.equal(item.kind, record.kind);
      assert.equal(item.href, "/records/" + encodeURIComponent(record.id));
      assert.ok(item.summary.length <= 280);
      assert.ok(record.summary.startsWith(item.summary.replace(/…$/, "")));
    }
  }
});

test("suggestions validate before retrieval and preserve HTTP read-only and cache behavior", async () => {
  assert.deepEqual((await (await request("")).json()).items, []);
  for (const query of ["?q=%22unclosed", "?q=a&q=b", "?kind=source&q=a", "?limit=13&q=a", "?q=" + "a".repeat(241)]) {
    const response = await request(query);
    assert.equal(response.status, 400, query);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    const error = await response.json();
    assert.equal(typeof error.error, "string");
    assert.equal(error.stack, undefined);
  }
  const get = await request("?q=accounting");
  assert.equal(get.headers.get("X-Corpus-Version"), meta.corpus_version);
  const head = await request("?q=accounting", { method: "HEAD" });
  assert.equal(head.headers.get("ETag"), get.headers.get("ETag"));
  assert.equal(await head.text(), "");
  assert.equal((await request("?q=accounting", { headers: { "If-None-Match": get.headers.get("ETag") } })).status, 304);
  assert.equal((await request("", { method: "OPTIONS" })).status, 204);
  assert.equal((await request("", { method: "POST" })).status, 405);
});
