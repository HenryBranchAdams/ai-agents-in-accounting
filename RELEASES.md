# Corpus releases

The [September 11 construction checkpoint](docs/checkpoint-2026-09-11.md) records local corpus version `2026-09-11.1`: 37 new source records, 13 construction workflow maps, five collections, four briefs, and a scoped recheck of one inherited source. The [research report](docs/research/construction-accounting-coverage-2026-09-11.md) details coverage and unresolved gaps. The outgoing `2026-09-07.4` snapshot is preserved. This is local work; publication and hosted CI acceptance are not asserted.

The [September 10 checkpoint](docs/checkpoint-2026-09-10.md) remains the historical implementation and reading-interface checkpoint for corpus `2026-09-07.4`.

The canonical version is `data/catalog.json:corpus_version`. Use a dated version such as `2026-09-07.1` and increment it when publishing changed corpus content. Schema changes use semantic versions independently; the refactored record schema is 2.0.0.

Every build generates JSON, JSONL, Markdown, and a complete source ZIP from the current working files. The manifest records version, record count, file sizes, and SHA-256 hashes. Generated downloads are the latest build and are not themselves a version-addressed archive.

Before publication, run `npm run check`, inspect the reading surface on desktop and mobile, review rights and substantive evidence changes, and record compatibility changes. Preserve exact released artifacts if immutable replay is required. Published versions should not be silently overwritten under the same version identifier.

Source IDs remain stable. The September 2026 schema and retired routes are documented in `docs/migration.md`. Public deployment, remote Git updates, and release archival are explicit maintainer actions; a local build does not perform them.
