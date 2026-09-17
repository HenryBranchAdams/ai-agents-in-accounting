# AA-R127 latest final residual re-review

Date: 2026-09-17

PR: 131

Exact reviewed head: 724f8970f231a6f6c87d5a92b308a70949fdecef

Compared with: ed5f0b88c2ac7c315cf357dcb5a6f13f8498d7ba

Base: main

Review branch: codex/aa-r127-final-rereview4

Scoped disposition: PASS

Final release gate: separate and pending catalog and combined-edition history integration.

## Scope and delta

The exact delta contains only `scripts/import-research-packages.mjs` and `tests/import-research-packages.test.mjs`. No canonical corpus, catalog, coverage input, snapshot, or release file changed between the compared SHAs. This review is limited to the three prior importer residuals, fresh package application, replay stability, unrelated-update preservation, and canonical newer evidence.

## Prior residuals independently rechecked

- A canonical supplemental review newer than the incoming package is retained wholesale, including replacement limitations and checks, with an older-date conflict. Unrelated non-package supplemental reviews remain unchanged.
- A maintained unmatched source locator is retained while an unrelated keyed question update is applied. The locator conflict is reported and repeated replay is byte-stable.
- Empirical `population`, `intervention`, `comparator`, `outcomes`, `funding_or_author_relationship`, and assessment-status differences under a stable question ID retain the current question with a substantive conflict. Importer, mapping generation, and validation pass, and repeated replay is byte-stable.
- Newer and same-date mapping conflicts retain current owned mapping fields and extensions.
- Duplicate canonical URLs and stale non-self aliases fail before writes. The existing NAICS URL exception remains valid.

## Fresh application and replay

An independent fresh-record fixture added a new package source. The importer created the canonical source with `inherited-not-reverified` and null top-level `reviewed_at`, attached the package review as supplemental evidence, reported the source change, and produced byte-stable repeated importer, mapping, and validation output.

An independent valid newer-edition fixture advanced the package to `2026-09-17.1273` and added a defined optional question field. The field was applied, the guide edition advanced, no substantive conflict was emitted, and importer, `scripts/coverage-mappings.mjs`, and `scripts/validate.mjs` all passed.

An independent clean current-corpus replay passed importer, mapping generation, and validation with 636 sources, 187 guides, 187 named questions, 8 explicit conflicts, 5 source-record changes, 5 mapping-record changes, no guide or registry changes, and no alias changes. The repeated replay was byte-stable. `src_1l0q90c` remained top-level inherited with null `reviewed_at`, and the non-package Oracle mapping remained absent.

A deliberately non-additive newer package replacement of an older canonical supplemental review emitted explicit array conflicts and preserved the current arrays. This is a visible fail-closed conflict requiring review, not silent stale merging.

## Identity and input boundary

The current corpus has 636 canonical sources with no duplicate canonical URLs. All 74 package source entries resolve to 65 canonical IDs with no current package ID/URL mismatch. The current catalog, canonical records, coverage inputs, and `data/coverage/snapshots.json` are unchanged between the compared SHAs. The latest snapshot remains `2026-09-17.1272`.

## Verification

- Focused importer tests: PASS, 6/6.
- Full repository test suite: PASS, 94/94. The real Streamable HTTP test passed with local loopback permission.
- `npm run lint`: PASS, including typecheck, corpus validation, UI lint, and design lint.
- `git diff --check`: PASS.
- Exact-head CI `verify`: SUCCESS at [run 35257640908](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35257640908/job/105325134288).

No author branch files were modified. No merge, deployment, catalog edit, snapshot edit, or issue closure was performed. This receipt is the only review-branch change.

Local and CI checks do not establish deployment parity, live source verification, external rights clearance, professional accounting review, or independent replication.
