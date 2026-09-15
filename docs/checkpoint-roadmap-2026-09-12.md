# Five-phase roadmap: local research handoff

Historical checkpoint: implementation and publication statements below describe this checkpoint date. For current interface requirements, read [the design system](design-system.md); see [release guidance](../RELEASES.md) for later changes.

Checkpoint: September 12, 2026. Workspace: `/Users/henryadams/Documents/ai-agents-in-accounting`; branch `main`; starting HEAD `84140fadf9be8c8f7abe6599e9fc8879c6dd5da8`. Work remains local and uncommitted. Existing work and stable record IDs were preserved. This assignment did not publish, push, change remote branches, contact outside parties, purchase access or operate an accounting system.

The local edition is **2026-09-11.2**. The last observed published edition remains **2026-09-11.1**; the earlier public baseline was verified during roadmap preparation. Public accessibility is not evidence that this new edition is deployed. Its outgoing 838-record snapshot is preserved under `data/releases/2026-09-11.1/`.

## What the five phases delivered

**1. Review the existing foundation.** All 715 inherited records have documented dispositions, split into 488 source reviews and 227 editorial reviews. The source access ledger records 239 substantive-excerpt checks, 199 abstract/landing checks and 50 unresolved attempts. Source dispositions are 417 supported-scope, 70 unresolved-access and one corrected-association; access level and disposition are different fields. Editorial dispositions are 133 corrected-association, 25 shared-relevance and 69 supported-scope. Original identities, URLs, historical provenance and record rights remain attached. Rights-chain research separates repository code licensing from dataset grants and identifies unresolved upstream permissions for TabFormer and FiFAR/BAF. Six independent axes distinguish applicability, accounting adequacy, source currency, professional review, empirical support and reuse rights.

**2. Establish repeatable depth.** All 62 accounting-question families now have two selected foundation questions: 124 named questions with canonical answers, source relationships, inputs, controls, scope and gaps. These selected questions do not exhaust a family. Construction adds four connected questions and three tax-transition questions. Its original synthetic reference includes 18 balanced journals across two periods, job-cost and estimate versions, WIP/revenue/billing bridges, AP/payroll, cash and balance-sheet reconciliation. Five branches address retainage, disputed modifications, uninstalled materials, loss contracts and reopened-job errors/estimates. Contractor, developer, owner, building, civil and specialty-trade distinctions remain visible in the profiles and exception reviews.

The construction tax guide distinguishes contract date from the statutory taxable-year transition and keeps apparent inconsistencies in Form 8697 instructions and Revenue Procedure 2026-32 visible. Current consolidated authority and professional interpretation remain dependencies; a source conflict is not silently resolved through a generic disclaimer.

**3. Test contrasting industries.** Four completed scoped research packages contain 23 named questions: manufacturing (5), wholesale/retail (6), software/subscriptions (6) and professional services (6). They distinguish conversion costs and outsourced production, inventory ownership and marketplace agency, provider versus customer software expenditure, and labor-based projects/staffing. Original worked material ties quantities/costs, inventory write-downs, hosting implementation amortization and revised project estimates to ledger consequences. Each package includes source locators, evidence populations, review controls, exceptions and remaining gaps. The authored research inputs record observed source/reuse work; no reliable elapsed researcher-hour series was captured, so no extrapolated schedule or cost estimate is claimed.

**4. Complete systematic US assessment.** There are 96 authored activity profiles, all 5,952 subsector/family screening cells and 1,012 individually recorded detailed-industry exception reviews. Profile facts and 62 reviewed family rules are composed reproducibly; this is not 5,952 independent literature reviews. Each leaf has its own classification basis, activity distinction and research outcome. Entity form, public/nonprofit status, framework, jurisdiction and business role remain separate. Insurers, lenders, federal entities and regulated operators require their actual role conditions; an industry code alone does not establish those roles. Exact leaves receive their own exception review and separately labeled parent context.

**5. Expand selected jurisdictions.** Four scoped packages deliver 19 questions: Texas construction/services (5), California construction/services (5), UK construction/services (5), and Canada framework selection/Ontario GST-HST (4). They address selected public payment, sales tax, certified payroll, reporting-basis transitions, VAT/reverse-charge and invoice-adjustment distinctions. This footprint was chosen for reuse of construction and service research; it is neither a 50-state survey nor worldwide coverage. Two limited relationships were verified: UK SIC 2007 41.10 to NACE Rev. 2 41.10, and Canada NAICS 2022 v1/US NAICS 2022 111110. Their editions, relationship types and non-equivalence limits are recorded. No complete crosswalk is claimed.

Across the phases, a five-question independent-evidence brief distinguishes customer-support and consulting studies, version-specific findings, an access-limited incident, enforcement and professional guidance. MBABench metadata were corrected to the actual source/version. Synthetic examples and non-accounting studies do not establish accounting-agent effectiveness.

## Counts and evidence outcomes

| Measure | Final local observation |
|---|---:|
| Canonical records / source references | 1,061 / 630 |
| Guides / workflows / collections / examples | 186 / 73 / 35 / 7 |
| Inherited dispositions | 715 of 715 |
| Question-mapped / unassigned records | 1,003 / 58 |
| Industry-specific / shared / unassigned records | 173 / 792 / 96 |
| Named questions | 178: 176 partial, 2 evidence gaps |
| Broader family questions retained open | 62 |
| Subsector profiles | 96 of 96 |
| Screening: applicable / conditional / excluded | 1,269 / 4,308 / 375 |
| Open applicable/conditional screening pairs | 5,577 |
| Leaves: justified shared / additional research / unresolved | 119 / 869 / 24 |
| Additional leaf-question entries | 616 |
| Whole families / subsectors / leaves sufficient | 0 / 0 / 0 |

Named questions, broader family questions, screening pairs and leaf questions overlap; do not add them or convert them into a knowledge-completeness percentage. A completed exception assessment can conclude that further research is needed. Classification evidence supports activity boundaries, not accounting treatment.

## Reading and retrieval

Start the local site with `npm start` after building; default address is `http://127.0.0.1:5177`.

- Construction: `/records/guide-construction-connected-close` → `/records/example-construction-contract-ledger` → cited publisher records; tax cohorts at `/records/guide-construction-tax-transitions`.
- Contrasting models: `/records/guide-manufacturing-conversion`, `/records/guide-wholesale-retail`, `/records/guide-software-subscriptions`, `/records/guide-professional-services`.
- Jurisdictions: `/records/guide-jurisdiction-tx-construction-service`, `/records/guide-jurisdiction-ca-construction-service`, `/records/guide-jurisdiction-uk-construction-service`, `/records/guide-jurisdiction-canada-ontario`.
- Evidence limits: `/records/guide-independent-deployment-evidence` and `/records/guide-dataset-rights-chain`.
- Assessment: `/coverage?industry=236&question=q-project-wip`; compare `/coverage?industry=524210&question=q-insurer` for a brokerage leaf and explicit parent context.

Agent examples (read-only API; same operations in CLI/MCP):

```text
/api/v1/agent/search?q=construction&kind=guide&naics=236&question_family=q-project-wip
/api/v1/agent/get?id=guide-construction-connected-close&section=data.research_questions&limit=20
/api/v1/agent/get?id=guide-software-subscriptions&section=data.worked_examples&limit=20
/api/v1/agent/get?id=src_asu201815
/api/v1/coverage?industry=236&question=q-project-wip
```

Use exact code/family filters to locate a directly associated guide, then follow its `source_ids` without imposing the guide's industry filter on shared accounting authorities. Read pagination/omission fields; one bounded packet may not contain every qualification. Citations, rights, review scope, versions and JSON Pointers remain attached. Retrieval schema is `1.2.0`; the research schema is `1.0.0`. Six research exports and both inherited-review ledgers accompany the existing corpus, passage and coverage downloads. All are built together with the source ZIP and SHA-256 manifest.

## Validation and acceptance

`npm run check` passed on September 12: **67 tests, 67 passed, zero failed**, including type checking, canonical validation, build, HTTP/API/CLI agreement, actual MCP stdio/HTTP exchanges, rights/source-pointer preservation, immutable history, scope boundaries, worked arithmetic and export integrity. The realistic retrieval suite now has **35 question fixtures**, including 11 new roadmap examples. `git diff --check` passed.

Browser review covered desktop 1280×900 and mobile 390×844. Combined search/NAICS/question filters returned the connected construction example, profile and guide; removing the question filter expanded results from three to six. Skip-to-content and Tab reached search, focus had a visible 3px outline, and Enter toggled evidence details. Construction coverage exposed five scoped named questions for the selected WIP family. An insurance-broker leaf retained its own exception and explicitly labeled insurer screening as parent context. Source citation navigation exposed publisher links, actual review levels and locators. The tested desktop/mobile pages had no document-level horizontal overflow. This was representative flow inspection, not a comprehensive accessibility audit or accounting review.

A separate bounded review exercised 11 narrow queries and eight guide-to-source traversals; a separate 12-case scope review found no material scope defects in its sample. Neither review reverified every accounting claim. Exact NAICS filtering intentionally omits shared sources until source traversal; that boundary is documented and tested.

The latest immutable coverage snapshot is `2026-09-12.2`. Final build verification checks all 27 download hashes and every source-ZIP entry against the local files, including authored research, ledgers, schemas, tests and this handoff. Earlier local snapshots remain intact. The machine-readable acceptance record is [roadmap-validation-2026-09-12.json](roadmap-validation-2026-09-12.json).

No software check establishes accounting correctness, rights clearance, professional sign-off or deployment performance.

## Remaining dependencies

- Public access limits: 50 unresolved inherited-source attempts and 199 abstract/landing-only checks. Some authoritative conclusions still require current consolidated or permitted full-text access.
- Rights: TabFormer dataset permission and FiFAR/BAF upstream license conflicts remain unresolved. No purchase or outside permission request was made.
- Accounting: all named answers are bounded; broader family questions, 5,577 screening pairs and 616 leaf-question entries retain open evidence work. Industry classification alone cannot close these.
- Consequential interpretation: construction tax conflicts, framework eligibility, adoption/effective periods and contract-specific judgments need the recorded additional authority/fact checks. No specialist review occurred.
- Empirical evidence: no private operational ledger, real accounting-system replay or independent production evaluation was performed. Worked examples are original synthetic material.
- Delivery: hosted CI and actual scheduled refresh execution are unverified for this local edition. The weekly workflow is configured to rotate 40 URL checks; local tests establish rotation mechanics only. Publication remains separately authorized.

The [updated roadmap](roadmap.md) prioritizes these remaining evidence needs while retaining the original baseline as history.
