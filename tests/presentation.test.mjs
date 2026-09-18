import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import worker from "../dist/server/index.js";
import { records } from "../dist/internal/corpus.mjs";
const page = async (route) =>
  (await worker.fetch(new Request("https://corpus.example" + route))).text();

test("library preserves filters, shows empty results, and exports the same query", async () => {
  const html = await page(
    "/?q=zzzz_no_matching_record&kind=source&jurisdiction=United+States",
  );
  assert.match(html, /No records match these filters/);
  assert.match(html, /aria-label="Remove Jurisdiction: United States"/);
  assert.match(html, /name="kind" value="source"/);
  assert.match(html, /United\+States&amp;format=markdown/);
  assert.match(html, /aria-current="page"/);
  assert.doesNotMatch(html, /\[object Object\]/);
  assert.match(
    html,
    /<script type="module" src="\/assets\/navigation-[A-Z0-9]{8}\.js"><\/script>/,
  );
});
test("all server-rendered record bodies preserve structured links without serialized VNodes", async () => {
  for (const record of records) {
    const html = await page(`/records/${record.id}`);
    assert.doesNotMatch(html, /\[object Object\]|ZZEXPR/, record.id);
    for (const section of [
      'id="citation"',
      'id="rights"',
      'id="record-information"',
    ])
      assert.ok(html.includes(section), `${record.id}: ${section}`);
  }
});
test("compiled stylesheet and source configuration are real build artifacts", () => {
  const css = fs.readFileSync("dist/client/style.css", "utf8");
  assert.ok(css.includes("--background:"));
  assert.ok(
    css.includes("aria-current=page") || css.includes('aria-current="page"'),
  );
  assert.ok(css.includes(".bg-primary"));
  assert.doesNotMatch(css, /@import\s*["']tailwindcss|@apply/);
  const manifest = JSON.parse(
    fs.readFileSync("dist/client/downloads/manifest.json"),
  );
  assert.ok(JSON.stringify(manifest).includes("accounting-agents-source.manifest.json"));
});

test("React documents have titles, a native navigation fallback, and exactly one external hydration entry", async () => {
  for (const route of [
    "/",
    "/collections",
    "/briefs",
    "/coverage",
    "/maintenance",
    "/changes",
    "/about",
    "/use",
    "/records/src_1os761s",
  ]) {
    const html = await page(route);
    assert.match(html, /<title>[^<]+ · Accounting Agents<\/title>/, route);
    assert.equal((html.match(/<script\b/g) || []).length, 1, route);
    assert.match(html, /<details><summary>Menu<\/summary>/, route);
    assert.match(html, /data-slot="navigation-menu"/, route);
  }
});

test("hydration bundle is served through the read-only worker with restrictive script policy", async () => {
  const html = await page("/");
  const script = html.match(/<script type="module" src="([^"]+)"/)[1];
  assert.ok(fs.statSync("dist/client" + script).size > 0);
  const env = {
    ASSETS: {
      fetch: async () =>
        new Response(fs.readFileSync("dist/client" + script), {
          headers: { "Content-Type": "text/javascript; charset=utf-8" },
        }),
    },
  };
  const response = await worker.fetch(
    new Request("https://corpus.example" + script),
    env,
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Content-Type"), /text\/javascript/);
  assert.match(
    response.headers.get("Content-Security-Policy"),
    /script-src 'self';/,
  );
  assert.equal(
    (
      await worker.fetch(
        new Request("https://corpus.example" + script, { method: "POST" }),
        env,
      )
    ).status,
    405,
  );
  assert.equal(
    (
      await worker.fetch(
        new Request("https://corpus.example" + script, { method: "HEAD" }),
        env,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await worker.fetch(
        new Request("https://corpus.example/assets/unexpected.js"),
        env,
      )
    ).status,
    404,
  );
});
