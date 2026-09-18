# Accounting Agents research corpus

A public, read-only research corpus that helps people and agents find, understand, and reuse the information needed to build accounting agents.

The corpus brings original source references together with accounting workflows, controls, design references, terminology, and synthetic examples. Search, citations, source relationships, and portable downloads are the product.

The [roadmap](docs/roadmap.md) records the research expansion and remaining evidence work. Read the [roadmap handoff](docs/checkpoint-roadmap-2026-09-12.md) for counts, reading paths, validation and publication boundaries. Earlier checkpoints preserve historical states; retired product plans are not the current backlog.

The corpus contains **1,061 records**, including **630 source references, 186 guides, 73 workflows, 35 collections and 7 examples**. All 715 inherited records have documented review dispositions; this does not mean every source received a substantive full-text review. The expansion provides 178 named research questions across all 62 families, connected construction examples, four contrasting industry packages and four selected jurisdiction packages. Coverage includes 96 subsector profiles, 5,952 applicability screenings and 1,012 individual industry exception reviews.

**176 named questions remain partial and 2 are evidence gaps. No entire family, subsector or detailed industry is assessed sufficient.** Scoped AI-assisted source checks, classification review and software validation do not establish professional accounting verification or production effectiveness. The canonical edition is `2026-09-11.2`. The [live site](https://accounting-agents.madebyhenry.chatgpt.site) exposes its served edition at `/api/v1/meta`; deployment and corpus versions are separate. See [mission and coverage](data/catalog.json).

## Run locally

Node.js 22.13 or later is required.

```sh
npm ci
npm run check
npm run dev
```

Open `http://127.0.0.1:5177`. Rebuild with `npm run build` after editing data, source, or assets; the development server restarts when its imported bundle changes. `npm start` serves an existing build. Use `PORT` to choose another local port.

The site has no database or account system. React renders crawlable HTML on the server; a small client island hydrates desktop navigation and the mobile Sheet, with native navigation available without JavaScript. Search and filters use GET forms. A Fetch handler serves the pages and a read-only API. Shared schemas use Zod; the separate MCP adapter uses the official MCP TypeScript SDK. The build produces a Cloudflare Worker and static assets, plus Node adapters for local use. A small entry module loads the immutable corpus application on first request to stay within the host’s startup budget. Deploy the complete generated server directory, including its module chunk. Building does not publish the site.

## Public interface

The interface uses Tailwind v4, official shadcn/ui source components, Radix, and Lucide. `public/style.css` owns the standard semantic theme plus explicit typography and layout extensions. `src/components/ui/` holds registry primitives; application components and `src/pages/` compose them. Keep native semantic markup for corpus prose.

Read the [design system](docs/design-system.md) before changing the interface. Use registry components, built-in variants and sizes, semantic colors, and layout-only caller classes. `@shadcn/lint` runs in both `npm run lint` and `npm run check`, including deliberate violation probes. Follow the [contributor workflow](CONTRIBUTING.md#interface-changes) and [verification requirements](TESTING.md).

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
- `/downloads/accounting-agents-source.manifest.json`: verify and reconstruct the complete source ZIP or its ordered parts.
- `/downloads/manifest.json`: verify sizes and SHA-256 hashes.
- `/openapi.json`, `/llms.txt`, `/AGENTS.md`: discover the interface.

Record data lives in [`data/corpus`](data/corpus). The same records drive the site, search, and exports. Generated artifacts go in `dist/` and are not committed. The source export includes new files even before Git staging. Use `node scripts/reconstruct-source-archive.mjs` after downloading the manifest and all listed parts.

## Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md), the [record policy](docs/corpus-policy.md), and [AGENTS.md](AGENTS.md). Prefer original publishers and useful accounting context. Preserve uncertainty and rights. The goal is exhaustive coverage through traceable additions, not inflated record counts.

Courses, interactive training, labs, maps, and benchmark programs have been retired. Useful bibliographies, editorial references, and synthetic scenarios were retained. See the [migration](docs/migration.md).

Software is MIT; project metadata and synthetic values are CC0; original editorial content is CC BY 4.0. **External source content is not redistributed or licensed by this project.** Free access does not imply permission to train on or redistribute a publication. See [LICENSE_POLICY.md](LICENSE_POLICY.md).

## Evidence, retrieval and maintenance

The `/coverage` view joins every record to versioned industry and accounting-question metadata. It includes the complete NAICS-US 2022 hierarchy, 62 question families, proposed record associations, scoped evidence assessments and measured coverage history. Broader-industry and shared context remain separate from direct material. Download the analytics, mapping JSONL, full topology or 96-by-62 screening CSV, and follow [the coverage model](docs/coverage-model.md) to update the baseline.

Research briefs at `/briefs` now include construction WIP, tax transitions, multistate boundaries and lifecycle coverage alongside the three earlier cross-source briefs. The site also exposes structured source evidence and applicability, controlled scope filters, and typed relationships. Raw source metadata and rights remain canonical; inferred scope retains field-level basis. The additive agent schema is 1.1.0.

The reading surface puts search and three starting paths on the homepage, keeps filtered results compact with removable filter links, and provides source findings, applicability, limitations, citation, and provenance navigation. Review scope and unknown rights remain visible. Official shadcn/ui components use shared Slate semantic tokens. Research brief cards and corpus content are server-rendered; only navigation hydrates.

`/changes` links versioned snapshots; `/records/{id}/history` identifies canonical changes against the newest preserved predecessor (currently 2026-09-11.1). `/maintenance` exposes unresolved reviews, rights and source observations. Run `npm run maintenance` to inspect the queue; live checks are explicit and never upgrade source review status. See [maintenance](docs/maintenance.md) and [retrieval regression coverage](docs/research-questions.md).
