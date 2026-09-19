# Issue 118: selected US reporting completion

This source-only package is based on commit `f3d7fb2d56e09d7a3af8ed602e7d0238c763e9e8` and package version `2026-09-19.118-completion.1`. It completes four named United States routes from the existing eight-family inventory:

- `q-ledger-close`
- `q-estimates`
- `q-presentation`
- `q-policy-changes-errors`

The package preserves the previously accepted bounded routes for reporting basis, foreign currency, events and going concern, and consolidation. It does not claim complete coverage of any family, industry, entity type, current Codification text, or professional conclusion.

## Primary source review

The package retains the original publisher URL, exact locator, effective period or publication status, access status and unresolved rights disposition for every source. External text is not copied into the corpus.

| Source | Locator and period | Access and rights boundary |
| --- | --- | --- |
| [FASB Accounting Standards Codification](https://asc.fasb.org/) | Topics 210, 220 and 250, including Subtopics 210-10, 220-10 and 250-10; current edition | Public landing page and topic access boundary reviewed. Current paragraph text requires permitted Codification access. Publisher rights remain unresolved and full text is not stored. |
| [FASB ASU 2020-10](https://storage.fasb.org/ASU%202020-10.pdf) | Printed pages 17-18, 41-44; ASC 250-10-45-27, 250-10-45-28, 250-10-50-7A, 250-10-50-12 and transition paragraph 105-10-65-6 | Historical amendment read in the official PDF. Public business entities and specified SEC filing entities apply the listed annual effective date after December 15, 2020; other entities apply the listed annual date after December 15, 2021, with interim application after December 15, 2022. The source is an update, not a substitute for current consolidated text. Publisher rights remain unresolved. |
| [SEC Staff Accounting Bulletin 99](https://www.sec.gov/interps/account/sab99.htm) | Topic 1.M, paragraphs 1-2 and footnote 50 | Staff guidance published August 12, 1999. It supports quantitative and qualitative materiality analysis for SEC registrants and notes that normal recurring close-process errors are not automatically corrected solely because they were identified. It is not a private-company materiality rule. SEC page terms apply; no text is stored. |
| [SEC Staff Accounting Bulletin 108](https://www.sec.gov/rules-regulations/staff-guidance/staff-accounting-bulletins/staff-accounting-bulletin-no-108) | Topic 1.N, paragraphs 47-60 | Staff guidance published September 13, 2006. It supports the rollover and iron-curtain quantification approaches for an SEC registrant and requires assessing the effect of an identified error on each financial statement and related disclosure. It is not a general private-company correction rule. SEC page terms apply; no text is stored. |
| [SEC Financial Reporting Manual Topic 1](https://www.sec.gov/about/divisions-offices/division-corporation-finance/financial-reporting-manual/frm-topic-1) | Sections 1110.1, 1365.1-1365.2, 1410-1410.1 and 1450.1-1450.4 | Current staff manual page reviewed for SEC filing, Regulation S-X and fiscal-period routing. The page was updated June 29, 2026 and is informal, non-authoritative staff guidance. It does not establish private-entity presentation requirements. SEC page terms apply; no text is stored. |
| [eCFR 17 CFR Part 210](https://www.ecfr.gov/current/title-17/chapter-II/part-210) | Current Part 210, Articles 3-5; §§210.3-01 through 210.3-20 and §§210.5-01 through 210.5-05 are the filing form-and-content route | Current public URL and filer-specific route were identified. Individual paragraph text was not extracted in the review session because the public page returned an access block. Current filer requirements therefore remain a follow-up limit. Government publication rights and no full-text storage are retained. |

## Four bounded answers

The ledger-close route freezes the reporting period and source populations, reconciles the opening balances and activity to the GL, uses service or obligation dates for cutoff, retains a journal packet and re-performs the adjusted trial balance to statement bridge. A later invoice or payment is an investigation input rather than an automatic prior-period entry. SEC registrants route error materiality through SAB 99 and quantify financial-statement effects under SAB 108. Current ASC 250 text and private-company facts still require permitted review.

The estimates route preserves the original estimate, the new evidence and the date that evidence became available. A changed input can support a prospective estimate route when it is new information; an omitted or misapplied fact that was available at the earlier reporting date remains an error candidate. The package does not decide a correction, restatement or materiality outcome.

The presentation route maps the adjusted trial balance to statements, disclosures and comparatives, reconciles every total, records classification judgments and separately decides whether an SEC Regulation S-X overlay applies. A private entity does not inherit an SEC or XBRL requirement from the synthetic fixture. The SEC FRM is retained as an informal routing aid, not as authoritative US GAAP.

The policy-changes-errors route classifies policy change, new-information estimate change and error before changing a comparative or issued period. It preserves availability and discovery dates, issued status, affected periods, materiality analysis, statement effects and reviewer disposition. ASU 2020-10, SAB 99 and SAB 108 support only bounded portions of that route; current consolidated Topic 250 text remains an explicit limit.

## Synthetic evidence and application boundary

The companion fixture contains four original numeric or classification cases. It includes a 3,000 January service obligation separated from a 3,000 February service invoice and a later 6,000 payment; an estimate moving from 1,000 to 1,200 when unit cost changes from 10 to 12, alongside a 400 known omission candidate; a statement-mapping packet with balances of 80,000 cash, 120,000 receivables, 70,000 payables and 200,000 debt; and a policy, estimate and error classification matrix. These cases are synthetic routing material only. They are not ERP, ledger, filing, valuation, audit, professional or operating-effectiveness evidence.

`integrate-reporting-completion.mjs` is an additive temporary applicator. It validates the package and its distinct version, stages all source, guide, registry, assessment, mapping and foundation outputs in memory, checks package-owned records for conflicts, and writes only after all checks pass. Replays are byte stable. Existing guide questions, source metadata, mappings, assessments and foundation records are retained; the helper does not replace them. The package does not itself change canonical corpus, snapshot or release files.

## Issue 118 disposition

For the original A1-A5 criteria, the four selected routes now have named questions, declared US scope, source-linked answers, source locators and periods, inputs, workflow, controls, synthetic worked material, counterexamples, explicit unresolved gaps and partial assessments. The inventory retains all eight original families and the four previously accepted routes. This is a bounded completion of the four selected answers. It is not a claim that all 25 original questions, all eight families, all industries or all current US reporting authority are complete.
