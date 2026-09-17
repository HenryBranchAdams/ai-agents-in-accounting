# AA-I125 management accounting evidence

This is a scoped implementation receipt for issue AA-I125. It records the selected role, source review, canonical artifacts, deterministic checks, and unresolved limits. It does not close the issue or assert professional or operating validation.

## Selected scope

- Entity role: one synthetic privately held domestic US manufacturer with two operating units and shared services.
- Framework: US GAAP for the external ledger and a documented internal management-accounting policy for January 2026.
- Period: January 2026 budget and actual activity, a forecast revision dated 2026-02-05, and a restated actual dated 2026-02-10.
- Population: support-pool GL accounts 6100-6120, 1,000 approved service hours, a 30/70 headcount sensitivity, a 1,000-unit budget at $100, a 900-unit actual at $110, and linked AR, AP, cash, and version records.
- External boundary: 2 CFR Part 200 and FAR Part 31 are checked only as federal-award or covered-contract applicability branches. SEC SAB 99 is retained only as a registrant materiality boundary. Existing IAS 2 context remains international and is not expanded.

## Source evidence

- `src_cfr200grants`: eCFR §§200.302(b)(3),(5),(7), 200.403(a)-(h), and 200.405(a)-(e), current page displayed through 2026-09-15. The source supports source-documentation, budget-comparison, allowability, consistent-treatment, and relative-benefit boundaries for federal awards.
- `src_far_31203_indirect_costs`: Acquisition.gov FAR 31.203(b)-(g), FAC 2026-01 effective 2026-03-13. The source supports logical cost groupings, benefit-based bases, direct-versus-indirect consistency, method changes, and base-period considerations for covered federal contracts.
- `src_secsab0099`: SEC SAB 99 Topic 1.M, issued 1999-08-12 and accessed 2026-09-17. It supports the registrant-only limit that materiality cannot rely exclusively on a percentage threshold and must consider qualitative context and aggregation.
- Existing IMA/Deloitte and Productivity J-Curve records remain bounded context. No external full text or new reuse permission was added.

## Canonical implementation

- Guides: `guide-q-cost-allocation`, `guide-q-planning`, and `guide-q-performance`.
- Named questions: six direct shared-family rows are synchronized across the guides, `data/research/foundations.json`, and `data/coverage/research-questions.json`. The seventh baseline touchpoint, `rq-mfg-cost`, is explicitly unresolved and deferred to issue #101.
- Example: `example-us-management-allocation-budget-actual`.
- Coverage: three sector-scoped partial assessments under assessment version `2026-09-17.1252`; mapping overrides and generated mappings are synchronized.
- Retrieval fixtures: `rq-aa-i125-allocation` and `rq-aa-i125-budget-actual`.
- Narrow integration: `scripts/integrate-management-accounting.mjs` applies only this issue packet, refuses an unrelated existing example with the same stable ID, and stops before writing when any canonical top-level version or review date is newer than the packet.

## Baseline and coordination receipt

The baseline was recomputed at commit `afd2aced307628843f8a26677c3a6fb37fa733e3` from the catalog, record mappings, and named-question registry. It contains 51 distinct associated record IDs. The packet records every stable ID under `deepened`, `reused`, or `unresolved_or_deferred`, with no replacements. New scoped records are the original synthetic example and the FAR 31.203 source. The existing `src_cfr200grants` record is explicitly marked as an additional non-baseline source that was deepened.

| Baseline question | Disposition | Boundary |
| --- | --- | --- |
| `rq-cost-allocation-allocation-base` | deepen | Selected US shared-service driver, ledger tie, sensitivity, and external-rule boundary |
| `rq-cost-allocation-unit-cost` | reuse | IAS 2 context retained without presenting it as US authority |
| `rq-planning-driver-model` | deepen | Versioned US budget-to-actual and profit-to-cash bridge |
| `rq-planning-uncertainty` | deepen | Forecast revision, known and unknown inputs, missing-driver branch, and restated actual lineage |
| `rq-performance-margin-definition` | deepen | Dated metric inputs, allocation treatment, and profit-to-cash tie |
| `rq-performance-materiality` | deepen | SAB 99 remains registrant-only and supplies no percentage rule |
| `rq-mfg-cost` | unresolved | Manufacturing conversion and normal-capacity application remains with #101 |

Coordination links remain open and are not treated as completed: [#101](https://github.com/HenryBranchAdams/ai-agents-in-accounting/issues/101) owns manufacturing conversion and subsector exceptions; [#109](https://github.com/HenryBranchAdams/ai-agents-in-accounting/issues/109) owns holding-company perimeter, centralized management costs, and consolidation; [#117](https://github.com/HenryBranchAdams/ai-agents-in-accounting/issues/117) owns nonprofit recognition, awards, functional expenses, and disclosures. AA-I125 reuses shared context only.

## Deterministic reference results

- Support pool: $90,000 + $20,000 + $10,000 = $120,000.
- Service-hour allocation: 600/1,000 gives $72,000 to Unit A and 400/1,000 gives $48,000 to Unit B.
- Independent headcount sensitivity: 30/100 gives $36,000 and 70/100 gives $84,000. Neither driver is asserted to be economically correct.
- Revenue bridge under the declared sequential volume-then-price convention: budget $100,000, actual $99,000, volume -$10,000, price +$9,000, total -$1,000.
- Budget-to-actual entity profit: -$80,000 to -$75,000 before the late invoice, then -$76,000 after restatement. The full support pool is counted once; Unit A's $72,000 allocation is not added again.
- Dated margin inputs: budget Unit A revenue $50,000, direct cost $10,000, and allocated support $72,000 produce `50000 - 10000 - 72000 = -32000`; actual v1 Unit A revenue $54,000, direct cost $9,000, and allocated support $72,000 produce `54000 - 9000 - 72000 = -27000`. Unit A and Unit B inputs tie to the entity revenue and direct-cost totals before any margin is reported.
- Other displayed measures are reproducible from the same ledger ties: gross margin is $40,000 budget and $45,000 actual v1; entity operating profit is -$80,000 budget and -$75,000 actual v1. Contribution margin remains explicitly unasserted because no validated variable-cost taxonomy is provided.
- Cash bridge: budget closing cash $217,000; actual v1 and restated v2 closing cash $224,000. The late $1,000 invoice changes AP and restated profit, not cash closing balance.

## Limits

The work is original synthetic research material. It has no real ledger, award, federal contract, CAS package, SEC filing, production forecast population, backtest, professional sign-off, or operating-effectiveness evidence. The selected management allocations and margin definitions are documented internal choices, not universal US GAAP requirements. The current consolidated FASB Codification was not accessed. Source rights remain record-specific, and public access was not treated as permission to store or redistribute external text.
