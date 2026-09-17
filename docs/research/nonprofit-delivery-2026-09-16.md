# Nonprofit supplement: implementation and delivery evidence

This is a **partial implementation for issue #117**, not completion of that issue or the 31-issue backlog. The work branch is `research/us-backlog-2026-09-16`, PR #128. Corpus edition `2026-09-16.1` adds five records to the unchanged 1,067-record baseline. Counts (1,072 records, 639 sources, 179 named questions) are inventory, not accounting sufficiency.

## Implemented source and retrieval paths

| Record | Role in the supplement |
|---|---|
| `src_nonprofit_fasb_2018_08` | Original FASB summary: contribution/exchange and condition/restriction distinctions; selected summary, not consolidated Codification |
| `src_nonprofit_fasb_2016_14` | Selected ASU presentation/restriction/functional expense material; excerpt-level review only |
| `src_nonprofit_irs_990_2025` | IRS 2025 Form 990 Part IX instructions; federal reporting classification, not financial-statement recognition authority |
| `guide-us-nonprofit-contributions-close` | Nongovernmental US nonprofit guide with one bounded named question, evidence inputs, controls and unresolved exceptions |
| `example-us-nonprofit-restricted-award-close` | Original synthetic award/advance/restriction and separate shared-cost allocation example |

There are **two FASB records and one IRS record**, not three FASB records. Their original publisher URLs, locators, applicable periods and September 16 review provenance remain in `data/corpus/source.json`. This delivery repair does not manufacture a fresh source review. External rights remain unknown and no publisher full text is included. The guide and example retain project-original rights and their source links.

Named question: `rq-us-nonprofit-award-close` in `data/coverage/research-questions.json`. Partial assessment: `coverage-us-nonprofit-2026-09-16` in `data/coverage/assessments.json`. NAICS 813 is a discovery association; it is not proof of nonprofit coverage across all industries, nor of any child industry. Mapping overrides and generated mappings preserve that distinction.

Human reading: `/records/guide-us-nonprofit-contributions-close` and `/records/example-us-nonprofit-restricted-award-close`. Agent searches: `nonprofit contributions` with `kind=guide` and `framework=US GAAP`; `restricted award` with `kind=example` and the same framework. The section directory exposes scope and research limits with source pointers. Counterexample: the GASB framework retrieves governmental sources, not this nonprofit US GAAP guide.

## Arithmetic and operational boundary

The original example records a 120,000 cash receipt as a refundable advance before a barrier is met, then contribution recognition when that condition is satisfied. Qualifying expense and restriction release of 45,000 leave 75,000 restricted. The separate 20,000 cost pool allocates 14,000/4,000/2,000 using a 70%/20%/10% driver; it is not silently charged again to the award. Tests reconstruct the advance and balanced illustrative journals and reconcile the allocation.

The `cash_or_payables` credit is an explicitly synthetic alternative, not an observed payment or a complete cash-ledger tie-out. These examples provide no operational population, ERP completeness, measured agent performance or professional sign-off.

## Acceptance evidence and remaining work

| Criterion | Evidence and limit |
|---|---|
| Inventory and declared scope | Nongovernmental US nonprofit role, US GAAP versus Form 990 and one named question are explicit. Full nonprofit/industry inventory is not complete. |
| Original-authority-linked answers | Two scoped FASB reviews and one IRS instruction record, with locators and access/rights limits. Permitted current consolidated Codification review is absent. |
| Inputs, treatment, controls and worked material | Guide plus original award-close and separate allocation arithmetic. Not operational evidence. |
| Exceptions and research status | Canonical partial assessment and open questions retain endowment, contributed services and state-law boundaries, missing professional review and missing operational evidence. Contributed goods/services and cross-industry applications still need substantive work. |
| Retrieval/build verification | Two added retrieval fixtures and five nonprofit regression tests cover source pointers, rights, framework counterexample, scoped assessments, arithmetic and rendered/exported records. Full repository checks and actual CI commit evidence must be reported separately. |

#117 remains open. Missing selected research work is not an external access blocker by itself. No other starting issue is claimed implemented by this supplement; construction's four existing external gaps remain untouched.

## Recovery and verification provenance

Authoring run [35165611976](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35165611976) applied and hash-verified the pending seven-file payload, built 27 downloads, then failed four of 81 tests. Its push step was skipped. The separate green PR check at [35165615465](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35165615465) covered the pre-integration canonical tree, not this research.

The repair finds the construction assessment by stable ID instead of array position; reconciles scoped-assessment counts against the canonical assessment population while retaining construction exclusions; updates the named-question inventory with a canonical-to-manifest equality assertion; and appends a new immutable coverage snapshot. It preserves the exact old edition before changing the current version. No acceptance criterion, source-rights rule or professional/operational boundary is weakened.

Local environment: Node 22.16.0 with lockfile-matched dependencies recovered from CI artifact 10466582513. A first complete local run after repair passed 85 of 86 tests; the remaining failure was in the new test reading gaps from the intentionally compact coverage cell instead of the canonical assessment. That test was corrected to follow the stable assessment ID; all five focused nonprofit tests then passed. The subsequent complete local `npm run check` passed **86/86 tests**: type checking, corpus validation, UI/design lint, two new retrieval fixtures, all original tests and five new nonprofit checks. It rebuilt all 27 downloads and the source archive together. Two earlier time-limited local attempts are not successful full-check evidence. The final delivery workflow reruns `npm run check` on the exact staged tree and retains source/build evidence; actual outcome and commit must be checked in GitHub, not inferred from this document.

Temporary payloads are removed during verified branch authoring. The GitHub connector removes the temporary workflow after the canonical commit, then the final PR check rebuilds the clean source tree; the earlier authoring artifact may still contain that workflow. The local final candidate already excludes those temporary files. Generated downloads and the source archive are built together, never hand-edited. No live-site deployment, merge, outside outreach, paid access, terms acceptance or professional review is performed.
