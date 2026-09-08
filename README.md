# Accounting Agents research corpus

A public, read-only research corpus that helps people and agents find, understand, and reuse the information needed to build accounting agents.

The corpus brings original source references together with accounting workflows, controls, design references, terminology, and synthetic examples. Search, citations, source relationships, and portable downloads are the product.

The corpus contains **749 records**: 517 source references, 60 workflows, 24 design references, 26 reading collections, and 122 other accounting and technical references. The September 7 research expansion adds 28 sources with scoped, AI-assisted publisher checks and five collections covering electronic invoicing, ledger/data interfaces, public-sector and charity accounting, payroll reporting, and financial-reasoning research. The 716 inherited records retain their earlier migration status. Source checks are not professional verification or exhaustive coverage. See [mission and coverage](data/catalog.json).

## Run locally

Node.js 22.13 or later is required.

```sh
npm ci
npm run check
npm run dev
```

Open `http://127.0.0.1:5177`. Rebuild with `npm run build` after editing data, source, or assets; the development server restarts when its imported bundle changes. `npm start` serves an existing build. Use `PORT` to choose another local port.

The site has no database, account system, or client JavaScript. A Fetch handler serves HTML and a read-only API. Shared schemas use Zod; the separate MCP adapter uses the official MCP TypeScript SDK. The build produces a Cloudflare Worker and static assets, plus Node adapters for local use. Building does not publish the site.

## Connect an agent

The API, CLI and MCP share four operations: `describe`, `search`, `get`, and `context`. Search returns compact cards; get returns citable passages with canonical source pointers; context enforces a character budget and reports omitted material. Every response carries corpus and retrieval schema versions. Rights and review provenance remain attached.

```sh
node scripts/corpus.mjs search --q "bank reconciliation" --kind workflow
node scripts/corpus.mjs get wf-r2r-bank-reconciliations
node scripts/corpus.mjs context --q "audit evidence" --max-chars 12000
node scripts/mcp.mjs
```

The MCP command serves stdio. Use `--transport http --port 5178` for Streamable HTTP at `/mcp`. Both connectors default to the local snapshot; `--base-url ORIGIN` connects to a deployed agent API. See [setup, contracts and limits](docs/agent-access.md). Public deployment and registration in an MCP client are separate steps.

## Retrieve and reuse

- `/api/v1/records?q=bank+reconciliation`: search full records.
- `/api/v1/agent/describe`: discover agent capabilities and filters.
- `/api/v1/agent/search`, `/get`, `/context`: compact search, passages and bounded context (all under `/api/v1/agent/`).
- `/api/v1/records?kind=workflow&page=1&limit=20`: filter and paginate.
- `/api/v1/records/{id}`: retrieve a stable record.
- `/records/{id}.md`: retrieve a Markdown record.
- `/api/v1/collections/{id}`: retrieve a bibliography with its source records.
- `/downloads/corpus.json`, `.jsonl`, `.md`: download the complete snapshot.
- `/downloads/agent-index.jsonl`, `/downloads/agent-passages.jsonl`: ingest normalized headers and citable passages with provenance and rights.
- `/downloads/manifest.json`: verify sizes and SHA-256 hashes.
- `/openapi.json`, `/llms.txt`, `/AGENTS.md`: discover the interface.

Record data lives in [`data/corpus`](data/corpus). The same records drive the site, search, and exports. Generated artifacts go in `dist/` and are not committed. The source ZIP includes new files even before Git staging.

## Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md), the [record policy](docs/corpus-policy.md), and [AGENTS.md](AGENTS.md). Prefer original publishers and useful accounting context. Preserve uncertainty and rights. The goal is exhaustive coverage through traceable additions, not inflated record counts.

Courses, interactive training, labs, maps, and benchmark programs have been retired. Useful bibliographies, editorial references, and synthetic scenarios were retained. See the [migration](docs/migration.md).

Software is MIT; project metadata and synthetic values are CC0; original editorial content is CC BY 4.0. **External source content is not redistributed or licensed by this project.** Free access does not imply permission to train on or redistribute a publication. See [LICENSE_POLICY.md](LICENSE_POLICY.md).
