# Issue 116 government and public administration source package

This source-only package covers selected US public-administration roles for an illustrative 2026 close: a state or local governmental general fund, a proprietary enterprise, a fiduciary or custodial activity, a federal component reporting entity, and a federal-award control branch. It separates GASB from FASAB and keeps budgetary authority, GAAP recognition, award compliance, and custody as separate populations.

The pinned baseline contains eight NAICS 921 through 928 guide records plus `src_gaofam26` and `src_gaogb25`, for ten associated records. Its nine linked open question families are preserved in the packet inventory. The new questions deepen only the selected government branches and do not claim that the baseline or this package is sufficient for the whole sector.

## Authority review

- GASB Statement 34, June 1999 issued text: paragraphs 3-5 and 12-16 for scope, governmental, proprietary, and fiduciary reporting; paragraphs 63-73 for fund types; paragraphs 77, 79-82, 85, and 90 for reconciliation; paragraphs 130-131 for budgetary comparison schedules. The official PDF was read for the selected passages. The historical issuance and later amendments are kept explicit.
- GASB Statement 103, April 2024 issued text: paragraphs 2-3, 16, and 18-19 for selected budget-comparison and effective-date material. Fiscal years beginning after June 15, 2025 are recorded as the selected effective boundary.
- FASAB Handbook Version 24, September 2025 selected SFFAS 34 paragraphs 4-12 and SFFAS 53 paragraphs 1-5, including the identified replacement SFFAS 7 paragraphs. The packet reuses the accepted source records and does not treat a FASAB route as a state/local conclusion.
- Current eCFR 2 CFR Part 200 selected sections 200.101, 200.302, 200.328-.329, 200.403-.405, 200.501, and 200.331 for federal-award records, reporting, allowability, allocability, audit routing, and relationship classification. Award terms and later amendments remain controlling.
- GAO 2025 Green Book is used only as a federal internal-control reference. Its presence does not prove that a control operated or that a state/local entity is subject to it.

The linked source rights remain unknown and no external full text is stored. The packet records source URL identity, selected locator, effective period, access limit, and the distinction between accepted inherited review metadata and this issue's application.

## Original worked material

`example-government-fund-federal-bridge` contains separate state/local, federal, and custodial cases. The state/local case recomputes original and final budget variances, actual surplus, ending fund balance, and a selected bridge for capital assets, depreciation, and long-term debt. The federal case recomputes unobligated authority and a SFFAS 53-style net-cost-to-net-outlay bridge, while keeping award costs separate. The custodial case records beneficiary cash and the remaining payable without treating the collection as government revenue. Every journal is balanced in integer cents.

All examples are synthetic educational fixtures. They are not agency records, appropriations, award files, audits, legal opinions, current consolidated standards, operational control evidence, or professional sign-off.

## Integration contract

`integrate-government.mjs` stages record, question, assessment, criteria, and mapping changes, rejects duplicate stable IDs, URL or locator mismatches, unresolved links, question-pointer drift, and mapping conflicts before writing. It does not write the catalog, releases, snapshots, or archives. The source-only test applies the package in a disposable copy of the pinned base, runs the repository coverage validator and corpus validator, bundles the repository agent, and exercises real search, context, and get calls. Search fixtures stay at ten results or fewer.

Remaining work belongs to later integration review: current consolidated standards and entity adoption, live award and budget populations, archive and release generation, full repository check, CI, and independent integrated-head review.
