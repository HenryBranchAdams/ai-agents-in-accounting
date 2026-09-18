# AA-INT118 bounded reporting-foundations integration and portable source-export receipt

Date: 2026-09-18

Repository: `https://github.com/HenryBranchAdams/ai-agents-in-accounting`

Integration branch: `codex/aa-int118-integration`

Base: merged `main` commit `7ecd9e31d7035f7a4d38bae6e0bd1fba46343144`, tree `b0ff95509bccfd7a0e065e3637ac86cb15df8233`

## Scope

This branch integrates the bounded partial AA-R118 reporting-foundations package from reviewed head `0de408bf3f00928f41ac90d2c0b5ccde338b58e1` with independent receipt commit `03376a104d2849d1cfed9221d87d6177baec2e99`. The package adds eight source records, eight US-scoped named questions, one original synthetic January 2026 close example, and eight sector-anchor assessments.

The integration keeps the accepted conflict-aware research importer and the newer AA-I119, AA-I125, AA-I127 and nonprofit records unchanged outside the eight intentionally deepened reporting guides. The four explicit current-authority evidence gaps remain open. All eight reporting-foundations assessments remain `partial`. The source applicator preserves newer registry, mapping and assessment versions and fails closed on package-owned guide divergence. Clean-base, replay, current-mainline preservation and mutation-sensitive checks are included.

## Immutable history and release identity

The existing mainline `2026-09-17.1` coverage snapshot and all prior release artifacts remain unchanged. The AA-R118 receipt records a separate PR132 `2026-09-17.1` history and a colliding PR131 `2026-09-17.1` history with different inputs. This branch does not copy either history over the other. It records the collision provenance on new coverage snapshot `2026-09-17.6`.

The coherent combined corpus edition is `2026-09-17.4`:

- 1,106 canonical records, including 653 sources
- 208 named research questions
- 25 scoped assessments, including eight new partial reporting-foundations assessments
- four reporting-foundations questions explicitly marked `evidence-gap`
- release artifacts under `data/releases/2026-09-17.4/`

The current release was generated from the same corpus export used by the build. Earlier release bytes were not regenerated.

## Portable source export

The prior PR138 monolithic source archive measured 28,355,528 bytes, or 27.04 MiB, after integrating the coherent release directory and receipt sources. This follow-up keeps the deterministic ZIP bytes as the reconstruction target and publishes them as ordered raw parts when the single ZIP exceeds the host limit. Each part has a 24 MiB ceiling, leaving 1 MiB of headroom below the 25 MiB host limit.

The generated `accounting-agents-source.manifest.json` records the corpus version, full archive size and hash, ordered part names, offsets, sizes and hashes, and complete source membership. It marks only `data/releases/2026-09-17.4/corpus.json.gz` as separately provided by the release bundle; every other current source path and every historical release gzip remains in the reconstructed ZIP. The standard download manifest cross-checks the source-export summary against the same build.

When the deterministic ZIP fits under the host limit, the existing single `accounting-agents-source.zip` output remains available and the same manifest switches to `mode: single`. When it does not, stale source-export parts are removed only from the generated download directory. `scripts/reconstruct-source-archive.mjs` verifies each part, reconstructs the ZIP in order, verifies the archive hash, and checks complete ZIP membership. No host limit was raised, no source content was silently dropped, and no deployment-facing resolution was bypassed.

## Author checks

- Reporting-foundations and integration focused suites: 16/16 passed, including clean-base application, byte-identical replay, current-mainline preservation, four authority-gap checks, eight partial assessments, mutation sensitivity and snapshot-collision provenance.
- Portable source-export suite: 4/4 passed, including clean temporary reconstruction, complete membership, all part and archive hashes, historical release presence, deterministic replay, stale-part cleanup, single-ZIP compatibility, and missing or corrupted part rejection.
- Coverage mapping and coverage header regeneration: passed, 1,106 mappings and 5,952 screening cells.
- Immutable release and coverage snapshot generation: passed for `2026-09-17.4` and `2026-09-17.6`.
- `npm run build`: passed, generating 29 downloads and a multipart source export with 268 included source files.
- `node scripts/reconstruct-source-archive.mjs`: passed against the generated manifest and parts.
- `npm run check`: passed with loopback permission for the existing MCP HTTP integration test, including all 132 tests.

No merge, issue closure, deployment, or reviewer-comment rejection bypass was performed.
