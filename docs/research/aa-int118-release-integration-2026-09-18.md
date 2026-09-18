# AA-INT118 reporting-foundations integration, mapping correction and portable source-export receipt

Date: 2026-09-18

Repository: `https://github.com/HenryBranchAdams/ai-agents-in-accounting`

Integration branch: `codex/aa-int118-integration`

Base: merged `main` commit `7ecd9e31d7035f7a4d38bae6e0bd1fba46343144`, tree `b0ff95509bccfd7a0e065e3637ac86cb15df8233`

## Scope

This branch integrates the bounded partial AA-R118 reporting-foundations package from reviewed head `0de408bf3f00928f41ac90d2c0b5ccde338b58e1` with independent receipt commit `03376a104d2849d1cfed9221d87d6177baec2e99`. The package adds eight source records, eight US-scoped named questions, one original synthetic January 2026 close example, and eight sector-anchor assessments.

The integration keeps the accepted conflict-aware research importer and the newer AA-I119, AA-I125, AA-I127 and nonprofit records unchanged outside the eight intentionally deepened reporting guides. The four explicit current-authority evidence gaps remain open. All eight reporting-foundations assessments remain `partial`. The source applicator derives exact source-question associations from package citations, preserves newer registry, mapping and assessment versions, and fails closed on package-owned guide or mapping divergence. Clean-base, replay, current-mainline preservation and mutation-sensitive checks are included.

## Immutable history and release identity

The existing mainline `2026-09-17.1` coverage snapshot and all prior release artifacts remain unchanged. The AA-R118 receipt records a separate PR132 `2026-09-17.1` history and a colliding PR131 `2026-09-17.1` history with different inputs. This branch does not copy either history over the other. The existing collision-provenance snapshot `2026-09-17.6` remains unchanged, and the corrected current inputs are recorded in new immutable snapshot `2026-09-17.7`.

The coherent corrected corpus edition is `2026-09-17.5`:

- 1,106 canonical records, including 653 sources
- 208 named research questions
- 25 scoped assessments, including eight new partial reporting-foundations assessments
- four reporting-foundations questions explicitly marked `evidence-gap`
- release artifacts under `data/releases/2026-09-17.5/`

The current release was generated from the same corpus export used by the build. Earlier release bytes were not regenerated.

## Portable source export

The prior PR138 monolithic source archive measured 28,355,528 bytes, or 27.04 MiB, after integrating the coherent release directory and receipt sources. This follow-up keeps the deterministic ZIP bytes as the reconstruction target and publishes them as ordered raw parts when the single ZIP exceeds the host limit. Each part has a 24 MiB ceiling, leaving 1 MiB of headroom below the 25 MiB host limit.

The generated `accounting-agents-source.manifest.json` records the corpus version, full archive size and hash, ordered part names, offsets, sizes and hashes, and complete source membership. It marks only `data/releases/2026-09-17.5/corpus.json.gz` as separately provided by the release bundle; every other current source path and every historical release gzip remains in the reconstructed ZIP. The standard download manifest cross-checks the source-export summary against the same build.

When the deterministic ZIP fits under the host limit, the existing single `accounting-agents-source.zip` output remains available and the same manifest switches to `mode: single`. When it does not, stale source-export parts are removed only from the generated download directory. `scripts/reconstruct-source-archive.mjs` verifies each part, reconstructs the ZIP in order, verifies the archive hash, and checks complete ZIP membership. No host limit was raised, no source content was silently dropped, and no deployment-facing resolution was bypassed.

The exact generated part paths now receive `application/octet-stream` from both the Worker asset fallback and `scripts/serve.mjs`. The override is limited to `/downloads/accounting-agents-source.zip.part-<digits>`, preserves the asset bytes, length and ETag, and leaves JSON, Markdown and arbitrary unknown paths on their existing MIME behavior. GET, HEAD and conditional 304 responses use the same binary headers.

## Author checks

- Focused integration, mapping and source-export suites: 27/27 passed, including clean-base application, byte-identical replay, current-mainline preservation, exact source-question associations, newer-metadata preservation, conflicting-association rejection, four authority-gap checks, eight partial assessments, mutation sensitivity and snapshot-collision provenance.
- Portable source-export suite: 4/4 passed, including clean temporary reconstruction, complete membership, all part and archive hashes, historical release presence, deterministic replay, stale-part cleanup, single-ZIP compatibility, and missing or corrupted part rejection.
- Coverage mapping and coverage header regeneration: passed, 1,106 mappings and 5,952 screening cells.
- Immutable release and coverage snapshot generation: passed for `2026-09-17.5` and `2026-09-17.7`; prior `.4` and `.6` artifacts remain unchanged.
- `npm run build`: passed, generating 29 downloads and a multipart source export with 274 included source files.
- `node scripts/reconstruct-source-archive.mjs`: passed against the generated manifest and parts.
- Multipart route and header regression: passed in `tests/corpus.test.mjs`, 17/17, including exact bytes, binary MIME, Content-Length, ETag, GET, HEAD, 304 and unchanged JSON MIME.
- Local `scripts/serve.mjs` harness: passed against a real multipart part, including exact SHA-256, binary MIME, length, ETag, HEAD and 304 behavior; Markdown and JSON MIME remained unchanged.
- Browser or screenshot validation: not run. This fix changes download routing and local static serving only; no page markup, styling or keyboard interaction changed.
- `npm run check`: passed with loopback permission for the existing MCP HTTP integration test, including all 134 tests.

No merge, issue closure, deployment, or reviewer-comment rejection bypass was performed.
