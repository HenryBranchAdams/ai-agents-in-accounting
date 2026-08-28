import assert from "node:assert/strict";
import test from "node:test";

const workerPromise = (async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("knowledge-hub-api-test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
})();

async function request(path, headers = {}, method = "GET") {
  const worker = await workerPromise;
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers, method }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

const routes = [
  {
    name: "content contract",
    apiPath: "/api/v1/content-contract",
    markdownPath: "/content-contract.md",
    collection: "content_contract",
    itemId: "content-contract",
    links: {
      self: "https://accounting-agents.madebyhenry.chatgpt.site/api/v1/content-contract",
      human: "https://accounting-agents.madebyhenry.chatgpt.site/content-contract",
      markdown: "https://accounting-agents.madebyhenry.chatgpt.site/content-contract.md",
      openapi: "https://accounting-agents.madebyhenry.chatgpt.site/openapi.json",
    },
  },
  {
    name: "core course",
    apiPath: "/api/v1/course",
    markdownPath: "/course.md",
    collection: "accounting_agents_core_course",
    itemId: "accounting-agents-core-course",
    links: {
      self: "https://accounting-agents.madebyhenry.chatgpt.site/api/v1/course",
      human: "https://accounting-agents.madebyhenry.chatgpt.site/course",
      markdown: "https://accounting-agents.madebyhenry.chatgpt.site/course.md",
      start_here: "https://accounting-agents.madebyhenry.chatgpt.site/start-here",
      source_library: "https://accounting-agents.madebyhenry.chatgpt.site/resources",
      capstone_workflow: "https://accounting-agents.madebyhenry.chatgpt.site/workflows/record-to-report/wf-r2r-bank-reconciliations",
    },
  },
  {
    name: "coverage map",
    apiPath: "/api/v1/coverage",
    markdownPath: "/coverage.md",
    collection: "coverage_map",
    itemId: "accounting-agents-coverage-map",
    links: {
      self: "https://accounting-agents.madebyhenry.chatgpt.site/api/v1/coverage",
      human: "https://accounting-agents.madebyhenry.chatgpt.site/coverage",
      markdown: "https://accounting-agents.madebyhenry.chatgpt.site/coverage.md",
      workflows: "https://accounting-agents.madebyhenry.chatgpt.site/api/v1/workflows?limit=60",
    },
  },
];

test("static knowledge-hub routes preserve their shared public interface", async () => {
  for (const route of routes) {
    const json = await request(route.apiPath);
    assert.equal(json.status, 200, `${route.name} JSON status`);
    assert.equal(json.headers.get("access-control-allow-origin"), "*", `${route.name} JSON CORS`);
    assert.match(json.headers.get("cache-control") ?? "", /^public,/, `${route.name} JSON cache`);
    assert.ok(json.headers.get("etag"), `${route.name} JSON ETag`);
    assert.ok(json.headers.get("last-modified"), `${route.name} JSON Last-Modified`);
    assert.match(json.headers.get("vary") ?? "", /^Accept(?:,|$)/, `${route.name} JSON Vary`);
    assert.equal(json.headers.get("content-language"), null, `${route.name} JSON language`);
    const payload = await json.json();
    assert.equal(payload.schema_version, "1.0", `${route.name} schema version`);
    assert.equal(payload.collection, route.collection, `${route.name} collection identity`);
    assert.equal(payload.item.id, route.itemId, `${route.name} item identity`);
    assert.deepEqual(payload.links, route.links, `${route.name} links`);

    const markdown = await request(`${route.apiPath}?format=markdown`);
    assert.equal(markdown.status, 200, `${route.name} Markdown status`);
    assert.match(markdown.headers.get("content-type") ?? "", /^text\/markdown\b/i, `${route.name} Markdown type`);
    assert.equal(markdown.headers.get("access-control-allow-origin"), "*", `${route.name} Markdown CORS`);
    assert.match(markdown.headers.get("cache-control") ?? "", /^public,/, `${route.name} Markdown cache`);
    assert.ok(markdown.headers.get("etag"), `${route.name} Markdown ETag`);
    assert.ok(markdown.headers.get("last-modified"), `${route.name} Markdown Last-Modified`);
    assert.equal(markdown.headers.get("content-language"), "en", `${route.name} Markdown language`);
    const markdownBody = await markdown.text();
    const canonicalMarkdown = await request(route.markdownPath);
    assert.equal(await canonicalMarkdown.text(), markdownBody, `${route.name} Markdown parity`);

    const unchanged = await request(route.apiPath, { "if-none-match": json.headers.get("etag") });
    assert.equal(unchanged.status, 304, `${route.name} ETag conditional request`);

    const invalid = await request(`${route.apiPath}?format=xml`);
    assert.equal(invalid.status, 400, `${route.name} invalid format status`);
    assert.equal((await invalid.json()).title, "Invalid format", `${route.name} invalid format problem`);

    const unacceptable = await request(route.apiPath, { accept: "application/xml" });
    assert.equal(unacceptable.status, 406, `${route.name} unacceptable Accept status`);
    assert.equal((await unacceptable.json()).title, "Not acceptable", `${route.name} unacceptable Accept problem`);

    const head = await request(route.apiPath, {}, "HEAD");
    assert.equal(head.status, 200, `${route.name} HEAD status`);
    assert.equal(head.headers.get("content-type"), json.headers.get("content-type"), `${route.name} HEAD type`);
    assert.equal(head.headers.get("etag"), json.headers.get("etag"), `${route.name} HEAD ETag`);
    assert.equal(head.headers.get("access-control-allow-origin"), "*", `${route.name} HEAD CORS`);

    const options = await request(route.apiPath, {}, "OPTIONS");
    assert.equal(options.status, 204, `${route.name} OPTIONS status`);
    assert.match(options.headers.get("allow") ?? "", /GET, HEAD, OPTIONS/, `${route.name} OPTIONS allow`);
    assert.equal(options.headers.get("access-control-allow-origin"), "*", `${route.name} OPTIONS CORS`);
  }
});
