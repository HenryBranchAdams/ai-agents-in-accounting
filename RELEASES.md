# Corpus releases

The [September 10 local checkpoint](docs/checkpoint-2026-09-10.md) consolidates the current implementation and reading-interface updates. Corpus content remains version `2026-09-07.4`; this checkpoint does not claim publication or hosted CI acceptance.

The canonical version is `data/catalog.json:corpus_version`. Use a dated version such as `2026-09-07.1` and increment it when publishing changed corpus content. Schema changes use semantic versions independently; the refactored record schema is 2.0.0.

Every build generates JSON, JSONL, Markdown, and a complete source ZIP from the current working files. The manifest records version, record count, file sizes, and SHA-256 hashes. Generated downloads are the latest build and are not themselves a version-addressed archive.

Before publication, run `npm run check`, inspect the reading surface on desktop and mobile, review rights and substantive evidence changes, and record compatibility changes. Preserve exact released artifacts if immutable replay is required. Published versions should not be silently overwritten under the same version identifier.

Source IDs remain stable. The September 2026 schema and retired routes are documented in `docs/migration.md`. Public deployment, remote Git updates, and release archival are explicit maintainer actions; a local build does not perform them.
