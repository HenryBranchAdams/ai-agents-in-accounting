import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { loadRecords } from "../scripts/validate.mjs";
import { createCorpusClient } from "../scripts/agent-client.mjs";
import {
  executeAgent,
  agentIndexRows,
  agentPassageRows,
} from "../dist/internal/agent.mjs";
import {
  inputSchemas,
  outputSchemas,
  agentSchemaVersion,
} from "../dist/internal/agent-contract.mjs";
import worker from "../dist/server/index.js";

const canonical = loadRecords(),
  byId = new Map(canonical.map((r) => [r.id, r]));
const version = JSON.parse(fs.readFileSync("data/catalog.json")).corpus_version;
const id = "wf-r2r-bank-reconciliations";
const call = (op, args = {}) => {
  const result = executeAgent(op, args);
  assert.ok(outputSchemas[op].safeParse(result).success, `${op} output schema`);
  return result;
};
const api = (route, options = {}) =>
  worker.fetch(new Request(`https://corpus.test${route}`, options));
const cli = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/corpus.mjs", ...args], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "",
      stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });

test("prepared headers preserve every record's identity, rights, provenance and relationships", () => {
  const rows = [...agentIndexRows()];
  assert.equal(rows.length, canonical.length);
  assert.equal(new Set(rows.map((r) => r.id)).size, canonical.length);
  for (const row of rows) {
    const original = byId.get(row.id);
    for (const key of [
      "id",
      "title",
      "kind",
      "summary",
      "rights",
      "provenance",
      "reviewed_at",
      "review_status",
      "source_ids",
      "related_ids",
      "publisher",
      "jurisdiction",
      "source_type",
    ])
      assert.deepEqual(row[key], original[key], `${row.id}: ${key}`);
    assert.equal(row.citation.original_source_url, original.source_url);
    assert.equal(row.corpus_version, version);
    assert.equal(row.agent_schema_version, agentSchemaVersion);
    assert.ok(row.passage_count > 0);
  }
});

test("all exported passages are bounded, traceable, rights-preserving and cover canonical detail", () => {
  const rows = [...agentPassageRows()],
    ids = new Set(),
    pointersById = new Map();
  for (const row of rows) {
    assert.ok(!ids.has(row.id), row.id);
    ids.add(row.id);
    assert.ok(row.text.length > 0 && row.text.length <= 1600, row.id);
    const original = byId.get(row.record_id);
    assert.deepEqual(row.rights, original.rights);
    assert.deepEqual(row.provenance, original.provenance);
    assert.equal(row.citation.record_id, original.id);
    assert.equal(row.reviewed_at, original.reviewed_at);
    assert.equal(row.content_trust, "untrusted-research-data");
    const covered = pointersById.get(row.record_id) || new Set();
    for (const pointer of row.source_pointers) {
      const keys = pointer
        .slice(1)
        .split("/")
        .map((k) => k.replace(/~1/g, "/").replace(/~0/g, "~"));
      let value = original;
      for (const key of keys) {
        assert.ok(Object.hasOwn(value, key), `${row.id}: ${pointer}`);
        value = value[key];
      }
      covered.add(pointer);
    }
    pointersById.set(row.record_id, covered);
  }
  const leaves = (value, pointer) =>
    value && typeof value === "object" && Object.keys(value).length
      ? Object.entries(value).flatMap(([k, v]) =>
          leaves(v, `${pointer}/${k.replace(/~/g, "~0").replace(/\//g, "~1")}`),
        )
      : [pointer];
  for (const r of canonical) {
    const covered = pointersById.get(r.id);
    assert.ok(covered.has("/summary"));
    for (const [key, value] of Object.entries(r.data)) {
      if (
        Object.hasOwn(r, key) &&
        JSON.stringify(r[key]) === JSON.stringify(value)
      )
        continue;
      for (const pointer of leaves(value, `/data/${key}`))
        assert.ok(covered.has(pointer), `${r.id} omitted ${pointer}`);
    }
  }
});

test("agent search ranks meaningful matches, supports phrases and filters, and stays compact", () => {
  const result = call("search", { q: "bank reconciliation", kind: "workflow" });
  assert.equal(result.results[0].id, id);
  assert.ok(result.results[0].match.matched_fields.includes("title"));
  assert.ok(result.results[0].match.passage_id);
  const phrase = call("search", {
    q: '"audit evidence"',
    kind: "source",
    jurisdiction: "United States; public-company audits",
  });
  assert.ok(phrase.total > 0);
  assert.ok(
    phrase.results.every(
      (r) =>
        r.kind === "source" &&
        r.jurisdiction === "United States; public-company audits",
    ),
  );
  const checked = call("search", {
    kind: "source",
    review_status: "source-checked",
    limit: 25,
  });
  assert.equal(
    checked.total,
    canonical.filter(
      (record) => record.kind === "source" && record.review_status === "source-checked",
    ).length,
  );
  assert.equal(checked.results.length, 25);
  assert.ok(
    checked.results.every(
      (r) => r.review_status === "source-checked" && r.reviewed_at,
    ),
  );
  assert.equal(
    call("search", { q: "inherited-curation-not-reverified" }).total,
    0,
    "review boilerplate is a facet, not substantive search text",
  );
  assert.equal(call("search", { q: "unknown_nonexistent_zq71390" }).total, 0);
  const originalBytes = JSON.stringify(
    result.results.map((r) => byId.get(r.id)),
  ).length;
  assert.ok(JSON.stringify(result).length < originalBytes * 0.5);
});

test("cursor pagination covers the complete corpus once and rejects changes and stale versions", () => {
  const seen = [],
    args = { limit: 25 };
  let cursor;
  do {
    const result = call("search", { ...args, ...(cursor ? { cursor } : {}) });
    seen.push(...result.results.map((r) => r.id));
    cursor = result.next_cursor;
    if (cursor) assert.ok(result.next_url.includes("cursor="));
  } while (cursor);
  assert.deepEqual(new Set(seen), new Set(canonical.map((r) => r.id)));
  assert.equal(seen.length, canonical.length);
  const first = call("search", { q: "audit", limit: 1 });
  assert.throws(
    () => call("search", { q: "tax", limit: 1, cursor: first.next_cursor }),
    (error) => error.code === "INVALID_CURSOR",
  );
  const token = JSON.parse(atob(first.next_cursor));
  token[0] = "old-corpus";
  assert.throws(
    () =>
      call("search", {
        q: "audit",
        limit: 1,
        cursor: btoa(JSON.stringify(token)),
      }),
    (error) => error.code === "STALE_CURSOR" && error.status === 409,
  );
  for (const cursor of [
    "%%%",
    btoa("{}"),
    btoa(JSON.stringify([version, agentSchemaVersion, token[2], -1])),
  ])
    assert.throws(
      () => call("search", { q: "audit", limit: 1, cursor }),
      (error) => error.code === "INVALID_CURSOR",
    );
  assert.throws(
    () => call("get", { id, corpus_version: "old" }),
    (error) => error.code === "VERSION_MISMATCH",
  );
});

test("get offers a useful section directory and lossless bounded continuation", () => {
  const all = [...agentPassageRows()].filter((p) => p.record_id === id);
  let cursor,
    seen = [];
  do {
    const result = call("get", { id, limit: 2, ...(cursor ? { cursor } : {}) });
    assert.equal(result.total, all.length);
    assert.ok(result.passages.length <= 2);
    assert.deepEqual(result.record.provenance, byId.get(id).provenance);
    assert.ok(result.sections.some((s) => s.id === "data.control_model"));
    seen.push(...result.passages);
    cursor = result.next_cursor;
  } while (cursor);
  assert.deepEqual(
    seen.map((p) => p.id),
    all.map((p) => p.id),
  );
  const selected = call("get", { id, section: "data.control_model" });
  assert.ok(selected.passages.every((p) => p.section === "data.control_model"));
  assert.throws(
    () => call("get", { id, section: "missing" }),
    (error) => error.code === "UNKNOWN_SECTION",
  );
  assert.throws(
    () => call("get", { id: "no-such-record" }),
    (error) => error.code === "NOT_FOUND",
  );
});

test("context obeys total JSON budgets and reports omitted records and incomplete passages", () => {
  for (const args of [
    { q: "audit evidence", max_chars: 4000 },
    { q: "audit evidence", max_chars: 12000 },
    { ids: [id], max_chars: 4000 },
    {
      ids: [id, "src_auditagent2025"],
      max_chars: 40000,
      include_sources: false,
    },
  ]) {
    const result = call("context", args);
    assert.equal(result.budget.used_chars, JSON.stringify(result).length);
    assert.ok(result.budget.used_chars <= args.max_chars);
    for (const entry of result.records) {
      assert.deepEqual(entry.record.rights, byId.get(entry.record.id).rights);
      assert.deepEqual(
        entry.record.provenance,
        byId.get(entry.record.id).provenance,
      );
      assert.equal(
        entry.total_passages,
        entry.passages.length + entry.remaining_passages,
      );
      assert.ok(!result.omitted.some((o) => o.id === entry.record.id));
    }
  }
  const constrained = call("context", {
    ids: [id],
    max_chars: 4000,
    include_sources: false,
  });
  assert.ok(
    constrained.omitted.length ||
      constrained.records.some((r) => r.remaining_passages > 0),
  );
  const none = call("context", { q: "nonexistent_zqm883113" });
  assert.equal(none.records.length, 0);
  for (const args of [
    {},
    { ids: [id], q: "audit" },
    { ids: [id], kind: "workflow" },
    { ids: ["missing"] },
  ])
    assert.throws(() => call("context", args));
});

test("agent HTTP API and schemas preserve the shared contract, cache semantics and read-only boundary", async () => {
  for (const op of ["describe", "search", "get", "context"]) {
    const params =
      op === "get"
        ? `?id=${id}`
        : op === "context"
          ? "?q=audit%20evidence"
          : "";
    const response = await api(`/api/v1/agent/${op}${params}`);
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.ok(outputSchemas[op].safeParse(result).success);
    const head = await api(`/api/v1/agent/${op}${params}`, { method: "HEAD" });
    assert.equal(head.headers.get("ETag"), response.headers.get("ETag"));
    assert.equal(await head.text(), "");
    assert.equal(
      (
        await api(`/api/v1/agent/${op}${params}`, {
          headers: { "If-None-Match": head.headers.get("ETag") },
        })
      ).status,
      304,
    );
    for (const method of ["POST", "PUT", "PATCH", "DELETE"])
      assert.equal((await api(`/api/v1/agent/${op}`, { method })).status, 405);
  }
  const context = await api("/api/v1/agent/context?q=audit&max_chars=4000");
  const text = await context.text();
  assert.ok(text.length <= 4000);
  assert.equal(JSON.parse(text).budget.used_chars, text.length);
  for (const query of [
    "limit=0",
    "limit=26",
    "q=" + "x".repeat(241),
    "q=%22unclosed",
    "kind=__proto__",
    "review_status=verified",
    "limit=1&limit=2",
    "random=1",
    "__proto__=x",
    "cursor=bad",
  ]) {
    const response = await api(`/api/v1/agent/search?${query}`);
    assert.equal(response.status, 400, query);
    const result = await response.json();
    assert.ok(result.error.code && result.error.message);
    assert.equal(result.error.retryable, false);
  }
  const pinned = await api(`/api/v1/agent/get?id=${id}&corpus_version=old`);
  assert.equal(pinned.status, 409);
  for (const op of ["__proto__", "no-operation"])
    assert.equal((await api(`/api/v1/agent/${op}`)).status, 404);
  assert.equal((await api("/api/v1/agent/get?id=missing")).status, 404);
  const schema = await (await api("/schemas/agent.schema.json")).json();
  const download = JSON.parse(
    fs.readFileSync("dist/client/downloads/agent.schema.json"),
  );
  assert.deepEqual(schema, download);
  const openapi = await (await api("/openapi.json")).json();
  for (const op of Object.keys(inputSchemas))
    assert.deepEqual(
      openapi.paths[`/api/v1/agent/${op}`].get.responses["200"].content[
        "application/json"
      ].schema,
      schema.$defs[`${op}Output`],
    );
});

test("CLI JSON and errors agree with the API, including repeated context IDs", async () => {
  for (const [args, op, input] of [
    [["describe"], "describe", {}],
    [
      ["search", "--q", "bank reconciliation", "--kind", "workflow"],
      "search",
      { q: "bank reconciliation", kind: "workflow" },
    ],
    [
      ["get", id, "--section", "data.control_model"],
      "get",
      { id, section: "data.control_model" },
    ],
    [
      [
        "context",
        "--ids",
        id,
        "--ids",
        "src_auditagent2025",
        "--include-sources",
        "false",
      ],
      "context",
      { ids: [id, "src_auditagent2025"], include_sources: false },
    ],
  ]) {
    const result = await cli(args);
    assert.equal(result.code, 0, result.stderr);
    assert.equal(result.stderr, "");
    assert.deepEqual(JSON.parse(result.stdout), call(op, input));
  }
  for (const args of [
    ["get", "missing"],
    ["search", "--limit", "26"],
    ["search", "--q"],
    ["search", "--__proto__", "x"],
    ["get", id, "--base-url", "file:///tmp"],
  ]) {
    const result = await cli(args);
    assert.equal(result.code, 1);
    assert.equal(result.stdout, "");
    assert.ok(JSON.parse(result.stderr).error.code);
  }
});

test("remote connector validates HTTP responses, version pinning and transport failures", async () => {
  const client = createCorpusClient({
    baseUrl: "https://corpus.test",
    fetch: async (url, options) => {
      assert.equal(options.method, "GET");
      assert.equal(options.redirect, "error");
      return worker.fetch(new Request(url, options));
    },
  });
  assert.deepEqual(
    await client.call("search", { q: "audit", limit: 2 }),
    call("search", { q: "audit", limit: 2 }),
  );
  await assert.rejects(
    client.call("get", { id, corpus_version: "old" }),
    (error) => error.code === "VERSION_MISMATCH",
  );
  for (const [fetcher, code] of [
    [
      async () => {
        throw Error("offline");
      },
      "NETWORK_ERROR",
    ],
    [
      async () => new Response("<html>old deployment</html>"),
      "INVALID_RESPONSE",
    ],
    [
      async () =>
        new Response("{}", { headers: { "Content-Type": "application/json" } }),
      "INVALID_RESPONSE",
    ],
    [
      async () =>
        Response.json({ ...call("describe"), agent_schema_version: "99.0.0" }),
      "INVALID_RESPONSE",
    ],
    [
      async () =>
        new Response("x".repeat(2_000_001), {
          headers: { "Content-Type": "application/json" },
        }),
      "INVALID_RESPONSE",
    ],
  ])
    await assert.rejects(
      createCorpusClient({
        baseUrl: "https://corpus.test",
        fetch: fetcher,
      }).call("describe"),
      (error) => error.code === code,
    );
});

test("generated agent downloads match runtime rows and manifest counts", () => {
  const read = (name) =>
    (fs.existsSync(`dist/client/downloads/${name}`)
      ? fs.readFileSync(`dist/client/downloads/${name}`, "utf8")
      : gunzipSync(fs.readFileSync(`dist/client/assets/downloads/${name}.gz`)).toString("utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
  assert.deepEqual(read("agent-index.jsonl"), [...agentIndexRows()]);
  assert.deepEqual(read("agent-passages.jsonl"), [...agentPassageRows()]);
  const manifest = JSON.parse(
    fs.readFileSync("dist/client/downloads/manifest.json"),
  );
  assert.equal(manifest.agent_passage_count, [...agentPassageRows()].length);
  assert.equal(manifest.agent_schema_version, agentSchemaVersion);
  for (const file of [
    "agent-index.jsonl",
    "agent-passages.jsonl",
    "agent.schema.json",
  ])
    assert.ok(manifest.files.some((f) => f.path === `/downloads/${file}`));
});

async function verifyMcp(client, transport) {
  await client.connect(transport);
  const tools = (await client.listTools()).tools;
  assert.deepEqual(
    tools.map((t) => t.name),
    ["corpus_describe", "corpus_search", "corpus_get", "corpus_context"],
  );
  for (const tool of tools) {
    assert.equal(tool.annotations.readOnlyHint, true);
    assert.equal(tool.annotations.destructiveHint, false);
    assert.ok(tool.inputSchema && tool.outputSchema);
  }
  for (const [op, args] of [
    ["describe", {}],
    ["search", { q: "bank reconciliation", kind: "workflow", limit: 1 }],
    ["get", { id, section: "data.control_model" }],
    ["context", { q: "audit evidence", max_chars: 4000 }],
  ]) {
    const result = await client.callTool({
      name: `corpus_${op}`,
      arguments: args,
    });
    assert.ok(!result.isError, JSON.stringify(result));
    assert.deepEqual(result.structuredContent, call(op, args));
    assert.deepEqual(
      JSON.parse(result.content[0].text),
      result.structuredContent,
    );
  }
  const missing = await client.callTool({
    name: "corpus_get",
    arguments: { id: "no-such-record" },
  });
  assert.equal(missing.isError, true);
  assert.equal(JSON.parse(missing.content[0].text).error.code, "NOT_FOUND");
  const resources = await client.listResources();
  assert.equal(resources.resources[0].uri, "accounting-corpus://describe");
  const templates = await client.listResourceTemplates();
  assert.equal(
    templates.resourceTemplates[0].uriTemplate,
    "accounting-corpus://records/{id}",
  );
  const resource = await client.readResource({
    uri: `accounting-corpus://records/${id}`,
  });
  assert.deepEqual(JSON.parse(resource.contents[0].text), call("get", { id }));
}

test(
  "real MCP stdio client discovers schemas, retrieves data and reads resources in both protocol modes",
  { timeout: 20000 },
  async () => {
    for (const mode of ["legacy", { pin: "2026-07-28" }]) {
      const client = new Client(
        { name: "corpus-test", version: "1" },
        { versionNegotiation: { mode } },
      );
      const transport = new StdioClientTransport({
        command: process.execPath,
        args: [path.resolve("scripts/mcp.mjs")],
        stderr: "pipe",
      });
      let stderr = "";
      transport.stderr.on("data", (data) => (stderr += data));
      try {
        await verifyMcp(client, transport);
        assert.equal(stderr, "");
      } finally {
        await client.close();
      }
    }
  },
);

test(
  "real Streamable HTTP MCP and remote CLI use only the configured corpus and reject unsafe hosts",
  { timeout: 25000 },
  async () => {
    const apiServer = http.createServer(async (req, res) => {
      const result = await worker.fetch(
        new Request(`http://127.0.0.1${req.url}`, { method: req.method }),
      );
      res.writeHead(result.status, Object.fromEntries(result.headers));
      res.end(Buffer.from(await result.arrayBuffer()));
    });
    apiServer.listen(0, "127.0.0.1");
    await once(apiServer, "listening");
    const baseUrl = `http://127.0.0.1:${apiServer.address().port}`;
    const child = spawn(
      process.execPath,
      [
        "scripts/mcp.mjs",
        "--transport",
        "http",
        "--port",
        "0",
        "--base-url",
        baseUrl,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let output = "";
    try {
      const url = await new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(Error("MCP did not start: " + output)),
          5000,
        );
        child.stderr.on("data", (d) => {
          output += d;
          const match = output.match(/http:\/\/127\.0\.0\.1:\d+\/mcp/);
          if (match) {
            clearTimeout(timer);
            resolve(match[0]);
          }
        });
        child.once("error", (error) => {
          clearTimeout(timer);
          reject(error);
        });
        child.once("exit", (code) => {
          clearTimeout(timer);
          reject(Error(`MCP exited ${code}: ${output}`));
        });
      });
      for (const mode of ["legacy", { pin: "2026-07-28" }]) {
        const client = new Client(
          { name: "corpus-http-test", version: "1" },
          { versionNegotiation: { mode } },
        );
        try {
          await verifyMcp(
            client,
            new StreamableHTTPClientTransport(new URL(url)),
          );
        } finally {
          await client.close();
        }
      }
      const remote = await cli([
        "search",
        "--q",
        "bank reconciliation",
        "--kind",
        "workflow",
        "--base-url",
        baseUrl,
      ]);
      assert.equal(remote.code, 0, remote.stderr);
      assert.deepEqual(
        JSON.parse(remote.stdout),
        call("search", { q: "bank reconciliation", kind: "workflow" }),
      );
      for (const headers of [
        { Origin: "https://untrusted.example" },
        { Host: "untrusted.example" },
      ]) {
        const status = await new Promise((resolve, reject) => {
          const request = http.request(
            url,
            { method: "POST", headers },
            (response) => {
              response.resume();
              resolve(response.statusCode);
            },
          );
          request.once("error", reject);
          request.end("{}");
        });
        assert.equal(status, 403, JSON.stringify(headers));
      }
      assert.equal(
        (await fetch(url, { method: "POST", body: "x".repeat(65537) })).status,
        413,
      );
      assert.equal((await fetch(url, { method: "PUT" })).status, 405);
    } finally {
      child.kill("SIGTERM");
      await once(child, "close");
      apiServer.closeAllConnections();
      await new Promise((resolve) => apiServer.close(resolve));
    }
  },
);
