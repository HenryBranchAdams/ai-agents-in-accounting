import test from "node:test";
import assert from "node:assert/strict";
import { buildReviewQueue, checkSourceUrl } from "../scripts/maintenance.mjs";
import { compareCorpus, preparePublication, writeReleaseArtifacts } from "../scripts/release-history.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

test("review queue is deterministic and preserves explicit versus inherited review basis", () => {
  const records = [
    { id: "src-a", kind: "source", title: "A", review_status: "inherited-not-reverified", reviewed_at: null, rights: { source_status: "Unknown" }, source_ids: [], source_url: "https://example.com" },
    { id: "wf-a", kind: "workflow", title: "W", review_status: "editorially-reviewed", reviewed_at: "2026-09-01", rights: {}, source_ids: [], source_url: null },
  ];
  const queue = buildReviewQueue(records, { observations: [{ record_id: "src-a", checked_at: "2026-09-07T00:00:00.000Z", access: "broken", reachable: false, version_change_hint: null }] });
  assert.deepEqual(queue.map((x) => x.id), ["src-a", "wf-a"]);
  assert.equal(queue[0].review_basis, "inherited");
  assert.ok(queue[0].reasons.includes("source-unreachable"));
  assert.equal(queue[1].review_basis, "explicit");
});

test("queue uses latest observation and surfaces due and stale checks", async () => {
  const { buildReviewQueue } = await import("../scripts/maintenance.mjs");
  const records = [{ id: "s", kind: "source", title: "S", review_status: "source-checked", reviewed_at: "2026-01-01", rights: {}, source_ids: [], source_url: "https://example.com" }];
  const rows = buildReviewQueue(records, { observations: [
    { record_id: "s", checked_at: "2025-01-01T00:00:00Z", access: "broken", reachable: false, next_review_at: "2025-02-01T00:00:00Z" },
    { record_id: "s", checked_at: "2026-09-01T00:00:00Z", access: "public", reachable: true, next_review_at: "2026-09-02T00:00:00Z" },
  ] }, { now: new Date("2026-09-07T00:00:00Z") });
  assert.deepEqual(rows[0].reasons, ["substantive-review-due", "review-due", "citation-use-gap"]);
});

test("source checker rejects private destinations and stores bounded metadata", async () => {
  assert.equal((await checkSourceUrl("http://127.0.0.1/x")).access, "blocked");
  assert.equal((await checkSourceUrl("http://[::1]/x")).access, "blocked");
  assert.equal((await checkSourceUrl("http://[::ffff:127.0.0.1]/x")).access, "blocked");
  const response = new Response("<html><title>Example</title>publisher content</html>", { status: 200, headers: { etag: '"v1"' } });
  const row = await checkSourceUrl("https://example.com/source", { fetchImpl: async () => response, now: new Date("2026-09-07T00:00:00Z") });
  assert.equal(row.reachable, true);
  assert.equal(row.title, "Example");
  assert.equal(row.etag, '"v1"');
  assert.match(row.content_fingerprint, /^[a-f0-9]{64}$/);
});

test("source checker classifies restricted access, timeout, and fingerprint changes", async () => {
  const restricted = await checkSourceUrl("https://example.com/private", { fetchImpl: async () => new Response("", { status: 403 }) });
  assert.equal(restricted.access, "access-restricted");
  const timeout = await checkSourceUrl("https://example.com/slow", { timeoutMs: 1, fetchImpl: async () => ({ status: 200, headers: new Headers(), body: { getReader: () => ({ read: () => new Promise(() => {}) }) } }) });
  assert.equal(timeout.access, "indeterminate");
  const records = [{ id: "s", kind: "source", source_url: "https://example.com", title: "S" }];
  const rows = await (await import("../scripts/maintenance.mjs")).checkSources(records, { observations: { observations: [{ record_id: "s", checked_at: "2026-01-01T00:00:00Z", content_fingerprint: "old" }] }, fetchImpl: async () => new Response("new", { status: 200 }), now: new Date("2026-09-07") });
  assert.equal(rows[0].version_change_hint, "content-fingerprint-changed");
});

test("release comparison uses additive categories for ambiguous changes", () => {
  const before = { records: [{ id: "s", title: "old", rights: { content: "x" }, source_url: "https://a", provenance: { x: 1 } }] };
  const after = { records: [{ id: "s", title: "new", rights: { content: "y" }, source_url: "https://b", provenance: { x: 2 } }] };
  assert.deepEqual(compareCorpus(before, after), [{ id: "s", change: "modified", categories: ["editorial", "provenance", "source-claims", "rights"] }]);
});

test("release writes preflight all bytes before changing an existing version", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-history-"));
  const current = { schema_version: "2.0.0", corpus_version: "2026-09-07.4", records: [{ id: "a", kind: "source", title: "A" }] };
  writeReleaseArtifacts(current, dir);
  const before = fs.readFileSync(path.join(dir, "2026-09-07.4", "corpus.json"));
  assert.throws(() => writeReleaseArtifacts({ ...current, records: [{ ...current.records[0], title: "changed" }] }, dir), /Immutable release artifact differs/);
  assert.deepEqual(fs.readFileSync(path.join(dir, "2026-09-07.4", "corpus.json")), before);
});

test("publication helper returns plain queue, changes, and record history", () => {
  const result = preparePublication([{ id: "a", kind: "workflow", title: "new", source_ids: [], related_ids: [] }], { records: [{ id: "a", kind: "workflow", title: "old", source_ids: [], related_ids: [] }] }, { observations: [] });
  assert.deepEqual(Object.keys(result), ["queue", "changes", "record_history"]);
  assert.equal(result.changes[0].categories[0], "editorial");
  assert.deepEqual(result.record_history[0], { id: "a", change: "modified", categories: ["editorial"] });
});
