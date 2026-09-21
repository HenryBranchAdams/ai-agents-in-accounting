# AA-R127 targeted final residual review

Date: 2026-09-17

PR: 131

Exact reviewed head: ed5f0b88c2ac7c315cf357dcb5a6f13f8498d7ba

Compared with: a62b394f4098e259c24ef7549f0a3736b922d5d1

Base: main

Review branch: codex/aa-r127-final-rereview3

Disposition: HOLD

## Scope and delta

The exact delta contains only `scripts/import-research-packages.mjs` and `tests/import-research-packages.test.mjs`. No canonical corpus, catalog, coverage input, snapshot, or release file changed between the compared SHAs. This review is limited to importer merge semantics, package replay, source identity, and the requested valid newer-update path.

## Settled checks

The new guards independently resolve the two prior P2 cases and the localized identity failure:

- A newer `src_1sbtyzp` mapping is retained wholesale with an older-date conflict, including custom policy fields and extensions. Same-date contradictory owned mapping fields are also retained with a conflict.
- A changed same-ID question with removed source IDs or gaps retains the current question and reports substantive and primitive-array removal conflicts.
- Duplicate canonical URLs and stale non-self aliases fail before output writes. The existing NAICS URL exception remains accepted.
- `src_1l0q90c` remains top-level `inherited-not-reverified` with null top-level `reviewed_at`; empirical arXiv evidence remains supplemental. The non-package Oracle record receives no reviewed mapping.
- A valid newer package update with an optional defined question field is applied, and importer, mapping generation, and validation all pass.

An independent clean temporary-copy replay ran importer, `scripts/coverage-mappings.mjs`, and `scripts/validate.mjs` successfully. It reported 636 sources, 187 guides, 187 named questions, 8 explicit conflicts, 5 source-record changes, 5 mapping-record changes, no guide or registry changes, and no alias changes. A repeated importer, mapping, and validation replay was byte-stable.

## Residual findings

### P2: newer supplemental review arrays can retain stale older evidence

`mergeSupplementalReview` at `scripts/import-research-packages.mjs:196-212` calls `mergeValue` with the older incoming package review as the base when the canonical supplemental review has a newer date. The recursive merge therefore treats the newer canonical arrays as incoming values. When the newer review replaces or removes old `limitations` or `checks`, the primitive-array and keyed-array rules preserve the older package arrays and emit conflicts, while the newer review is not retained wholesale.

An independent fixture set the Wiley supplemental review to 2026-09-18 with a replacement limitation and replacement check, then replayed the 2026-09-17 package. The date and a newer marker survived, but the output retained all three older package limitations and both older package checks. Conflicts were emitted for `incoming-primitive-array-removal-preserved-current` and `unmatched-current-array-items-preserved`, but those conflicts document the wrong retained value. This can leave stale source-review evidence attached to a newer canonical review.

Required follow-up: make newer or incomparable supplemental review objects authoritative for maintained fields, preserving only explicitly additive extensions, or preserve the canonical object and report field-level contradictions without merging older evidence into it.

### P2: an unmatched retained locator blocks unrelated valid newer question updates

The keyed-array merge at `scripts/import-research-packages.mjs:104-123` returns the entire current array when any current item is absent from the incoming package. That preserves the unmatched item but skips all matching-item merges in the same array.

An independent fixture added a maintained canonical source locator to an existing question, advanced the package edition, and added a non-substantive marker to the matching package question. Importer, mapping generation, and validation passed, but the marker was absent from the canonical question. The output reported a substantive locator conflict. The conflict is visible, but the valid incoming update was discarded because of an unrelated retained locator.

Required follow-up: merge matched items while preserving and reporting unmatched current items, and separately report incoming items that cannot be integrated. Do not let one retained extension block valid updates to other stable IDs.

### P2: several empirical question fields outside the substantive list can change silently

`substantiveQuestionFields` at `scripts/import-research-packages.mjs:80-88` covers question text, answer, scope, answer status, family IDs, sources, locators, observed outcomes, evidence type, and gaps. Actual empirical package questions also contain `population`, `intervention`, `comparator`, `outcomes`, and `funding_or_author_relationship`. Those fields are passed through the generic merge without a substantive conflict. Derived assessment metadata is likewise not protected as an owned question field.

An independent schema-valid newer-edition fixture changed all five empirical study fields and changed an assessment status from `partial` to `evidence-gap` under the same stable question ID. Importer, mapping generation, and validation passed with no conflict for that question, and every changed field appeared in the canonical output. These are evidence-bearing study-design fields, so a future correction can silently change the interpretation of a stable question while the conflict report remains empty.

Required follow-up: include all package-owned evidence-bearing question fields in substantive comparison, or explicitly document and test which fields are allowed to update independently of question identity.

## Identity and current-input audit

The current corpus has 636 canonical sources with no duplicate canonical URLs. All 74 package source entries resolve to 65 canonical IDs, with no current package ID/URL mismatch. The independent stale-alias fixture rejected a non-self alias whose target URL differed from the package URL and left all six mutable outputs byte-identical. The independent duplicate-URL fixture also failed closed before writes.

The latest snapshot remains `2026-09-17.1272`. The catalog, canonical records, coverage inputs, and `data/coverage/snapshots.json` are unchanged between the compared SHAs. The snapshot does not prove importer replay semantics.

## Verification

- Focused importer tests: PASS, 4/4.
- Full repository test suite: PASS, 92/92. The real Streamable HTTP test passed with local loopback permission.
- `npm run lint`: PASS, including typecheck, corpus validation, UI lint, and design lint.
- `git diff --check`: PASS.
- Exact-head CI `verify`: SUCCESS at [run 35254369891](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35254369891/job/105314243524).

No author branch files were modified. No merge, deployment, catalog edit, snapshot edit, or issue closure was performed. This receipt is the only review-branch change.

The final release gate remains HOLD pending the three P2 importer corrections and the separate orchestrator-owned catalog and combined-edition history integration. Local and CI checks do not establish deployment parity, live source verification, external rights clearance, professional accounting review, or independent replication.
