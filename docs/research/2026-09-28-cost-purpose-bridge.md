# HEN-32: shared cost-purpose bridge

Local bounded addition based on main `c1029b36f76b74a9e5a6bf44cc798c81cddcc9cf`, edition `2026-09-27.2`. On September 28, GitHub showed PR193 merged at that commit and main workflow run 36479401895 successful. PR190 remains separate design-reference work. No application, posting tool or external publication is part of this change.

The bridge adds four partial shared-context questions, five terms, five source records and one original example containing three independent scenarios. Normal capacity links the existing manufacturing US application at `/data/research_questions/0/us_application`; the retained IFRS answer is separate. Existing cost-object/driver and FAR 31.203 records are linked without altering their source reviews or assessments. No detailed industry earns sufficiency or new industry credit.

## Dated source evidence

All entries below were directly inspected on September 28, 2026. These are original summaries and locators, not publisher full text. Source records preserve the exact publisher URL and observation date.

- [KPMG, Handbook: Inventory, October 2025](https://kpmg.com/kpmg-us/content/dam/kpmg/frv/pdf/2025/inventory.pdf): Questions 3.2.110/120, printed pages 36–37 (PDF pages 37–38), and Question 3.3.20, printed pages 47–48 (PDF pages 48–49). Interpretation supports the inventory questions; it does not substitute for current consolidated ASC 330. No protected standard passages or publisher numerical examples are copied.
- [OpenStax section 10.4](https://openstax.org/books/principles-managerial-accounting/pages/10-4-evaluate-and-determine-whether-to-keep-or-discontinue-a-segment-or-product): relevant-cost discussion, Fundamentals, Sample Data and Final Analysis. Book publication label is February 14, 2019. The live rights footer names CC BY-NC-SA 4.0 and prior written permission for LLM training/AI ingestion. No such permission is recorded. The new arithmetic is project-created, not a copied textbook example.
- [FAR 31.201-1(a)–(b)](https://www.acquisition.gov/far/31.201-1), [31.201-2(a)–(d)](https://www.acquisition.gov/far/31.201-2), and [31.201-4](https://www.acquisition.gov/far/31.201-4): substantive official text read, with page labels FAC 2026-01, effective March 13, 2026. These labels do not establish the applicable version for an executed award, agency supplement or deviation. Public access does not establish a reuse grant.

The five source identities are distinct from the existing KPMG June 2026 IFRS/US comparison, historical November 2004 FAS 151 and FAR 31.203. No duplicate URL is introduced. No prior source review is upgraded. Redirected IMA material, DCAA manuals, tax cost rules and current ASC are not claimed as newly read evidence.

## Reconciliation and boundaries

The standard-cost example assumes uniform normal variance attribution with no opening inventory or WIP. Both unfavorable and favorable variances reconcile stock plus expense to total cost; separately identified abnormal cost stays out of stock. Missing attribution yields no inventory adjustment.

The service-line example distinguishes traceable fixed cost, avoidable cost and continuing common cost. Closing loses $380,000 contribution and saves $120,000, reducing income $260,000. A separately stated $300,000 alternative-use contribution reverses that result; absent avoidability facts, the result is unresolved.

The independent contract example reconciles $100,000 standard cost plus $8,000 variance, less an assumed $6,000 exclusion. The $102,000 remainder is a candidate for further review, not an approved allowable claim. Claim, billing and revenue amounts remain null. FAR applicability, selected CAS requirements and full CAS coverage require separate facts. Federal-assistance rules are a different route.

Tax cost remains an explicit unresolved purpose with no answer or amount. Current authority, actual entity records, professional review and evidence of agent effectiveness remain dependencies throughout.

## Verification contract

`tests/cost-purpose-bridge.test.mjs` checks retrieval, question-level citations/pointers, reused context, synthetic arithmetic and counterexamples, unresolved facts, source rights, and preservation of baseline records/assessments/history. Existing research-question fixtures exercise the four new search routes. Run the repository edition workflow and `npm run check` on committed local source. Automated validation establishes integrity and retrieval behavior, not accounting correctness or publication authorization.
