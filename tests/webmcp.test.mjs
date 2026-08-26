import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const workerPromise = (async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("webmcp-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
})();

async function request(path) {
  const worker = await workerPromise;
  return worker.fetch(
    new Request(`http://localhost${path}`),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("the root layout registers bounded read-only WebMCP tools", async () => {
  const [layout, source] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/WebMcpTools.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /<WebMcpTools\s*\/>/);
  assert.match(source, /name: "accounting_agents\.get_current_page"/);
  assert.match(source, /name: "accounting_agents\.search"/);
  assert.equal((source.match(/readOnlyHint: true/g) ?? []).length, 2);
  assert.equal((source.match(/untrustedContentHint: true/g) ?? []).length, 2);
  assert.match(source, /maxLength: 200/);
  assert.match(source, /maximum: 20/);
  assert.match(source, /additionalProperties: false/);
  assert.match(source, /accountable people approve conclusions and sensitive external actions/);
  assert.doesNotMatch(source, /window\.location\.(?:assign|replace)|fetch\([^)]*method:\s*["'](?:POST|PUT|PATCH|DELETE)/i);
});

test("the production client bundle includes both WebMCP registrations", async () => {
  const assets = new URL("../dist/client/assets/", import.meta.url);
  const files = (await readdir(assets)).filter((file) => file.endsWith(".js"));
  const bundle = (await Promise.all(files.map((file) => readFile(new URL(file, assets), "utf8")))).join("\n");

  assert.match(bundle, /accounting_agents\.get_current_page/);
  assert.match(bundle, /accounting_agents\.search/);
  assert.match(bundle, /modelContext/);
});

test("agent-access documentation describes WebMCP behavior and boundaries", async () => {
  const response = await request("/machine-access");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /id="webmcp"/);
  assert.match(html, /accounting_agents\.get_current_page/);
  assert.match(html, /accounting_agents\.search/);
  assert.match(html, /agents may prepare accounting work/i);
  assert.match(html, /accountable people approve conclusions/i);
  assert.match(html, /https:\/\/learn\.chatgpt\.com\/docs\/webmcp/);
  assert.match(html, /https:\/\/webmachinelearning\.github\.io\/webmcp\//);
});
