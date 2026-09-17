# AA-R119 independent review

Review date: 2026-09-17

## Review identity

- Pull request: #133
- Base: `main` at `afd2aced307628843f8a26677c3a6fb37fa733e3`
- Reviewed head: `bcec0a5d344972b664448800d91dca920f17f94c`
- Review branch: `codex/aa-r119-review`
- Worktree: `/Users/henryadams/.codex/worktrees/21a3/ai-agents-in-accounting`
- Remote confirmation: `origin/main` resolved to `afd2aced307628843f8a26677c3a6fb37fa733e3`; `refs/pull/133/head` resolved to `bcec0a5d344972b664448800d91dca920f17f94c`.

## Outcome

The implementation is bounded and independently testable, but the review is not ready for release reconciliation without follow-up on the findings below. The review made no changes to canonical corpus records. The only intended change on this branch is this receipt.

The substantive US additions are present across six existing families: 12 new US questions, seven workflows, seven controls, two synthetic ledger examples, five new FASB source records and three retrieval fixtures. Existing questions in those six guides were preserved exactly, including the existing IFRS questions. The construction records and construction-specific limits remain present.

## Findings

### [P1] Generated coverage metadata reports an older corpus version

`data/coverage/subsector-profiles.json:4` and `data/coverage/subsector-screening.json:4` report `2026-09-11.2`. The parent versions of both files reported `2026-09-14.1`, while the canonical corpus and the latest preserved snapshot `2026-09-17.5` identify `2026-09-14.3`. The generator hard-codes the older value at `scripts/build-research-coverage.mjs:40-41`, so rerunning it can reproduce the regression.

This is a provenance and release-reconciliation defect, not a screening-logic regression. The current and parent files both contain 5,952 cells; 576 cells changed, and every changed cell changed only `named_question_ids`. No applicability, rationale, exclusion, adequacy or open-question field changed. The snapshot input hashes all match the current bytes, but the version labels do not identify the same corpus edition.

Required disposition: update the generator or its inputs so the derived artifacts carry the intended corpus version, regenerate without rewriting prior snapshot IDs, and add or preserve a check that rejects a stale generated corpus version.

### [P1] New authority locators are not synchronized with the source records' declared review scope

The reused source record `src_construction_fasb_2014_09` declares review of only ASC 606 paragraphs 25-27, 25-31 through 25-37, 45-1 through 45-5, 55-21 and Example 19 at `data/corpus/source.json:75275-75329`. New US questions cite additional paragraphs outside that declaration, including:

- ASC 606-10-25-1 through 25-2 and 25-14 in `data/corpus/guide.json:6473`.
- ASC 606-10-32-1 through 32-6 and 45-1 through 45-4 in `data/corpus/guide.json:6539`.
- ASC 340-40-25-1, 25-5 through 25-8 and 35-1 in `data/corpus/guide.json:6966`.

The existing `src_construction_fasb_202505` record declares only summary, scope and transition review at `data/corpus/source.json:77079-77119`, while new receivables questions cite ASC 326-20-30-10F and 50-12A through 50-12B at `data/corpus/guide.json:7780-7841`. These citations may be present in the publisher documents, but the current record metadata does not establish that the cited sections were actually read in the recorded review. The ASU 2016-08 record also records annual effective dates but does not capture all interim timing and early-adoption detail stated in the underlying update.

Required disposition: either extend the affected source records with dated, exact review scope, effective-period detail, access and rights limits, or narrow the question locators and claims to what the source records document. The current consolidated Codification remains the controlling authority; the issued ASUs are not substitutes for it. Official publisher material checked during this review includes [ASU 2014-09 Section A](https://storage.fasb.org/ASU%202014-09_Section%20A.pdf), [ASU 2016-08](https://storage.fasb.org/ASU%202016-08.pdf), [ASU 2015-11](https://storage.fasb.org/ASU_2015-11.pdf), [ASU 2016-13](https://storage.fasb.org/ASU_2016-13.pdf), [Concepts Statement 8 Chapter 4](https://storage.fasb.org/Concepts_Statement_8-Chapter_4-Elements.pdf), and the [FASB Topic 330 board handout](https://storage.fasb.org/BMHO20241218.pdf). No publisher full text was added to the corpus and source reuse rights remain unknown.

### [P2] Each of the six modified guides contains five identical history entries

Each of the six modified guide records has five identical `2026-09-17` entries in `provenance.revision_history`, for example `data/corpus/guide.json:6246-6275`. The parent records had no corresponding history array. Repeating one event five times makes the audit trail appear to contain five separate review events and weakens provenance traceability.

Required disposition: retain one dated entry for this change, or replace the repetitions with distinct events that have distinct scopes and evidence.

## Acceptance matrix

| Criterion | Result | Evidence and limit |
| --- | --- | --- |
| Family inventory, role, framework, period and question scope | Pass within the declared bound | Six guides now carry an existing IFRS branch and a US nongovernmental accrual-basis US GAAP branch for 2026. Bank lending, insurer contracts, governmental fund accounting and tax-only conclusions are explicitly excluded. |
| Original US authority, locators, effective period, access and rights | Partial | Five new FASB records have dated selected-section reviews, exact locators and `full_text_stored: false`; source rights remain unknown. The locator and effective-period synchronization finding above remains open. |
| Inputs, accounting treatment, workflows, controls and worked material | Pass as read-only synthetic research | Seven workflows, seven controls and two synthetic ledger examples preserve IDs, source/posting dates, opening balances, corrections, voids, returns, fees, taxes, AP/AR/cash clearing, consignment and loan-proceeds separation. No production population or observed control effectiveness is claimed. |
| Exceptions, professional limits and empirical limits | Pass | Counterexamples and missing-fact branches are explicit. Each new US question and workflow states that professional review and empirical support were not performed or established. |
| Retrieval, counterexample, full check and same-build exports | Pass locally and in CI | Three new retrieval fixtures resolve; numeric and branch tests pass; build downloads and the source archive match canonical records. Deployment and hosted acceptance were not performed. |
| Preserve non-US questions and construction exceptions | Pass | All existing questions in the six modified guides have `removed: []` and `changed_existing: []`; construction records and their prior limitations remain. |
| Derived coverage and snapshot lineage | Partial | Snapshot `2026-09-17.5` is preserved and all 13 recorded input hashes match. Generated profile and screening version labels are stale as described above. |

## Verification performed

- `npm ci`: pass.
- `npm run check`: pass after the loopback-listener permission required by the local Streamable HTTP test; 83 of 83 tests passed.
- `git diff --check`: pass.
- Coverage registry audit: 190 guide questions and 190 registry rows; no duplicate IDs, missing pointers or field mismatches.
- Derived coverage comparison: 5,952 cells before and after; 576 named-question-only changes; zero non-named field changes.
- Snapshot hash audit: all 13 `2026-09-17.5` input hashes match the reviewed worktree.
- CI snapshot at the reviewed head: `verify` passed in [GitHub Actions run 35237051097](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35237051097/job/105255539417).
- No deployment, hosted site, default-branch state, merge, closure or author-branch mutation was performed.

## Next action

The author or release orchestrator should reconcile the generated version metadata, synchronize source review scopes and effective-period details with every cited locator, and collapse the duplicated guide history entries. After those changes, rerun the full check and preserve a new reconciled snapshot or document the orchestrator-owned release disposition for `2026-09-17.5`.

## Re-review of correction head

Re-review date: 2026-09-17

- Correction head: `0d447e6033bdc10ecd3ab9a2f5855ae73644807d`
- Correction base: `bcec0a5d344972b664448800d91dca920f17f94c`
- PR base: `main` at `afd2aced307628843f8a26677c3a6fb37fa733e3`
- Exact-head validation worktrees: `/private/tmp/aa-r119-rereview-check-0d447e6` and `/private/tmp/aa-r119-rereview-0d447e6`

### Prior findings resolved in the committed correction

- Both generated coverage files now derive `corpus_version` from `data/catalog.json`, validate its date-and-edition format, and report `2026-09-14.3`.
- The affected source records now document the cited ASU 2014-09, ASU 2025-05 and ASU 2016-08 sections, effective and transition details, substantive-excerpt checks, current-Codification limits, and unresolved reuse rights. The official publisher PDFs were spot-checked during this re-review: [ASU 2014-09 Section A](https://storage.fasb.org/ASU%202014-09_Section%20A.pdf), [ASU 2025-05](https://storage.fasb.org/ASU%202025-05.pdf), and [ASU 2016-08](https://storage.fasb.org/ASU%202016-08.pdf).
- The six modified family guides now each contain one provenance-history entry. The new test checks the state and rejects duplicate entries.
- Existing questions in the six family guides remain unchanged relative to `bcec0a5`; there are no added, removed or changed existing questions in the correction commit. Prior snapshots through `2026-09-17.5` are byte-for-byte unchanged.

### [P1] The coverage generator still changes committed construction outputs on a clean rerun

In the fresh detached correction worktree, `node scripts/build-research-coverage.mjs` completed successfully but changed `data/corpus/guide.json`. The only first-run diff was 15 lines, adding these source IDs to each of the following generated industry guides:

- `guide-industry-naics2022-236`
- `guide-industry-naics2022-237`
- `guide-industry-naics2022-238`

Added IDs: `src_construction_fasb_retainage_staff`, `src_construction_gao_25107258` and `src_construction_asbca_51759`.

A second generator run produced no additional diff, so the generator reaches a stable result after mutating the committed artifact. It is therefore deterministic after the mutation, but it is not a no-op against the reviewed correction output. This matters because the correction reports construction outputs restored and the review protocol requires actual preservation, not only a passing metadata assertion. The generator's `industryQs` source union at `scripts/build-research-coverage.mjs:19` and `:32` is the path that reintroduces these source IDs.

Required disposition: either commit the intended regenerated construction source associations and reconcile the related mappings, exports and snapshot, or constrain the generator inputs/output to the intended construction source set and add a clean-rerun preservation test. The current test verifies catalog labels and history state, but does not execute the generator and compare its output with the committed artifact.

## Re-review verification

- `npm run check` on a clean exact correction worktree: 85 of 85 tests passed, including the two new correction tests.
- CI snapshot at correction head: `verify` passed in [GitHub Actions run 35241830613](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35241830613/job/105271933514).
- Latest snapshot: `2026-09-17.1192`, corpus `2026-09-14.3`, 1,088 records, 1,030 question-mapped records; all 13 input hashes matched.
- Existing snapshot IDs through `2026-09-17.5` were unchanged; `2026-09-17.1192` was additive.
- Source review audit: the three corrected source records had `reviewed_at: 2026-09-17`, `review_level: substantive-excerpt`, at least one material-read check, `full_text_stored: false`, and unresolved source rights.
- No corpus edits, merge, closure, deployment or author-branch mutation was performed. The generator mutation was confined to the temporary detached verification worktree.

### Re-review conclusion

The three prior findings are resolved in the committed correction output. The remaining generator-preservation finding keeps release reconciliation open until the intended construction output is made reproducible and explicitly covered by a clean-rerun check. Catalog and release disposition remain separate orchestrator-owned gates.
