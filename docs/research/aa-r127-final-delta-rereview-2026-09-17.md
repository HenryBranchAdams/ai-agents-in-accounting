# AA-R127 final delta re-review

Date: 2026-09-17

PR: 131

Exact reviewed head: a62b394f4098e259c24ef7549f0a3736b922d5d1

Compared with: fe791cf70c4fe6243eb620ab16f69c7bab262f5c

Base: main

Review branch: codex/aa-r127-final-rereview2

Disposition: HOLD

## Delta boundary

The exact delta contains only `scripts/import-research-packages.mjs` and `tests/import-research-packages.test.mjs`. No canonical corpus, catalog, snapshot, coverage input, or release file changed between the compared SHAs.

## Re-review conclusion

The author fixes resolve the original clean-replay defects:

- `src_1l0q90c` remains `inherited-not-reverified` with a null primary `reviewed_at`; its empirical arXiv evidence remains supplemental.
- The non-package Oracle source does not receive a null-dated reviewed mapping and remains a candidate.
- An invalid reviewed mapping fails before any mutable output is written. An independent fixture exited 1 with the expected assertion and all six mutable output files remained byte-identical.
- Newer and incomparable guide, mapping, registry, source, and supplemental metadata dates and editions are retained with conflicts. Nested guide, mapping, registry, undated, and same-date markers survive the focused replay tests.
- The current corpus has 636 canonical sources, no duplicate source URLs, 74 package source entries, 72 unique package IDs, 65 canonical source IDs, and no current package ID/URL target mismatches.

An independent clean temporary-copy replay ran the importer, `scripts/coverage-mappings.mjs`, and `scripts/validate.mjs` successfully. It reported 636 sources, 187 guides, 187 named questions, no preserved-newer conflicts, 9 source-record changes, 8 mapping-record changes, no guide or registry changes, and no alias changes. A repeated importer, mapping, and validation replay was byte-stable. The source and mapping changes are therefore deterministic and auditable, but the importer is not a no-op on the current canonical inputs.

## Residual findings

### P2: newer mapping review metadata is only date-preserved, not semantically preserved

At `scripts/import-research-packages.mjs:245-254`, generated mapping fields are recursively merged into the prior mapping and only `reviewed_at` is protected afterward. Scalar incoming values therefore overwrite a newer canonical mapping's policy fields.

An independent fixture set `src_1sbtyzp` to a 2026-09-18 mapping with `replace_question_ids: true`, a custom question list, a custom basis, and custom reason and note, then replayed the older package. The 2026-09-18 date was retained and an older-date conflict was emitted, but the policy fields changed to `replace_question_ids: false`, an expanded generated question list, `/data`, and generic generated reason and note. This violates preservation of newer mapping semantics even though the result remains structurally valid.

Required follow-up: treat a reviewed mapping as a date-aware semantic unit, or preserve its maintained fields when its date is newer or incomparable. Contradictory same-date fields should be reported rather than silently replaced.

### P2: primitive-array union can retain stale or contradictory package evidence

At `scripts/import-research-packages.mjs:75-97`, primitive arrays are unioned and keyed object-array items absent from the incoming package are retained. This is safe for explicitly append-only metadata, but not for package-owned evidence fields that may be corrected or removed.

An independent newer-edition fixture set a package guide's top-level `source_ids`, a question's `source_ids`, and `remaining_gaps` to empty arrays, and changed the question text while reusing its stable ID. Replay retained the old source IDs and gaps without a primitive-array conflict, while the changed question text was accepted under the same ID. A variant with changed answer text retained the old finding with an explicit unmatched-item conflict. The first case can leave stale citations and gaps attached to changed question content.

Required follow-up: distinguish replacement fields from append-only fields, report or reject removals, and validate that a stable question ID cannot silently change its question while retaining incompatible evidence. Preserve maintained extension fields without blindly unioning semantically incompatible content.

### P3, conditional: ambiguous URL identity has no conflict guard

The current inputs have no duplicate source URLs and no wrong ID/URL resolutions. A synthetic fixture with a duplicate canonical URL and an unknown package ID silently selected the last URL entry, wrote the alias to that record, and emitted no conflict. A stale alias target would likewise be trusted without checking its URL.

This was not observed in the current corpus and is not evidence of a current wrong-source merge. Required follow-up: reject duplicate canonical source URLs or require an explicit ambiguity conflict before attaching supplemental evidence by URL.

## Original-failure and acceptance checks

- Focused importer tests: PASS, 3/3.
- Full repository test suite: PASS, 91/91. The real Streamable HTTP test passed with local loopback permission.
- `npm run lint`: PASS, including typecheck, corpus validation, UI lint, and design lint.
- `git diff --check`: PASS.
- Exact-head CI `verify`: SUCCESS at [run 35250851991](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35250851991/job/105302534505).
- The current catalog, canonical records, coverage inputs, and `data/coverage/snapshots.json` are unchanged between the compared SHAs. The latest snapshot remains `2026-09-17.1272` with the existing 1,069-record and 187-question build inputs.

No author branch files were modified. No merge, deployment, catalog edit, snapshot edit, or issue closure was performed. This receipt is the only review-branch change.

The release gate remains HOLD pending correction of the two P2 importer semantics and the final orchestrator-owned catalog and combined-edition integration. Local and CI checks do not establish deployment parity, live source verification, external rights clearance, professional accounting review, or independent replication.
