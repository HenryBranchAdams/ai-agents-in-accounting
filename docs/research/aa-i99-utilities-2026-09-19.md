# US utilities source package

Status: source-only candidate pending coordinator integration. The package is designed for a selected United States FERC-jurisdictional electric utility or licensee and includes an unregulated merchant generator and service-provider counterexample. It does not claim whole-subsector sufficiency, current consolidated US GAAP coverage, professional review, operational evidence or publication.

The selected base case uses the FERC Uniform System of Accounts as a regulatory-ledger context and keeps financial-reporting framework selection separate. The period is a fictional 2026-12-31 close. Gas, water/sewage, municipal, state-specific and international branches remain outside the package.

## Baseline inventory and reuse

The current NAICS 221 profile identifies generation, network delivery, metered billing, purchased supply, plant construction and retirement exposure as research areas. It already links the subsector to `guide-q-rate-regulation`, `guide-q-capital-assets`, `guide-q-revenue`, `guide-q-environmental`, `guide-q-government-funds` and `guide-q-derivatives`. The existing rate-regulation question `rq-aa-i124-rate-regulation` and source records `src_aa_i124_ferc101` and `src_fercacct` are reused. This package does not copy those foundations.

The candidate adds five concrete application questions:

1. FERC role, rate-order evidence and regulatory-asset/liability boundaries.
2. Metered, estimated and unbilled consumption cutoff with source-to-ledger reconciliation.
3. Plant construction lineage and separation of an unsuccessful preliminary project.
4. Retirement-obligation evidence versus ordinary removal cost.
5. Purchased-power and settlement classification under Account 555.

## Live source basis

The [eCFR Part 101](https://www.ecfr.gov/current/title-18/chapter-I/subchapter-C/part-101) page was read on 2026-09-19. It displayed Title 18 current through 2026-09-17. The package uses the Part 101 applicability and definitions section, definition 8 for continuing plant inventory records, definitions 10 and 31 for removal and regulatory assets/liabilities, and General Instructions 2, 4 and 8 for supporting records, monthly accounting and bounded estimates. The eCFR page states that it is authoritative but unofficial, so the edition and entity jurisdiction must be retained.

The [FERC Accounting Matters](https://www.ferc.gov/accounting-matters-0) hub was read for its scope and Account 555 index. The [FERC Accounting Questions and Answers](https://www.ferc.gov/accounting-questions-and-answers) page was read for its scope disclaimer and plant-construction Q&A. The page says the Q&As assist with existing requirements but do not necessarily reflect the Commission and are not binding. The [Account 555 purchased-power guidance](https://www.ferc.gov/enforcement-legal/enforcement/accounting-matters/accounting-settlement-amounts-account-555purchased) was read for the distinction between purchased power, eligible net exchange settlements and distinct purchases and sales; it states an effective date of January 1, 1991.

The [FASB Statement 143 summary](https://fasb.org/page/PageContent?bcpath=tff&pageId=%2Freference-library%2Fsuperseded-standards%2Fsummary-of-statement-no-143.html) was read only as a historical source for the legal-obligation evidence path. FASB labels it superseded. Current consolidated ASC 410 was not read, so the package makes no current consolidated ARO conclusion.

Publisher text is not stored. Rights for external sources remain unknown, and public accessibility is not treated as a reuse or training grant.

## Accounting material and controls

The original synthetic example connects 1,200 MWh of unbilled consumption at $85/MWh to a $102,000 proposed unbilled balance, 1,500 MWh of purchased power at $48/MWh to $72,000, a $600,000 successful plant project, a separate $25,000 abandoned feasibility study, proposed regulatory balances of $80,000 and $30,000, and a $120,000 retirement-obligation proposal held for current-framework review. The entries are proposals for research, not posting instructions.

The example includes two independent numeric checks. A 50 MWh meter-to-billing mismatch creates a $4,250 exception at the synthetic rate. Combining $952,000 of customer sales with $72,000 of purchased power would produce a misleading $880,000 convenience net. The source and account classifications must be resolved before an entry is proposed. Two scope counterexamples keep the package bounded: an unregulated merchant generator with the same $102,000 sales amount and a meter-reading service provider's $18,000 invoice do not inherit the selected customer-revenue or Part 101 routes.

The proposed workflow freezes dated source populations, validates role and authority, reconciles quantities and rates, retains corrections and deletions, and requires accountable human disposition of exceptions. The proposed control covers completeness, cutoff, classification, accuracy, authority and traceability. Neither proposal is evidence of implementation or operating effectiveness.

## A1-A5 disposition

**A1, inventory and scope:** addressed in the package and this document. The selected role, framework context, fictional period, five-question population and reused foundation are explicit.

**A2, original source answers:** addressed at bounded excerpt level. Exact URLs, short locators, review date, effective period and access limits are in the package. The selected sources are FERC/eCFR and FASB original publisher material. Current consolidated ASC text, real rate orders and entity evidence remain open.

**A3, inputs, workflow, controls and worked material:** addressed with concrete source fields, five workflows, a source-to-ledger workflow record, a control record and an original connected synthetic example with arithmetic and counterexamples.

**A4, exceptions and limits:** addressed as partial assessments. Rights remain unknown, professional review is not performed, empirical support is not established, and no whole-subsector sufficiency is claimed.

**A5, retrieval and checks:** the narrow applicator test suite exercises package shape, newer-corpus application, dry-run staging, idempotence, conflict refusal before writes, numeric reconciliation and scope counterexamples. The source branch intentionally does not change canonical data, catalog metadata, coverage snapshots, releases or deployment output. A coordinator applying the package should run the full repository check and independently verify representative retrieval and source-export alignment on the resulting integration.

## Remaining gaps

Current consolidated ASC 980, ASC 410, ASC 360 and ASC 606 were not read. No real tariff, rate order, billing population, FERC filing, purchase agreement, plant register, legal obligation or ARO estimate was reviewed. The package does not cover gas, water/sewage, municipal or state-by-state accounting. No operational deployment, incident, completeness or measured agent-performance evidence is available. These are explicit research gaps, not resolved by the package's structural checks.
