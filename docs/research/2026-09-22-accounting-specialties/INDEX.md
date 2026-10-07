# Accounting subspecialties and verticals: research handoff

Research date: September 22, 2026, America/Chicago; some live retrievals occurred September 23 UTC. Baseline: local corpus `2026-09-21.3`, with exact Git revision and input hashes in [baseline.json](baseline.json).

The handoff contains 15 briefs and 100 deduplicated source references from 101 research observations. Read status and unresolved dependencies are retained; these counts do not imply 100 fully verified or publication-ready additions.

## Start here

- [Expansion roadmap](ROADMAP.md): recommended authoring sequence and shared foundations.
- [Source inventory](SOURCE-INVENTORY.md): deduplicated source references, existing IDs and intake dispositions.
- [Structured inventory](source-inventory.json): exact source identity, read scope, locators, evidence, dates and rights observations.
- [Coverage matrix](coverage-matrix.json): every research question, its support status, source links, recommendations and remaining gaps.
- [Coordinator review](REVIEW.md) and [structural validation](validation.json): corrections, spot-check scope and integrity results.

## All 15 areas

The baseline column describes the inspected library before this assignment. Research findings are local handoff material, not changes to the canonical corpus. A supported question is bounded to its cited source and scope, not a finding that a whole specialty is sufficient.

| Area and brief | Baseline coverage | Research now adds | Main remaining dependency |
|---|---|---|---|---|
| [1. Partnership and LLC accounting](capital-property/01-partnership-llc.md) | Adjacent equity, tax-return and family-office coverage. | Book/tax capital and outside basis; contributions, allocations, distributions and exits. | Current GAAP partnership presentation, elections and entity agreements. |
| [2. Fund accounting and investment partnerships](capital-property/02-fund-accounting.md) | Custody and investor-side context; limited fund books. | Fund NAV, class capital, subscriptions, fees, carry, waterfall and dealing conventions. | Current Codification and fund-specific allocation/equalization terms. |
| [3. Forensic accounting and litigation support](specialist-reporting/03-forensic-accounting-and-litigation-support.md) | Audit fraud and controls, not a forensic specialty library. | Professional forensic scope, fund tracing, loss evidence and expert-disclosure boundaries. | Claim-specific damages, legal causation and evidence-preservation standards. |
| [4. Bankruptcy and restructuring accounting](specialist-reporting/04-bankruptcy-and-restructuring-accounting.md) | Going concern, exit costs and disposals. | Debtor reports and claim populations; fresh-start interpretation and liquidation basis. | Current ASC, case orders and allowed-claim judgments. |
| [5. Employee benefit plan accounting](specialist-reporting/05-employee-benefit-plan-accounting.md) | Primarily employer accounting and reporting guidance. | Plan-level statement populations, investments/contributions/distributions and audit routes. | Current plan GAAP and plan-year regulatory/professional requirements. |
| [6. Small-business reporting and accountant services](specialist-reporting/06-small-business-reporting-and-accountant-services.md) | General framework and professional-governance routing. | Reporting bases, recordkeeping and preparation/compilation/review/audit distinctions. | Current exact service-standard requirements and entity basis choices. |
| [7. Cost and managerial accounting](cost-contracts-associations/7-cost-managerial.md) | Selected shared-cost allocation and forecast examples. | Job/process/standard/ABC costing, overhead, variances and profitability views. | Current inventory GAAP, advanced costing variants and source reuse permissions. |
| [8. Private equity, venture capital, and hedge funds](capital-property/08-pe-vc-hedge.md) | Broad funds/custody and family-office references. | Separate fund/manager/GP roles; model waterfall, hedge class/series and side-pocket examples. | Actual agreements, security-level valuation and portfolio-company applicability. |
| [9. Real estate ownership and property management](capital-property/09-real-estate.md) | Selected owner/developer/manager and lease questions. | Project costs, property-manager revenue, CAM/reimbursements and REIT tax routing. | Current GAAP, actual lease/management terms and local deposit rules. |
| [10. Government contractors](cost-contracts-associations/10-government-contractors.md) | Preaward system and selected federal cost references. | Cost principles, indirect rates, billing, accounting-system criteria and financing distinctions. | Executed clause versions, CAS/agency branches and inaccessible DCAA materials. |
| [11. Auto and equipment dealerships](cost-contracts-associations/11-dealerships.md) | Industry profile and general inventory references. | Dealer-side inventory, trade-ins, floorplan, incentives, warranty and aftersales examples. | Generalization beyond issuer policies and equipment-dealer-specific evidence. |
| [12. HOAs and condominium associations](cost-contracts-associations/12-hoa-condominium.md) | No dedicated coverage found in the focused baseline screen. | Fund/reporting framework, assessment interpretations, reserves, transition and federal tax. | Conflicting interpretations, current ASC and association/state applicability. |
| [13. SaaS and subscription businesses](operating-verticals/13-saas.md) | Selected revenue, subscription and software-cost questions. | Modifications, commissions, usage/minimums, breakage and provider software-cost scope. | Credit/contract-specific application and current adoption choices. |
| [14. E-commerce and marketplace sellers](operating-verticals/14-ecommerce.md) | Trade, principal/agent, inventory and settlement questions. | Platform payout, refund/dispute, fulfillment inventory and tax/accounting distinctions. | Company contract facts, accounting estimates and other state rules. |
| [15. Oil and gas operators and nonoperators](operating-verticals/15-oil-gas.md) | Substantive selected production-to-settlement research. | Joint-account source limits, ownership/distribution populations, financial/tax depletion and ARO boundaries. | Final COPAS guidance, current ASC and executed JOA/title/lease evidence. |

## Interpretation and limits

Original authorities, technical interpretations, model agreements, issuer examples, educational materials and vendor documentation are classified separately. An ASU or historical standard is not a current consolidated Codification read. Tax, regulatory, management and financial-statement accounting remain distinct.

Restricted sources and search-only leads are retained as acquisition pointers, not substantiation. IPEV access terms, OpenStax reuse restrictions, gated professional/ASC references and inaccessible documents are recorded explicitly. No publisher full text is included in this package, no new reuse permission is inferred, and no source was purchased or publisher contacted.

The coordinator reviewed the 15 briefs and question matrices, reconciled source identities and corpus references, requested substantive supplements, and spot-checked selected original sources. This is AI-assisted research review, not independent professional accounting acceptance. Actual entity agreements and circumstances remain necessary for applying the findings.

## Files and reproducibility

The four group folders retain their detailed source observations and per-area question records. `integrate.py` reconstructs the combined inventory and coverage matrix and validates references without modifying the corpus. `scope-manifest.json` preserves the requested topic checklist. `BASELINE-REVIEW.md` records the pre-dispatch interpretation; the final briefs govern any corrections.

No canonical records, application sources, remote branches or deployment were changed. Source intake, guide authoring, professional review and publication are future work.
