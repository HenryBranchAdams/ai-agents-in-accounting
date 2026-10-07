# Verified starting point

Checked against the local corpus on 2026-09-24 before delegation. The current `guide-family-office-us-accounting` object matches the snapshot in the [prior package](../2026-09-24-family-office-expansion/baseline.json). All ten of its directly linked source objects also match that snapshot. The six corresponding objects in `data/coverage/assessments.json` match and each remains `partial`. The prior [validation](../2026-09-24-family-office-expansion/validation.json) reports 11 question rows, 50 deduplicated references and 35 substantive follow-up reads; this package treats those as research evidence, not adequate controller coverage or canonical integration.

PR preparation rechecked the same 17 family-office records against `origin/main` at `86a7830`; all still match the original snapshot. Other repository work landed after the research snapshot, so 25 of the 678 historical protected-file hashes now differ. The [current validation](validation.json) lists that drift and separately confirms this research branch changes none of those protected files. The original snapshot and earlier validation remain dated evidence, not a claim that the entire repository is frozen.

The existing guide has substantive treatment of the legal/entity perimeter, selected investment capital activity, reciprocal shared costs, a Texas fiduciary example, taxpayer routing and a supplemental carrying-value close. It does not provide a full controller responsibility map. The following corpus records can be reused without relabeling them as family-office-specific conclusions:

| Adjacent corpus area | Reusable records | Boundary |
|---|---|---|
| Treasury | `treasury-cash`, `wf-treasury-daily-cash`, `wf-treasury-cash-forecast`, `wf-treasury-liquidity-covenants`, `wf-treasury-bank-administration`, `wf-treasury-payment-initiation` | General workflow roles and evidence; family authority and actual bank terms remain facts. |
| Household and people | `guide-industry-naics2022-814`, `src_aa_i115_irs_household_employer`, `guide-q-payroll`, `guide-q-benefits` | Do not infer the employer from payroll processor or house location alone. |
| Investments | `guide-q-investments`, `guide-q-valuation-impairment`, `guide-industry-naics2022-525`, `guide-aa-i106-finance-insurance` | Fund, investor, custodian and office-company roles remain distinct. |
| Property | `guide-real-estate-us-roles`, `wf-real-estate-property-to-ledger`, `guide-q-capital-assets`, `guide-q-leases` | Rental and personal-use property may need different records and tax bridges. |
| Philanthropy | `guide-us-nonprofit-cross-industry-routing`, `guide-us-nonprofit-contributions-close`, `guide-q-grants-contributions` | A foundation has its own books; a donor-advised fund sponsor owns donated assets. |
| Controls and reporting | `control-family-office-ownership-payments`, `workflow-family-office-entity-close`, `guide-q-controls-fraud`, `guide-q-security`, `guide-q-consolidation`, `guide-q-planning` | Broad category coverage does not resolve family permissions, consolidation or report basis. |

The earlier specialty work is retained in [the first package](../2026-09-22-accounting-specialties/) and [follow-up](../2026-09-23-accounting-specialties-followup/). Its 45 deferred partial questions remain future expansion. Only relevant existing evidence is reused here, especially partnership/fund capital, property and employer/tax distinctions.
