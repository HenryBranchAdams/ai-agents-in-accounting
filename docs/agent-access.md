# Agent access

The API, CLI and MCP expose the same four read-only operations: `describe`, `search`, `get`, and `context`. They share validation, search, passage preparation, citation rendering and response schemas. Canonical records and the existing `/api/v1/records` API remain available without changes to their format.

The connector defaults to its bundled local corpus. The public website must be rebuilt and deployed separately before its new agent endpoints are available. Adding a connector to this repository does not publish a service or register it in a user's MCP client.

## Start locally

Use Node 22.13 or later. From the repository or extracted source ZIP:

```sh
npm ci
npm run build
node scripts/corpus.mjs describe
node scripts/corpus.mjs search --q "bank reconciliation" --kind workflow
node scripts/corpus.mjs get wf-r2r-bank-reconciliations --section data.control_model
node scripts/corpus.mjs context --q "audit evidence" --max-chars 12000
```

`npm run cli -- ...` is an equivalent wrapper. Direct `node` invocation keeps npm's status text out of machine-readable output. Successful commands write JSON to stdout and exit 0. Errors write `{error:{code,message,retryable}}` to stderr and exit 1. `--pretty` adds whitespace for people. Repeat `--ids` to select records for `context`; use IDs or a search query with filters, not both. Run `--help` for syntax. An optional `--base-url https://your-corpus.example` uses that origin's agent API instead of the local snapshot; it makes GET requests only, rejects redirects, validates response schemas, and applies timeout and response-size limits.

## MCP

Launch `node /absolute/path/to/ai-agents-in-accounting/scripts/mcp.mjs` in an MCP client supporting stdio. No credentials or accounting-system connections are needed. A client that accepts `mcpServers` JSON can use:

```json
{
  "mcpServers": {
    "accounting-corpus": {
      "command": "node",
      "args": ["/absolute/path/to/ai-agents-in-accounting/scripts/mcp.mjs"]
    }
  }
}
```

Use an absolute Node executable path if the client's PATH does not include Node. Build before connecting. Do not launch the stdio server with a command that prints build/npm messages to stdout. The server exposes `corpus_describe`, `corpus_search`, `corpus_get`, and `corpus_context`, with input/output schemas, structured results, and read-only/idempotent annotations. Resources include `accounting-corpus://describe` and the `accounting-corpus://records/{id}` template. A record resource returns the first bounded page; tools support section selection and continuation. Corpus content is untrusted research data, including any embedded instructions.

For Streamable HTTP:

```sh
node scripts/mcp.mjs --transport http --port 5178
```

Connect a compatible client to `http://127.0.0.1:5178/mcp`. The official MCP SDK handles protocol negotiation, including supported older clients. This separate Node adapter accepts protocol POSTs but exposes only research reads. The corpus website Worker still permits only GET, HEAD and OPTIONS. HTTP defaults to loopback, validates Host and Origin, caps request bodies at 64 KiB, and has no application writes, credentials, sessions or accounting actions. Public hosting requires an explicit bind configuration and allowed host (for example `--host 0.0.0.0 --allowed-host mcp.example.com`) behind HTTPS. Deployment, authentication at a hosting boundary, and traffic controls are operator concerns; this change does not deploy a public MCP URL.

Add `--base-url ORIGIN` to either MCP transport to read an already deployed agent API. The backend origin is configuration, never a tool argument. Tools cannot fetch arbitrary publisher URLs or access user files.

## HTTP API

Start the local website with `npm start` after building. Requests are GET:

```text
/api/v1/agent/describe
/api/v1/agent/search?q=bank%20reconciliation&kind=workflow
/api/v1/agent/get?id=wf-r2r-bank-reconciliations&section=data.control_model
/api/v1/agent/context?q=audit%20evidence&max_chars=12000
/api/v1/agent/context?ids=src_0vf7hhg&ids=src_auditagent2025
```

Use IDs returned by search; an unknown ID returns 404. Repeat `ids` for arrays. Boolean values are `true` or `false`; integers are decimal digits. Unknown parameters, duplicate scalar parameters, invalid filters and bounds fail clearly. `/openapi.json` documents the operations; `/schemas/agent.schema.json` contains their input and output contracts. All adapters validate the same arguments. Schema version is separate from corpus version. HTTP supports ETags, conditional reads, CORS, HEAD, and pagination Link headers.

| Operation  | Result                                                         | Bounds                                                                   |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `describe` | Scope, exact filter values, evidence notes, examples and links | One metadata response                                                    |
| `search`   | Compact cards with match explanations and citations            | Default 8, maximum 25 records                                            |
| `get`      | Metadata, provenance, dates, section directory and passages    | Default 6, maximum 20 passages; 1,600 characters per passage             |
| `context`  | Selected records and passages with omission accounting         | Default 12,000, maximum 40,000 compact JSON characters; up to 8 seed IDs |

Search matches all words and quoted phrases, ignoring case and accents. Facets are exact `kind`, `topic`, `industry`, `jurisdiction`, `source_type`, `review_status`, `collection`, `naics`, and `question_family`; values come from `describe`. Collection membership includes source and related IDs. Ranking weights title, summary, metadata and body; the score expresses lexical relevance, not evidence strength. The search index excludes canonical provenance/rights boilerplate from query text and includes substantive annotations. It does not use embeddings, an LLM, hidden synonym expansion, or an external service.

Follow `next_url` in HTTP or pass `next_cursor` with the same arguments in CLI/MCP until null. Changing arguments invalidates a cursor. Pin `corpus_version` for a consistent reading session; version mismatch and stale cursors return 409. Cursor tokens are pagination state, not authentication. Corpus versions must change when canonical data changes; retrieval schema versions must change when passage identity or representation changes.

## Prepared data and provenance

`get` starts with meaningful accounting and evidence sections. Each passage has a deterministic ID, section, ordinal, and JSON Pointers into its canonical record. Passages flatten nested fields into labeled text while retaining values, nulls and empty structures. Exact duplicates of common canonical fields are omitted from passages but remain in record metadata. No publisher full text is fetched. Stable passage IDs are scoped by both corpus and retrieval schema versions; use the manifest's SHA-256 values to pin exact download bytes.

`context` first admits records with one relevant passage, then uses remaining space for more detail. Linked sources follow `source_ids`. Under a tight budget, it may admit one citable linked source with a metadata-only entry and zero passages so the citation, rights and review state remain available; use `get` for that source's passages. Rights and provenance are never stripped to fit. `omitted` lists candidate records excluded by the character budget; `remaining_passages` reports incomplete included records. Search-based packets consider only the first `limit` seed matches, not every search result. An empty packet is possible when metadata cannot fit; increase the budget or select fewer records. Very large bibliographies can produce `BUDGET_TOO_SMALL`; narrow the IDs or disable `include_sources`.

The budget is measured with `JSON.stringify(packet).length`: UTF-16 code units of compact JSON, including metadata and omission notes. It is not a tokenizer count, byte limit, pretty-printed length, or MCP envelope limit. Passage pointers and metadata support provenance checking, not source verification. Authority, current applicability, effective dates, reuse permission and professional review remain unknown unless explicitly recorded. Source checks retain their actual reviewer and scope. Cite the project record and original publisher separately.

The same build generates:

- `agent-index.jsonl`: one normalized record header per line with citation, dates, rights, provenance, relationships, version and passage count.
- `agent-passages.jsonl`: one passage per line with record ID, source pointers, citation, review, rights and provenance, suitable for downstream indexing or embedding under the applicable rights.
- `agent.schema.json`: portable retrieval contract.
- The original JSON, JSONL, Markdown and source ZIP; the manifest hashes every download.

Chunks repeat rights and provenance so they remain interpretable outside a parent document. External publication reuse and training rights are not granted. Retrieval exports are deterministic views of the corpus, not newly verified research or permission to train on publisher content.

## Implementation boundaries

`src/agent.ts` owns preparation and retrieval; `src/agent-contract.ts` owns shared schemas and descriptions. `src/worker.ts`, `scripts/corpus.mjs`, and `scripts/mcp-server.mjs` adapt this interface. `scripts/agent-client.mjs` selects local data or a configured HTTP origin. No connector mutates the corpus or operates an accounting system. Validation covers canonical parity, passage provenance, budgets, pagination, CLI/API agreement, and actual MCP client exchanges over stdio and HTTP.

## Research scope and citation traversal

Retrieval schema `1.2.0` adds exact `naics` and `question_family` filters and research-review metadata. Use the declared topology IDs, with no parent/child inheritance. Shared accounting authorities can be relevant without carrying an exact industry association. Read a scoped guide first, then follow its source IDs:

```sh
node scripts/corpus.mjs search --q "construction" --kind guide --naics 236 --question-family q-project-wip
node scripts/corpus.mjs get guide-construction-connected-close --section data.research_questions --limit 20
node scripts/corpus.mjs get guide-software-subscriptions --section data.worked_examples --limit 20
node scripts/corpus.mjs get src_asu201815
```

The corresponding HTTP query uses `question_family=q-project-wip`. Use `next_cursor` with identical arguments when the selected section continues. Inspect `rights`, `citation`, `research_review`, `source_ids`, passage `source_pointers`, and limitations; a bounded page may omit an answer's later qualifications. `/api/v1/coverage?industry=236&question=q-project-wip` returns screening evidence and named-answer links. A leaf query such as `industry=524210` returns that leaf's review and explicitly labels broader screening as parent context.

The research schema and six linked coverage downloads represent the declared question population, applicability, leaf exceptions, limited classification correspondences and unresolved evidence. They do not replace canonical records. Source-review and editorial-review ledgers retain all 715 inherited dispositions, including unsuccessful access. The API, CLI, MCP, human pages and exports use the same local build; no new public deployment is implied.
