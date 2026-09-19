# Issue 108 source package: Professional, Scientific, and Technical Services

Status: source-only pending coordinator integration. Package version: `2026-09-19.108-source.1`. Target corpus context: `2026-09-19.12420`. The package is additive and does not freeze a corpus release, rewrite canonical records, or assert current consolidated ASC requirements.

The package inventories seven existing NAICS 54 associated records and the six named questions already attached to `guide-professional-services`. It adds a bounded US route for legal, accounting, engineering and technical, consulting or R&D, and staffing or PEO roles. The route connects contract and time evidence to revenue, WIP or unbilled balances, payroll, billing and settlement. It includes a California-only client-fund example whose governing law must be established before use. The package does not claim whole-subsector sufficiency, conduct a 50-state survey, or treat an ABA Model Rule as nationwide law.

## Original criteria disposition

- **A1 inventory and foundations:** Complete within scope. The package records the seven baseline IDs and six linked question IDs, preserves the existing professional-services guide as context, and reuses accepted FASB, Census, IRS and DOL source records rather than duplicating them.
- **A2 primary-source research:** Complete within the bounded route. Two original US authorities were read at the locators below on 2026-09-19. Inherited source records retain their earlier review periods and limitations.
- **A3 accounting material:** Complete as a bounded research application. The synthetic example carries a fixed-fee project, retainer, reimbursable, subcontractor, staffing, payroll and client-fund branch with entries, tie-outs and independent counterexamples.
- **A4 limits and exceptions:** Explicitly partial. Professional review, empirical support, current consolidated GAAP, entity adoption, enforceability, worker facts, state-law applicability and operating effectiveness remain unresolved.
- **A5 retrieval and checks:** The helper is additive, conflict-aware and replay-stable. Focused tests apply the package in a disposable harness, regenerate coverage mappings, run corpus validation, and confirm byte-stable replay. Coordinator integration still requires independent review and the repository’s full checks on the resulting branch.

## Primary authorities reviewed

1. [IRS Publication 15-A (2026), Employer's Supplemental Tax Guide](https://www.irs.gov/publications/p15a) was read at the “Employee or Independent Contractor” and “Common-Law Rules” sections, including behavioral control, financial control, type-of-relationship factors, and the law-firm attorney example. The edition is the 2026 federal employment-tax guide. It supports worker-status and withholding context. It does not determine US GAAP revenue, WIP, gross-versus-net presentation, state employment law, or a specific worker’s status. Access is public publisher access; reuse rights remain unknown and full text is not stored.

2. [California Rule of Professional Conduct 1.15](https://www.calbar.ca.gov/legal-professionals/rules/rules-professional-conduct/current-rules-professional-conduct/chapter-1-lawyer-client-relationship) was read at Rule 1.15(a)-(d), including Rule 1.15(d)(4). The selected rule addresses funds held for a client or other person, trust-account separation, no commingling, disputed funds, accounting and five-year record retention, with a 45-day presumption for undisputed funds. This is a California example only. It is not a nationwide rule or an ABA Model Rule. Governing law, engagement facts, lawyer status and dispute facts must be established before application. Source rights remain unknown and the rule text is not stored.

The package reuses these accepted source records without changing their primary metadata: `src_construction_fasb_2014_09` for the bounded issued ASU 2014-09 contract, performance, contract-balance and cost locators; `src_fasb_asu2016_08_principal_agent` for the issued principal-versus-agent amendment; `src_roadmap_naics2022_manual` for classification only; `src_irs_pub15_2026` and DOL Fact Sheets 21 and 23 for inherited payroll and recordkeeping context. The FASB records are issued updates, not a current consolidated Codification review. Their publisher rights remain unresolved.

## Accounting material and counterexamples

The original synthetic close assumes a fixed fee of $120,000, $45,000 of costs incurred, and $90,000 estimated total cost. Cost-to-cost progress is 50%, so cumulative earned revenue is $60,000. With $30,000 billed, the synthetic contract asset is $30,000. A $24,000 three-month retainer supports $8,000 of current-period service and leaves $16,000 deferred. A $50,000 staffing invoice and $38,000 worker payroll produce a $12,000 illustrative gross margin before other costs. A $25,000 California client-fund receipt, with $5,000 assumed earned and released under the selected facts, leaves a $20,000 client-fund liability. Wages of $20,000 and an assumed $1,530 employer payroll tax are arithmetic illustrations only.

The independent negative cases show why evidence is required: recognizing all retainer cash would overstate current revenue by $16,000; billing-only recognition would miss the $30,000 contract asset in the synthetic project; an IRS worker-status analysis cannot substitute for GAAP revenue or WIP analysis; and a California client-fund rule cannot be generalized to other states or to accounting, engineering, consulting or staffing customer cash. Reimbursables require a separate control and principal-versus-agent assessment. Subcontractor AP is not automatically payroll, and a staffing label does not settle gross-versus-net presentation.

## Application contract

`scripts/integrate-professional-services.mjs` stages all source, record, question, assessment and mapping changes before writing. It checks the declared base commit when applying, stable IDs, source URL identity, source primary-review metadata, exact locator URLs and periods, existing-record conflicts, and mapping conflicts. It never writes the catalog or releases. Default application preserves the catalog version. An explicit `--applied` mode is used only by a disposable application harness to update the research-question denominator needed by standard validation; it does not belong in the source commit’s canonical data.

The helper does not assume that replay starts from an empty corpus. Existing identical IDs are reused, differing IDs or URL collisions fail before writes, and a second application is byte-stable. The package and corpus versions remain separate. Retrieval fixtures cap search and get at 20 records and route the California exception explicitly.

## Source rights and remaining gaps

All external publisher rights in the package remain unknown. Only factual summaries, URLs, short locators and limitations are included. No copyrighted full text, private paths or local task identifiers are part of the candidate package. The package does not provide professional legal, accounting or tax advice. Current consolidated ASC 606, entity adoption, state employment rules, engagement enforceability, actual payroll populations, trust-bank reconciliations and operating-effectiveness evidence remain coordinator or later reviewer work.
