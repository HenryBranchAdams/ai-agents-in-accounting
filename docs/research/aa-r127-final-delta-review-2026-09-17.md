# AA-R127 final delta review

Date: 2026-09-17

PR: 131

Exact reviewed head: fe791cf70c4fe6243eb620ab16f69c7bab262f5c

Compared with: b11155e2e49dcd82728f0b4cba5710fda0eeaf26

Review branch: codex/aa-r127-final-rereview

Disposition: HOLD

## Summary

The delta contains four files: the research-package importer, the server-rendered coverage view, and two test files. No author data, catalog, snapshot, or release files changed in this delta.

The coverage heading correction is effective. The public route now uses “Scoped assessments”, the empty copy is generic, and shared assessment cards retain the “Shared context” label.

The importer correction is incomplete. Date and edition scalars are preserved in the tested newer and incomparable cases, and conflicts are emitted. However, the importer still rebuilds package guides, mappings, and the question registry from partial package data. A clean replay changes maintained canonical fields without reporting conflicts, promotes an unresolved source to a primary review date, and emits reviewed mapping entries with no review date. The documented follow-up mapping and validation checks fail on that replay.

## Open findings

### P1: documented package replay can generate invalid and partially corrupted canonical state

The importer applies a package review date to an existing source primary record at scripts/import-research-packages.mjs:94-116. In the current data, src_1l0q90c remains inherited-not-reverified with a null primary reviewed_at because its primary NBER review is unresolved. A clean replay applies the empirical package date 2026-09-17 to that primary field even though the package evidence is a supplemental arXiv review. The following documented validation then fails with “migration cannot assert a new review date”.

The importer also loops over every canonical source cited by generated question rows at scripts/import-research-packages.mjs:172-177. For existing sources that are not package inputs, sourceDates has no value, so it writes reviewed_question_ids with reviewed_at null. A clean replay followed by scripts/coverage-mappings.mjs fails for src_oracle26b_journal_headers because a reviewed mapping has no reviewed_at.

Required follow-up:

- Keep supplemental package review dates separate from the primary source review status and migration contract.
- Do not create reviewed mapping entries without a valid review date and explicit evidence, or preserve an existing reviewed mapping unchanged.
- Run the importer followed by validation and mapping generation in the replay regression test.

### P2: preservation is scalar-only and clean replay is not idempotent

Guide generation at scripts/import-research-packages.mjs:144-157 creates data from the package object and replaces the prior guide mapping object. It preserves only the selected guide version and reviewed_at scalars. Registry generation at lines 158-185 recreates every question row and replaces the prior registry object. Supplemental merging at lines 80-92 replaces the entire matching review when the incoming date is equal or the current date is absent.

An independent clean replay exited successfully with sources 636, guides 187, named_questions 187, preserved_newer_metadata 0, and no conflicts, but changed 7 source records, 3 guides, 19 mapping records, 16 registry rows, and added two self-alias entries. Examples included construction assessment fields changing from present to partial, removal of existing question reviewed_at fields, replacement of evidence-specific mapping rationale, and additions of reviewed mappings with null dates.

An independent newer-state fixture confirmed that:

- A higher same-date guide edition, 2026-09-17.1273, stayed ahead of the incoming 2026-09-17.1272 edition and emitted a conflict.
- An incomparable guide or registry edition, edition-current, stayed in place and emitted a conflict.
- Newer source, guide, mapping, registry, and supplemental date scalars were retained with conflicts.
- Existing source nested data was retained because the source object is reused.
- A newer guide nested marker, guide mapping marker, registry top-level and row markers, an undated supplemental marker, and a same-date supplemental marker were dropped. Same-date incoming data wins without a conflict, as claimed, but the whole-object replacement is not safe for additional maintained fields.

Required follow-up:

- Preserve or explicitly merge all maintained nested metadata when the current record is newer or incomparable.
- Make clean replay semantically idempotent, or report every intentional canonical change and require review before writing.
- Add fixtures for nested guide and mapping fields, registry row dates, undated reviews, equal-date reviews, all package aliases, and validation after replay.

## Aliases and current package inputs

The current package set has 74 source entries, 72 unique input IDs, and 65 canonical source IDs. All package entries resolve to canonical records. The current alias file has 70 entries. Replay retained those existing mappings and added self-aliases for src_1sbtyzp and src_1v8cm5i; no package source was lost.

The focused author tests cover the current replay and one future scalar state, but do not compare complete clean-replay output, run validation or mapping generation after replay, or assert nested-field preservation.

## Coverage rendering

The changed server-rendered wording is correct at src/coverage-view.tsx:509-512 and 564-572. An independent route probe returned status 200 for the all-assessment, question-scoped, and unassessed industry/question routes. Each contained the Scoped assessments heading and no old WIP heading or empty copy. Shared cards remained labeled Shared context. The added route assertion is tests/roadmap-research.test.mjs:61-69.

No layout, class, form, link, details, summary, or keyboard interaction changed. I did not perform desktop or mobile browser inspection or a real keyboard traversal. Those checks remain unverified, but the required scope is low for this string-only delta and the server-rendered accessibility structure is unchanged.

## Snapshot and release checks

The old 2026-09-17.1 snapshot is unchanged. The latest 2026-09-17.1272 snapshot remains unique and matches current input hashes, with 1,069 records, 13 scoped assessments, and mapping and assessment version 2026-09-17.1272. None of the four changed files is a latest-snapshot input.

No new snapshot is required solely for the checked-in importer and rendering code change. The snapshot does not cover the importer or coverage view, however, and the clean replay changes canonical data. Snapshot coherence therefore does not establish importer reproducibility. The catalog and final history integration remain orchestrator-owned release gates.

## Verification

- npm test: PASS, 90/90, including focused importer tests 2/2.
- npm run lint: PASS, including typecheck, corpus validation, UI lint, and design lint.
- git diff --check: PASS.
- Exact-head CI verify: SUCCESS, https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35245944985/job/105286051770
- Author PR branch was not modified. No merge, deployment, catalog edit, snapshot edit, or issue closure was performed.

