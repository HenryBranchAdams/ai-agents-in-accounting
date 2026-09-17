# AA-R118 independent implementation review

Date: 2026-09-17

Repository: `https://github.com/HenryBranchAdams/ai-agents-in-accounting`

Review worktree: `/Users/henryadams/.codex/worktrees/247d/ai-agents-in-accounting`

Review branch: `codex/aa-r118-review`

Reviewed head: `8d7c018050212a440443c5194e65ff7ad2733a16`

Base: `refs/remotes/origin/main` at `afd2aced307628843f8a26677c3a6fb37fa733e3`

Origin default branch: `origin/HEAD -> origin/main`

Disposition: **Not ready for integration.** The PR has two release-integrity blockers and several bounded evidence or maintainability follow-ups. The author corpus and immutable snapshots were not changed by this review.

## Review scope

This review used the original Issue 118 completion criteria and the shared review protocol, not the PR's relabeled criteria. It covered the eight requested families, existing guide and question preservation, source depth and rights, the synthetic January 2026 fixture, retrieval and counterexamples, generated coverage, the applicator, and same-build exports.

The original criteria were:

1. Inventory existing records and questions with explicit roles, frameworks, periods and populations.
2. Add original US authority-linked answers with publisher URLs, locators, effective/access metadata and rights state.
3. Supply inputs, accounting workflows, controls and worked material.
4. Record canonical exceptions and professional or empirical limits.
5. Verify representative retrieval, scope counterexamples and same-build exports/checks.

## Criteria assessment

| Criterion | Assessment | Evidence and limit |
| --- | --- | --- |
| 1. Inventory | Partial, not signable | The eight new questions and the selected fixture declare a private nongovernmental role, US GAAP, US jurisdiction, January 2026 period and synthetic population. Existing IFRS questions and stable IDs remain. The PR does not include a separate inventory/disposition of the existing records and questions showing reuse, deepen, new bounded question or unresolved status. |
| 2. US authority links | Partial | Six original publisher sources have URLs, locators, effective-period fields where known, access/review levels and unresolved rights. The four answers for close, estimates, presentation, and policy/errors rely in material part on `src_1os761s`, whose canonical review level is `abstract-or-landing`; the package itself says current topic text was not fully accessed. These are bounded research leads, not full current-authority coverage. |
| 3. Inputs, workflows, controls, worked material | Pass for the stated synthetic scope | The fixture has opening and adjusted trial balances, six proposed balanced journals, source-event identity, approvals, dated FX inputs, statement mapping, controls and review-only actions. It does not establish live ERP completeness, posting, payment, filing or production close behavior. |
| 4. Exceptions and limits | Pass as bounded material | All eight assessments remain `partial`; professional review is `not-performed`, empirical support is `not-established`, source rights remain unresolved, and the package retains government, SEC/private, shared-services, historical-FAS-52 and missing-date boundaries. |
| 5. Retrieval and exports | Partial pending integration repair | Independent all-family question-filter retrieval found all eight target guides, source pointers resolved, IFRS records remained present, the fixture arithmetic tied, and the full check passed. The PR's snapshot ID collides with PR 131 and two generated coverage files regress their corpus version, so the combined release history and coverage exports are not currently safe to integrate. |

## Findings

### P1-01: Snapshot ID collides with PR 131

`data/coverage/snapshots.json` adds snapshot `2026-09-17.1` with 1,074 records, 1,015 question-mapped records and 12 scoped assessments. PR 131 at head `f294a687ce48d5400d0aaa5d7a56bb90f6029cff` also has `2026-09-17.1`, but its input hashes and counts differ: 1,069 records, 1,011 question-mapped records and four scoped assessments. For example, the assessment hashes are `c050a4...` in this PR and `af4273...` in PR 131.

This is an immutable-history collision, not a cosmetic version difference. A combined release cannot use the same ID for two different measured inputs, and the existing snapshot guard correctly rejects rewriting an ID with different hashes.

Required correction: have the release owner assign a unique final snapshot ID, preserve both measured histories, and regenerate the combined snapshot after the intended PR set is selected. Do not rewrite either existing snapshot.

### P1-02: Generated coverage headers regress to an older corpus version

Compared with the supplied base, the PR changes both:

- `data/coverage/subsector-profiles.json`: `corpus_version` from `2026-09-14.1` to `2026-09-11.2`
- `data/coverage/subsector-screening.json`: `corpus_version` from `2026-09-14.1` to `2026-09-11.2`

The catalog and snapshot identify the current corpus as `2026-09-14.3`. The 5,952 screening cells otherwise changed only by adding the eight named question IDs to 768 cells, but the header regression makes those generated artifacts claim an older corpus. `npm run check` does not detect this cross-file version mismatch.

Required correction: restore or regenerate the coverage artifacts with the correct release version, then add a cross-file version assertion so the generator cannot silently publish an older header.

### P1-03: The requested baseline inventory is not evidenced as a durable artifact

The PR adds eight new named questions and updates the named-question count from 178 to 186, but it does not add an inventory that records the existing question or record, role, framework, period, population, disposition and remaining gap for the baseline set. The package's eight `us_scope` objects document the new selected slice, not the requested inventory of existing material.

Required correction: add or link the inventory/disposition artifact used for the slice. It should make clear which existing IFRS and other framework records are reused, which questions are deepened, which eight are new, and which family or population remains unresolved.

### P2-01: Landing-page evidence is labeled as a sourced answer for four families

The canonical FASB source record `src_1os761s` records `review_level: abstract-or-landing` and a landing-page/standards-index locator. The estimates and policy/errors questions cite exact ASC 250 paragraphs while also saying current consolidated text was not fully accessed. The close question uses the same landing-level FASB source plus editorial close sources, and the presentation question uses the landing-level source plus SEC index/staff material.

The disclosure is honest, but `answer_status: sourced-answer-bounded` and the resulting coverage count can be read as substantive authority coverage. Required correction: either label these as bounded research leads or add the permitted current-authority evidence, effective-date review and entity-scope review needed to count them as substantive sourced answers. Keep the current gaps and unresolved rights visible.

### P2-02: The applicator overwrites existing canonical records without a preservation guard

`scripts/apply-reporting-foundations.mjs` replaces an existing matching example at lines 250-252, replaces a matching question at lines 144-147, and unconditionally updates registry, assessment and mapping versions at lines 268-305. Exact reapplication on the current PR tree is byte-for-byte idempotent. A separate temporary probe added a newer unrelated field to the matching example and re-ran the applicator; the field was removed.

Required correction: fail on an existing record whose canonical content differs from the package, or merge only package-owned fields with an explicit conflict report. Add a preservation test for newer unrelated canonical edits. Current-tree idempotence does not establish safe reapplication after later corpus work.

### P2-03: FX pair notation is reproducible only if consumers ignore the pair convention

The fixture declares `quote: USD per CAD` and correctly computes CAD 10,000 as USD 7,400 at 0.74 and USD 7,500 at 0.75. Each rate row labels the pair `USD/CAD`, which is not an unambiguous statement of the multiplication direction for a downstream consumer. An inverted interpretation would produce a materially different payable.

Required correction: use an explicit base/quote field and formula, or rename the pair to match the declared quote convention. Add a test that independently converts the foreign amount and verifies the direction.

### P2-04: ASU 2014-15 effective-period metadata is imprecise

`data/research/reporting-foundations.json` describes the source as effective for “interim periods beginning after 2016-12-15.” The official FASB update describes an annual period ending after December 15, 2016, with annual periods and interim periods thereafter. The distinction does not change the January 2026 fixture, but the source metadata should not restate the effective rule inaccurately.

Required correction: align the effective-period field with the official update and retain the current consolidated-text limitation.

### P2-05: Unrelated construction source associations are in the PR diff

The PR changes `guide-industry-naics2022-236`, `guide-industry-naics2022-237` and `guide-industry-naics2022-238` by adding the existing construction sources `src_construction_fasb_retainage_staff`, `src_construction_gao_25107258` and `src_construction_asbca_51759`. These changes are outside the reporting-foundations slice and have no corresponding rationale in the supplement.

Required correction: remove the unrelated associations from this PR or document and independently verify the intended construction change in its owning workstream.

## Diff and preservation audit

- Six source IDs were added. No existing source ID, URL or source record was removed or changed.
- One synthetic example and eight named US questions were added. Existing IFRS questions remained and no old question ID was removed.
- Eight scoped assessments were added. Existing assessment rows were preserved.
- Mapping overrides added one example row and updated review dates on the eight target guide rows. No override rows were deleted.
- The 768 changed screening cells add the eight new named question IDs only. Applicability, evidence outcome and adequacy fields did not change. No assessment propagated from sector 54 to 541 or 541110.
- `subsector-profiles.json` profile content did not change; only its corpus header regressed. The screening file has the same header regression.
- The construction test change selects its named assessment instead of the last row, which is a safeguard against appended assessments, not a weakened assertion.

## Fixture and retrieval evidence

Independent recalculation of `data/research/reporting-foundations-example.json` found:

- Opening trial balance: debits and credits both 200,000.
- Six proposed journals: every journal balanced, every event ID resolved, and every status remained `proposed-not-posted`.
- January net expense: 15,000 wages minus 3,000 reversal plus 7,400 service expense plus 100 January FX loss plus 12,000 earned-but-unrecorded expense = 31,500.
- Adjusted trial balance: debits and credits both 185,000.
- Closing retained earnings: 85,000 opening retained earnings minus 31,500 January net expense = 53,500.
- February CAD settlement: 7,600 settlement amount versus 7,500 January carrying amount, leaving a separate 100 February FX effect.
- Statement mapping: assets equal liabilities plus equity at 185,000, with no executed actions.

The built agent was independently queried with the exact question-family filter for each of the eight new families. Every target guide was returned, all eight direct question sections retained structured `/data/research_questions/` pointers, and the reporting-basis, events, SEC/private, shared-services and missing-date boundaries remained visible. Existing IFRS consolidation material remained linked and the new US consolidation question did not cite an IFRS source.

## Checks and external state

- `npm ci`: passed using the locked dependency set because this worktree did not contain `node_modules` initially.
- Sandboxed `npm run check`: reached the tests but the local Streamable HTTP test failed to bind `127.0.0.1` with `EPERM`.
- Escalated `npm run check`: passed, 86 tests passed, 0 failed. This covered typecheck, corpus validation, UI/design lint, build, exports, source archive, coverage validation and the new reporting-foundations tests.
- Build output: 1,074 records, 27 downloads and a 215-file source archive at corpus version `2026-09-14.3`.
- `git diff --check refs/remotes/origin/main..HEAD`: passed.
- Exact-head CI was inspected once: workflow `Corpus integrity and retrieval`, run `35235387387`, job `105249844259`, completed successfully.
- No deployment, hosted acceptance, professional accounting review, live ERP or market-rate population, merge, remote branch change or release publication was performed.

## Review conclusion

The reporting-foundations slice is useful bounded research material and its synthetic arithmetic, retrieval plumbing, rights posture and human-action boundary are sound. It cannot be accepted as an integration-ready release until the snapshot identity and generated coverage version are repaired. The baseline inventory and source-depth labeling should also be resolved before the eight answers are treated as satisfying the original authority-coverage criterion.
