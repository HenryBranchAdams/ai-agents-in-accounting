# AA-R130 independent re-review receipt: 2026-09-17

Independent follow-up review of correction PR130 against the original PR128 head.

- Assignment: `AA-R128` follow-up, PR130, issue #117
- Initial PR130 review head: `2e72df52cbe71e04b62dbe3123c313f3fc8210f3`
- Final narrow-check head: `ec21ffa58a68a19461aad1940f729fde6e337f60`
- PR130 base and original PR128 head: `75e819205c72d07fe096b84eb33629200830faa6`
- PR130 author branch: `codex/aa-f128-evidence`
- Reviewer worker: `01a0afa2-40cc-77a2-8e8d-28159e584ba5`, local host
- Reviewer worktree: `/Users/henryadams/.codex/worktrees/0d74/ai-agents-in-accounting`
- Review branch: `codex/aa-r128-review`

## Outcome

Both original P1 findings are accepted as corrected at the supplied PR130 head. The correction is bounded and does not complete issue #117. No corpus record, catalog, implementation branch, merge, deployment or issue state was changed by this reviewer. Issue #117 remains open.

At the initial review, one release-metadata follow-up remained before final publication. The supplied final delta resolves that assessment-version issue and preserves the prior snapshot:

- `data/coverage/assessments.json` now uses `assessment_version: 2026-09-17.1302`.
- Snapshot `2026-09-17.1` remains unchanged, and the new `2026-09-17.1302` snapshot records the revised assessment bytes under the new version.
- The assessment version, correction snapshot and input hashes are synchronized. Final corpus and release sequencing remains orchestrator-owned.

This was a traceability and release-sequencing follow-up, not a reopening of either P1 evidence correction. The author was told that the orchestrator owns final release sequencing, so no release artifact or corpus-version rewrite is made in this reviewer branch.

## P1 correction review

### Source applicability, periods and locators

The three source records now preserve the reviewed publisher artifacts and the applicable boundaries needed by the guide:

- `src_nonprofit_fasb_2018_08` pins the official [ASU 2018-08 PDF](https://storage.fasb.org/ASU%202018-08.pdf), records recipient and provider annual and interim effective periods, modified-prospective transition, permitted retrospective application and early adoption, and points to PDF pages 7 through 10 plus Topic 958 paragraphs `958-605-15-5A` and `958-605-25-5A` through `25-5F`.
- `src_nonprofit_fasb_2016_14` pins the official [ASU 2016-14 PDF](https://storage.fasb.org/ASU_2016-14.pdf), records the annual and interim effective periods, early application and retrospective transition, and points to the effective-date section plus paragraphs `958-205-45-2`, `958-205-45-9` and `958-720-45-15`.
- `src_nonprofit_irs_990_2025` pins the [2025 IRS Form 990 instructions PDF](https://www.irs.gov/pub/irs-prior/i990--2025.pdf), records tax year 2025 and the Part IX PDF page 41 locator, and retains the federal-reporting-not-GAAP boundary.

I independently checked the cited official artifacts. The ASU 2018-08 effective-date section supports the separate recipient and provider branches. The ASU 2016-14 PDF supports the cited effective date and Topic 958 paragraph locations. The IRS PDF supports the Part IX normal-accounting-method, reasonable-allocation and documentation statements. No consolidated Codification text or professional review is claimed. Full external text remains unstored and source reuse rights remain unknown.

### Dated close and independent branches

`example-us-nonprofit-restricted-award-close` now includes:

- A 2026-01-01 opening balance block and a 2026-12-31 close cutoff.
- Dated synthetic receipt, barrier satisfaction, cash-paid qualifying cost and restriction-release events.
- A cash-settled base case with ending cash of 75,000, zero advance, zero base-case payable and 75,000 of net assets with donor restrictions.
- An independent unpaid-cost branch that replaces the cash credit with accounts payable, ending with 120,000 cash and 45,000 payable. The branch is explicitly not combined with the cash-paid case.
- A separate 20,000 functional-allocation pool with 14,000, 4,000 and 2,000 allocations, kept outside the award rollforward and not used as a balancing plug.

The four listed journals independently total 330,000 of debits and 330,000 of credits. The award rollforward is 0 plus 120,000 less 45,000 equals 75,000. The example remains synthetic and does not establish an operational ledger population.

## Synchronization and versioned coverage

- The guide source-period records, named-question registry locators, partial assessment evidence IDs and tests point to the same three source IDs and locator paths.
- The generated mapping retains `mapping_version: 2026-09-16.1` because the association rules and overrides did not change. Its canonical corpus hash is `786a31b3335d3a2ffdd0f58e5ec5e99ef2a68eed1b014fa946b68c33600b39bb`.
- Snapshot `2026-09-17.1` records the changed mapping, assessment and research-input hashes. Independent recomputation matched every recorded input hash and the mapping corpus hash.
- The snapshot corpus version, mapping version and catalog corpus version are all `2026-09-16.1`; the topology version remains `2026-09-11.1`.
- The current tree contains preserved release `2026-09-14.3` and no `data/releases/2026-09-16.1` directory. That is consistent with the author branch being a correction to an unreleased PR128 candidate. Before publication, the orchestrator must preserve the outgoing published edition and choose the final corpus version without publishing changed canonical bytes under an already issued version.

## Exact-head and independent checks

- GitHub exact-head CI [run 35234524258](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35234524258) checked out `2e72df52cbe71e04b62dbe3123c313f3fc8210f3`, ran `npm ci` and `npm run check`, and completed successfully.
- CI reported 1,072 records, 639 sources, 27 downloads and a 219-file source archive. All 86 tests passed and none failed, skipped or was cancelled. The nonprofit regression tests were tests 82 through 86.
- Independent exact-tree checks in a temporary archive passed `npm run build`, `npm run validate` and `node --test tests/us-nonprofit.test.mjs` with 5/5 tests passing.
- The base branch has no protection rule and no declared required status checks. PR130 has no submitted reviews. These are merge-governance limits, not accounting acceptance evidence.

## Final narrow check

The delta from `2e72df52cbe71e04b62dbe3123c313f3fc8210f3` to `ec21ffa58a68a19461aad1940f729fde6e337f60` is limited to the assessment version, an appended coverage snapshot, delivery documentation and regression assertions. No source record, guide, example, mapping rule or prior snapshot was changed.

- Independent exact-tree checks passed `npm run build`, `npm run validate` and `node --test tests/us-nonprofit.test.mjs` with 5/5 tests passing.
- Independent recomputation matched the new snapshot's 12 input hashes and corpus mapping hash. Snapshot `2026-09-17.1` has the same object hash before and after the delta; `2026-09-17.1302` has the new assessment hash and matching `assessment_version`.
- The author reported focused tests and full 86/86 checks for the final head. CI was queued at callback time and was not polled in this review, so final-head CI remains an external unverified gate here.
- Final narrow-check result: the P2 assessment-version finding is resolved. No further review finding was identified. The correction remains partial work for issue #117.

## Limits and next action

Current consolidated Codification access, professional NFP review, operational award-to-ledger evidence, measured agent performance, external rights permissions, merge and deployment remain unverified or incomplete. No polling or waiting on running CI was performed.

Next action: the orchestrator should handle final corpus-release sequencing, preserve the appropriate outgoing edition, then integrate only within the authorized workflow. Keep issue #117 open.
