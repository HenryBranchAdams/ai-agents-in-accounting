# AA-R127 corrected-head independent re-review

Review target: [PR #131](https://github.com/HenryBranchAdams/ai-agents-in-accounting/pull/131), corrected head `b11155e2e49dcd82728f0b4cba5710fda0eeaf26`, against prior review head `f294a687ce48d5400d0aaa5d7a56bb90f6029cff` and `main` base `afd2aced307628843f8a26677c3a6fb37fa733e3`.

Review branch: `codex/aa-r127-rereview`.

Review date: 2026-09-17.

## Disposition

The five findings in the prior AA-R127 receipt are resolved at the corrected head. No prior P1 research or canonical-data defect remains. The release gate remains HOLD until the final catalog and combined-edition integration is completed. Two residual P2 issues are recorded below.

## Prior findings rechecked

### 1. Named-question denominator

The registry contains 187 named questions with 184 `partial` rows and 3 `evidence-gap` rows. `data/coverage/research-criteria.json:3,365` and `data/coverage/research-questions.json:3` now carry version `2026-09-17.1272` and the 187 denominator. `src/research.ts:18-24` derives the runtime denominator from the registry, and the latest snapshot summary agrees with runtime analytics.

The catalog remains intentionally unchanged at `data/catalog.json:3-10`, where its coverage note still says 1,067 records and 178 named questions. That is a final release-integration gate, not evidence that the corrected coverage denominator failed.

### 2. Canonical shared assessments

`data/coverage/assessments.json:3,215-224,615-626` contains 13 assessments: 4 existing industry assessments and 9 new shared-context assessments. The shared records use `industry_code: null`, identify their named question, and retain family IDs, evidence records, dimensions, gaps, review status, and rights boundaries. The expanded contract is in `schemas/coverage.schema.json:35-46`, with runtime checks in `scripts/validate-coverage.mjs:33-75`.

Independent linkage checks found all 9 shared assessments map to the correct guide question and registry row. `src/coverage.ts:49-112` keeps shared and industry assessments separate. Construction scope `23` still returns the 4 historical construction assessments, construction child scope `236` returns none, and shared assessments do not reduce its unassessed status.

### 3. Source locators and bibliography union

The two changed guides now have complete source-ID to locator unions and complete top-level source unions. The 3 existing deployment questions and 6 new AA-I127 questions each have a locator for every cited source, with HTTPS URLs and substantive locator text. The synchronized registry rows remain at `data/coverage/research-questions.json:5653-5885`.

### 4. Canonical source reviews and importer output

The Wiley and Microsoft records now carry the corrected 2026-09-17 source review details and matching `supplemental_reviews` entries at `data/corpus/source.json:24878-24904,32313-32339` and `data/reviews/source-reviews.json:14217-14230,14912-14931`. The empirical package inputs at `data/research/empirical.json:196-283` match those canonical supplemental review contents.

An independent all-source parity check also resolved the package's two legacy aliases and found matching canonical supplemental content for all 7 empirical package sources. Existing non-empirical supplemental reviews were unchanged relative to the prior review head.

### 5. Wiley scope and jurisdiction

The package now states that the publisher's [full article](https://onlinelibrary.wiley.com/doi/abs/10.1111/1475-679x.70052) is openly accessible, that this package performed an abstract-only review, and that platform raw data and reuse permission were not obtained at `data/research/empirical.json:206-215`. The jurisdiction is the neutral `SME accounting platform; professional accountants`, which is also reflected in the canonical source record. This distinguishes accessible methods from unavailable raw data and avoids the prior unsupported US-platform label.

## Residual findings

### P2: The documented research-package importer is not edition-safe

The current empirical package is version `2026-09-17.1272` and was reviewed on 2026-09-17 at `data/research/empirical.json:3,621-622`. `scripts/import-research-packages.mjs:6-8` still hardcodes the import date to 2026-09-11, line 33 writes that date into empirical `supplemental_reviews`, line 61 hardcodes generated guide version 2026-09-11.1, and line 95 hardcodes the research-question metadata to the 2026-09-11 versions.

Running the documented importer against the current package would therefore replace the current 2026-09-17 empirical supplemental entries with 2026-09-11 entries and regenerate package-derived coverage metadata at the older version. The corrected canonical data are synchronized now, but replaying the repository's documented importer is not safe for this edition.

Required correction: derive the date and version from the package or explicitly separate historical importers from current edition generation. Add a replay test covering all package sources, alias remapping, preservation of non-package supplemental reviews, and protection against version downgrade.

### P2: Shared assessments still render under an obsolete WIP heading

When no industry or question filter is selected, `src/coverage.ts:152-153` supplies all 13 assessments to the page. `src/coverage-view.tsx:564-572` still labels that section `Earlier scoped WIP assessment` and uses the same WIP-only empty-state wording. The new shared-context rights, evidence-transfer, security, and authority assessments therefore appear under a heading that falsely describes their scope. A direct rendered-page probe confirmed the obsolete heading and shared assessment cards are present together.

Required correction: rename the section and empty state to describe scoped assessments generally, or split industry-scope and shared-context sections. Add a rendered-route assertion for shared assessment labeling.

## Test strength

The added tests strongly cover the corrected target data: denominator equality, latest snapshot summary equality, changed-guide locator and source unions, 9 shared assessment IDs, two new canonical empirical reviews, and exported assessment presence at `tests/aa-i127-evidence.test.mjs:94-155`. Existing construction tests continue to select the historical construction assessment by ID.

The focused test checks only the two newly changed empirical source IDs, not all seven package inputs or the two alias mappings. It also does not exercise shared-versus-industry route rendering or importer replay. Independent checks covered those gaps: all 7 package inputs matched canonical supplemental content after alias resolution, non-empirical supplemental entries were preserved, shared assessments stayed out of industry cells, and the obsolete page heading was identified.

## Snapshot and release gate

The prior snapshot object `2026-09-17.1` is unchanged. The new snapshot `2026-09-17.1272` is unique and coherent with the current build: 1,069 records, 13 scoped assessments, mapping and assessment versions `2026-09-17.1272`, matching analytics summary, and matching current input-hash values. Snapshot history grew from 15 to 16 entries without rewriting the prior object.

The current catalog still has corpus version `2026-09-14.3`, update date 2026-09-14, and the older 1,067-record/178-question coverage note. The orchestrator must combine the parallel work, preserve prior release history, update catalog and final release metadata, regenerate all derived outputs, and retain one unique final snapshot identity. This review does not authorize merge, catalog edits, deployment, or issue closure.

## Verification and limits

- `npm run lint`: PASS. Typecheck, corpus validation, UI lint, and design lint passed.
- `npm test`: PASS, 87/87 tests, including the loopback MCP path when run with the required local permission. Build reports 1,069 records, 27 downloads, and a 211-file source archive.
- `git diff --check`: PASS.
- Exact-head CI `verify`: SUCCESS at [run 35241528782](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35241528782/job/105270897710).
- The synthetic Oracle fixture's active-row, correction, tombstone, missing-page, arithmetic, and stop-and-escalate behavior remains internally coherent. It is not live ERP or independently observed population evidence.
- No live Oracle tenant, production deployment, professional accounting sign-off, independent replication, external rights clearance, or accounting-treatment conclusion was established.

No author branch files were modified. This receipt is the only review-branch change.
