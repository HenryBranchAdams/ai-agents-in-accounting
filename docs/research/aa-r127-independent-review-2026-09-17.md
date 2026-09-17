# AA-R127 independent review

Review target: [PR #131](https://github.com/HenryBranchAdams/ai-agents-in-accounting/pull/131), exact head `f294a687ce48d5400d0aaa5d7a56bb90f6029cff`, against `main` base `afd2aced307628843f8a26677c3a6fb37fa733e3`.

Review branch: `codex/aa-r127-review`.

Review date: 2026-09-17.

## Result

Disposition: HOLD pending changes and release reconciliation.

The PR adds useful, bounded ERP lineage, correction, security, human-authority, empirical-transfer, and rights material. The synthetic Oracle fixture is internally coherent and the claims are generally classified conservatively. The public coverage state is not internally consistent, however, and the new question-level assessments and source reviews are not fully integrated into their canonical registries.

## Findings

### P1: Named-question denominator and public coverage state are stale

`data/coverage/research-questions.json` now contains 187 named questions, and `tests/roadmap-research.test.mjs:16` expects 187. The canonical criteria population still reports 178 named questions at `data/coverage/research-criteria.json:364-370`. `src/research.ts:18-21` spreads that stale population into `researchSummary` while recalculating 184 partial questions and 3 evidence gaps from the live registry. The resulting public summary is 178 named questions versus 184 partial plus 3 gaps, which totals 187.

The same stale state is carried into `data/catalog.json:3-10`, which still describes 1,067 records and 178 named questions, while the latest snapshot in `data/coverage/snapshots.json:1` records 1,069 records and the same inconsistent 178-question summary. The current tests compare the snapshot to the already stale summary, so they pass without checking the registry denominator.

Required correction: regenerate the criteria population, catalog, question-set metadata, public analytics, and snapshot from the combined final corpus. Add a regression that checks registry count, criteria count, analytics denominator, and snapshot summary, while preserving the prior edition.

### P1: New question assessments bypass the canonical assessment registry

The six new questions in `data/corpus/guide.json:47607-47981` carry embedded `assessment` objects, and their synchronized rows are present in `data/coverage/research-questions.json:5692-5900`. `data/coverage/assessments.json` is unchanged and remains at assessment version `2026-09-14.3` with four historical construction assessments. Consequently, the canonical coverage analytics and assessment export do not expose the six new partial assessments.

This does not satisfy issue #127's requirement to record exceptions, unresolved questions, professional-review status, and empirical limits in canonical coverage assessments, or the shared protocol's requirement to put scoped evidence in `data/coverage/assessments.json`. The guide's shared-context scope and empty industry list mean an industry code must not be invented to satisfy the existing schema.

Required correction: make an explicit canonical representation for shared-scope assessments, add the six dispositions and their evidence boundaries to that representation, update the assessment version and snapshot, and test that every newly assessed question is represented in canonical analytics and exports.

### P2: Cited source IDs lack exact locators, and the guide bibliography is incomplete

The new evidence-transfer question at `data/corpus/guide.json:47847-47915` cites six source IDs but provides locators for only `src_1sbtyzp`, `src_1v8cm5i`, and `src_0w8mvx4`. The NBER, Organization Science/HBS, and NIST records `src_1l0q90c`, `src_1p2g6i1`, and `src_038j28b` have no question-level locator. The rights-provenance question at `data/corpus/guide.json:47918-47981` cites `src_1k7its6` without a locator. The modified deployment evidence-gap question at `data/corpus/guide.json:24402-24446` has the same three missing general-source locators.

The new guide's top-level source list at `data/corpus/guide.json:47491-47507` also omits `src_1l0q90c`, `src_1p2g6i1`, and `src_1k7its6`, even though nested questions cite them. The IDs resolve to canonical source records, but the exact source-to-claim path required for audit and retrieval is incomplete.

Required correction: add an original URL, edition, and precise locator for every cited source, or remove source IDs that do not support the answer. Keep each guide's top-level source list equal to the union of its nested citations, and add tests for both invariants.

### P2: The 2026-09-17 empirical review is not synchronized into canonical source reviews

`data/research/empirical.json:196-283` records the Wiley and Microsoft checks as reviewed on 2026-09-17, with the Microsoft entry classified as `substantive-excerpt`. The canonical source records remain dated 2026-09-11 and classify both sources as `abstract-or-landing` at `data/corpus/source.json:24878-24904` and `data/corpus/source.json:32275-32302`. The canonical review registry has the same older dates and levels at `data/reviews/source-reviews.json:14217-14230` and `data/reviews/source-reviews.json:14913-14926`.

This matters because `scripts/import-research-packages.mjs:15-34` treats package sources as inputs that update canonical `supplemental_reviews`. The PR changes the importer-owned package without producing matching canonical source-review evidence. Users can therefore see different review dates and depths depending on which surface they use.

Required correction: run or appropriately revise the importer, verify the generated canonical source records and review registry, and add a package-to-canonical parity check. The canonical review must preserve the actual checked URL, scope, locator, access date, and rights limits.

### P2: Wiley source-depth metadata conflates review scope with source unavailability

The package says at `data/research/empirical.json:206-212` that the full methods are proprietary or access-restricted and were not obtained, and it labels the platform as a US accounting platform at line 207. It is valid to state that this package performed an abstract-only review and that raw platform records and reuse rights were not obtained. The publisher's current [full article](https://onlinelibrary.wiley.com/doi/full/10.1111/1475-679x.70052) is openly accessible and includes methods and limitations, so the package wording overstates the unavailability of the methods. The canonical source instead uses the narrower jurisdiction `SME accounting platform` at `data/corpus/source.json:24886` and `data/corpus/source.json:24925`.

Required correction: retain `review_scope: abstract-only` if that is the work actually performed, distinguish publicly available methods from unavailable raw data, and use a neutral jurisdiction unless the checked source establishes that the platform was US-based. Keep rights and raw-data permission unresolved.

## Release gate

The PR author identifies catalog, version, and release-note reconciliation as orchestrator work. That remains a release gate, not a reason to infer a completed release. The PR still leaves the catalog and question-set metadata at older versions, and its snapshot is `2026-09-17.1` even though the snapshot summary carries the older corpus and assessment versions. [PR #130](https://github.com/HenryBranchAdams/ai-agents-in-accounting/pull/130) also claims snapshot ID `2026-09-17.1` for a different branch state and record count. The orchestrator must combine the parallel work, preserve the prior immutable edition, regenerate all derived outputs, and emit one unique final snapshot identity. No merge recommendation should be made until that reconciliation is complete.

## What passed and what remains bounded

- `npm run check`: PASS, 85/85 tests; corpus validation reports 1,069 records and 636 sources; build reports 1,069 records, 27 downloads, and a 211-file source archive.
- `node --test tests/aa-i127-evidence.test.mjs`: PASS, 4/4 focused tests.
- `git diff --check`: PASS.
- Exact-head CI `verify`: SUCCESS at [run 35234984272](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35234984272/job/105248466608).
- Oracle's [Journal Headers API documentation](https://docs.oracle.com/en/cloud/saas/financials/26b/farfa/api-journal-batches-journal-headers.html) and [collection pagination guidance](https://docs.oracle.com/en/cloud/saas/applications-common/25d/farca/Manage_Collections.html) support the documented endpoint and pagination-control boundaries.
- The synthetic fixture's active-row, correction, tombstone, missing-page, and stop-and-escalate arithmetic is internally consistent. It is not live ERP evidence or an independently observed population.
- The Wiley material is retained as bounded accounting field evidence, the Microsoft material as vendor/customer practice evidence, and external dataset rights remain unresolved. No live Oracle tenant, production deployment, professional accounting sign-off, independent replication, or rights clearance was established.

This receipt is the only review-branch file change. The author branch was not modified.
