# Issue 173: bounded catalogue depth

Status: all nine bounded packages have canonical material and reading paths in
research edition2026-09-22.1. Hosted CI/browser checks, final171/175 integration,
maintainer acceptance and publication remain pending. Read
[the current validation register](issue-173-validation.md) for the exact evidence
and unresolved dependencies. The dated entries below preserve the work history;
earlier pending-work notes are not the current completion state.

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

### P2 bounded-extension draft

The purchase case now links three inspectable extensions. Its late-invoice branch includes date-specific known and unknown evidence and shows the receipt liability moving to AP without a second inventory charge. The intercompany extension reuses the existing P/S SERVICE-1 journals, resolves an omitted subsidiary accrual before consolidation, and retains external pool cost. The construction extension reuses the existing estimate-only J01 alternative and binds a fictional approval to serialized inputs; a later estimate change requires a new decision. Historical source limitations remain inherited and explicit, with no claim of newly reviewed standards or real sign-off.

Seven focused tests pass, including source-record alignment, exact extension arithmetic and approval-input identity. The extensions remain draft editorial material. Reader guides, completed P7 packets, source-supported currency treatment, final review and canonical edition integration are still required.

### P7 packet and guide draft

Both connected cases now contain completed stronger synthetic packets and explicitly inadequate teaching comparisons. Assertion traces name actual document/journal IDs, period balances and reconciliation calculations. Unresolved professional judgments and contradictory settlement evidence remain visible. Fictional review decisions are labeled; no actual preparer/reviewer sign-off is invented. Baseline identity includes entity, period, account definitions, units, rounding, evidence and assumptions. Changes require affected review to be renewed, not just a new hash.

`guide-connected-close-review` provides direct reading paths and a proposed human protocol for preparation time, review time, rework, unnecessary escalation, missed exceptions and final quality. No participants or measurements are claimed. A bounded reading of PCAOB AS 1105 HTML on 21 September covered paragraphs .02, .05-.10A, .27 and .29; it is scoped to applicable audit work and used here as an evidence-design analogy, not a universal bookkeeping obligation. Empirical research links from P3, full editorial review, reader presentation and corpus integration remain pending. Eight focused arithmetic, lineage, packet-identity and schema tests pass.

### P2 currency variant

`B-CURRENCY-JPY-USD` supplies one independent, narrow currency variant: a fictional USD-functional-currency US seller presents JPY 10,000 and immediately converts to USD 67.00 at a stipulated exact rational rate; a fictional USD 2.00 fee leaves USD 65.00 for later bank settlement. It does not leave a foreign-currency balance, perform later remeasurement, or claim actual account eligibility, observed pricing or professionally approved measurement. Raw JPY amounts cannot be posted as USD cents.

Stripe's original currency documentation was read for presentment/settlement, minor units, zero-decimal currencies and special cases. `src_stripe_currency_units` records that bounded source context. Exact integer conversion and journal replay pass; nine focused tests now pass. This is source-supported denomination context plus original arithmetic, not an observed API or a general foreign-exchange accounting policy.

### P3 version/access reconciliation in progress

The publisher identifies Choi and Xie, *Human + AI in Accounting: Early Evidence from the Field*, Journal of Accounting Research 64(3), pages 1333–1373, DOI `10.1111/1475-679X.70052`, first published 16 April 2026. SSRN identifies the earlier 3 May 2025 working paper, abstract 5240924. They must not be silently treated as interchangeable versions.

The basic reader denied the Stanford pages and Wiley full-text route; Exa full-page fetch returned an internal tool error. ResearchGate's article page explicitly labels its full text as supplied by Wiley and exposes the published article, including its received/accepted dates and open-access notice. The title page and introduction were read there. Its PDF download link returned 404 in the current reader, and the journal supplement landing page was not yet readable. Methods, tables, appendix, working-paper differences and comparison studies have not yet been reviewed. No numerical outcome claims have been upgraded on this basis.

Recovery entry points: `https://onlinelibrary.wiley.com/doi/abs/10.1111/1475-679x.70052`, `https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5240924`, `https://www.researchgate.net/publication/403886266_Human_AI_in_Accounting_Early_Evidence_from_the_Field`, and `https://www.chicagobooth.edu/jar-online-supplements`. PDF skill read for methods/table inspection; no PDF layout review is yet claimed.

### September21 methods and P1 dossier progress

The earlier P3 access paragraph is historical. Selected published Choi methods,
Tables9-11, the primary journal supplement, data sheet and supplied experiment
code/log were subsequently read. The99-observation analytic sample follows an
accuracy restriction from102 loaded observations. Review time is categorized
self-report, not stopwatch time. No private inputs or independent execution were
obtained. Canonical profiles preserve exact locators, object hashes and unresolved
prior-version/preregistration limits. Ashraf, Fedyk and Blankespoor have scoped
primary methods profiles; six additional studies were screened with explicit
retain/defer decisions. The guide's earlier abstract-only wording was reconciled,
but full editorial, relationship and export integration remains pending.

The public Xero Gatsby page-data supplies the documentation content that basic
readers missed behind a JavaScript shell. `guide-xero-ledger-completeness` now
contains a task-led object/purpose table, access/change classifications,
checkpoint/reconciliation procedure, short-page counterexample and proposed
named-environment test protocol. Four canonical source annotations cover manual
journals, type/status codes, document history and tier-dependent rate limits.
The existing Journals source was rechecked, preserving its stable identity.
The ledger collection includes source fields omitted by single-journal reads;
some system-origin journals omit source IDs by design. Neither missing link nor
short response may be silently treated as a complete population.

This remains draft P1 work. QBO's full dossier, source-object specifics, webhook
and concurrency semantics, exact permission mapping, report equivalence and a
narrow existing ERP comparison remain to be completed or precisely bounded after
source investigation. No authenticated accounting-system request was performed.
Canonical schema validation reaches the expected stale draft coverage mappings;
no immutable edition has been finalized for these draft changes.

The QBO draft dossier is now canonical as `guide-qbo-ledger-completeness`. It
separates typed entity pagination, report parsing, CDC coverage, company-scoped
notification routing and uncertain writes. Its original44-day reconnection-gap
example shows why a30-day CDC response can omit an older modification. Both
system counterexamples pass local deterministic checks; they are explicitly
normalized synthetic fixtures, not captured vendor traffic. Current QBO entity,
permission,terms,webhook-delivery and write contracts remain research work, not
completed by marking them unknown.

### System contracts and action boundaries

Further original-source review replaces several draft unknowns with narrowly
documented contracts. Xero annotations now cover webhook categories/signatures,
24-hour failure disablement and up-to31-day replay retention, six-minute
idempotency-key expiry, cached errors, per-item batch failures under HTTP200,
invoice line-detail retrieval and differing invoice/bank/base currencies.
Contradictory retry/key-generation wording remains visible. QBO annotations cover
current CloudEvents versus stale best-practice wording, delivery acknowledgment
and retry behavior, stale-object SyncToken handling, OAuth lifecycle, the current
minor-version floor, and scoped October14,2025 developer terms. No tenant behavior
was observed. Role/feature maps,object-specific contracts,incorporated policies,
rate/pricing cohorts and the narrow ERP comparison remain work.

`guide-accounting-action-boundaries` drafts the five-action matrix and three
substantive dossiers: journal proposal/posting,vendor change/payment release,and
period reopening/post-approval modification. Each names a proposed external
permission boundary and states what the documented platform mechanism cannot
establish. Seven inspectable synthetic exception records are linked from both
P2/P7 cases without changing their baseline accounting payloads. All nine existing
case/packet/arithmetic tests still pass. These examples are not a production
executor or proof of operating effectiveness.

The February2026 NCCoE concept PDF was read at printed pages1-8 and its Figure1
visually inspected. The live project is still Reviewing Comments. Its status and
enterprise scope remain distinct from adopted requirements. Finalized-standards
comparison,control-record/editorial integration and independent policy-fixture
checks are still required before P6 acceptance.


### P6 finalized guidance comparison

Read NIST SP 800-53 Revision 5 final landing page and official OSCAL release 5.2.0 base statements/guidance for AC-3, AC-5, AC-6 and AU-3. Enriched existing stable source src_0pywo86 with versioned object digest and bounded locators, and a three-way comparison of final controls, the February 2026 NCCoE draft concept, and the original accounting proposal. No enhancements, assessment procedures, operating controls or compliance conclusion are claimed. External source text stays outside exports. Control-record integration, concrete approval fixture checks and final editorial acceptance remain pending.

Added an explicit fictional payment-approval payload tied to the purchase case packet and four source documents. Its hash uses a declared canonical preimage; actual human approval remains null. Two offline tests verify identity and mutation detection across every bound field, expiry, absent authority and ambiguous/consumed intent handling. Together with the nine connected-case checks, 11 tests pass. This is an inspectable design illustration, not an executor or bank/API test.


### P4 FinBalance bounded primary assessment

Enriched existing src_0qwi4ry with paper v1 methods/grading/reproducibility review, rendered page 12 inspection, and pinned repository a1062b7b392eaf53311308c2f63cf748b68bb8cf. Read the actual scorer and data license; inspected a coverage record and counted 120 clean/23 contradiction records. Recorded date-exclusion, replay/invalid-account separation, independent contradiction-code and empty-output scores, provider-output exclusions, and asset-path/release-version limits. No benchmark code or model API was executed. APEX and contrasting evaluation profiles, selection guide, final rights matrix and editorial integration remain required.


### P4 APEX bounded primary assessment

Reviewed paper v1 methods, grading, limitations and worked example; pinned HF dev release bf5e8c99117b7ee763d79ad2c64563ac844d77d2 and counted10 tasks/89 criteria. Read World9 Task14 full rubric/reference answer and visually inspected its fictional one-page addendum. Recorded final-answer-only scoring, private160-task split, excluded human-in-loop skills, easier dev-world selection, separate repeated-run metrics, and explicit missing tool layer/optimized grader template. Public Archipelago generic verifier is not claimed equivalent. No benchmark or provider call executed. Contrast profiles, selection guide and integrated rights/relationship/editorial work remain pending.


### P4 FinQA contrast

Inspected publisher paper task/method/licensing sections, rendered Figure3 and pinned repository0f16e2867befa6840783e58be38c9efb9229d742. Read actual local evaluator and documented2022 leakage correction; counted883dev examples and inspected one schema/example. Recorded execution versus symbolic-program metrics and the local evaluator's supplied-prediction denominator, requiring independent population validation. Upstream report/data rights chain remains separate from MIT software license. No model/grader run or dataset redistribution. Document-extraction contrast and selection guide remain pending.


### P4 document-extraction contrast and selection guide

Added original CORD release profile and four-resource capability guide. CORD original README/license and HF metadata pinned; one preview schema row inspected, without asserting pinned Parquet identity. Primary paper browser check/403 is an unresolved methods dependency, not substituted with search snippets. Public1000-sample release and removed labels remain distinct from original collection. No fulltext or receipt assets enter exports. Selection guide links both connected cases and separates parsing, QA, ledger replay, source support and authorization. Final rights/relationship/editorial integration and broader P9 work remain pending.


### P5 first substantive entries

Read original settled SEC company orders for Mattel(33-11122) and Under Armour(33-10940), preserving the former's period-specific error and the latter's explicit no-GAAP-finding footnote. Added two source profiles and a draft casebook collection with precise locators, dispositions, limitations, separate proposed lessons and original unexecuted variants. No AI attribution, payment-status claim or finding about separate defendants/private litigation. P5 remains incomplete pending broader primary cases and final review.


### P5 supplier and estimate cases

Added Kraft Heinz corrected-order and Fluor company-order profiles, bringing the draft casebook to four entries. Read primary PDF text, distinguish Kraft transaction subsets and its limited bankruptcy admission, and separate Fluor cost estimates from unsupported recovery. Later fund evidence is dated and qualified: a forecast or distribution authorization does not prove investor payment. Local PDF access returned 403, so no downloaded-object digest is asserted. Original proposed lessons and unexecuted synthetic extensions remain distinct from settled findings. Two further cases and final editorial integration remain pending.


### P5 six-case draft

Added the KeyBanc company settlement and GAO-05-693R source-population/control observations. The company settlement is separate from allegations in an individual proceeding. GAO’s accessible primary report and recommendation follow-up distinguish a corrected revenue classification and unverified employee population from missing cash or proven fraud; later implementation is explicitly dated. Six cases now cover period errors, narrative omissions, supplier obligations/override, estimates, unsupported adjustments, and population verification. Final editorial, qualified relationship and combined retrieval/UI checks remain pending.


### P8 scoped claim/counterexample draft

Added seven substantive pairs covering receipt knowledge, consolidation role, contract/estimate changes, audit framework, payout mode, dispute timing and journal traversal. Each records required facts, changed fact, consequence, open questions and distinct publisher versus corpus locators. Explicit qualifies edges reuse the canonical format; citations do not become supports. Final brief freshness, retrieval fixtures and graph/List presentation remain pending.


### P9 bounded asset screen and local checks

Added an eight-candidate usable-assets collection with explicit access, quotation, redistribution, modification, evaluation, training and commercial dispositions. Reuses four P4 profiles and preserves TabFormer/BAF/FiFAR unresolved chains as exclusions. Project fixtures are the eighth candidate. No external files enter exports.

`python3 scripts/check-research-asset-samples.py ASSET_DIRECTORY` reads these previously downloaded files: `finbalance-release/data/coverage/records.jsonl`, `apex-release/data/dev.jsonl`, `finqa-release/dataset/dev.json`, `cord-first-row.json`. It executes no external scripts or network requests. Counts were143 FinBalance IDs,10 APEX tasks/89 criteria,883 FinQA IDs and11 CORD preview lines. The scope is structural; no model/grader/accounting reproduction is claimed. Eleven project fixture/replay/approval tests passed at source revision88da116. Receipts remain outside the repository. Final editorial and retrieval integration remain pending.


### P6 canonical controls and P1 organisation context

Five existing controls now carry concrete action-boundary procedures and evidence requirements linked to the P6 guide and both cases. Historical editorial reviews are preserved; the amended records are explicitly draft pending renewed review. No control execution or actual approval is claimed.

Read original Xero organisation/action and tracking-mapping payloads. Added source profiles and dossier rows separating tenant context, country/edition/currency/lock metadata, incomplete plan-plus-user capability lists, tracking dimensions and exact transaction approval. Intuit throttling support page rendered only a CSS error and the alternate API page only a loading shell; no third-party rate numbers were adopted. Remaining object contracts, narrow ERP comparison and final editorial integration remain pending.


### P1 narrow ERP comparison

Re-read existing Oracle26B journal-header index and25D collection paging/sort guidance, preserving their different edition scopes. Added one primary Stripe NetSuite deposit-workflow profile and the bounded comparison to both dossiers. Batch-child reads, generic pagination and connector settlement mapping remain distinct capabilities. No tenant, connector or banking operation occurred. Further dossier object/role/lock detail and final integration remain pending.


### P1 QBO report and request contracts

Recovered original Run reports and November2024 throttling notice through supported Exa fetch after web shells. Added report basis/filter/nesting/compliance-date and published production-limit profiles and dossier rows. JournalEntry, linked-transaction and authorization pages still returned loading/empty content through attempted routes; exact affected conclusions and needed evidence are recorded. No API request, load test or pricing entitlement was inferred.

### Integration with PR181 main

Merged main186b6b14cc43f0d68c650e877d77719a075d4a72 into the research branch after research98c58b7272791edfc8274ce58b26e5b91d37aec7. Three array insertion conflicts were resolved by stable record ID. No record was independently changed by both sides; every changed record from each side was compared against the resolved result and preserved exactly. Combined counts are904 sources,276 guides and38 collections. Historical release and snapshot paths match main without changes. Typecheck and all11 connected-case/approval tests passed. Record validation reaches the expected stale draft mapping boundary. This is source integration evidence, not final corpus edition, full CI, rendered compatibility, human acceptance or publication proof.

### Connected-close reading brief

Added an answer-first reading brief for the two connected cases, including a synthetic purchase-close table, responsibility boundaries, changed-approval exceptions, source qualifications and unresolved human/professional evidence. The brief declares its case, guide and primary-source dependencies; its current dependency hashes match the material reviewed. This is an agent editorial review of the stated presentation, not maintainer acceptance. Structural validation passes the record checks and stops at the expected stale draft coverage mapping. Final rendered, exported and browser checks remain pending.

### P1 attachment lineage

Read the original Intuit attachment tutorial and Xero attachment reference. Added two source profiles and dossier rows distinguishing metadata, typed parent linkage, file bytes, permissions and mutable or temporary URLs. Xero replacement behavior and QBO's absent reverse transaction link explain why a transaction list or saved URL is insufficient evidence. Authorized-test protocols now cover changed attachment bytes and inaccessible files; no API operations were run. Structural validation reaches the expected stale draft mapping boundary.

### P3 synthesis and current review reconciliation

Replaced the empirical guide's obsolete abstract-only description with a bounded four-profile synthesis and preserved the six-additional-record screening decisions. Current source summaries and review-ledger entries now point to the actual selected methods and supplementary material; previous source reviews remain in each record as historical evidence. Clarified Fedyk's coefficient as a probability difference equivalent to five percentage points, not a relative-percent effect. No unavailable methods, private-input replication, human acceptance or operating effectiveness is claimed. The new reading brief binds the reviewed profiles and proposed human-measurement protocol. Current editorial dependencies match; final rendering, retrieval and export acceptance remain pending.

### P4/P6/P8 readable synthesis

Added answer-first briefs for evaluation selection, action boundaries and claim/counterexample pairs. Original hypothetical tables remain separate from published findings and observed behavior. Reviewed the connected-close guide's affected links after the dependency check correctly flagged the revised limitation statements; renewed only those examined bindings. Detailed matrices, source pointers, exceptions and unresolved evidence remain in the canonical records. Structural record validation reaches the draft coverage boundary; final rendered and exported acceptance is pending.

### P1 reading layer

Added task-led Xero and QBO reading briefs over the detailed dossiers. Each presents its original incomplete-extraction counterexample, separates population/recovery/approval questions and retains named unresolved contract and runtime conditions. No endpoint test or tenant authority is implied. Structural validation reaches the expected draft coverage boundary; final combined browser and export checks remain pending.

### P5/P9 collection reading layer

Added readable synthesis to the failure casebook and usable-assets collection, preserving procedural posture, original proposed lessons, purpose-specific permissions and named exclusions. Historical source-review dates remain distinct from this editorial presentation review. Record validation reaches the draft coverage boundary. These additions do not finalize an edition or establish human, professional, rendered or deployment acceptance.

### Control editorial review and P1 scope closure

Reviewed the five action-boundary control extensions against their original objectives, exact-intent fixture, source distinctions and recovery limits. Added missing citations for shared NIST/NCCoE scope text. Preserved prior reviews separately and recorded a five-record current review batch; no historical ledger-wide date rewrite. Rechecked the two affected reading briefs before renewing their control bindings.

Read Xero's current scope-resource table and additive-consent sections, adding a scoped read-side map and source profile. Re-read the complete short bank-statement boundary page; its prior restriction is unchanged. Both dossiers now have a bounded dependency register naming the reviewed material, missing evidence, affected conclusion and resolution path. Actual app/cohort/tenant configuration, inaccessible Intuit object contracts and intended-use permission remain unresolved. These limits constrain the delivered dossier; they do not stand in for unwritten sections or observed tests. The Xero counterexample still follows the same empty-page cursor rule.
