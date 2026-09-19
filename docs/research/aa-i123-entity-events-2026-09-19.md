# AA-I123: entity changes and unusual events

Issue [123](https://github.com/HenryBranchAdams/ai-agents-in-accounting/issues/123), researched September 18-19, 2026. Assigned base: `a38de70787ee47653f3e315a3c31f0577b5b9ae2`. Reserved edition/snapshot: `2026-09-18.123`. This is a review candidate, not independent acceptance, issue closure or deployment.

## Original criteria and evidence

| Original criterion | Review evidence | Limits |
| --- | --- | --- |
| Inventory, selected roles/framework/period/question population | `data/research/aa-i123-inventory.json`: 89 associated records and all 14 existing linked questions retained. Nine new questions extend six existing guides. | Nongovernmental US GAAP operating company/acquirer in calendar 2026; private-company and SEC branches remain distinct. No industry-wide sufficiency. |
| Original US authority, locators, periods, access and rights | `data/research/aa-i123-entity-events.json`: eleven source checks, including two existing FASB source IDs reused through additive reviews. Canonical source records retain locators and access/rights boundaries. | FASB historical Statements/Interpretations are superseded authority; ASUs communicate amendments. Current consolidated Codification text remains unverified. |
| Inputs, treatment, workflow, controls and worked material | Nine named canonical answers, five-step review workflow and three proposed controls; `example-aa-i123-entity-events` has eight connected synthetic cases. | No real approvals, ledger, valuation, legal advice or engineering evidence. Residual arithmetic does not establish goodwill. |
| Exceptions and unresolved evidence in canonical coverage | Nine shared-context partial assessments, each with exceptions, source and professional limits; gaps are also in the named-question registry. | Recovery recognition/offsetting, full acquisition measurement, bankruptcy, tax, insurer, detailed environmental defenses and other excluded models remain open. |
| Retrieval, counterexamples, exports and full check | `tests/aa-i123-entity-events.test.mjs` tests the three requested searches, source pointers, preserved questions, arithmetic, role/date exceptions, replay and same-build archive/release parity. | Local software tests establish only the exercised behavior. They do not establish accounting correctness or deployment. |

## Source research and precise limitations

The public [ASU 2017-01](https://storage.fasb.org/ASU%202017-01.pdf) business-definition amendments provide the concentration and substantive-process research. Existing [ASU 2023-05](https://storage.fasb.org/ASU%202023-05.pdf) and [ASU 2018-17](https://storage.fasb.org/ASU%202018-17.pdf) records are reused with separately dated checks for venture formation and common-control eligibility. Their construction-specific provenance remains intact.

Original FASB [Statement 57](https://storage.fasb.org/aop_FAS57.pdf), [Statement 5](https://storage.fasb.org/aop_fas5.pdf), [Interpretation 45](https://storage.fasb.org/fin%2045.pdf), [Statement 146](https://storage.fasb.org/aop_fas146.pdf) and [Statement 143](https://storage.fasb.org/fas143.pdf) supply historical disclosure, claim, guarantee, exit-cost and retirement research. They are explicitly not labeled current consolidated GAAP. [ASU 2014-08](https://storage.fasb.org/ASU%202014-08.pdf) supplies the bounded disposal presentation criteria. Older lease, impairment and other cross-references are not silently promoted to current guidance.

[SEC SAB Topic 5.Y](https://www.sec.gov/interps/account/sabcodet5.htm), particularly footnote 49, supplies a separate registrant-only contested-recovery branch. [EPA Superfund Liability](https://www.epa.gov/enforcement/superfund-liability) supplies a responsible-party investigation route, not a complete statutory or GAAP decision.

The Codification login returned no readable paragraphs on September 19. The prior construction access-boundary record is reused as prior evidence only. Public FASB PDFs and agency pages were researched independently; access failure was not used to skip those sources. No terms were accepted or protections bypassed. A permitted current-text review of the specific ASC topics is still necessary before live accounting use. External full text and permissions are not supplied by this project.

## Synthetic cases

The acquisition residual is $150,000 under declared assumptions. Same-price asset purchase and venture formation counterexamples prevent classification from being inferred from cash price. Related-party charges reconcile to $15,000 due without claiming arm's-length terms or consolidation eligibility.

The claim records a separately assumed $100,000 liability and $60,000 contested potential recovery, with zero recovery asset. A later claim estimate of $120,000 changes liability expense by $20,000 without changing recovery status. This is not a universal gross-presentation rule. The guarantee branch assumes a $3,000 unrelated-party premium and separately flags related-party exceptions.

Other exit costs reconcile $12,000 received services less $7,000 cash to $5,000 payable; $38,000 of unreceived budget is not accrued. A routine machine sale lacks demonstrated held-for-sale and discontinued-operation criteria. The retirement rollforward is $100,000 + $5,000 accretion + $10,000 revision - $20,000 settlement = $95,000, with separate original and revision rate assumptions. Improper-operation remediation cannot inherit that model automatically.

## Integration and review

The issue-specific applicator appends owned IDs and fails on conflicting owned content before writing. It preserves the original 14 questions and does not overwrite `foundations.json` or the shared importer. Run `node scripts/integrate-aa-i123.mjs`, `npm run coverage:map`, `npm run coverage:snapshot -- 2026-09-18.123`, then `npm run check` on the assigned base. Existing release and snapshot history remains immutable. Replaying an already applied identical package is byte-stable.

Release-dependent assertions in four older test files now compare current exports and metadata with the current catalog or preserved input registry, and preserve historical release checks explicitly. The AA-I127 assessment test retains its full owned-question check while allowing additional shared-context assessments.

Independent acceptance, merge and criteria-based issue closure belong to the coordinator. No claim is made that the current-authority or professional-review gaps have been closed.
