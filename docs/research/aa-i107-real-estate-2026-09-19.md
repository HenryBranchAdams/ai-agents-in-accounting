# AA-I107 US real estate, rental and leasing source package

This source-only package addresses the bounded issue 107 research request against base commit `a122d3b58607aa4bf8adfa101f011fe612d378f0`. It is a candidate for coordinator integration. It does not change canonical records, the catalog, releases, snapshots, downloads, or archives.

## A1. Baseline, scope and question population

The baseline inventory contains three associated NAICS 53 guide records:

- `guide-industry-naics2022-531`, Real Estate. Its existing open families are cost allocation, data lineage, human authority, security, and leases.
- `guide-industry-naics2022-532`, Rental and Leasing Services. Its existing open families are cost allocation, data lineage, security, leases, and revenue.
- `guide-industry-naics2022-533`, Lessors of Nonfinancial Intangible Assets except Copyrighted Works. Its existing open families are licensed content, data lineage, security, and human authority.

The count is an association inventory, not an adequacy claim. The package keeps those stable IDs and mappings and adds a separate role guide with six named questions:

1. Owner or developer acquisition and development cost routing, including the boundary from a construction contractor.
2. Rent, lease incentives, and refundable deposits.
3. Property sales and control-transfer evidence.
4. Equipment lessor classification and bundled maintenance.
5. Property manager or broker owner-fund settlement and principal-versus-agent facts.
6. Nonfinancial patent, trademark, or franchise-right licensing by term, territory, and usage.

The selected jurisdiction is the United States. The framework is selected nongovernmental US GAAP routing, with the current FASB Codification remaining authoritative. The examples use a 2026 reporting context. The package does not add a 50-state survey, an international package, tax-only authority, professional signoff, or whole-sector sufficiency claim.

The 2022 Census NAICS manual is classification evidence only. Its Part I definitions are at PDF pages 443-446 for subsector 531, 447-453 for 532, and 454-456 for 533. Classification does not determine accounting treatment, entity role, ownership, or framework.

## A2. Source-linked answers and limits

The package reuses existing source IDs rather than adding duplicate publisher URLs. The source records retain unknown publisher reuse status and `full_text_stored: false`.

| Source ID | Original source and selected locator | Period and limit |
| --- | --- | --- |
| `src_roadmap_naics2022_manual` | [2022 NAICS United States manual](https://www.census.gov/naics/reference_files_tools/2022_NAICS_Manual.pdf), Part I subsectors 531, 532, and 533, PDF pages 443-456 | NAICS 2022 classification. It is not accounting authority. |
| `src_fasb_asu201602_leases` | [ASU 2016-02, Section A](https://storage.fasb.org/ASU%202016-02_Section%20A.pdf), lessor routes: 842-10-15-38 through 15-39, PDF pages 26-27; 842-10-25-1 through 25-3, PDF pages 35-36; 842-30-25-1 through 25-13, PDF pages 133-135. The explicit lessee counterrole uses 842-20-30-1, 30-3, 30-5 and 35-3 through 35-5, PDF pages 108-110. | February 2016 issued update. Later amendments, current consolidated Topic 842, entity elections, and contract facts remain open. |
| `src_i120_asu202005_lease_dates` | [ASU 2020-05](https://storage.fasb.org/ASU%202020-05.pdf), lease effective-date summary and 842-10-65-1(a)-(b), printed pages 4 and 7-8 | June 2020 amendment. It supplies selected adoption-date history, not a current full Topic 842 review. |
| `src_construction_fasb_2014_09` | [ASU 2014-09, Section A](https://storage.fasb.org/ASU%202014-09_Section%20A.pdf), 606-10-25-1 through 25-2, 25-27 through 25-37, 32-1 through 32-6, and 45-1 through 45-5 | May 2014 original revenue amendment. Current consolidated Topic 606 and later amendments control. |
| `src_fasb_asu2016_08_principal_agent` | [ASU 2016-08](https://storage.fasb.org/ASU%202016-08.pdf), summary pages 1-5 and 606-10-55-36 through 55-40 | March 2016 issued principal-versus-agent amendment. The control assessment remains fact-specific. |
| `src_aa_i105_fasb_2016_10` | [ASU 2016-10](https://storage.fasb.org/ASU%202016-10.pdf), 606-10-25-19 through 25-22 and 55-56 through 55-64 | April 2016 issued licensing amendment. Current consolidated license implementation and legal enforceability remain open. |
| `src_1os761s` | [FASB Accounting Standards Codification](https://asc.fasb.org/), current-topic routing | The Codification is the authoritative US GAAP starting point. The package does not reproduce licensed text or assert that current ASC 970, 360, 842, or 606 text was fully reviewed. |
| `src_aa_i107_fas67_real_estate_costs` | [FAS 67](https://storage.fasb.org/aop_FAS67.pdf), consulted 2008 Original Pronouncements volume as amended: paragraphs 3-7, PDF page 4 (printed page 3); 11-12, PDF page 5 (printed page 4); 17-24, PDF page 6 (printed page 5); and 24-25 and 27, PDF page 7 (printed page 6) | Original Statement issued October 1982 and effective for costs incurred in fiscal years beginning after December 31, 1982. The consulted amended historical edition is not current consolidated guidance. |
| `src_aa_i107_fas66_real_estate_sales` | [FAS 66](https://storage.fasb.org/fas66.pdf), original 1982 electronic version: paragraphs 1-3, PDF page 5; 4-6, PDF page 6; and 52, PDF page 17 | Original Statement issued October 1982 and applied to transactions entered into after December 31, 1982. This electronic version is distinct from the FASB Original Pronouncements as-amended edition. |

The acquisition and development question is deliberately qualified. FAS 67 paragraphs 3-7 address project costs and directly related indirect costs, while paragraphs 11-12 address specific identification, relative-value allocation, and review of estimates. The answer routes a property owner or developer to current property and inventory guidance and keeps the contractor revenue route separate, but it does not claim a current ASC 970 capitalization conclusion. The package does not use SEC SAB material as current GAAP authority.

The property-sale question uses FAS 66 paragraphs 1-3 on PDF page 5, 4-6 on page 6, and 52 on page 17 as historical real-estate-sales evidence. It distinguishes customer or inventory sales, nonfinancial-asset disposal, and a contractor or service contract, so the original Topic 606 material is used only for the customer-contract branch. The lessor questions use ASU 2016-02 paragraphs 842-10-15-38 through 15-39 on PDF pages 26-27, 842-10-25-1 through 25-3 on pages 35-36, and 842-30-25-1 through 25-13 on pages 133-135. The rental question additionally uses 842-10-30-5(a) and 30-6 on page 41, 842-10-25-15 on page 39, 842-10-55-30 on page 51, and 842-30-25-11 through 25-13 on page 135 (printed page 129). The 842-20 passages remain a lessee-only counterrole. These are selected source readings, not a complete current Topic 842 conclusion.

## A3. Inputs, workflow, controls, and worked material

The workflow requires the entity role, reporting framework, period, contract version, property or rights identifier, payment and deposit schedules, source metadata, and applicable current authority before a proposed treatment is released. It stops on missing contract evidence, an unresolved role, an unknown effective period, an unreconciled control total, a locator mismatch, or an unresolved principal-versus-agent or owner-versus-contractor fact.

The controls keep owner assets, contractor services, manager settlements, tenant deposits, lease consideration, and license rights in separate populations. They include contract-version identity, stable source IDs, exact locator URL equality, cents-level schedule recomputation, owner-fund segregation, receipt-to-bank reconciliation, usage-report completeness, and authorized release.

The rental-incentive subcase is a 24-month lessor schedule at 120,000 cents stated monthly rent, with month 1 free, 2,760,000 cents total cash rent, 115,000 cents straight-line operating-lease income per month, and a 240,000-cent refundable deposit. The deposit remains a separate custody liability and is excluded from both rent and lease income. An explicit lessee counterrole is retained for the separate 842-20 route.

The synthetic owner-versus-manager case uses $120,000 of tenant rent, a 5% management fee of $6,000, a $114,000 owner settlement liability, and a separate $20,000 refundable deposit. The owner recognizes the tenant deposit liability and a $20,000 due-from-manager balance. The manager records a separate $20,000 agency-custody obligation payable to the owner. The owner and manager books are separate and balanced, with receipt, fee, remit, deposit, and ending liability checks. The package reconciles the first three values and does not treat the deposit as rent. Other synthetic branches reconcile a $3,660,000 developer project-cost population, 36 monthly equipment payments of $2,500 totaling $90,000 plus separate deposit and maintenance populations, and a $100,000 fixed license fee plus 80,000 units at $0.50, or $40,000 usage royalty, for $140,000 total consideration.

All proposed entries are marked `proposed-synthetic`. They are not operational evidence, posting instructions, or professional conclusions.

## A4. Exceptions and unresolved boundaries

The package preserves explicit counterexamples for owner-as-contractor, deposit-as-rent, manager gross presentation, and usage outside an expired license territory. Other open branches include short-term lease elections, tenant improvements, variable rent, common-area services, property held for sale or rental, development inventory, installment and unit sales, repurchase rights, sale-and-leaseback, sublease, residual guarantees, bundled maintenance, franchise services, sublicensing, local legal rights, tax treatment, and current consolidated topic text.

No professional review, operating effectiveness review, live ERP or ledger test, legal enforceability analysis, title review, or empirical industry sufficiency study was performed. Classification counts and named questions do not establish coverage sufficiency.

## A5. Retrieval and integration evidence

The package declares bounded search and get fixtures with a limit of 20. The fixtures route owner-manager settlement, equipment lessor, nonfinancial-rights licensing, the new role guide, and the synthetic counterexamples. They also include an explicit excluded baseline role to test that a narrow query does not imply whole-sector coverage. The focused suite applies the helper to an exact baseline fixture, resolves schema references, invokes the repository schema validator normally, runs coverage mapping and the repository validator with a nonempty `data.examples` array and a `Synthetic` limitation, and executes the bundled agent's search, context, and get operations. It verifies the exact 81-question linked baseline inventory, source locator identity, owner and manager balancing, payment and royalty arithmetic, conflict-before-write behavior, and byte-stable replay.

`scripts/integrate-real-estate.mjs` stages all incoming source, record, question, assessment, and mapping changes before writing. It rejects unknown source IDs, duplicate publisher URLs, locator URL mismatches, stable-ID differences, and mapping conflicts. It supports dry-run mode and requires an explicit disposable-fixture flag before any write. The focused test file verifies schemas, baseline inventory, arithmetic, source identity, no catalog/release/snapshot/archive targets, conflict failure before writes, and byte-stable replay.

The coordinator still needs to apply the package in an isolated integration fixture, run the repository check and build, verify generated retrieval and exports, produce a release/archive, and independently review the integrated head. Those later checks are outside this source-only commit.
