# AA-I124 institutional and regulated arrangements

This package adds ten selected US questions to the existing twenty-question foundation inventory. It starts from `a38de70787ee47653f3e315a3c31f0577b5b9ae2`. The reserved edition and immutable coverage snapshot are `2026-09-18.124`; resumed research and editorial review occurred on September 19. Snapshot identity is not a backdated review claim.

The final edition is `2026-09-19.124`. It corrects two generated corpus-version headers and the assessment source-currency enum after the initial check, preserving the initial reserved snapshot/release unchanged. The final successor snapshot records corrected inputs. Inherited source currency is conservatively marked not reverified for this assessment; individual question and source records retain precise review limits.

## Original criteria and evidence

| Original criterion | Artifact and evidence | Limits |
|---|---|---|
| Inventory, roles, framework, periods and question population | `data/research/institutional-regulated-124.json#/baseline_inventory`; canonical `guide-aa-i124-institutional#/data/research_questions` | All ten original guides and their question IDs retained. One new selected question per family, not a whole-family completion claim. |
| Original authority, precise locators, effective periods, access and rights | Four new source records in the package; each named question has source IDs, original URLs, locators, period and access limits | Existing source reviews retain their actual dates. Full current ASC, individual SSAPs and entity facts remain unreviewed. |
| Inputs, treatment, workflow, controls and original worked material | Each question supplies those fields; `example-aa-i124-role-routing#/data/examples` and `/data/custody` | Independent synthetic cases only. No manufactured example quota for each family. |
| Canonical exceptions and review/empirical limits | Ten shared-context assessments with IDs beginning `coverage-aa-i124-`; registry questions beginning `rq-aa-i124-` | All partial; no professional signoff or production evidence. Applied links do not certify another ticket. |
| Retrieval, counterexamples, same-build exports and full check | `tests/aa-i124-institutional.test.mjs`; standard publication/source-export tests; `npm run check` | Local checks only. Separate acceptance is required before merge or issue closure. No deployment requested. |

## Original-authority review

New records preserve original URLs and unknown reuse rights. No external full text is stored.

- [FERC Part 101](https://www.ecfr.gov/current/title-18/chapter-I/subchapter-C/part-101): applicability, General Instructions 1-3 and account 182.3. The displayed Title 18 currency is September 17, 2026. Jurisdiction and ratemaking action are required facts; neither a utility industry code nor this source establishes ASC 980 eligibility or recovery.
- [SEC adviser custody rule](https://www.ecfr.gov/current/title-17/chapter-II/part-275/section-275.206(4)-2): paragraphs (a)(1)-(4), (b)(1)-(6), (d)(2) and (d)(6). The current eCFR text was read September 19. It addresses custody duties and exceptions, not fund valuation or legal ownership. The eCFR is authoritative but unofficial.
- [SEC oil/gas rules, 2025 CFR](https://www.govinfo.gov/content/pkg/CFR-2025-title17-vol3/pdf/CFR-2025-title17-vol3-sec210-4-10.pdf): section 210.4-10(b), (c)(1)-(5), printed pages 297-299. The current eCFR section returned an access error, so the answer uses the explicitly identified April 1, 2025 edition. Later amendments and current ASC 932 remain unresolved. This is a concrete currency gap, not a claim that public research is impossible.
- [NAIC statutory accounting overview](https://content.naic.org/insurance-topics/statutory-accounting-principles): Overview and Prescribed/Permitted Accounting Practices; page updated June 23, 2026, read September 19. The overview supports the state-practice boundary, not an individual SSAP or reserve conclusion.

Reused authority includes the existing FASB ASU 2018-08 and nonprofit presentation package, GASB 34/103, FASAB SFFAS 34/53, December 2025 FFIEC 051 instructions, CMS hospital form instructions including Transmittal 25, 42 CFR 413.24, federal award rules, and original ASU 2014-09. Their source records preserve original editions, review dates and limits. The licensed-content question is a historical-amendment research route; later licensing amendments and current authoritative Codification remain open.

## Worked material and counterexamples

The $100,000 customer prepayment starts as a liability and becomes revenue on assumed performance. The separate unconditional restricted gift is contribution revenue with no assumed restriction release. The separate legislative appropriation authorizes spending against existing resources and is not invented cash or revenue. Each case identifies its own source records, evidence checklist and reporting-basis bridge.

The identical $250,000 custody feed yields an assumed owned investment in one case and a client-asset subledger in the other. The difference is documented legal/beneficial ownership, not the statement amount. These illustrative recognition decisions are editorial assumptions, not a legal title opinion or a complete GAAP analysis.

The requested searches resolve to framework-qualified evidence. The provider search must not retrieve the insurer guide in its first five results. The matrix has no industry-specific mappings, and its exported context must retain both provider-versus-insurer and unregulated-seller exceptions.

## Integration and remaining scope

`scripts/integrate-aa-i124.mjs` adds only this package's records, questions, assessments and mappings, plus links from the existing family guides. It preflights conflicts before writing and refuses a different corpus edition. The general foundation importer was not rerun. Existing international records and release history are preserved.

Remaining gaps are explicit in each canonical assessment: current consolidated ASC and later amendments; state-specific insurer authority and individual SSAPs; full lender schedules and CECL/servicing accounting; fund NAV and broker-dealer branches; actual FERC rate orders and recovery; current resource rules, mining and agriculture; actual CMS/MAC provider facts; legal IP rights; professional review; and operational evidence. These are limits of the selected foundations, not completed applied industry work.

Validation results and immutable commit identity are reported in the PR review receipt. The full check regenerates downloads, release output and the multipart source archive together; archive tests verify membership and hashes against the actual working-tree files.

The assessment schema now permits optional explicit `professional_review: not-performed` and `empirical_support: not-established` fields. Tests reject positive verification claims in those fields. Existing historical-count tests retain the accepted 1,107-record snapshot and prior question-set assertions, while current-build checks compare the canonical population and current release. They no longer assume a prior package owns all future shared assessments.
