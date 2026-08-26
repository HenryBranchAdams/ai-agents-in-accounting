# Goal: Complete the Accounting Agents field guide

## Objective

Turn Accounting Agents from a first-deployment primer into a complete public field guide for designing, governing, evaluating, and operating AI agents across the accounting lifecycle.

The finished site must let an accountant, controller, auditor, implementation lead, or software agent answer five questions for any covered workflow:

1. What accounting objective is being pursued?
2. What may the agent read, prepare, recommend, or execute?
3. What evidence, deterministic checks, and controls are required?
4. Which decisions and actions require an attributable person?
5. What record must remain after the work is complete?

Full scope means complete subject coverage. It does not mean that every action should be autonomous. Final approval, legal certification, fiduciary authority, and other non-delegable responsibilities must remain clearly assigned to accountable people.

## User-visible outcome

Replace the overview's current “Excluded from the first deployment boundary” treatment with a section titled **Coverage and execution boundary**.

The new section must explain:

- The guide maps a broad core of the accounting lifecycle, including posting, payments, filings, master-data changes, deletion, close operations, control assessment, and certification; `/coverage` publishes the versioned boundaries and gaps.
- Coverage does not imply permission.
- Each workflow is assigned an authority level based on reversibility, materiality, external effect, segregation of duties, and legal accountability.
- Sensitive actions remain behind deterministic authorization and attributable human approval.
- Some responsibilities, including final approval and ICFR certification, are human responsibilities even when an agent prepares the supporting work.

## Information architecture

Preserve the current professional, minimal documentation design. Expand the guide into five compact navigation groups.

### Learn

- Overview
- Agent fundamentals
- Accounting lifecycle
- Authority levels

### Workflows

- Record to report
- Procure to pay
- Order to cash
- Treasury and cash
- Assets and inventory
- Tax and regulatory reporting
- Audit and ICFR
- Technical accounting and policy

### Govern

- Controls and authority
- Sensitive actions
- Evidence and assurance
- Security, identity, and segregation of duties

### Implement

- System architecture
- Evaluation and testing
- Pilot checklist
- Production operations and incident response

### Reference

- Templates and checklists
- Glossary
- Source library
- Agent access

## Canonical authority model

Use one authority model everywhere in the site, API, and downloadable context.

| Level | Agent role | Execution rule |
|---|---|---|
| A0 | Explain | May explain concepts using approved sources. No work-product effect. |
| A1 | Prepare | May organize evidence, calculate, classify, and draft. A person performs the action. |
| A2 | Recommend | May propose a conclusion or action with linked evidence. A named person decides. |
| A3 | Execute after approval | May perform a specific, pre-approved action through a constrained tool. Approval is attributable and recorded before execution. |
| A4 | Execute within policy | May perform low-risk, reversible actions inside deterministic limits with monitoring and exception routing. |
| Human-only | Decide, attest, or certify | The agent may prepare support, but may not assume the accountable person's authority. |

An LLM prompt must never be the enforcement boundary. Permissions, thresholds, approval state, separation of duties, and prohibited actions must be enforced outside the model.

## Workflow coverage

Create canonical workflow records for the following areas. Closely related activities may share a page, but every named workflow must be independently findable through site search and the machine-readable taxonomy.

### Record to report

- Journal-entry preparation and posting
- Accruals, reversals, and cutoff
- Balance-sheet reconciliations
- Bank reconciliations
- Intercompany matching and settlement
- Consolidation and eliminations
- Close orchestration and status monitoring
- Flux and variance analysis
- Financial-statement tie-out
- Disclosure preparation and review

### Procure to pay

- Vendor onboarding and vendor-master changes
- Invoice intake, coding, and duplicate detection
- Purchase-order and three-way matching
- Accounts-payable exception handling
- Expense-report review
- Payment proposal preparation
- Payment release and fraud controls
- Unrecorded-liability and cutoff procedures

### Order to cash

- Customer and contract intake
- Billing preparation and validation
- Revenue-recognition research and schedules
- Cash application
- Accounts-receivable aging and collections support
- Credit memos, refunds, and write-offs
- Expected-credit-loss support

### Treasury and cash

- Daily cash-position reporting
- Cash forecasting
- Liquidity and covenant monitoring
- Bank-account and signatory administration
- Payment initiation and release
- Debt and investment accounting support
- Foreign-exchange exposure and remeasurement support

### Assets and inventory

- Fixed-asset additions, depreciation, transfers, and disposals
- Lease abstraction and lease-accounting schedules
- Inventory movement, count, and reconciliation
- Inventory valuation and obsolescence
- Cost-of-goods-sold analysis
- Impairment indicators and valuation support

### Tax and regulatory reporting

- Income-tax provision support
- Indirect-tax determination and reconciliation
- Tax-return and information-return preparation
- Filing-package review and submission controls
- Statutory and regulatory reporting
- Jurisdiction, effective-date, and retention checks

### Audit and ICFR

- PBC request coordination
- Population completeness and evidence packaging
- Walkthrough preparation
- Control-performance support
- Control testing
- Deficiency analysis and remediation tracking
- Audit-evidence evaluation
- Management review controls
- Subcertification and ICFR certification support

### Technical accounting and policy

- Fact-pattern intake
- Authoritative research
- Technical-accounting memoranda
- Accounting-policy drafting and maintenance
- Estimates and valuation support
- New-standard and regulatory-change monitoring
- Disclosure checklists

## Required workflow schema

Every workflow must be authored from one canonical structured record with these fields:

- Stable workflow ID and version
- Process family and accounting objective
- Accountable owner and reviewer
- Trigger, scope, entity, period, and jurisdiction
- Required inputs and source control totals
- Authoritative and supporting sources
- Agent procedures
- Deterministic calculations and validation checks
- Approved read tools and write tools
- Authority level for each action
- Materiality and exception thresholds
- Required human decisions and approvals
- Segregation-of-duties requirements
- Stop conditions
- Expected outputs and proposed accounting effects
- Run-record and workpaper requirements
- Retention and reproducibility requirements
- Common failure modes and recovery actions
- Pilot measures and production monitoring signals
- Last-reviewed date and provenance

Generate the human page, Markdown representation, API record, search entry, and context-bundle section from this canonical record wherever practical. Do not maintain conflicting copies of the same workflow content.

## Sensitive-action coverage

Create a dedicated sensitive-actions page and machine-readable records for:

- Journal posting
- Cash movement and payment release
- External filings and submissions
- Deletion and destructive changes
- Vendor, customer, bank, and other master-data changes
- Write-offs, refunds, and credit decisions
- Final approval
- ICFR and other legal certification
- Unsupervised close activity
- Communications or representations made in the company's name

For each action, show:

- What the agent may prepare
- What the agent may execute, if anything
- The required authority level
- Identity and separation-of-duties checks
- Materiality or transaction limits
- Approval timing and evidence
- Pre-execution validation
- Idempotency, rollback, or compensating procedures
- Logging, reconciliation, and post-action review
- Conditions that make the action human-only

## Governance coverage

Expand the current control guidance to cover:

- Control objectives and risk statements
- Input completeness and source authenticity
- Model and prompt changes
- Tool authorization and least privilege
- Human approval design
- Segregation of duties
- Deterministic recalculation and tie-outs
- Exception routing and override monitoring
- Configuration and version evidence
- Third-party and vendor risk
- Data classification, privacy, and retention
- Evaluation before release
- Production monitoring
- Incident containment, rollback, and evidence preservation
- Control-performance assessment and deficiency evaluation

Keep control performance separate from management's or the auditor's final assessment.

## Templates and practical artifacts

Publish reusable, printable templates for:

- Workflow specification
- Authority matrix
- Source register
- Agent run record
- Workpaper and reviewer packet
- Proposed journal entry
- Exception log
- Evaluation plan
- Pilot scorecard
- Production change record
- Incident report
- Control design and walkthrough
- Control test
- Technical-accounting memo

Templates must be useful without signing in and available as clean HTML and Markdown.

## Machine-readable completion

Extend the existing machine interface without adding a framework-specific dependency.

Add or expand:

- `/api/v1/workflows`
- `/api/v1/workflows/{id}`
- `/api/v1/authority-levels`
- `/api/v1/sensitive-actions`
- `/api/v1/controls`
- `/api/v1/templates`
- `/api/v1/glossary`
- Markdown representations for all canonical records
- A versioned full-corpus JSON snapshot
- The OpenAPI description
- `/.well-known/api-catalog`
- `/llms.txt`
- `/agent-context.md`
- The downloadable context bundle

Keep stable IDs, explicit schema and catalog versions, provenance, review dates, rights notes, cursor pagination, CORS, ETag and Last-Modified validators, standard problem responses, and human documentation.

Do not add MCP unless it introduces a tested capability that ordinary HTTPS and OpenAPI cannot provide.

## Research and editorial standard

- Prefer primary rules, standards, regulator material, specifications, and first-party technical documentation.
- Distinguish binding requirements, official guidance, technical references, empirical evidence, and practice examples.
- Tie consequential claims to a source.
- State jurisdiction, scope, effective date, access limits, and uncertainty.
- Do not reproduce paid standards or imply a reuse license that has not been granted.
- Treat vendor examples as first-party claims, not neutral proof.
- Use direct, professional prose. Remove generic introductions, inflated claims, repeated conclusions, decorative metaphors, and unsupported predictions.
- Preserve the existing minimal docs presentation. Do not introduce stock imagery, gradients, oversized marketing sections, card sprawl, or chat-first navigation.

## Accessibility and interface standard

- Meet WCAG 2.2 AA for the authored interface.
- Preserve semantic landmarks and heading order.
- Support keyboard navigation, visible focus, reduced motion, zoom, and narrow screens.
- Keep core content server-rendered and readable without client-side interaction.
- Give every interactive control an accessible name and clear state.
- Maintain ordinary URLs and links so browsers, crawlers, and agents can navigate the corpus.
- Keep HTML, Markdown, JSON, and search results semantically aligned.

## Definition of done

The goal is complete when:

1. Every process family and named workflow above is represented in the human guide and machine taxonomy.
2. Every workflow satisfies the required workflow schema or explicitly marks a field as not applicable with a reason.
3. Every sensitive action has a documented authority boundary, control pattern, evidence requirement, and recovery path.
4. The overview no longer suggests that sensitive subjects are outside the guide; it distinguishes coverage from permission.
5. Final approval, legal attestation, and ICFR certification remain clearly human-owned.
6. Navigation, search, glossary, templates, cross-links, and page sequencing make the expanded corpus usable as a wiki.
7. HTML, Markdown, JSON, context downloads, OpenAPI, and API-catalog discovery describe the same canonical corpus.
8. Every material page identifies its review date and source basis.
9. Internal links resolve, generated records have unique stable IDs, and the public snapshots contain the complete corpus.
10. Lint, production build, endpoint tests, schema validation, accessibility checks, and content-integrity tests pass.
11. No placeholder copy, duplicate sections, dead navigation, or unsupported product claims remain.
12. The completed version is deployed publicly and its primary human and machine endpoints are verified.

## Execution sequence

1. Define the canonical content schemas and expanded taxonomy.
2. Replace the overview scope language and add the lifecycle and authority-model foundations.
3. Author workflow families and sensitive-action records from the schemas.
4. Add governance, production-operations, glossary, and template content.
5. Generate or connect human pages, Markdown, API records, snapshots, search, and discovery metadata.
6. Run source, content, accessibility, schema, endpoint, and build validation.
7. Publish one coherent checkpoint after the full corpus is internally consistent.

## Decision rule

Default to the safest implementation that preserves practical usefulness. If an unresolved choice would change who holds authority, permit an irreversible action, assert a legal obligation, or expand beyond public educational content, stop and request direction. Otherwise, complete the goal without deferring ordinary editorial, information-architecture, or implementation decisions.
