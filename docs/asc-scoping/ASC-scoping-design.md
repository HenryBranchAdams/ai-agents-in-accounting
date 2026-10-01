# ASC Scope Navigator
## Product and accounting design

Prepared September 22, 2026. This package is a design specification and structured starter interview, not a deployed application or a validated full-Codification ruleset. It includes no licensed ASC text. A complete current ASC inventory has not been retrieved or reconciled in this exercise. Candidate locators are research-routing hints until independently verified against the operative ASC version.

## 1. Product objective

Enable a preparer to describe a reporting entity, its reporting package, and its activities in plain language, then obtain a reproducible register of applicable ASC sections and narrower requirements. Show the facts, authoritative basis, exclusions, unresolved questions, elections, version choices, and review status behind every decision.

The product contract is: specified reporting perimeter + reporting periods + confirmed facts + valid elections + operative ASC version -> scoped requirements, justified exclusions, open issues, and a coverage reconciliation.

The scope of the initial product is FASB-based nongovernmental U.S. GAAP. Other bases of accounting route to another workflow. Location in the United States is not itself a reporting-framework conclusion. SEC reporting is a separate overlay and is not exhausted by the SEC material reproduced in the Codification. [FASB-ASC; FASB-ABOUT]

Do not market a short questionnaire as a guarantee that every fact has been discovered. A comprehensive release can promise that every unit in its verified corpus received an explicit disposition, conditional on the facts and reporting package. It cannot prove the absence of undisclosed arrangements.

## 2. What the system is and is not

It is an accounting applicability engine presented as an adaptive checklist. It is not a keyword search, a chatbot's opinion, or an industry-to-Topic lookup table. A retrieval model can find candidates but cannot establish that an unreturned section is irrelevant.

Scoping and accounting treatment remain separate. An applicable Topic does not prove a balance must be recorded; an estimated amount of zero does not establish that the Topic is out of scope. Recognition, measurement, presentation, disclosure, and transition can have distinct predicates. [ASU-2016-02; ASU-2016-13]

The first release should not calculate journal entries, make elections, assert auditor approval, produce an audit opinion, or claim SEC filing completeness. Those are separate products and permission boundaries.

## 3. User journey

### Screen A: Set up the assessment

Collect reporting entity names and stable IDs, relationships, package type, accounting framework, periods, issuance dates, reporting currency, relevant jurisdictions, preparer, and reviewer. Allow a single entity to start without building an elaborate organizational chart.

Create separate classifications for PBE status, SEC registrant status, other relevant public/nonpublic definitions, not-for-profit status, plan status, and specialized industry eligibility. The PBE interview must test the applicable Master Glossary criteria instead of asking only whether shares are listed. [ASU-2013-12]

Ask for reporting-purpose changes, including an offering, acquisition reporting package, carve-out, or new external user requirement. Store policy elections and adoption choices as records, not checkboxes without dates or approval.

### Screen B: Describe the business

Present plain-language activity groups with yes/no/unknown responses. Unknown is a supported workflow outcome. An unanswered question is not the same as an explicit unknown, even though both prevent a negative conclusion.

Use a left progress rail, a central interview surface, and an optional evidence/authority drawer. Do not make a graph the primary interview. A table is better for reviewing coverage; a graph can explain a selected dependency later.

Each question supports: examples; why it matters; affected candidates; evidence attachments; entity/population scope; owner; notes; and delegation to a colleague. Ask only the branches required by current facts, but retain a visible unexplained-activity screen and a persistent full coverage register.

For large groups, reuse shared facts with provenance and permit child-level overrides. Do not copy tax status, industry classification, or accounting elections across entities merely because they share an owner. Assess the consolidated package independently where the reporting basis changes the result.

### Screen C: Resolve technical branches

Collect transaction- or population-level details for triggered questions. A simple business need not answer the insurer branch, but the system must be able to explain why that branch was not activated.

Use approved decision rules for classifications. Ask for contractual or operational facts rather than forcing users to make conclusions such as 'Is this a VIE?' or 'Is the award equity-classified?' A specialist can record an approved judgment with evidence and rationale when a rule requires one.

### Screen D: Review results

Default tabs: In scope; Needs review; Not applicable; Elections and upcoming changes; Coverage. Provide a section-level list first, expandable to paragraph and subparagraph requirements. Use clear text labels and icons in addition to color.

The primary result row contains ASC locator, title, requirement category, entity or item, scope status, applicability version, brief reason, triggering facts, source validation, and reviewer. Detailed rationale and source access belong in the drawer, not in every row.

Support filtering by entity, accounting process, financial statement caption, industry, requirement type, owner, and open issue. Export a human-readable workpaper and machine-readable snapshot. Never hide a coverage gap in a 'not applicable' filter.

### Screen E: Roll forward

Clone the prior assessment but mark carried-forward facts unconfirmed until the designated owner reconfirms them. Ask about entity changes, financing, acquisitions, contracts, policies, source updates, and unusual activity. Produce an explanation of what changed and why, separately identifying new facts, new judgments, and new authoritative text.

## 4. ASC inventory and granularity

Import the full hierarchy from an authorized, versioned ASC source. Use the source's actual hierarchy and locators, including industry intersections, lettered paragraphs, and existing section codes. Do not fabricate sections by expanding a standard numeric template.

The engine's atomic unit is a requirement or related paragraph group with a shared predicate. The output aggregates these units into ASC sections, but never describes all paragraphs in a section as applicable when only some are.

Scope cannot be modeled from Section 15 alone. Binding definitions and restrictions embedded within recognition, measurement, disclosure, transition, and implementation guidance must also be represented. [FASB-ABOUT]

Tag source units as requirement, definition, illustration, background, relationship, transition, status, taxonomy reference, or SEC material. An implementation example can support a conclusion without making every example in the Subtopic a separate action item.

Maintain source locators, resolved aliases, effective versions, content hashes, publication status, license boundaries, and dependency edges. Historical references need a date-sensitive destination; do not automatically treat a retired reference as active or redirect it without recording the change.

For each unit, store one explicit coverage disposition: published reviewed rule; covered by a precisely identified inherited rule; human-review-only with a stated reason; nonoperative/reference content; historical/pending content; or missing implementation. Broad parent inheritance must enumerate the children covered and prove that no child restriction is lost.

## 5. Coverage architecture

The interface groups work by understandable business activities. The authoritative inventory, not those groups, defines the completeness denominator.

Required domain families:

- Reporting foundations, presentation, policies, estimates, corrections, going concern, subsequent events, risks, per-share and segment reporting, and special reporting packages.
- Cash and restrictions, receivables and credit losses, all investment classifications, transfers and servicing, inventory, deferred costs, property, intangibles, software, research, and digital assets.
- Payables, commitments, contingencies, guarantees, retirement and environmental obligations, exit costs, debt, interest, supplier finance, ownership interests, share-based awards, and complex instruments.
- Customer transactions, contract costs, noncustomer income, contributions, grants, collaborative arrangements, and mixed contracts.
- Acquisitions, joint-venture formation, consolidation, noncontrolling interests, related parties, foreign currency, fair value, nonmonetary exchanges, service concessions, reorganizations, and transition provisions.
- Every active specialized industry and reporting-entity branch in the imported corpus, with the necessary general guidance preserved.

Industry selection is a search accelerator, not an exclusion engine. Multiple industries may apply. The investment manager, a managed vehicle, an operating subsidiary, and the consolidated package require separate analyses. Investment-company eligibility is a technical classification rather than a name-matching exercise. [ASU-2013-08]

The starter bank covers common and specialist activity discovery. It intentionally does not assert that its list is the current complete Topic inventory. Unmatched corpus units remain visible and block a comprehensive product claim.

## 6. Facts and answer semantics

A fact record needs an ID, semantic definition, entity, reporting package, item/population, period, value, answer state, source, supplied-by identity, date, reviewer, and validity window. It also needs relationships to facts it supersedes.

For each negative answer, evaluate whether the population is complete and whether the negative concerns new activity, all activity, opening/closing balances, comparative disclosures, or surviving obligations. 'No transactions this year' is not sufficient to eliminate a prior-year balance or current disclosure.

Documents can contradict a user answer. Store the contradiction as a conflict and request review. Do not silently prioritize a model extraction over a human answer or a human answer over an executed agreement.

Distinguish applicability uncertainty, source verification status, and model extraction confidence. Never display '92% ASC applicable' as if scope were a probability calibrated by the standard.

## 7. Rule evaluation

Use deterministic evaluation over approved facts and approved judgments. The same facts, source version, rules, and engine must reproduce the same result. A language model may propose facts or draft explanations but cannot write production rules at runtime.

Suggested evaluation order:

1. Select the reporting framework and package perimeter.
2. Resolve the operative content version for each relevant requirement and period.
3. Evaluate entity, activity, item, and relationship inclusions.
4. Apply only the exceptions and precedence rules relevant to that same unit and version.
5. Apply section- or paragraph-specific restrictions.
6. Traverse typed dependencies and redirect excluded items to the appropriate alternate model.
7. Evaluate valid elections, recognition relief, and surviving disclosure or transition obligations.
8. Reconcile the result to the entire source inventory and present all unresolved or uncovered items.

There is no universal 'industry always wins' switch and no 'all cross-references are mandatory' switch. Encode the actual relationship: overrides-for-defined-unit, requires, defines, excludes, redirects, supplements, illustrates, or relates. Only binding dependencies change required scope; informational references belong in the supporting packet.

Use three-valued predicate logic with a separate conflict state. AND is false when a decisive false predicate exists; otherwise unknown survives. OR is true when a decisive true predicate exists; otherwise unknown survives. NOT unknown remains unknown. Exclude a candidate only after every inclusion path is conclusively closed or a controlling exception has been established.

A changed answer invalidates every downstream dependent conclusion. Recompute additions and removals, preserve the previous snapshot, and require renewed approval where the signed conclusion changed. Do not mutate a signed workpaper in place.

For circular references, separate authority relationships from evaluation dependencies and use a finite fixed-point process with conflict detection. If the result cannot be resolved uniquely under published rules, route to a reviewer rather than choosing by source order.

## 8. Decision dimensions

Keep these dimensions separate in storage and exports:

| Dimension | Values or meaning |
|---|---|
| Technical scope | In scope; excluded by a specific scope rule; unresolved; not assessed |
| Current relevance | Current application; continuing balance; comparative/historical disclosure; no identified activity; unresolved |
| Requirement category | Recognition; measurement; presentation; disclosure; derecognition; transition; required evaluation; reference |
| Temporal version | Operative; issued/pending not adopted; historical; superseded; unresolved |
| Election | Required model; eligible not elected; elected and valid; ineligible; not assessed |
| Review | Draft; evidence needed; judgment needed; technically reviewed; approved |
| Materiality | Not assessed; material; documented immaterial disposition; unresolved |
| Source coverage | Verified rule; verified inheritance; human-only rule; reference; unimplemented; stale source |

An exclusion from a measurement provision cannot automatically remove disclosure obligations. A recognition exemption is not a whole-Topic scope exemption. Immateriality is a documented disposition after applicability, not a convenient substitute for answering scope questions.

## 9. Illustrative branch contracts

These examples define expected design behavior and source anchors; they are not complete executable rules. Reconcile all anchors to current ASC content before publication.

### Leases

Start with plain facts about payments for use of assets, including service arrangements. Identify the relevant item and party role, resolve whether it contains a lease, and test applicable exclusions. For an ordinary confirmed lessee arrangement, the result packet may include ASC 842-10-15 and applicable portions of 842-20-25, -30, -35, -45, and -50. Add other Subtopics only for actual roles or events.

A qualifying short-term lease policy changes recognition under 842-20-25-2; it does not delete the entire Topic. Keep the separate disclosure analysis, including 842-20-50-8. [ASU-2016-02]

### Credit losses

Receivable classification and measurement basis come before credit-loss routing. Scope examples include ASC 326-20-15-2 and its exceptions. The rule must distinguish a disclosure-specific exception such as 326-20-50-9 from the Subtopic's overall applicability. [ASU-2016-13]

A separate adopted-version branch should address the current-receivables measurement relief and entity-dependent election introduced by ASU 2025-05. Availability, election, and required disclosures are distinct records. [ASU-2025-05]

### Going concern

For the appropriate FASB reporting basis, an absence of distress does not remove management's recurring evaluation from the assessment. Record an evaluation conclusion separately from the conditional disclosure result. Useful anchors are 205-40-15-1 and 205-40-50-1. [ASU-2014-15]

### Software and digital assets

Software prompts must identify the arrangement and use before routing; adoption history can change the applicable internal-use software model. [ASU-2025-06]

Digital-asset prompts must ask about the asset's characteristics and rights rather than sending every token to one model. The crypto-asset Subtopic has specific eligibility criteria. [ASU-2023-08]

## 10. Effective-date design

Use a temporal resolver, not 'latest document wins.' A record includes publication date, effective condition, eligible entity definition, annual/interim differences, fiscal-year start, transition method, early-adoption permission, adoption election, comparative treatment, and any sunset or surviving legacy provisions.

A publication date is not an effective date. A fiscal year ending after a cutoff is not the same as a fiscal year beginning after it. Even a Topic's title can have current and pending variants.

Two versioning test cases from reviewed official amendments:

- ASU 2026-02 introduces environmental-credit guidance in Topic 818. Required adoption differs between PBEs and other entities, and early adoption must be evaluated separately. [ASU-2026-02]
- ASU 2025-10 changes Topic 832's grants model. The previous disclosure content cannot simply disappear for a reporting period in which the new model has not been adopted. [ASU-2025-10]

Also version consequential amendments in linked Topics. When two ASUs amend the same paragraph with different adoption dates, preserve the dependency and sequence; do not assume one global new/old toggle is sufficient.

Proposed standards and board decisions must never be treated as adopted authoritative requirements. Put them in a separate watchlist only if the product supports it.

## 11. Output workpaper

The cover identifies reporting perimeter, periods, basis, source snapshot, rule release, unresolved count, uncovered count, preparer, reviewer, and assessment date. Display a meaningful status such as 'Preliminary: unresolved scope judgments' or 'Approved within the stated coverage and facts.' Avoid an unconditional 'GAAP compliant' label.

For each result, retain: requirement ID; ASC section and paragraph anchors; title; entity/item/population; user facts; derived facts; selected source version; triggered rules; included/excluded alternatives; exception rationale; election; evidence links; review owner; and change history.

Export five coordinated views: applicable requirements; exclusions with reasons; unresolved questions and evidence requests; elections and pending standards; and complete coverage reconciliation. The machine-readable export also includes fact snapshot IDs, rule versions, engine build, and content hashes.

Not every relevant paragraph creates a to-do. Distinguish a source-reading packet from a task checklist. A complete scoping report is not automatically a complete disclosure checklist or a completed accounting implementation.

## 12. Completeness and quality metrics

Report multiple denominators instead of one flattering completion percentage:

- Source inventory accounted for, measured against the imported authoritative snapshot.
- Operative requirement groups represented by reviewed rules or explicit human-review procedures.
- Rules passing inclusion, exclusion, unknown, interaction, and period-boundary tests.
- Entity assessment units resolved, unresolved, and blocked by content gaps.
- Fact coverage and population/evidence reconciliation.

A user can finish every visible question while the assessment remains incomplete. Completion of the interview is not completion of technical review. Missing rules must produce a visible block, not an excluded Topic.

The comprehensive-release gate is no unaccounted operative unit, no undisclosed unsupported branch, no missing required source link, no unresolved conflicting rule outcome, and independent accounting review of each published module. The assessment-level gate additionally requires necessary facts and judgments, an attested perimeter, and reviewer approval.

## 13. Technical design

Implement the ruleset as a separately versioned package, independent of the UI and language model. A React/TypeScript interface can consume stable assessment and question APIs. Keep UI components out of the accounting rule definitions. For an existing accounting corpus, add stable source-ID links rather than duplicating reference records or putting customer facts in the public research corpus.

Proposed persistent records: ReportingPackage, Entity, EntityRelationship, ReportingPeriod, FactDefinition, FactAssertion, Evidence, PolicyElection, Adoption, ASCUnit, SourceVersion, DefinitionBinding, ScopeRule, RuleDependency, Decision, Review, AssessmentSnapshot, and ChangeImpact.

Use a relational store for canonical records and explicit edge records for dependency traversal; a specialized graph database is not required by the design. Persist immutable approved snapshots and enforce transactionally consistent updates for facts and dependent decisions.

Proposed endpoints: create assessment; upsert scoped facts; retrieve next questions; evaluate; list determinations; explain a determination; assign an issue; approve a reviewed assessment; export; and roll forward. Scope tenant access and permissions on every endpoint.

Role boundaries: preparer supplies facts; subject-matter owner answers assigned questions; accounting reviewer approves judgments and exclusions; content administrator publishes rules. Source and rule releases are not editable by ordinary assessment users.

Never put contracts, tax data, cap tables, or source text in public build artifacts. Encrypt customer data, log access, isolate tenants, provide retention/deletion controls, and make any model-processing data use explicit.

## 14. Source and rights design

ASC is the authority layer. Official ASUs communicate amendments; their historical text is not a substitute for checking the consolidated Codification and the correct effective version. Secondary guides can be explanation sources but cannot silently determine a rule's authority status. [FASB-ASC; FASB-ASU-INDEX]

Keep source access behind an authorized adapter. Public code may hold locators, original questions, rule metadata, and permitted excerpts; licensed content stays within its permitted storage and usage boundary. Do not build commercial distribution on the assumption that individual website access permits bulk copying or redistribution. The reviewed FASB documents contain copyright restrictions. [ASU-2025-10]

A current-source badge requires the actual operative paragraph to have been checked. An official amendment source supports a design anchor, not a claim that every subsequent amendment was reconciled. Record verification dates honestly.

## 15. Model role

A language model may translate a business description into proposed activity tags, extract candidate facts, explain a cited approved decision, identify missing evidence, or draft a workpaper narrative. It should link every proposed fact to a document passage and ask for confirmation when the result matters.

A language model may not invent ASC citations, silently supply unknown facts, decide an election, publish a rule, declare comprehensive coverage from retrieved matches, or replace an approved source version with a newer snippet. Changes to model versions should not change deterministic results for an unchanged approved fact snapshot.

## 16. Testing and release gates

Test each published rule for true, false, unknown, conflict, exception, and boundary cases. Test interactions across relevant entity types, ordinary and specialized activities, annual/interim periods, and adoption histories.

The accompanying acceptance scenarios are proposed behavioral contracts, not a claim that an engine passed them. Build actual executable fixtures with accountant-reviewed expected ASC determinations. Include a negative-control population and independently authored challenge cases to avoid testing only the rule author's assumptions.

Mandatory properties include unknown-not-false, no negative conclusion from an incomplete population, correct retraction after answer changes, deterministic replay, local scope exceptions, no universal industry suppression, and visible unsupported coverage. Test every published reference for existence in the selected corpus release.

For the interface, test keyboard navigation, screen-reader labels, delegated questions, autosave failures, resume, mobile layouts, conflict handling, and exports. Do not use color alone or hide unknown responses behind advanced settings.

## 17. Implementation plan

### Phase 1: Authority inventory and contract

Establish authorized source access. Import and reconcile the complete hierarchy. Create the source, rule, fact, decision, and review schemas. Put every unit into the coverage register, including unimplemented ones. Approve the vocabulary for statuses and the rules for source claims.

### Phase 2: End-to-end vertical slice

Build the intake, fact store, deterministic evaluator, authority drawer, and exports around a small independently reviewed set of rules. Use reporting context, lease scoping, and receivable/credit-loss scoping to test entity, instrument, election, and disclosure distinctions. Label this release limited coverage.

### Phase 3: Broad general coverage and all industry branches

Author and review additional modules from the full inventory. Add cross-Topic interactions and tests. No branch earns a completed badge based only on the presence of an activity question. Maintain a public-facing supported-coverage description without exposing licensed text.

### Phase 4: Comprehensive release and maintenance

Reconcile the full corpus, pass external technical review, and validate large multi-entity cases. Implement staged update review and an impact report for existing assessments. Retain all older versions needed for approved workpapers.

A recurring standards-update check should detect new FASB publications and queue a review. It must not autonomously publish modified accounting rules or rewrite prior approvals. No recurring task has been scheduled as part of this design deliverable.

## 18. Definition of done

A production assessment can start from a blank entity profile, collect facts without requiring users to know ASC numbers, explain every included and excluded requirement, expose unknowns and coverage gaps, reproduce results from frozen inputs, and export a reviewable workpaper. Its advertised coverage matches a reconciled source snapshot. Human judgment and data-completeness boundaries remain visible.

A universal product does not ask every user every possible question. It ensures every part of the verified ASC universe is accounted for through a supported rule, a proved exclusion path, or an explicit unresolved issue.

## 19. Package contents and verification status

- `starter-question-bank.json`: original proposed questions with candidate routing hints. No executable scoping logic and no approved current-ASC rules.
- `starter-question-bank.md`: readable version of the same question bank.
- `rule-authoring.schema.json`: structural JSON Schema for rule records. Semantic accounting validation and production publication gates remain to be implemented.
- `acceptance-scenarios.json`: proposed expected behaviors for a future test suite, not executed accounting tests.
- `source-register.json`: official sources reviewed for this design, with their access and verification limits.

The package has been checked for valid JSON, unique question IDs, and internally consistent counts. This is data-format validation, not validation of accounting completeness or an operating product.

## Sources

### FASB-ASC
FASB Accounting Standards Codification

https://asc.fasb.org/

Use: Landing page/access point reviewed; a complete live paragraph corpus was not retrieved.

### FASB-ABOUT
About the Codification, February 2023, v5.11

https://asc.fasb.org/layoutComponents/getPdf?fileName=FASB_About_the_Codification.pdf&isSitesBucket=true

Use: Hierarchy, restricted scope, industry intersections, SEC boundary, and versioning design.

### FASB-ASU-INDEX
Accounting Standards Updates issued

https://www.fasb.org/standards/accounting-standard-updates

Use: Update discovery point, not a certified snapshot of every update.

### ASU-2013-12
Definition of a Public Business Entity

https://storage.fasb.org/ASU%202013-12.pdf

Use: Master Glossary classification design; production must reconcile subsequent amendments.

### ASU-2014-09
Revenue from Contracts with Customers, Section A

https://storage.fasb.org/ASU%202014-09_Section%20A.pdf

Use: Revenue module and section locators; not a current consolidated ASC source.

### ASU-2016-02
Leases, Section A

https://storage.fasb.org/ASU%202016-02_Section%20A.pdf

Use: Lease sample, scope/election distinction; not a current consolidated ASC source.

### ASU-2016-13
Financial Instruments—Credit Losses

https://storage.fasb.org/ASU%202016-13.pdf

Use: Credit-loss scope and disclosure-scope example; not a current consolidated ASC source.

### ASU-2014-15
Going Concern

https://storage.fasb.org/ASU%202014-15.pdf

Use: Recurring evaluation versus conditionally required disclosure.

### ASU-2013-08
Investment Companies

https://storage.fasb.org/ASU%202013-08.pdf

Use: Specialized entity classification branch.

### ASU-2023-08
Crypto Assets

https://storage.fasb.org/ASU%202023-08.pdf

Use: Asset-characteristic screening, not blanket crypto scope.

### ASU-2025-05
Measurement of Credit Losses for Accounts Receivable and Contract Assets

https://storage.fasb.org/ASU%202025-05.pdf

Use: Measurement expedient and separate entity-dependent election.

### ASU-2025-06
Targeted Improvements to the Accounting for Internal-Use Software

https://storage.fasb.org/ASU%202025-06.pdf

Use: Software module requires adoption-version branching.

### ASU-2025-10
Accounting for Government Grants Received by Business Entities

https://asc.fasb.org/layoutComponents/getPdf?fileName=ASU_2025_10.pdf&isSitesBucket=true

Use: Current versus pending grants content and transition.

### ASU-2026-02
Environmental Credits and Environmental Credit Obligations

https://storage.fasb.org/ASU%202026-02.pdf

Use: New Topic 818, dependency changes, and adoption-version design.
