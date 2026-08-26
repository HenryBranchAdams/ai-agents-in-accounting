import { processFamilies, workflowById, workflowRecords } from "./workflows-data";

export const coverageMapId = "accounting-agents-coverage-map";
export const coverageMapVersion = "2026-08-25.1";
export const coverageMapPreparedAt = "2026-08-25";

export type CoverageStateId = "deep" | "canonical-reference" | "source-library-only" | "planned" | "out-of-scope";

export const coverageStates = [
  { id: "deep", label: "Deep", definition: "A completed, workflow-specific treatment with a complete scenario, unique risks, data readiness, deterministic checks, failures, judgments, variants, artifact, dependencies, evaluation cases, and claim-level sources." },
  { id: "canonical-reference", label: "Canonical reference", definition: "A governed operating specification with stable scope, evidence, procedure, checks, authority, review, record, provenance, and source links, but not yet the full deep-treatment package." },
  { id: "source-library-only", label: "Source-library only", definition: "The catalog contains relevant primary or clearly classified sources, but the domain does not yet have a canonical workflow treatment." },
  { id: "planned", label: "Planned", definition: "The approved content program names a future module or expansion ticket; publication and subject-matter review are not implied." },
  { id: "out-of-scope", label: "Out of scope", definition: "The public corpus intentionally does not provide the activity, conclusion, data, or authority described." },
] as const;

const boundariesByFamily: Record<string, { includes: string; excludes: string; next_gap: string }> = {
  "record-to-report": { includes: "Recurring close, journals, accruals, reconciliations, consolidation, variance analysis, tie-out, and disclosure preparation.", excludes: "Entity-specific close policy, every consolidation structure, specialist valuation conclusions, and approval or posting authority.", next_gap: "Publish deep bank-reconciliation, accrual, journal-entry, close, and variance cases." },
  "procure-to-pay": { includes: "Vendor onboarding, invoice handling, matching, AP exceptions, expenses, payment proposals, release controls, and unrecorded liabilities.", excludes: "Procurement strategy, contract negotiation, supplier performance, bank ownership decisions, and autonomous cash movement.", next_gap: "Publish deep invoice, three-way-match, and adversarial bank-change/payment cases." },
  "order-to-cash": { includes: "Contract intake, billing, revenue schedules, cash application, collections support, credits, refunds, write-offs, and credit-loss support.", excludes: "Sales execution, pricing approval, customer credit authority, every industry revenue pattern, and binding collection communication.", next_gap: "Publish a deep revenue-recognition case and later industry overlays." },
  "treasury-cash": { includes: "Cash position and forecast preparation, liquidity monitoring, bank administration, payments, debt/investment support, and FX support.", excludes: "Fiduciary approval, trading, financing commitments, investment advice, and unsupervised cash movement.", next_gap: "Connect treasury records to the canonical payment case and approval-bound execution architecture." },
  "assets-inventory": { includes: "Fixed assets, leases, inventory movement and valuation, cost of goods sold, and impairment support.", excludes: "Physical custody, engineering conclusions, specialist appraisal opinions, every costing method, and disposition approval.", next_gap: "Add workflow briefs, sample artifacts, framework variants, and evaluation cases." },
  "tax-regulatory": { includes: "Provision support, indirect tax, returns, submission controls, statutory reporting, and jurisdiction/effective-date checks.", excludes: "Tax or legal advice, taxpayer-specific conclusions, representation before authorities, signatures, and autonomous filing.", next_gap: "Add jurisdiction-specific modules only with current primary authority and qualified review." },
  "audit-icfr": { includes: "PBC coordination, population/evidence packaging, walkthrough support, control performance and testing, deficiencies, evidence evaluation, management review, and certification support.", excludes: "Auditor independence, engagement acceptance, audit opinions, management certification, and claims of control effectiveness by the agent.", next_gap: "Publish deep PBC/evidence and ICFR control-review cases plus the reviewer field guide." },
  "technical-policy": { includes: "Fact intake, authoritative research, memoranda, policy drafting, estimates/valuation support, change monitoring, and disclosure checklists.", excludes: "Final accounting conclusions, legal interpretations, specialist valuation opinions, policy approval, and claims of universal applicability.", next_gap: "Publish a deep technical-accounting memorandum case with contrary support and applicability checks." },
};

export const familyCoverage = processFamilies.map((family) => ({
  id: `coverage-family-${family.id}`,
  family_id: family.id,
  family_name: family.name,
  state: "canonical-reference" as const,
  workflow_count: workflowRecords.filter((workflow) => workflow.family === family.id).length,
  ...boundariesByFamily[family.id],
  evidence_classification: "editorial-recommendation" as const,
}));

const deepCandidateIds = [
  "wf-r2r-bank-reconciliations", "wf-r2r-accruals-cutoff", "wf-r2r-journal-entry",
  "wf-r2r-close-orchestration", "wf-r2r-flux-analysis", "wf-p2p-invoice-intake",
  "wf-p2p-three-way-match", "wf-p2p-payment-release", "wf-o2c-revenue-recognition",
  "wf-audit-pbc", "wf-audit-control-testing", "wf-technical-memoranda",
] as const;

export const deepCoverage = {
  state: "deep" as const,
  current_count: 0,
  boundary: "No workflow is currently classified as Deep. Canonical references and generated packs are useful inputs, but they do not yet satisfy every deep-treatment criterion.",
  planned_candidates: deepCandidateIds.map((id) => ({ id, name: workflowById.get(id)?.name ?? id, current_state: "canonical-reference" as const })),
  evidence_classification: "editorial-recommendation" as const,
};

export const expansionCoverage = [
  { id: "coverage-hire-to-retire-payroll", label: "Hire-to-retire and payroll accounting", current_state: "source-library-only", source_query: "payroll", planned_issue: 51, boundary: "No canonical payroll family or workflow record; related sources do not establish payroll completeness." },
  { id: "coverage-equity-compensation", label: "Equity and stock-based compensation", current_state: "planned", source_query: null, planned_issue: 47, boundary: "No canonical grant, vesting, modification, forfeiture, tax, or disclosure workflow; source-library coverage is not currently claimed." },
  { id: "coverage-ma-legal-entity-events", label: "M&A and legal-entity events", current_state: "planned", source_query: null, planned_issue: 53, boundary: "No canonical purchase-accounting, opening-balance, carve-out, or discontinued-operations module; source-library coverage is not currently claimed." },
  { id: "coverage-sustainability", label: "Sustainability and nonfinancial reporting", current_state: "planned", source_query: null, planned_issue: 49, boundary: "No canonical lineage, estimate, control, disclosure, or assurance workflow for nonfinancial reporting; source-library coverage is not currently claimed." },
  { id: "coverage-fund-nonprofit-governmental", label: "Fund, nonprofit, governmental, and grant accounting", current_state: "planned", source_query: null, planned_issue: 48, boundary: "Distinct frameworks, restrictions, assertions, and fiduciary duties require separate modules; current generic records are not substitutes." },
  { id: "coverage-public-accounting-firm", label: "Public-accounting-firm workflows", current_state: "source-library-only", source_query: "audit firm", planned_issue: 54, boundary: "The corpus supports client-side PBC and ICFR work but not firm acceptance, independence, supervision, consultation, or opinion issuance." },
  { id: "coverage-industry-overlays", label: "Priority industry overlays", current_state: "planned", source_query: null, planned_issue: 87, boundary: "Banking, insurance, healthcare, construction, SaaS, energy, manufacturing, and digital assets are not yet modeled as reviewed overlays." },
  { id: "coverage-management-finance", label: "Management finance", current_state: "planned", source_query: null, planned_issue: 20, boundary: "FP&A, unit economics, management reporting, capital allocation, and decision support remain incomplete; top-level finance claims must stay qualified." },
] as const;

export const outOfScopeCoverage = [
  { id: "coverage-live-accounting-service", label: "Live accounting service or system of record", boundary: "The site is public and read-only; it does not ingest books, post entries, move cash, file returns, or operate a ledger." },
  { id: "coverage-client-specific-advice", label: "Entity-specific accounting, audit, tax, legal, or investment advice", boundary: "Educational records cannot determine a conclusion for an entity, transaction, period, jurisdiction, or fact pattern." },
  { id: "coverage-professional-assurance", label: "Professional opinion, certification, or assurance", boundary: "Maintainer review and automated checks are not an audit, attestation, certification, professional sign-off, or independent assurance." },
  { id: "coverage-sensitive-data", label: "Employer, client, engagement, bank, employee, vendor, customer, or taxpayer data", boundary: "Only clean-room synthetic examples and metadata belong in the public corpus." },
] as const;

export const accountingAgentsCoverageMap = {
  id: coverageMapId,
  version: coverageMapVersion,
  title: "Accounting Agents coverage and gaps map",
  prepared_at: coverageMapPreparedAt,
  review_status: "maintainer-review-pending",
  review_note: "Maintainer review is pending. Subject-matter, independent, professional, audit, or assurance review is not claimed.",
  primary_mode: "reference",
  evidence_classification: "editorial-recommendation",
  intended_audience: ["Accounting practitioners", "Transformation leaders", "Agent builders", "Risk and assurance teams", "Researchers and educators"],
  prerequisites: ["Know the intended accounting domain or workflow", "Distinguish content coverage from execution authority", "Check the version and stated boundary before relying on a classification"],
  expected_outcome: "A reader can identify what the corpus treats deeply, at canonical-reference level, only through sources, as planned work, or as explicitly out of scope.",
  limitations: ["Coverage state is an editorial description of this release, not evidence that a workflow is correct or suitable for an entity.", "Source-library presence does not establish a complete workflow or authoritative conclusion.", "Planned work may change after source, rights, feasibility, or subject-matter review."],
  next_action: "Choose the relevant row, follow its workflow or source links, and record the visible gap before selecting a pilot or making a coverage claim.",
  governing_invariant: "Agents may prepare accounting work; accountable people approve conclusions and sensitive external actions.",
  state_definitions: coverageStates,
  deep_coverage: deepCoverage,
  family_coverage: familyCoverage,
  expansion_coverage: expansionCoverage,
  out_of_scope: outOfScopeCoverage,
  counts: { process_families: processFamilies.length, canonical_workflows: workflowRecords.length, deep_workflows: deepCoverage.current_count, planned_deep_candidates: deepCoverage.planned_candidates.length, expansion_domains: expansionCoverage.length, out_of_scope_boundaries: outOfScopeCoverage.length },
  applicability: "Describes the public Accounting Agents corpus at this exact version. It does not transfer to another repository, organization, implementation, or later release without review.",
  provenance: { publisher: "Accounting Agents", basis: ["Approved content audit", "Approved content roadmap", "Canonical workflow corpus", "GitHub content-program issue index"], method: "Maintainer-authored classification reconciled to stable workflow IDs and explicit program gaps." },
  rights: { editorial_content: "CC-BY-4.0", factual_metadata: "CC0-1.0", external_sources: "Publisher terms apply; no external full text is stored in this record." },
} as const;

export function renderCoverageMapMarkdown() {
  const map = accountingAgentsCoverageMap;
  const lines = [
    `# ${map.title}`, "", `> Versioned boundary map for the public corpus.`, "",
    `- ID: \`${map.id}\`; version ${map.version}`, `- Prepared: ${map.prepared_at}`, `- Review status: ${map.review_status}`, "",
    `**Governing invariant:** ${map.governing_invariant}`, "", "## Use and limits", "",
    `- Expected outcome: ${map.expected_outcome}`, `- Next action: ${map.next_action}`, ...map.limitations.map((item) => `- Limitation: ${item}`), "",
    "## Coverage states", "", "| Stable ID | State | Meaning |", "|---|---|---|",
    ...map.state_definitions.map((state) => `| \`${state.id}\` | ${state.label} | ${state.definition} |`), "",
    "## Deep coverage", "", `Current deep workflows: **${map.deep_coverage.current_count}**. ${map.deep_coverage.boundary}`, "",
    ...map.deep_coverage.planned_candidates.map((item) => `- [${item.name}](/workflows/${workflowById.get(item.id)?.family}/${item.id}) — current state: ${item.current_state}; planned for deep treatment.`), "",
    "## Canonical process-family boundaries", "", "| Stable ID | Family | Workflows | Includes | Excludes | Next gap |", "|---|---|---:|---|---|---|",
    ...map.family_coverage.map((item) => `| \`${item.id}\` | ${item.family_name} | ${item.workflow_count} | ${item.includes} | ${item.excludes} | ${item.next_gap} |`), "",
    "## Expansion gaps", "", "| Stable ID | Domain | Current state | Source query | Planned issue | Boundary |", "|---|---|---|---|---:|---|",
    ...map.expansion_coverage.map((item) => `| \`${item.id}\` | ${item.label} | ${item.current_state} | ${item.source_query ? `[source records](/api/v1/resources?q=${encodeURIComponent(item.source_query)})` : "Not claimed"} | #${item.planned_issue} | ${item.boundary} |`), "",
    "## Out of scope", "", ...map.out_of_scope.map((item) => `- **${item.label}** (\`${item.id}\`): ${item.boundary}`), "",
    "## Rights and review", "", `- ${map.review_note}`, `- Applicability: ${map.applicability}`, `- Original editorial content: ${map.rights.editorial_content}`, `- Project-created factual metadata: ${map.rights.factual_metadata}`,
  ];
  return lines.join("\n").trimEnd() + "\n";
}
