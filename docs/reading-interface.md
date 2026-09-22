# Reading interface integration

Issue #175 is being integrated against the nine research packages from #173 and the answer-first reading changes from PR #181. Graph mounting and exploration remain owned by #171.

## Compact search contract

`GET /api/v1/search-suggestions?q=...` projects the canonical whole-corpus search into at most 12 results, preserving its order, aliases and quoted-phrase behavior. Only one `q` parameter is accepted, with the existing 240-character limit. Empty input returns no records. The response carries `corpus_version`, normalized `query`, true `total`, and `items` containing only `id`, `kind`, `title`, `summary`, `has_brief`, and the canonical `href`.

Summaries are canonical text shortened to at most 280 characters. The brief flag identifies an actual edited reading brief, rather than all guides. This endpoint does not inherit library filters. Use `/library?q=...` for all matches and the existing full-record API for complete records. ETag, conditional reads, HEAD, OPTIONS and rejected writes use the existing worker contract. Invalid parameters and malformed queries return readable 400 errors with no-store caching. OpenAPI documents the projection.

The browser contract lives separately from server retrieval so client code cannot accidentally import the corpus. Client implementation must reject an edition mismatch, preserve server order, cancel superseded requests and retain native navigation if enhancement fails.

## Browser entry identity

The build selects navigation by esbuild's exact `entryPoint` metadata. Shared or lazy chunks may appear first in the output map; output order cannot identify a page entry. Missing, duplicate and out-of-directory entries fail the build. Regression tests reorder outputs and exercise those failures before additional islands are introduced.

## Verification status

Focused tests cover canonical search parity, compact response fields, representative payloads below 32 KiB, validation, read-only methods and cache identity. These tests do not establish browser behavior or publication. The remaining palette, evidence previews, outline, filter and graph integration require combined production browser verification and the human acceptance specified by the issues.
