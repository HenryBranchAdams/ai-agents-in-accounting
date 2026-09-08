import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import process from "node:process";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

test(
  "newcomer MCP walkthrough discovers, searches by alias, follows a record, and extracts citations",
  { timeout: 20000 },
  async () => {
    const client = new Client(
      { name: "newcomer-walkthrough", version: "1" },
      { versionNegotiation: { mode: "legacy" } },
    );
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [path.resolve("scripts/mcp.mjs")],
      stderr: "pipe",
    });
    try {
      await client.connect(transport);
      const describe = await client.callTool({
        name: "corpus_describe",
        arguments: {},
      });
      assert.equal(describe.isError, undefined);
      const metadata = describe.structuredContent;
      assert.ok(metadata.record_count > 0);
      assert.ok(metadata.operations.search);
      assert.ok(metadata.evidence_notes.length > 0);

      const search = await client.callTool({
        name: "corpus_search",
        arguments: { q: "bank rec", kind: "workflow", limit: 5 },
      });
      assert.equal(search.isError, undefined, JSON.stringify(search));
      const searchResult = search.structuredContent;
      assert.ok(searchResult.results.length > 0);
      const bank = searchResult.results.find((result) => result.id === "wf-r2r-bank-reconciliations") || searchResult.results[0];
      assert.equal(bank.kind, "workflow");
      assert.ok(bank.citation.record_id === bank.id);

      const directory = await client.callTool({
        name: "corpus_get",
        arguments: { id: bank.id, include_relations: true, limit: 1 },
      });
      assert.equal(directory.isError, undefined, JSON.stringify(directory));
      const directoryResult = directory.structuredContent;
      assert.ok(directoryResult.sections.length > 0);
      assert.ok(Array.isArray(directoryResult.record.relations));
      const section = directoryResult.sections[0].id;
      const followed = await client.callTool({
        name: "corpus_get",
        arguments: {
          id: bank.id,
          section,
          include_relations: true,
          relation_direction: "both",
          limit: 3,
        },
      });
      assert.equal(followed.isError, undefined, JSON.stringify(followed));
      const followedResult = followed.structuredContent;
      assert.equal(followedResult.selected_section, section);
      assert.ok(followedResult.passages.length > 0);
      assert.ok(followedResult.record.source_ids.length > 0);
      assert.ok(followedResult.record.relations.length > 0 || followedResult.record.related_ids.length > 0);

      const packet = await client.callTool({
        name: "corpus_context",
        arguments: { ids: [bank.id], include_sources: true, max_chars: 12000 },
      });
      assert.equal(packet.isError, undefined, JSON.stringify(packet));
      const context = packet.structuredContent;
      assert.ok(context.budget.used_chars <= 12000);
      assert.ok(context.records.some((entry) => entry.record.id === bank.id));
      const citations = context.records
        .map((entry) => ({ id: entry.record.citation.record_id, url: entry.record.citation.original_source_url }))
        .filter((citation) => citation.url);
      assert.ok(citations.length > 0);
      for (const entry of context.records) {
        assert.ok(entry.record.rights);
        assert.ok(entry.record.review_status);
      }
    } finally {
      await client.close();
    }
  },
);
