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
