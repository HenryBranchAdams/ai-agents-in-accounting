# PR128 independent review receipt

Review date: 2026-09-17

Assignment: AA-R128

Pull request: [#128](https://github.com/HenryBranchAdams/ai-agents-in-accounting/pull/128)

Reviewed head: `75e819205c72d07fe096b84eb33629200830faa6`

Base: `main` at `afd2aced307628843f8a26677c3a6fb37fa733e3`

Review branch: `codex/aa-r128-review`

## Recommendation

Request targeted evidence corrections before integrating this checkpoint. The PR contains a real, bounded nonprofit supplement and should remain a partial delivery. It does not satisfy all of issue #117, which must remain open.

The accounting direction of the three selected source summaries and the synthetic arithmetic are supported within the stated limits. The two P1 findings below concern the evidence contract, not a claim that the PR completed the remaining nonprofit research.

## Repository and GitHub state

- The worktree was clean at the reviewed head. `git ls-remote` confirmed that PR head, `research/us-backlog-2026-09-16`, and the local checkout all resolve to `75e819205c72d07fe096b84eb33629200830faa6`; `main` resolves to `afd2ace`.
- I read `AGENTS.md`, `CONTRIBUTING.md`, `docs/corpus-policy.md`, `LICENSE_POLICY.md`, `docs/research/us-backlog-execution-2026-09-16.md`, `docs/research/nonprofit-delivery-2026-09-16.md`, the complete PR body and all three PR issue comments, the issue #117 body and both comments, including the shared protocol at [issuecomment-5713891954](https://github.com/HenryBranchAdams/ai-agents-in-accounting/pull/128#issuecomment-5713891954).
- GitHub returned no PR reviews and no inline review comments. The current exact-head check [35175893777](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35175893777) succeeded. `gh pr checks --required` reports no required checks, and the `main` branch has no protection rule. These are merge gates to resolve separately, not evidence of accounting acceptance.
- The final tree contains only the read-only `corpus.yml` and `source-health.yml` workflows. No temporary authoring workflow, transport payload, helper, or write-capable workflow is present. The generated source archive contains 219 entries and no temporary payload/helper/recovery artifact.

## Original source review

I independently checked the original publisher material against the three source records:

- [FASB ASU 2018-08](https://storage.fasb.org/ASU%202018-08.pdf), pages 7-10, supports the contribution versus exchange distinction and the barrier plus either right-of-return or right-of-release condition. It also says the right must be determinable from the agreement or a referenced document. The [FASB June 21, 2018 summary](https://fasb.org/page/PageContent?bcpath=tff&pageId=%2Farchive%2Ffasb-staff-issuances%2Ffifjune2018asu-201808notforprofit-entities-topic-958.html) supports the selected summary-level review.
- [FASB ASU 2016-14](https://storage.fasb.org/ASU_2016-14.pdf), pages 10-11 and the Topic 958 amendments, supports the two donor-restriction net-asset classes, release presentation, functional and natural expense analysis, liquidity disclosures, and the stated effective-date framework.
- [IRS 2025 Form 990 instructions](https://www.irs.gov/pub/irs-prior/i990--2025.pdf), page 41, Part IX, supports the normal accounting method, reasonable allocation method, documentation requirement, and the distinction between the columns required for section 501(c)(3)/(c)(4) organizations and other filers. The [IRS instructions page](https://www.irs.gov/instructions/i990) currently resolves to the same 2025 material, but it is not a tax-year-pinned URL.

The selected claims are directionally accurate within the records' stated limits. No current consolidated Codification review, professional review, operational population, or empirical agent evidence is established.

## Acceptance review

| Dimension | Result | Evidence and limit |
| --- | --- | --- |
| Inventory, roles, framework, periods, question scope | Partial support | The guide and named question define one nongovernmental US NFP role, US GAAP plus selected Form 990 reporting, an illustrative 2026 close, and one bounded question. The issue's broader nonprofit, cross-industry, endowment, contributed-goods/services, and selected federal-reporting work remains open. |
| Original authorities, locators, effective periods, access, rights | Partial support, P1 corrections required | The three source IDs, original publisher URLs, selected access notes, review dates, source rights, and `full_text_stored: false` are present. Effective/adoption periods are not structured, and two FASB locator sets are broader than the required reproducible locator contract. The IRS URL is not pinned to tax year 2025. |
| Inputs, treatment, controls, worked material | Partial support, P1 correction required | The guide has inputs, decision flow, controls, and source pointers. The example is original synthetic material with checked arithmetic, but its events are not dated and it has no explicit opening balances. |
| Exceptions, professional and empirical limits | Supported for the bounded supplement | The guide, assessment, registry row, and delivery evidence retain partial status, unresolved endowment/services/state-law/federal limits, unknown rights, no professional review, and no operational or empirical evidence. |
| Retrieval, counterexample, exports, full check | Supported | Positive guide and example searches, direct source retrieval, a GASB counterexample, rendered pages, export parity, preserved baseline parity, and the exact-head full check passed. |

## Findings and recommended fixes

### [P1] Record the known effective/adoption periods and make source locators reproducible

Affected records: `src_nonprofit_fasb_2018_08`, `src_nonprofit_fasb_2016_14`, `src_nonprofit_irs_990_2025`; related guide, question, assessment, and delivery evidence.

Evidence:

- The source records at `/data/locators` identify headings or broad amendment sections, but none of the three source `data` objects records an effective period, adoption method, early-adoption rule, or tax-year/edition field.
- `data/coverage/assessments.json#/assessments/4/effective_from` and `/effective_to` are null, while `docs/research/nonprofit-delivery-2026-09-16.md` says that applicable periods remain in `source.json`.
- The official sources contain material dates that change applicability: ASU 2018-08 recipient/provider effective periods and early adoption on pages 9-10; ASU 2016-14 annual and interim effective periods and early application on pages 10-11; and the IRS 2025 tax-year instructions on page 41.
- The IRS record's `/source_url` is `https://www.irs.gov/instructions/i990`, a mutable current-instructions route, while the reviewed artifact is tax-year-specific.

Recommended fix:

- Add source-level publication/edition and effective-period fields, or an equivalent structured field already accepted by the corpus contract. Record the selected recipient scope for ASU 2018-08, its applicable annual/interim periods and early adoption; ASU 2016-14 annual/interim periods, early application and retrospective transition; and the 2025 tax-year scope for Form 990.
- Replace broad FASB locators with page/paragraph or heading-plus-page locators, including the ASU 2018-08 effective-date section and the ASU 2016-14 effective-date and relevant Topic 958 paragraphs. Pin the IRS evidence to the official 2025 PDF or preserve the tax-year-specific PDF as the canonical source URL.
- Add a regression assertion that each new source has an edition/effective-period statement and a locator that can be found in the pinned original artifact.

This prevents a later current-page update or a shifted reporting period from being mistaken for the reviewed authority. It does not require current consolidated Codification access, which should remain an explicit open gap.

### [P1] Make the synthetic award close reproducible by period

Affected record: `example-us-nonprofit-restricted-award-close` at `/data/events`, `/data/journals`, `/data/calculation`, and `/data/scope`.

Evidence:

- The fixture states only that the barrier was met “during 2026”; its three events have no dates or reporting cut-off.
- It contains journal rows but no explicit opening balances for cash, refundable advance, donor-restricted net assets, or net assets without donor restrictions. The current test proves that the listed rows balance and that the advance clears, but not that a dated opening-to-closing rollforward can be reproduced.
- The shared protocol and the issue #117 implementation plan require recognition assumptions before arithmetic, explicit opening balances and dated events, independent changed-assumption branches, and reconciled quantities/cash/subledgers/journals.

Recommended fix:

- Add an assumptions/opening-balances block, a close period and dated events for receipt, barrier satisfaction, qualifying cost, and restriction release. State whether the receipt is a promise or cash, the exact condition and return right, the donor-purpose restriction, and the treatment of the separate shared-cost pool.
- Add explicit ending balances or a subledger-to-GL rollforward and extend `tests/us-nonprofit.test.mjs` to verify the dated opening-to-closing reconciliation, while retaining the current no-operational-evidence limitation.

The existing amounts independently recalculate as 120,000 recognized, 45,000 released, 75,000 remaining restricted, and 14,000/4,000/2,000 allocated from a separate 20,000 pool. This finding concerns reproducibility, not the arithmetic result.

## Checks run on the exact reviewed commit

- `npm ci`: passed with Node `v22.23.1` and npm `10.9.8`.
- `npm run check`: passed. Typecheck, corpus validation, UI/design lint, build, export checks, source-archive checks, retrieval tests, and all **86/86** tests passed. The build reported 1,072 records, 27 downloads, and a 219-file source archive.
- Independent release check: the preserved `data/releases/2026-09-14.3/corpus.json` contains exactly the 1,067 records from `main` at `afd2ace`, with no missing, extra, or changed record IDs/content; all listed release file hashes match its manifest.
- Independent arithmetic check: debit and credit totals are each 330,000; the refundable advance clears; 120,000 minus 45,000 equals 75,000; and the 20,000 allocation equals 14,000 plus 4,000 plus 2,000.
- Independent retrieval check: `nonprofit contributions` with `kind=guide` and `framework=US GAAP` returns `guide-us-nonprofit-contributions-close`; `restricted award` with `kind=example` and the same framework returns `example-us-nonprofit-restricted-award-close`; a blank GASB search returns GASB records and neither nonprofit guide nor example. Direct `get` results preserve source pointers and original URLs.

## Open acceptance and delivery gates

- Issue #117 remains open. Endowment, contributed goods/services, fuller cross-industry routing, and selected federal award/reporting work are not delivered by this PR.
- Current consolidated Codification access, professional NFP review, real operational award-to-ledger evidence, measured agent performance, and external rights permissions remain unverified or unknown.
- The PR is not merged and no deployment was performed. No issue was closed. No review of the default branch after integration was possible in this worker assignment.
- This review added only this receipt. No corpus record, catalog, execution ledger, issue state, or remote branch was changed by the reviewer.
