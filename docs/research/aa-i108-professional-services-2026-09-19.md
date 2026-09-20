# Issue 108 source package: Professional, Scientific, and Technical Services

Status: source-only pending coordinator integration. Package version: `2026-09-19.108-source.3`. Target corpus context: `2026-09-19.12420`. The packet is additive, preserves stable IDs and source primary metadata, and does not freeze a corpus release or assert current consolidated ASC requirements.

The package inventories seven existing NAICS 54 associated records and six linked questions. It covers selected US legal, accounting, engineering and technical, consulting or R&D, and staffing or PEO roles. It connects approved time and project cost to revenue, WIP or unbilled balances, payroll, billing, settlement, retainers, reimbursables, subcontractors and a California-only lawyer client-funds branch. California Rule 1.15 is a selected state example, not nationwide law or an ABA Model Rule. No whole-subsector or 50-state sufficiency is claimed.

## Original criteria disposition

- **A1 inventory and foundations:** Complete within the bounded route. The seven-record baseline and six existing questions remain explicit. Accepted FASB, Census, IRS and DOL foundations are reused by stable ID; packet locators preserve ASU 2014-09 (May 2014), ASU 2016-08 (March 2016), and the 2022 NAICS Manual Part I Sector 54 classification pointer.
- **A2 primary-source research:** Corrected. IRS Publication 15-A is pinned to its 2026 edition and worker-classification sections. California Rule 1.15 is pinned to the publisher’s January 1, 2023 amendment note, with Rule 1.15(a)-(d), (f), (g), and (d)(7) locators. Inherited Census, IRS Publication 15 and DOL Fact Sheet 21 locators now identify their own source material and periods rather than borrowing ASU 2014-09 text. Publisher rights remain unknown and full text is not stored.
- **A3 accounting material:** Corrected. The synthetic close has 17 explicit journal entries with account and side lines. The $45,000 cost population is $20,000 approved labor, $12,000 subcontractor cost, $8,000 selected gross-principal reimbursable cost and $5,000 other direct cost. At $90,000 estimated total cost, progress is 50%, earned fixed-fee revenue is $60,000, billing and cash settlement are $30,000, and the contract asset is $30,000. The example separately settles a $24,000 retainer, identifies a principal/agent reimbursable countercase, uses explicit staffing entity accounts, and models trust receipt, operating-cash transfer, earned fee, remaining liability and a disputed-funds counterexample.
- **A4 limits and exceptions:** Partial by design. Professional review, empirical support, current consolidated ASC text, worker and engagement facts, state-law applicability, trust-bank reconciliation and operating effectiveness remain open. Tax, client-funds and accounting routes are separated.
- **A5 retrieval and checks:** The focused test now applies the packet in a disposable full repository copy, runs the helper, coverage mapping, corpus validation and build, then invokes the built agent’s real search, get and context paths with limits no greater than 20. California and nationwide counter-role queries are declared and exercised. Replay is byte-stable and primary-source conflicts fail before writes. Coordinator integration and full repository checks remain separate.

## Primary authorities reviewed

1. [IRS Publication 15-A (2026)](https://www.irs.gov/publications/p15a) was read at “Employee or Independent Contractor,” “Common-Law Rules,” and the law-firm attorney example. The guide supports federal worker-status and withholding context. It does not decide US GAAP revenue, WIP, gross-versus-net presentation, state employment law or a specific worker’s status.

2. [California Rule 1.15](https://www.calbar.ca.gov/legal-professionals/rules/rules-professional-conduct/current-rules-professional-conduct/chapter-1-lawyer-client-relationship) was read at publisher lines 611-687: paragraphs (a)-(b) trust and advance-fee conditions, (c) commingling and disputes, (d)(1)-(7) records and distribution, (f) the rebuttable 45-day presumption tied to (d)(7), (g) the undisputed-funds definition, and the publisher note stating amendment effective January 1, 2023. This remains a California lawyer route only.

3. Reused [2022 NAICS Manual](https://www.census.gov/naics/reference_files_tools/2022_NAICS_Manual.pdf) Part I Sector 54, [IRS Publication 15 (2026)](https://www.irs.gov/publications/p15), and [DOL Fact Sheet 21](https://www.dol.gov/agencies/whd/fact-sheets/21-flsa-recordkeeping) retain their original source records and rights limits. They are classification, federal payroll-tax and FLSA recordkeeping inputs, not accounting conclusions.

## Accounting material and counterexamples

The fixed-fee branch uses a $120,000 fee, $45,000 actual cost population and $90,000 estimated total cost. The project cost bridge is $20,000 approved time at 400 hours, $12,000 subcontractor cost, $8,000 reimbursable cost and $5,000 other direct cost. The retainer branch receives $24,000 into operating cash, recognizes $8,000 and leaves $16,000 deferred. The selected reimbursable case assumes the firm controls the vendor service and is principal; its explicit countercase assumes an $8,000 agent pass-through with zero net revenue. The staffing entity invoices $50,000, accrues and pays $38,000 payroll, collects cash and shows $12,000 gross margin under the selected principal assumption. The California branch receives $25,000 in trust, transfers and recognizes a fixed undisputed $5,000 fee, leaves $20,000 as client-fund liability, and retains a $5,000 disputed counterexample in trust.

Tests recompute each journal’s line totals, the aggregate trial-balance equality, the cost population, progress, earned revenue, billing, cash settlement, retainer balance, staffing margin, client-fund liability and counterexamples from input fields. Metadata totals alone are not used as proof.

## Application contract

`scripts/integrate-professional-services.mjs` stages source, record, question, assessment and mapping checks before writing. It preserves catalog version by default, requires the declared base for apply mode, refuses stable-ID, source-URL, primary-metadata and mapping conflicts, and is replay-stable. The disposable `--applied` path may update the research-question denominator needed by standard validation; the source package never writes canonical files, catalog, releases or snapshots.

## Source rights and remaining gaps

External publisher rights remain unknown. Only factual summaries, URLs, short locators and limitations are included. No copyrighted full text, private paths or local task identifiers are part of the candidate package. Current consolidated ASC 606, entity adoption, state employment rules, engagement enforceability, real payroll populations, trust-bank reconciliations, professional review and operating-effectiveness evidence remain coordinator or later-review work.
