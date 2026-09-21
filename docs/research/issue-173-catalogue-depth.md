# Issue 173: bounded catalogue depth

Status: initial reuse inventory, not completed research or acceptance. All nine
packages remain mandatory. This file will be updated with implemented records,
reviewed source locators, validation and remaining external dependencies.

## Starting identities and ownership

Source inspection: `951e95922c98f5926cf5d567aec5b6934aa557a2`, a release-tooling
candidate based on the accepted issue 174 implementation. PR 178 is still under
review; its existence is not main integration. Main is
`941cdb1c01af10065ad3b02712a121ff24e15d18` after PR 177, with all 380 main tests
passing. Canonical corpus edition is `2026-09-21.3`, 1,328 records. The separately
observed public site is version 32 with source `e1e4d17`, corpus `2026-09-21.3`.
No part of this research package has been published.

Astra owns shared schema, relationship semantics, edition metadata, integration
and activation. Research changes are isolated from the release PR. Preserve the
existing editorial brief and freshness contracts from PR 172. Issue 171 is still
unimplemented; use its specified direction/owner/locator projection contract and
verify the actual implementation before acceptance. No independent schema or graph
store is introduced here.

## Reuse, deepen, add and defer inventory

These rows reflect inspected record bodies and their recorded review boundaries,
not fresh verification of the publishers. New IDs below are reserved proposals
until the corresponding canonical record exists.

| Package and question | Reuse and recorded evidence depth | Required addition and relationship effects | Acceptance check |
| --- | --- | --- | --- |
| P1: What constitutes the system population, and how are gaps recovered? | `src_xero_journals_completeness`, `src_xero_efficient_retrieval`, `src_xero_bank_statement_boundary` and `collection-erp-extraction-completeness` contain bounded 7 September documentation annotations. `src_oracle26b_journal_headers` covers headers only. Existing QBO items are surveys/product descriptions, not an extraction dossier. | Deepen current Xero documentation/cohort/terms evidence. Add `guide-xero-ledger-completeness` and `guide-qbo-ledger-completeness`, object/purpose tables, completeness/recovery procedures, synthetic counterexamples and authorized-test protocols. Preserve narrow Oracle/NetSuite comparisons; cite documentation without claiming observed API behavior. | A reader identifies population, short-page/webhook/reconnection failure, source lineage and untested conditions for each system; recovery fixtures remain synthetic. |
| P2: Can each amount be traced across periods from documents to GL and bank? | `example-us-operating-transactions-ledger` has original event/journal/settlement branches. `example-holding-parent-subsidiary-close` has integer-cent entity ledgers and eliminations. `example-construction-contract-ledger` has two-period journals, estimate/cutoff/retainage branches and separate observed evidence. `wf-r2r-bank-reconciliations` contains the accepted answer-first fee example. | Add complete purchase-to-payment and processor-receipts cases with stable documents/events, multi-period replay and isolated exceptions. Link and extend accrual/intercompany/construction material; do not duplicate the construction model or upgrade its unresolved professional/operational evidence. | Independently replay exact amounts and reconcile population, entity, period, clearing and bank. Missing documents remain unresolved; no plug, hidden assumption or synthetic sign-off. |
| P3: What outcome did accounting field evidence measure? | `src_1sbtyzp` records abstract-level field-study review, 277 accountants, 79 SMEs and over 200,000 transaction records, explicitly excluding a methods/raw-data review. `guide-independent-deployment-evidence` and `collection-empirical-accounting-limits` preserve transfer limits. | Reconcile publication/working-paper versions, inspect lawful methods/appendices, and deepen the existing ID. Screen a purposeful 4–6 comparison set, retaining rejection reasons and vendor versus independent classifications. Add a qualified evidence matrix without pooling unlike outcomes. | Every numerical result has version, table/page/section, population and unit; missing reviewer/rework/quality denominators stay missing. |
| P4: Which evaluation tests the required capability? | `src_0qwi4ry` is FinBalance with abstract-level scope. `src_0tiejpk` is the Mercor APEX post; `src_apexaccounting_paper2026` separately records arXiv v2 metrics/limitations. Existing FinQA, TAT-QA, ConvFinQA and DocFinQA IDs avoid duplicate discovery records. | Inspect actual paper/card/files/grader/license for FinBalance, APEX and a justified 2–4 contrast set. Keep vendor post and paper as distinct sources. Link capability overlaps to P2 without treating final-total accuracy as supported entries or authorized actions. | Capability selector exposes public/private split, grading, intermediate checks, exceptions, rights and reproducibility limits. |
| P5: What control requirement follows from a documented failure? | `src_06qnpc3` concerns AI-washing; it is not a six-case accounting failure set. Existing `src_0vf7hhg`, `collection-audit-evidence-assurance` and related workflows provide assurance context. | Add approximately six primary cases across at least four mechanisms, with orders/complaints/issuer disclosures and later disposition checks. Link separately labeled design lessons and synthetic P2 exception variants. | Facts, procedural posture, source locator and project inference remain distinguishable. No unsupported claim of AI causation or certain prevention. |
| P6: Who enforces the exact action boundary? | `ctrl-human-approval` requires exact payload approval; `ctrl-tool-authorization` describes least privilege. Journal, vendor-onboarding and payment workflows enumerate owners, authority, failure/recovery and human decisions. `src_06fwpim` is an emerging identity project lead. | Deepen journal, vendor/payment and reopening/post-approval dossiers, bind entity/amount/currency/destination/version/expiry, and separate documented system controls from proposals. Add defensive synthetic replay, stale approval, instruction-like invoice text and uncertain-response branches. | Every prohibited action identifies an enforcing mechanism or explicit unverified dependency. Prompt wording is not authorization. |
| P7: Can a reviewer find sufficient evidence and recognize a changed approval? | `tpl-reviewer-packet` supplies sections, while `example-assurance-evidence-packet` has fictional recorded/omitted items and control states with unresolved qualified-human review. | Deliver finished and deliberately inadequate packets for both P2 cases, using scoped assurance sources. Include evidence links, contradictory/unresolved items, synthetic decisions and post-approval changes; propose a bounded human measurement protocol. | Reviewer finds a material assertion's evidence and unresolved difference, detects invalidated approval, and sees no fabricated professional sign-off or efficiency result. |
| P8: Which changed fact limits a claim? | Existing construction and industry role counterexamples demonstrate fact-sensitive scope; current record references do not themselves establish broad support. | Add at least six scoped claim/counterexample pairs across P2, systems, evidence and authority, with fact/version/framework/entity changes and justified relationship owners/locators. Reuse existing source and example IDs. | Citation, explicit support, qualification, collection membership and reverse reference stay distinct in retrieval and the final graph/List. |
| P9: What may be inspected or reused for a stated purpose? | `guide-dataset-rights-chain`, TabFormer, BAF and FiFAR records preserve root-code versus archive notices and unresolved upstream NC-SA/NC-ND conflicts. `collection-financial-dataset-provenance` already groups these resources. | Screen 6–10 distinct assets including P4 resources and project fixtures. Inspect actual available content/notices and run bounded permissible local checks. Extend purpose-specific rights matrix; do not count duplicate profiles as additional assets. | Each recommended use has a versioned permission basis or named unresolved dependency. Access, quotation, redistribution, modification, evaluation, training and commercial use remain separate. |

## Initial retrieval observations

On 21 September, Ceramic's live tool schema exposed `query` and
`maxDescriptionLength`. The first Xero query returned mostly intermediaries and
was used only for discovery. Direct web reads of the Journals and Manual Journals
pages rendered only a JavaScript notice; search excerpts are not a substitute for
reviewing their full relevant documentation. The original Permissions FAQ was
read and identifies Reports access for both journal endpoints, alongside the
connecting user's role/Connected Apps conditions. This is a documentation
observation, not an authorized tenant test. Endpoint population, cohort and terms
claims still require their own current publisher material.

## Deferred and unresolved boundaries

No tenant credentials, live writes, paid source access, professional accounting
review, benchmark service, publisher outreach or private data are authorized by
this package. Unresolved external dependencies must identify the affected
question, attempted lawful route and exact evidence needed. They do not excuse
an unwritten mandatory package. Broader ERP/vendor or jurisdiction sweeps and
unrelated issues remain outside scope.

## Work in progress: first P1 source annotations

Four bounded official-source records have been drafted and checked against the
record schema: `src_xero_permissions_faq_2026`,
`src_xero_granular_scopes_2026`, `src_xero_platform_terms_20251204`, and
`src_xero_pricing_policy_2026`. Their evidence locators identify the actual HTML
sections reviewed. These are source annotations, not a finished system dossier.
Current mappings and edition preparation are intentionally still pending while
content is being developed. No new immutable edition or snapshot has been added.
The Journals/Manual Journals endpoint population, writes and recovery details
remain to be read from suitable original material; neither snippets nor inherited
annotations count as the new full review.

### QBO source review, 21 September 2026

Six bounded source annotations now cover official CDC guidance/reference, query pagination, company/entity/request identifiers, CloudEvents migration and modern reports migration. The official Intuit Developer Medium articles were read through the web reader; Exa page extraction supplied the actual query, CDC and basic-fields references where the basic reader returned a JavaScript shell. JournalEntry entity reference remains inaccessible in these readers. No tenant API operation was performed.

The annotations preserve two material changes: the updated CloudEvents deadline of 31 July 2026 despite older body dates, and the modern reports deadline of 31 August 2026 with changed null values, row ordering/hierarchy and daily summarization. They also preserve extraction limitations: excluded CDC entity types, bounded lookback and response caps, inactive lists, and request identity distinct from business document numbering. Example timestamp inconsistencies and undocumented retention/race behavior remain explicit. Source annotations are inputs to P1; the task-led dossier, fixtures and authorized-test protocol are still required.

### P2 evidence and case boundaries

Four original-publisher Stripe references were reviewed for balance populations, automatic payout reconciliation, refund states and disputes. They supply bounded source context, not observed API behavior or accounting recognition authority. Cases will use declared original amounts, document IDs, dates and journal assumptions. Reports expressed in major units must be distinguished from API smallest-unit amounts; fixture arithmetic uses integer minor units.

The purchase case connects a partial receipt, invoice, supplier credit, approval, instruction, bank settlement and remaining receipt across two periods. Failure branches remain alternatives. The processor case separates customer revenue, processor funds, fees, a pending then completed partial refund, payout and bank dates, and a later dispute decision. Neither a requested refund nor a payout notification establishes bank settlement. These case descriptions are preparation notes; the mandatory connected documents, replay, branches, extensions and completed reviewer packets remain unfinished.

### P2 baseline checkpoint

The original `example-connected-purchase-to-payment` and `example-connected-processor-settlement` baselines now contain document manifests, dated events, journals, account definitions, explicit assumptions, period balances and reconciliations. Four focused tests replay the entries with integer/BigInt arithmetic, independently reconcile purchase quantities/AP/bank and processor states, and reject missing evidence, duplicate journals and fractional-cent input. These checks establish only the stated synthetic arithmetic and links.

The purchase baseline finishes June with 90 units valued at 90,000 cents, cash of 110,000 cents and no AP/receipt liability. The processor baseline finishes June with 85,500 cents of cash after a partial refund, processing fees and one nonrefundable fictional dispute fee. Its recoverable disputed claim is an explicit case assumption, not a professional accounting conclusion. Refund requests and submitted payment instructions are visibly distinct from settlement.

Both records remain `draft-editorial-review-pending`. Required alternative branches, three extensions, the currency variant where supported, answer-first guides, completed stronger/inadequate review packets and final editorial review are outstanding. The new records do not complete P2 or P7 and have not been integrated into a finalized corpus edition.

### P2 alternative-branch checkpoint

Seven purchase alternatives now separately cover partial receipt, duplicate invoice, pending supplier credit, wrong entity, wrong period, uncertain payment and late invoice. Six processor alternatives cover delayed bank settlement, pending partial refund, duplicate delivery, an omitted settlement discovered in a later period, final dispute loss and unresolved claim valuation. The correction explicitly assumes the earlier books remain open and retains discovery and accounting dates. A lost dispute removes the assumed claim without charging cash twice. The unresolved claim cannot support unqualified review acceptance.

Six focused tests now pass. The purchase return timing was corrected during editorial review: accepted returned goods create a supplier credit receivable on 30 May; the 31 May credit note then clears that receivable against AP. This illustrates why a balanced trial balance alone is insufficient. All cases remain drafts; the three bounded extensions, source-supported currency branch, reader guides, stronger/inadequate packets and complete editorial integration remain outstanding.
