# AA-INT118 bounded reporting-foundations integration receipt

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

The current release was generated from the same corpus export used by the build before the source archive size guard stopped completion. Earlier release bytes were not regenerated.

## Source archive gate

Before this package, the measured source archive was 25,611,935 bytes, or 24.43 MiB. After integrating the package but before adding the new release directory, it was 26,545,676 bytes, or 25.32 MiB. With the coherent `2026-09-17.4` release directory and final receipt sources included, a direct final measurement is above the 25 MiB host limit at 266 of 267 source files. The tested contract still omits exactly the current release `corpus.json.gz`; no additional source or historical artifact was omitted.

The build therefore stops with the host-limit error rather than silently dropping source or history. Independent review must choose a resolution before release qualification: raise the actual host asset limit, or introduce a deterministic multi-part source archive that retains every file and updates the public download contract and tests. This author branch does not choose either deployment-facing resolution.

## Author checks

- Reporting-foundations and integration focused suites: 16/16 passed, including clean-base application, byte-identical replay, current-mainline preservation, four authority-gap checks, eight partial assessments, mutation sensitivity and snapshot-collision provenance.
- Coverage mapping and coverage header regeneration: passed, 1,106 mappings and 5,952 screening cells.
- Immutable release and coverage snapshot generation: passed for `2026-09-17.4` and `2026-09-17.6`.
- `npm run build`: blocked only at the measured source archive host-limit guard described above; canonical validation and release preparation completed before that guard.
- `npm run check`: not claimed because the required build cannot complete while the archive exceeds the host limit.

No merge, issue closure, deployment, or reviewer-comment rejection bypass was performed.
