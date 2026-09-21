# Corpus and interface releases

Use the [draft and edition preparation path](docs/edition-preparation.md) for new corpus editions. Preliminary captures remain outside canonical history; deliberate finalization precedes committed verification.

## September 14, 2026 interface release

The shadcn reading surface uses 15 official registry components, Tailwind v4 Slate semantic tokens, server-rendered React and a hydrated navigation island. It covers search, filters, records, collections, briefs, coverage and publication views. Contributor, testing, migration and agent-development guidance now state the component and lint requirements. See [the design system](docs/design-system.md).

This presentation release carries the existing `2026-09-11.2` corpus, with 1,061 records and 630 source references. It does not change canonical content or source review status. Source Git commits and Sites deployment versions identify interface releases; corpus versions identify canonical content. The download manifest pins exact artifacts, including the source archive, because presentation-only releases can update those artifacts without changing corpus records. Confirm the live deployment and hosted CI separately.

## Earlier checkpoints

The [September 11 construction checkpoint](docs/checkpoint-2026-09-11.md) records local corpus version `2026-09-11.1`: 37 new source records, 13 construction workflow maps, five collections, four briefs, and a scoped recheck of one inherited source. The [research report](docs/research/construction-accounting-coverage-2026-09-11.md) details coverage and unresolved gaps. The outgoing `2026-09-07.4` snapshot is preserved. This is local work; publication and hosted CI acceptance are not asserted.

The [September 10 checkpoint](docs/checkpoint-2026-09-10.md) remains the historical implementation and reading-interface checkpoint for corpus `2026-09-07.4`.

The canonical version is `data/catalog.json:corpus_version`. Use a dated version such as `2026-09-07.1` and increment it when publishing changed corpus content. Schema changes use semantic versions independently; the refactored record schema is 2.0.0.

Every build generates JSON, JSONL, Markdown, and a complete source export from the current working files. When the deterministic ZIP fits the host limit, the export keeps the single ZIP; otherwise it publishes a manifest and ordered raw ZIP parts. The manifest records version, file sizes, SHA-256 hashes, and complete source membership. Generated downloads are the latest build and are not themselves a version-addressed archive.

Before publication, run `npm run check`, inspect the reading surface on desktop and mobile, review rights and substantive evidence changes, and record compatibility changes. Preserve exact released artifacts if immutable replay is required. Changed canonical records require a new corpus version and preservation of the outgoing snapshot. Presentation-only releases retain that corpus version and are identified by their source revision and deployment version; pin download hashes when exact replay is required.

Source IDs remain stable. The September 2026 schema and retired routes are documented in `docs/migration.md`. Public deployment, remote Git updates, and release archival are explicit maintainer actions; a local build does not perform them.

Oversized generated downloads are stored as gzip assets below the host’s 25 MiB per-file limit. The source export uses the existing ZIP when it fits; otherwise consumers download the source-export manifest and its ordered raw ZIP parts, then run `node scripts/reconstruct-source-archive.mjs` to verify every part, the reconstructed archive SHA-256, and complete ZIP membership. The current release gzip is the only separately published source path omitted from the ZIP, and every prior release byte remains included. The Worker streams oversized logical downloads at their public URLs, using manifest hashes as ETags. Downloads and the source export still come from one build.

`src/entry.ts` is a small Worker entrypoint that loads the immutable application module on the first request. The build keeps its static module chunk beside `dist/server/index.js`; deploy the whole server directory. This avoids corpus/index initialization during the host’s startup budget. The first request in a fresh isolate still pays initialization cost; later requests reuse the module. No request-specific mutable state is stored globally.

## September 21, 2026 local editorial candidate

Corpus `2026-09-21.3` adds two answer-first explanations to the existing bank-reconciliation workflow and construction connected-close guide. The editorial homepage and `/library` preserve legacy root query behavior, record anchors, rights and retrieval/export interfaces. The outgoing `2026-09-19.12427` snapshot remains intact. Optional kind-specific reading fields use the existing schema 2.0.0 open-data contract; no source review or rights status is upgraded.

This is a local review candidate for #170, not publication or issue resolution. See `docs/issue-170-implementation.md` for evidence and acceptance boundaries. #100 remains open. Human acceptance, hosted CI, merge and deployment are separate gates. Follow the existing release-infrastructure procedure only when publication is authorized.

The unpublished editorial drafts `2026-09-21.1` and `2026-09-21.2` remain retained. Edition `.3` includes the plain-writing pass and synchronized coverage registry headers. Assessment contents and review dates are unchanged.
