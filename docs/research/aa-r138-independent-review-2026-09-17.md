# AA-R138 independent integration review

Date: 2026-09-17

Repository: `https://github.com/HenryBranchAdams/ai-agents-in-accounting`

Review worktree: `/private/tmp/aa-r138-review`

Review branch: `codex/aa-r138-independent-review`

Reviewed head: `9efe9b88e36f278e9c5af59d988c9232aeb9f861`

Reviewed head tree: `6315fdf2636c59e7d1ba9ac530ba88c6d862e666`

Base: `7ecd9e31d7035f7a4d38bae6e0bd1fba46343144`

Accepted package receipt: `03376a104d2849d1cfed9221d87d6177baec2e99` for reviewed package head `0de408bf3f00928f41ac90d2c0b5ccde338b58e1`

Disposition: **Scoped acceptance of the accounting/importer/integration behavior with one P2 integration finding. Not final release approval.** The source-archive host-limit failure remains an explicit release gate and is separately assigned for deterministic multipart export work.

## Review scope

This review covers the exact supplied AA-R138 head and its delta from main: preservation of the accepted reporting-foundations package and newer records, clean/replay/fail-closed applicator behavior, the bounded Issue 118 research scope, source status and rights, arithmetic and retrieval, immutable snapshot collision provenance, and release `2026-09-17.4` with coverage snapshot `2026-09-17.6`.

The review branch adds this receipt only. It does not edit the author corpus, release history, deployment configuration, or author branch.

## Finding

### P2: New reporting sources are not explicitly mapped to the named questions

The eight new source records are cited by the eight package questions, but the applicator does not persist the corresponding source-level mapping review.

Evidence at the reviewed head:

- `scripts/apply-reporting-foundations.mjs:76-98` creates every new source with `data.source_review.question_ids: []`.
- `scripts/apply-reporting-foundations.mjs:275-287` updates the guide override only. Unlike the established research-package importer, the applicator has no source loop that derives exact question associations and writes `mapping-overrides.records[source_id]`.
- `data/coverage/record-mappings.json` therefore classifies five new sources only as title-derived `candidate` mappings (`src_fasb_201009`, `src_fasb_201305`, `src_fasb_201415`, `src_fasb_201502`, `src_fasb_fas52`) and leaves three with no question mapping (`src_fasb_202010`, `src_fasb_202511`, `src_sec_regsx`).
- `data/research/reporting-foundations.json` explicitly cites all eight sources from the named questions, so these are known package relationships rather than speculative keyword matches.

This does not break canonical guide-to-source traversal: the guide and question `source_ids`, locators and source records are present. It does make the coverage ledger incomplete and causes direct coverage material counts to omit three cited sources and to label the other five as unreviewed candidates. It also leaves the source review metadata inconsistent with the package's explicit question-level citation review.

Recommended correction: derive each new source's exact question IDs from the package questions, preserve shared-context industry scope and unknown external rights, write source `question_ids` plus reviewed source mapping overrides with the package review date and limitation note, regenerate `record-mappings.json`, and add a regression assertion for all eight source IDs. The correction must preserve newer mapping metadata and remain fail-closed on divergence.

## Accepted research and integration evidence

- The package remains bounded partial work, not Issue 118 closure. Four questions are `evidence-gap` (`q-ledger-close`, `q-estimates`, `q-presentation`, `q-policy-changes-errors`); four are `sourced-answer-bounded`; all eight new assessments are `partial`.
- The synthetic January 2026 example remains arithmetic-consistent for its stated scope. It is original, read-only material and does not establish posting, filing, professional, operational, or empirical evidence.
- All eight new sources retain locators and source checks, `full_text_stored: false`, unknown source rights and no inferred publisher reuse permission. The SEC material remains scoped to its declared registrant population; future or pending material is not promoted to current authority.
- Clean-base application, byte-identical replay, current-mainline preservation, guide divergence failure, and no-write-on-conflict behavior pass in the focused suite. Existing record identities and unrelated newer metadata remain preserved in the inspected delta.
- Snapshot verification found 23 snapshots at the reviewed head, with only `2026-09-17.6` added. Existing snapshots are byte-stable; the colliding `2026-09-17.1` histories remain preserved with two source receipts, and all latest snapshot input hashes match their declared inputs.
- Release `2026-09-17.4` contains 1,106 records, 1,106 JSONL rows, nine additions, no removals, 17 history rows, and matching release-file hashes. Earlier release artifacts remain unchanged.

## Checks run

- `npm run typecheck` — passed.
- `npm run validate` — passed: 1,106 records, 653 sources, corpus version `2026-09-17.4`.
- `git diff --check 7ecd9e31d7035f7a4d38bae6e0bd1fba46343144..9efe9b88e36f278e9c5af59d988c9232aeb9f861` — passed.
- `node --test tests/reporting-foundations.test.mjs tests/aa-int119125-integration.test.mjs` — 16/16 passed.
- `npm run build` — blocked at the existing source archive host-limit guard after generating the corpus exports. The generated archive measured 28,355,528 bytes, 27.04 MiB, above the 25 MiB limit.
- `npm run check` — not run to completion and not claimed. The supplied CI run `35296648342` is also known to fail at the same archive-size gate; no CI pass or release qualification is claimed.

## Release boundary

The next release owner must first correct the source mapping gap and complete the separately assigned deterministic multipart source export while retaining every current and historical artifact. Then rerun the full check and perform final release review. No merge, issue closure, deployment, or publication is approved by this receipt.
