# AA-I120 US assets and workforce evidence

This is a scoped implementation receipt for issue AA-I120. It records the selected entity roles, source review, canonical artifacts, deterministic checks, retrieval fixtures, and unresolved limits. It does not close the issue or assert professional, legal, actuarial, tax, labor, operational, or empirical validation.

## Selected scope

- Entity: one privately held nongovernmental US operating entity that is not an SEC registrant, preparing a calendar-year 2026 external ledger under US GAAP.
- Roles: equipment owner, equipment lessee, hosted-software customer, and employer for federal payroll and employee benefits.
- Population: equipment purchase and construction-in-progress transfer, lessee commencement and modification, customer hosted-software implementation, hourly nonexempt payroll, employer FICA, and a defined-contribution benefit contribution.
- Federal evidence: IRS employer-tax and withholding material plus DOL wage-hour, recordkeeping, and benefit-plan reporting material. These sources are not substitutes for US GAAP accounting authority.
- Exclusions: state and local filings, international and governmental reporting, SEC registrant conclusions, worker classification, immigration, legal wage-hour advice, ERISA and actuarial conclusions, provider or lessor accounting, current consolidated Codification text, professional sign-off, and empirical agent-performance evidence.

The integrated package is `2026-09-18.122`, based on corpus edition `2026-09-18.1`. The catalog remains a public, read-only corpus and the packet authorizes no posting, filing, payment, participant communication, external call, or issue closure.

## Canonical implementation

| Surface | Stable IDs and boundary |
| --- | --- |
| Five family guides | `guide-q-capital-assets`, `guide-q-leases`, `guide-q-intangibles-software`, `guide-q-payroll`, and `guide-q-benefits`; two named questions per family, all partial and shared-context |
| Ten named questions | `rq-capital-assets-scope-treatment`, `rq-capital-assets-evidence-controls`, `rq-leases-scope-treatment`, `rq-leases-evidence-controls`, `rq-intangibles-software-scope-treatment`, `rq-intangibles-software-evidence-controls`, `rq-payroll-scope-treatment`, `rq-payroll-evidence-controls`, `rq-benefits-scope-treatment`, and `rq-benefits-evidence-controls` |
| Supporting software guide | `guide-software-subscriptions` retains its six existing questions and industry mappings; AA-I120 adds only an explicit shared-context review pointer |
| Original example | `example-us-assets-workforce-ledger`, an original cents-based packet with separate capital, lease, software, payroll, benefits, missing-evidence, and role-counterexample branches |
| Sources | Four updated records and eight new records, with publisher URLs, bounded locators, effective-period notes where known, no stored external full text, and unresolved publisher reuse rights |
| Assessments | Ten partial shared-context assessments under assessment version `2026-09-18.122`; no industry code or descendant sufficiency is assigned |
| Retrieval | Five named fixtures in `data/research-questions.json`, each with expected records, exclusions, required citations, and claims limited to the declared scope |

The package-driven integration is `scripts/integrate-assets-workforce.mjs`. It preserves stable IDs, refuses a newer unapproved corpus unless explicitly overridden, rejects duplicate source URLs, keeps external rights unresolved, and is byte-stable on replay after the supporting-guide note is normalized.

## Source evidence and rights

The packet updates FASB Codification routing, ASU 2018-15, ASU 2025-06, and IRS Publication 15 (2026). It adds ASU 2016-02 for leases, ASU 2017-07 for employee benefits, IRS Publications 15-T and 15-B, 2026 Form 941 instructions, DOL Fact Sheets 21 and 23, and the DOL EBSA Reporting and Disclosure Guide.

The FASB landing page is used only for current US GAAP topic routing. Issued updates are bounded excerpts and are not current consolidated Codification text. IRS and DOL material supplies federal payroll or labor evidence only. Every external source has `full_text_stored: false`, `source_license: null`, and an unresolved rights note. Public accessibility is not treated as permission to redistribute or train on publisher content.

## Deterministic reference results

- Capital and CIP: `10,000,000 + 2,000,000 = 12,000,000` cents; depreciable basis is `12,000,000 - 1,000,000 = 11,000,000` cents, with `183,333 x 59 + 183,353 = 11,000,000` cents.
- Lease: the 24-period lessee schedule closes at zero cents after the final payment true-up. The period-13 modification remeasurement is `6,041,845 - 5,809,467 = 232,378` cents.
- Hosted software: the `3,000,000`-cent implementation invoice separates `1,800,000` qualifying application-development cents from `1,200,000` training and data-conversion expense. The `1,200,000`-cent hosting fee is separate, and qualifying implementation amortization is `1,800,000 / 24 = 75,000` cents per month.
- Payroll and benefits: `40 x 2,400 + 6 x 3,600 = 117,600` gross-wage cents; net pay is `85,604` cents after the explicit withholding and deduction assumptions; employer cost is `136,596` cents after employer FICA and the `10,000`-cent benefit contribution.
- The example records `all_arithmetic_differences_cents: 0`, `proposed_actions: []`, `executed_actions: []`, `filings_executed: []`, and `payments_executed: []`. The values are synthetic and do not establish a posting, filing, tax, labor, plan, or accounting conclusion.

## Retrieval fixtures

| Fixture | Expected path | Explicit exclusion or stop condition |
| --- | --- | --- |
| `rq-us-assets-software-implementation` | Supporting software guide, I120 intangible guide, and synthetic example | Lease guide excluded; provider accounting and ASU 2025-06 adoption remain separate |
| `rq-us-assets-lease-modification` | I120 lease guide and synthetic example | Provider or lessor accounting is not inherited |
| `rq-us-assets-placed-in-service` | I120 capital-assets guide and synthetic example | Tax depreciation is a counterexample, not book depreciation authority |
| `rq-us-assets-payroll-fica` | I120 payroll guide, benefits guide, and synthetic example | Worker classification, state payroll, and legal wage-hour advice remain outside scope |
| `rq-us-assets-tax-book` | I120 capital-assets guide, payroll guide, and synthetic example | Tax-book differences require separate facts and review; no tax filing is generated |

## Verification evidence

- `npm run validate` passed with 1,116 records and 661 sources at corpus version `2026-09-18.122`.
- Typecheck, corpus validation, UI lint, design lint, build, source export, release checks, and all 143 non-network-bound repository tests passed in the full local check. The remaining one full-check failure was the sandbox-only `listen EPERM` on the local Streamable HTTP test.
- The exact Streamable HTTP test passed 1/1 when rerun with local socket permission.
- I120 arithmetic, rights, retrieval, package-parity, and generic research-question tests passed 7/7. The current snapshot `2026-09-18.122` recorded 1,116 records, 62 families with material, and 39 scoped assessments. The matching release contains 29 downloads and the rebuilt multipart source export.
- Replaying `scripts/integrate-assets-workforce.mjs` produced identical hashes for the catalog, corpus records, foundation package, named-question registry, mapping overrides, and assessments.

## Remaining limits

No current consolidated Codification text, entity election memo, contract population, payroll provider control report, timekeeping population, plan document, actuarial report, tax filing, legal review, professional sign-off, operating-effectiveness evidence, or measured agent performance was reviewed. The example is read-only synthetic research material. AA-I120 remains open until its independent acceptance and any remaining scope decisions are recorded separately.
