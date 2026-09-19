# AA-I106 Finance and insurance source package

This source-only package addresses four selected US roles from Issue 106:

1. lending, deposits and servicing;
2. funds, valuation and custody;
3. broker-dealers and advisers; and
4. insurance and reinsurance.

The baseline inventory records the 16 existing NAICS-52 discovery associations and their linked open questions. Those associations are retained as inventory context, not treated as evidence of sector sufficiency. Accepted US institutional, assets, capital, tax, entity and reporting foundations are reused by stable ID. Existing primary source metadata is left unchanged; this package records supplemental source checks separately.

The new source records cover the current OCC allowances-for-credit-losses page, SEC Rule 2a-5, current eCFR Rule 15c3-3, and the 2026 NAIC AP&P Manual. Rule 2a-5 is pinned to its March 8, 2021 effective date and September 8, 2022 compliance date. Rule 15c3-3 is pinned to the displayed September 16, 2026 eCFR edition and its customer/PAB reserve paragraphs and weekly/daily computation cadence. The AP&P locator names SSAP No. 62 paragraphs 30-32 and 40(a)-(f), including the printed 62-11 to 62-12 pages for risk transfer, premium/loss treatment and deposit accounting. Reused sources retain their original URL, rights and review limits. Each selected locator records an effective or edition period and an access limit. FASB Codification and publisher terms remain unresolved where the public locator is not a licensed full-text grant.

The package connects role inputs, treatment questions, workflow steps, controls and original synthetic examples. A dated event sequence now drives balanced, review-only journal proposals and independent movement reconciliations for every selected role. The lending route applies the 3,000,000-cent credit-loss input as a review-only allowance proposal; the funds route applies the 2,000,000-cent valuation adjustment to the owned-investment rollforward; the broker route keeps 100,000,000 cents of customer custody totals informational and leaves the Rule 15c3-3 reserve result uncomputed; and the insurance route keeps direct premium, claims, ceded premiums, recoveries and the SAP bridge separate. The fixture also includes negative role and framework counterexamples. All amounts are synthetic and are not operational evidence or approved journal entries.

`integrate-finance-insurance.mjs` is intentionally source-package only. It requires `--applied` for a disposable fixture or `--dry-run`, stages all stable-ID, original-URL and reference checks before any write, refuses primary metadata conflicts, and does not change catalog, snapshots or releases. The focused tests apply it only to a temporary copied Git fixture, verify replay byte stability and conflict-before-write behavior, and exercise bounded search/context retrieval with a limit of 20.

## A1-A5 disposition

- **A1, inventory and scope:** met for the four named roles and 16-record baseline inventory. Existing open families and selected frameworks are listed; international foundations are retained without expansion.
- **A2, source-linked answers:** met within the bounded role scope. Four current official source records and seven reused-source locator reviews have exact URLs, locators, edition/effective-period notes, access limits and unresolved rights. No source text is stored.
- **A3, inputs, treatment, workflow, controls and worked material:** met for a source-only reference. The event sequence, balanced review-only journal proposals, independent rollforwards and role-specific counterbranches cover all four roles. Customer custody totals are explicitly not a reserve-formula result, the valuation adjustment is applied to the owned-investment movement, the credit-loss input is bridged to an allowance proposal, and premium/claim movements remain separate pending treaty and state-practice review.
- **A4, exceptions and limits:** met. Every assessment is partial, professional review is not performed, empirical support is not established, and the package does not claim whole-industry or accounting sufficiency. State-specific practice, entity contracts, current consolidated text, live populations and professional judgments remain open.
- **A5, retrieval and rebuild proof:** focused source proof is met in the disposable applied fixture. The test builds the applied temporary corpus and calls the real agent search, get and context paths with limits of 20 or below; the context includes the custody-versus-owned-assets and non-reserve counterexample with source citations. Integration proof remains pending: a later coordinator-owned integration must add the package to canonical registries and mappings, preserve all existing source primary metadata and history, build downloads/archive from the same corpus, and run the repository’s full check after canonical changes.

This commit is local research work only. No canonical files, release files, snapshots, remote branch, pull request or external comment are changed by this package.
