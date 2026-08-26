# AI Agents in Accounting — proposed ticket graph

Source: the August 24, 2026 content audit and content roadmap. Overlapping recommendations are consolidated. Each ticket is intended to fit one fresh agent context and leave a demonstrable site increment.

## Recommended tracker setup

- Tracker: GitHub Issues in `HenryBranchAdams/ai-agents-in-accounting`
- Triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`
- Domain documentation: single-context (`CONTEXT.md` plus root `docs/adr/`)
- Apply `ready-for-agent` only when every listed blocker is closed and the issue has no assignee. Blocked tickets carry no readiness label; use `needs-triage` or `ready-for-human` when those states apply.

## A. Learning and editorial foundation

| # | Ticket | Blocked by | What it delivers |
|---:|---|---|---|
| 01 | Establish the educational content contract | None | Defines content modes, mode-specific quality gates, visible evidence classifications, release criteria, and educational success measures. |
| 02 | Publish the versioned coverage and gaps map | None | Shows deep, reference-only, source-only, planned, and out-of-scope coverage and qualifies lifecycle claims. |
| 03 | Publish the five-minute “Start here” orientation | 01 | Gives a nontechnical definition, comparisons, governing rule, evidence chain, concrete scenario, knowledge check, and next action. |
| 04 | Add five role-based learning paths | 03 | Creates deliberate routes for practitioners, transformation leaders, builders, risk/assurance teams, and researchers, each ending in a work product. |
| 05 | Publish “Agent systems for accountants” | 03 | Teaches models, tools, state, retrieval, permissions, evaluations, and failure modes using accounting examples and no coding prerequisite. |
| 06 | Publish “Accounting systems for agent builders” | 03 | Teaches assertions, materiality, cutoff, completeness, evidence, approvals, SoD, reversals, and auditability with no accounting prerequisite. |
| 07 | Reframe the homepage around accountable work | 02, 03, 04, 16 | Leads with the core thesis, the guided reconciliation case, role routes, a real scenario, and qualified corpus proof. |
| 08 | Turn Agent Fundamentals into a guided lesson | 03, 16 | Adds the running case, agent-versus-automation decision tree, myths, system dimensions, and knowledge check. |
| 09 | Turn Accounting Lifecycle into a practical process map | 02 | Adds dependencies, cross-process events, overlays, gaps, and a “where should I start?” matrix. |

## B. Governance and implementation foundations

| # | Ticket | Blocked by | What it delivers |
|---:|---|---|---|
| 10 | Publish the Accounting Agent Control Model | 01 | Defines Objective, Scope, Evidence, Procedure, Checks, Authority, Review, Action, and Record; includes two complete scenarios and a printable reference. |
| 11 | Publish the authority ladder and decision tree | 10 | Adds action-level classification, A3/A4 distinctions, mixed-level workflows, misclassifications, SoD comparisons, and sensitive-action examples. |
| 12 | Refactor governance pages around the Control Model | 10, 11 | Makes authority, controls, evidence, security, sensitive actions, evaluation, and operations apply one canonical model through journal-entry and payment cases. |
| 13 | Publish the reviewer’s field guide | 10 | Provides evidence challenge, completeness review, materiality and judgment checks, good/bad examples, a checklist, and calibration exercise. |
| 14 | Publish three accounting-agent reference architectures | 10, 11 | Documents read-only preparation, supervised durable workflow, and approval-gated execution with components, data flow, identity, evidence, policy, records, and evaluators. |
| 15 | Turn Production Operations into an incident how-to | 10, 12 | Adds severity tiers, incident examples, response branches, operating-review packet, recovery, and links from monitored signals to release tests. |

## C. Canonical end-to-end cases

| # | Ticket | Blocked by | What it delivers |
|---:|---|---|---|
| 16 | Publish the canonical bank-reconciliation tutorial | 10, 11, 13 | Complete synthetic evidence, missing-page stop, matches, adjustments, material wire, finished workpaper, reviewer packet, evaluation, and teaching notes. |
| 17 | Publish the canonical accrual and proposed-entry case | 10, 11, 13 | Teaches population completeness, cutoff, estimates, FX, reversals, nonresponse, reviewer challenge, true-up, and an unacceptable answer. |
| 18 | Publish the canonical technical-accounting memo case | 10, 11, 13 | Teaches approved facts, missing facts, authority hierarchy, applicability, alternatives, contrary support, reviewer questions, and a complete memo. |
| 19 | Publish the canonical ICFR control-review and test case | 10, 11, 13 | Separates performance from assessment, tests population completeness, contrasts documentation and operating exceptions, and supplies completed control artifacts. |
| 20 | Publish the adversarial vendor-bank-change and payment case | 10, 11, 13, 15 | Demonstrates malicious instructions, conflicts, sanctions, payload-bound approval, idempotency, acknowledgment, reconciliation, refusal, completion, and incident paths. |

## D. Practical workflow corpus

| # | Ticket | Blocked by | What it delivers |
|---:|---|---|---|
| 21 | Add the one-minute workflow brief contract and pilot | 01, 10 | Adds brief fields and presentation using one representative workflow, with equivalent human and machine surfaces. |
| 22 | Publish record-to-report workflow briefs | 21 | Adds workflow-specific outcome, fit, authority, owner, reviewer, check, failure, artifact, pilot suitability, and relationships for the family. |
| 23 | Publish procure-to-pay workflow briefs | 21 | Same complete brief coverage for procure-to-pay. |
| 24 | Publish order-to-cash workflow briefs | 21 | Same complete brief coverage for order-to-cash and revenue. |
| 25 | Publish treasury-and-cash workflow briefs | 21 | Same complete brief coverage for treasury and cash. |
| 26 | Publish payroll-and-benefits workflow briefs | 21 | Same complete brief coverage for payroll and benefits. |
| 27 | Publish assets, leases, inventory, and cost workflow briefs | 21 | Same complete brief coverage for long-lived assets, leases, inventory, and cost accounting. |
| 28 | Publish consolidation-and-reporting workflow briefs | 21 | Same complete brief coverage for consolidation and reporting. |
| 29 | Publish tax, audit, controls, policy, and planning workflow briefs | 21 | Coordinates separately reviewable increments for tax/regulatory, audit/ICFR, technical-accounting/policy, and unassigned planning workflows. |
| 30 | Deepen journal-entry preparation and posting | 17, 21 | Adds a distinct scenario, risks, checks, judgments, dependencies, framework variants, workpaper, evaluation cases, and claim-level support. |
| 31 | Deepen close orchestration | 21 | Adds workflow-specific state, dependencies, handoffs, late evidence, reopening, stop conditions, sample artifact, and evaluation cases. |
| 32 | Deepen flux and variance analysis | 21 | Adds population and baseline selection, driver decomposition, materiality, false narratives, reviewer challenge, artifact, and cases. |
| 33 | Deepen invoice intake and duplicate detection | 21 | Adds invoice evidence, duplicate logic, vendor/master risks, exception decisions, controls, artifact, and cases. |
| 34 | Deepen three-way match | 21 | Adds PO/receipt/invoice completeness, tolerances, split receipts, duplicate consumption, exceptions, artifact, and cases. |
| 35 | Deepen revenue recognition | 21 | Adds contract evidence, performance obligations, cutoff, modifications, variable consideration, judgments, workpaper, and cases. |
| 36 | Deepen PBC and audit-evidence workflows | 19, 21 | Adds request completeness, evidence provenance, version control, exceptions, assurance boundaries, reviewer packet, and cases. |
| 37 | Create the Accounting Agent Atlas | 02, 22–36 | Adds multi-facet exploration and answers pilot, authority, cash/filing, contract, proposed-entry, case, review-state, and coverage questions. |

## E. Usable template library

Each bundle publishes blank, minimum-viable, completed-case, and regulated-enterprise variants, plus editable and machine-readable forms where useful, instructions, reviewer guidance, a failure example, version, and review date.

| # | Ticket | Blocked by | What it delivers |
|---:|---|---|---|
| 38 | Publish workflow specification, authority matrix, and source-register variants | 16 | The core design-and-evidence template bundle, completed against a canonical case. |
| 39 | Publish run-record, reviewer-packet, and exception-log variants | 13, 16 | The core execution-and-review template bundle, completed against a canonical case. |
| 40 | Publish proposed-entry and evaluation-plan variants | 17 | Entry and evaluation artifacts with controlled examples and failure cases. |
| 41 | Publish control-design and control-test variants | 19 | Design, walkthrough, performance, testing, exception, and reviewer variants. |
| 42 | Publish change-record and incident-report variants | 15, 20 | Production change, incident, correction, and retention artifacts. |
| 43 | Publish pilot-scorecard variants | 55 | Blank through enterprise pilot scorecards tied to the selection playbook. |

## F. Evidence graph and reading room

| # | Ticket | Blocked by | What it delivers |
|---:|---|---|---|
| 44 | Add the source-relationship contract and pilot cohort | 01 | Introduces questions, claims, contrary claims, workflows, audience, difficulty, read time, importance, freshness, supersession, related sources, and evidence tiers on a representative cohort. |
| 45 | Backfill rule and official-guidance source relationships | 44 | Adds relationship and freshness metadata across authoritative sources while preserving provenance and jurisdiction. |
| 46 | Backfill research-paper and empirical-evidence relationships | 44 | Adds relationship, transfer-limit, contrary-evidence, difficulty, and freshness metadata across research sources. |
| 47 | Backfill technical, practice, vendor, and thought-piece relationships | 44 | Completes the remaining source types with visible commercial interests and evidence limitations. |
| 48 | Publish source–claim–workflow relationship views | 45–47 | Enables source-to-claim, claim-to-support/contrary evidence, workflow-to-basis, supersession, and “best source for this question” navigation. |
| 49 | Publish the 15–25 source core canon | 44 | Creates a sequenced course with contribution, evidence weight, importance, limitation, workflow relation, reading time, and learning outcome. |
| 50 | Synthesize evidence on accounting productivity | 46, 49 | Separates claims from interpretation, shows contrary evidence and transfer limits, states open questions, and links practical implications. |
| 51 | Synthesize evidence on failures of human review | 46, 49 | Same evidence-synthesis standard for overreliance, reviewer failure, and challenge design. |
| 52 | Synthesize evidence on tools, state, and long-horizon work | 46, 49 | Same evidence-synthesis standard for tool use, state, orchestration, and reliability. |
| 53 | Synthesize evidence on structured financial data | 46, 49 | Same evidence-synthesis standard for structured data and financial reasoning. |
| 54 | Synthesize consistent regulatory expectations | 45, 49 | Same evidence-synthesis standard for regulators, professional bodies, ICFR, audit, and governance expectations. |

## G. Decision-oriented playbooks

| # | Ticket | Blocked by | What it delivers |
|---:|---|---|---|
| 55 | Publish the first-pilot selection playbook | 02, 21 | A scored worksheet, do-not-pilot outcomes, three completed workflow examples, pilot charter, baseline, synthetic pretest, shadow plan, weekly review, and expansion decision. |
| 56 | Publish the authority-boundary design playbook | 11, 12 | A goal-led method for decomposing actions, assigning authority, binding approval, defining stops, and validating the boundary. |
| 57 | Publish the build-versus-buy guide | 14 | Vendor-neutral options, decision matrix, diligence questionnaire, verified-operation standard, provider/model change, exit, and total-cost analysis. |
| 58 | Publish the accepted-work business case | 16, 17 | Measures time, review, rework, errors, cost, incidents, and accepted items without unsupported headcount claims; includes two completed examples. |
| 59 | Publish the accounting-agent operating-model guide | 12, 15 | Compares embedded, central, CoE, federated, and managed models with explicit roles, decision rights, change, incident, and retirement ownership. |
| 60 | Publish the test-set design playbook | 10, 13 | Guides representative sampling, synthetic evidence, known answers, valid alternatives, hard gates, reviewer rubrics, and release decisions. |
| 61 | Publish the ICFR and audit readiness playbook | 13, 19, 39 | Shows how to assemble evidence, preserve boundaries, answer reviewer questions, and prepare an agent workflow for control or audit scrutiny. |
| 62 | Publish the human-factors field guide | 13, 51 | Converts evidence on automation bias, complacency, skill erosion, alert fatigue, anchoring, interface challenge, training, and requalification into practice. |

## H. LedgerBench learning surface

| # | Ticket | Blocked by | What it delivers |
|---:|---|---|---|
| 63 | Publish “Benchmarking accounting agents in ten minutes” | 16, 60 | Explains accepted work, deterministic/human evaluation, hard gates, conformance/capability, public/hidden cases, review effort, field utility, and limits through one episode. |
| 64 | Create a separate LedgerBench Lab route | 63 | Separates field-guide explanation from program constitution, task admission, statistical plans, hidden splits, governance, submissions, schemas, and conformance assets. |

## I. Cornerstone essays

| # | Ticket | Blocked by | What it delivers |
|---:|---|---|---|
| 65 | Publish “An accounting agent is not a model” | 10, 16 | One independently citable argument grounded in a case, workflows, controls, and sources. |
| 66 | Publish “Why agentic accounting is not RPA 2.0” | 10, 16 | Explains flexible investigation and tool choice, their value, and their new control problems. |
| 67 | Publish “Evidence before autonomy” | 10, 16 | Explains why retained, reviewable work must precede expanded authority. |
| 68 | Publish “The commit boundary” | 11, 20 | Explains preparation, approval, exact payload, execution, receipt, reconciliation, and correction. |
| 69 | Publish “The workpaper is the product” | 13, 16 | Explains why fluent output is not governed accounting work and what makes an artifact reviewer-ready. |
| 70 | Publish “The accounting agent as a subledger” | 10, 16 | Explains entry-ready edge records, reconciliation, review, and the boundary with the ERP. |
| 71 | Publish “Double-entry as an agent invariant” | 10, 17 | Explains how accounting structure constrains agent work and improves detection, reconciliation, and recovery. |
| 72 | Publish “Completed work should persist but not automatically carry forward” | 10, 15 | Explains temporal validity, supersession, retained work, and explicit reuse decisions. |
| 73 | Publish “Why the agent should not assess its own control” | 12, 19 | Explains the separation of performance, review, assessment, and assurance. |
| 74 | Publish “The economics of accepted work” | 58, 63 | Explains why speed must be evaluated after rework, reviewer effort, exceptions, risk, and correction. |

## J. Field observatory and coverage expansion

| # | Ticket | Blocked by | What it delivers |
|---:|---|---|---|
| 75 | Publish the real-world practice observatory | 44, 48 | Evidence-tiered deployment records with context, workflow, architecture, authority, claims, limitations, commercial interests, review dates, and non-inferences. |
| 76 | Add hire-to-retire and payroll-accounting coverage | 02, 21, 26 | Deepens the payroll briefs without creating a competing taxonomy, adding interfaces, master data, benefits, incentives, tax, reconciliation, authority, and evidence boundaries. |
| 77 | Add equity and stock-compensation coverage | 02, 21 | Covers grants, vesting, modifications, forfeitures, valuation inputs, tax effects, disclosures, controls, and evaluation. |
| 78 | Add M&A and legal-entity-event coverage | 02, 21 | Covers purchase accounting, opening balances, specialists, integration, carve-outs, discontinued operations, controls, and evidence. |
| 79 | Add sustainability and nonfinancial-reporting coverage | 02, 21 | Covers lineage, estimates, controls, disclosure, assurance, frameworks, and agent boundaries. |
| 80 | Add fund, nonprofit, governmental, and grant-accounting coverage | 02, 21 | Adds the four materially distinct domains through separately reviewable increments with explicit frameworks, restrictions, assertions, fiduciary duties, workflows, and limits. |
| 81 | Add priority industry overlays | 02, 37, 84 | Adds independently sequenced overlays for banking, insurance, healthcare, construction, SaaS, energy, manufacturing, and digital assets under the subject-matter review program. |
| 82 | Add public-accounting-firm workflow coverage | 02, 21 | Covers acceptance, independence, planning, tax, supervision, consultation, review, and client communication boundaries. |
| 83 | Add management-finance coverage or narrow project scope | 02 | Resolves the finance claim with FP&A, unit economics, management reporting, capital allocation, and decision support—or explicitly narrows scope. |

## K. Trust and program health

| # | Ticket | Blocked by | What it delivers |
|---:|---|---|---|
| 84 | Establish the subject-matter review program | 02 | Defines domain reviewer qualifications, named scope, conflicts, review evidence, re-review cadence, and visible review states. |
| 85 | Publish coverage, evidence, freshness, and review dashboards | 02, 45–48, 84 | Makes coverage depth, claim support, stale sources, overdue reviews, and subject-matter-review status explicit and versioned. |

## Dependency frontier

Tickets **01**, **10**, and **02** are complete through PRs #90, #92, and #93. Those foundations open six bounded agent increments in the [Foundation milestone](https://github.com/HenryBranchAdams/ai-agents-in-accounting/milestone/1): tickets **03**, **09**, **11**, **13**, **21**, and **44**, corresponding to GitHub issues #8, #12, #16, #14, #13, and #6.

The same milestone keeps tickets **84** and **83**, GitHub issues #17 and #20, visible as human-owned review and scope decisions. The other unique tickets remain an unlabeled dependency backlog rather than an active queue. The canonical cases remain intentionally early because they unlock the homepage, lessons, templates, playbooks, essays, and LedgerBench primer. GitHub remains authoritative for live state.

## Proposed publication result

- 85 GitHub issues, published in dependency order
- Only dependency-ready agent tickets labeled `ready-for-agent`; human decisions and unresolved splits use the matching triage state
- Each issue body includes a source reference, end-to-end outcome, acceptance criteria, validation expectations, and explicit blocker links
- No umbrella issue is required; the two supplied documents remain the source corpus
