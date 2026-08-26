import type {
  ControlModelElementId,
  WorkflowControlModelMapping,
} from "./domain-model";

export const controlModelId = "accounting-agent-control-model";
export const controlModelVersion = "1.0.0";
export const controlModelPreparedAt = "2026-08-25";
export const controlModelReviewStatus = "maintainer-review-pending";

export type ControlModelElement = {
  id: ControlModelElementId;
  ordinal: number;
  label: string;
  question: string;
  definition: string;
  required_record: readonly string[];
  failure_boundary: string;
  evidence_classification: "implementation-pattern";
};

export const controlModelElements: readonly ControlModelElement[] = [
  {
    id: "objective",
    ordinal: 1,
    label: "Objective",
    question: "What accounting outcome is being pursued?",
    definition: "State the bounded accounting outcome before selecting tools, procedures, or a desired conclusion.",
    required_record: ["Outcome and accountable owner", "Reporting or operating purpose", "Completion and stop criteria"],
    failure_boundary: "Do not begin when the outcome, owner, or completion condition is ambiguous.",
    evidence_classification: "implementation-pattern",
  },
  {
    id: "scope",
    ordinal: 2,
    label: "Scope",
    question: "Which entity, period, population, framework, materiality, and exclusions apply?",
    definition: "Bind the work to the exact facts and boundaries that the accountable owner approved.",
    required_record: ["Entity and period", "Population and exclusions", "Framework, jurisdiction, thresholds, and version"],
    failure_boundary: "Stop when a source, item, period, entity, or action falls outside the recorded scope.",
    evidence_classification: "implementation-pattern",
  },
  {
    id: "evidence",
    ordinal: 3,
    label: "Evidence",
    question: "What may support the work, and is it complete, reliable, applicable, and traceable?",
    definition: "Identify authoritative records and sources, preserve provenance, and keep contradictions and missing evidence visible.",
    required_record: ["Source register and immutable identifiers", "Population control totals", "Applicability, reliability, contradiction, and freshness notes"],
    failure_boundary: "Do not infer missing facts or suppress contradictory, stale, wrong-period, or inapplicable evidence.",
    evidence_classification: "implementation-pattern",
  },
  {
    id: "procedure",
    ordinal: 4,
    label: "Procedure",
    question: "Which model work, deterministic work, tools, and state transitions perform the task?",
    definition: "Separate probabilistic investigation and drafting from deterministic calculations, validations, and system operations.",
    required_record: ["Ordered procedures and approved tools", "Model, prompt, policy, and tool versions", "State transitions, handoffs, and exception paths"],
    failure_boundary: "Do not let model output silently replace an independently enforceable calculation, policy, or approval step.",
    evidence_classification: "implementation-pattern",
  },
  {
    id: "checks",
    ordinal: 5,
    label: "Checks",
    question: "Which arithmetic, tie-outs, schemas, permissions, limits, and stop conditions must pass?",
    definition: "Specify deterministic tests and hard gates before the run, including the treatment of failures and overrides.",
    required_record: ["Control totals and calculation checks", "Schema, permission, duplicate, and payload tests", "Thresholds, stop conditions, and exception disposition"],
    failure_boundary: "A failed hard gate cannot be averaged away by fluent output, confidence, or other passing checks.",
    evidence_classification: "implementation-pattern",
  },
  {
    id: "authority",
    ordinal: 6,
    label: "Authority",
    question: "What may be read, prepared, recommended, approved, executed, or represented?",
    definition: "Classify authority at the action level and enforce the smallest permission needed outside the model.",
    required_record: ["Action-level A0–A4 or human-only assignment", "Allowed, approval-gated, and prohibited actions", "Identity, segregation of duties, and credential boundary"],
    failure_boundary: "Confidence, a prompt, or the agent's own state never grants approval or execution authority.",
    evidence_classification: "implementation-pattern",
  },
  {
    id: "review",
    ordinal: 7,
    label: "Review",
    question: "Who challenges the work, resolves exceptions, and owns the decision?",
    definition: "Name the competent accountable reviewer and the evidence, judgments, exceptions, and alternatives that require disposition.",
    required_record: ["Reviewer identity, role, and authority", "Review criteria and unresolved matters", "Attributable approve, modify, reject, or escalate decision"],
    failure_boundary: "The agent cannot approve its own work or make an accounting, fiduciary, legal, control, or professional conclusion on a person's behalf.",
    evidence_classification: "implementation-pattern",
  },
  {
    id: "action",
    ordinal: 8,
    label: "Action",
    question: "How is any approved effect bound, enforced, acknowledged, and reconciled?",
    definition: "Keep preparation separate from execution and permit only the exact approved payload through a constrained interface.",
    required_record: ["Immutable payload and attributable approval", "Independent policy, permission, limit, and idempotency checks", "Acknowledgment, reconciliation, and rollback or compensation path"],
    failure_boundary: "Do not post, pay, file, delete, certify, approve, or communicate externally without separately attributable authority and deterministic enforcement.",
    evidence_classification: "implementation-pattern",
  },
  {
    id: "record",
    ordinal: 9,
    label: "Record",
    question: "What workpaper, trace, versions, approvals, receipts, corrections, and retention evidence remain?",
    definition: "Retain an accounting-facing record that lets a competent reviewer reproduce the work and distinguish preparation, judgment, approval, and execution.",
    required_record: ["Workpaper and source lineage", "Procedures, checks, exceptions, versions, and approvals", "Action receipt, reconciliation, correction, and retention state"],
    failure_boundary: "A technical trace alone is not an accounting workpaper, and a rewritten record must not erase prior decisions or corrections.",
    evidence_classification: "implementation-pattern",
  },
] as const;

export function buildWorkflowControlModelMapping(): WorkflowControlModelMapping {
  return {
    model_id: controlModelId,
    model_version: controlModelVersion,
    elements: [
      { element_id: "objective", source_fields: ["accounting_objective", "accountable_owner", "trigger"] },
      { element_id: "scope", source_fields: ["scope", "entity_scope", "period_scope", "trigger_scope", "jurisdiction", "thresholds"] },
      { element_id: "evidence", source_fields: ["inputs", "control_totals", "source_ids", "source_links"] },
      { element_id: "procedure", source_fields: ["agent_procedures", "read_tools", "write_tools"] },
      { element_id: "checks", source_fields: ["deterministic_checks", "stop_conditions", "failure_modes"] },
      { element_id: "authority", source_fields: ["authority_level", "actions", "segregation_of_duties"] },
      { element_id: "review", source_fields: ["reviewer", "human_decisions", "review_status"] },
      { element_id: "action", source_fields: ["write_tools", "actions", "proposed_accounting_effects", "recovery_actions"] },
      { element_id: "record", source_fields: ["outputs", "run_record", "retention", "reproducibility", "provenance"] },
    ],
  };
}

type ScenarioElement = {
  element_id: ControlModelElementId;
  application: string;
};

export type ControlModelScenario = {
  id: string;
  title: string;
  context: string;
  evidence_classification: "synthetic-example";
  fictional: true;
  intended_lesson: string;
  elements: readonly ScenarioElement[];
  accountable_conclusion: string;
};

export const controlModelScenarios: readonly ControlModelScenario[] = [
  {
    id: "synthetic-accrual-entry",
    title: "Month-end accrual and proposed journal entry",
    context: "Fictional Northstar Components LLC is closing September 2026. A synthetic $36,000 service contract covers August through October; service acceptance supports work through September, no invoice or accrual appears in the approved AP and ledger extracts, and the vendor has not replied.",
    evidence_classification: "synthetic-example",
    fictional: true,
    intended_lesson: "Preparation and recommendation can be rigorous without allowing the agent to approve or post the entry.",
    elements: [
      { element_id: "objective", application: "Prepare a supported September accrual, proposed reversal, and reviewer packet; do not approve or post." },
      { element_id: "scope", application: "Northstar Components LLC, September 2026, one synthetic contract, one cost center, USD, and the approved materiality and cutoff policy." },
      { element_id: "evidence", application: "Executed synthetic contract, service acceptance, AP and ledger populations with control totals, chart of accounts, cutoff policy, and visible vendor nonresponse." },
      { element_id: "procedure", application: "Validate populations, confirm two months of accepted service, calculate the $12,000 monthly rate and $24,000 cumulative amount through September, search for duplication, flag the unrecorded August amount for controller disposition, draft the balanced entry and reversal, and assemble exceptions." },
      { element_id: "checks", application: "$36,000 divided by three months equals $12,000 per month; two accepted months equal a $24,000 cumulative accrual through September; debits equal credits; entity, period, accounts, and dimensions are valid; no invoice or accrual is duplicated." },
      { element_id: "authority", application: "The agent prepares at A1 and may recommend at A2. The controller's accounting conclusion is human-only; any later staging action is separately approval-gated A3." },
      { element_id: "review", application: "The controller challenges completeness, cutoff, the $24,000 cumulative estimate, the unrecorded August service and any prior-period implications, account classification, vendor nonresponse, and the proposed reversal before deciding." },
      { element_id: "action", application: "No ledger effect occurs during preparation. After attributable approval, only the exact approved payload may enter a constrained staging queue; posting remains outside this scenario." },
      { element_id: "record", application: "Retain source identifiers and totals, calculation, proposed entry and reversal, exceptions, versions, reviewer decision, payload hash if approved, and final disposition." },
    ],
    accountable_conclusion: "A named controller approves, modifies, rejects, or escalates the proposed treatment. The agent does not own the conclusion.",
  },
  {
    id: "synthetic-payment-release",
    title: "Vendor payment with changed bank instructions",
    context: "Fictional Harbor Supply Co. has a synthetic $72,400 approved invoice and receipt match. Bank instructions printed on the invoice differ from the approved vendor master, and the requester asks for urgent release.",
    evidence_classification: "synthetic-example",
    fictional: true,
    intended_lesson: "A payment can proceed only after independent verification, conflict resolution, payload-bound approval, and deterministic bank controls.",
    elements: [
      { element_id: "objective", application: "Prepare a payment decision package and release only a separately verified, approved payload; otherwise hold and escalate." },
      { element_id: "scope", application: "One fictional vendor, invoice, legal entity, bank account, currency, value date, payment rail, and approved payment limit." },
      { element_id: "evidence", application: "Invoice, purchase order, receipt, vendor master, change request, independent callback record, sanctions result, requester identity, and cash availability." },
      { element_id: "procedure", application: "Reperform the match, isolate the conflicting bank data, verify the beneficiary through an independent channel, screen applicable controls, identify role conflicts, and prepare the immutable payload." },
      { element_id: "checks", application: "Invoice, receipt, and PO agree; beneficiary is independently verified; sanctions and fraud holds are clear; approvers are authorized; payload hash and duplicate key pass." },
      { element_id: "authority", application: "The agent may prepare and recommend. Vendor-master approval and fiduciary payment approval are human-owned. A constrained tool may transmit one exact approved payload at A3." },
      { element_id: "review", application: "Authorized vendor-master and treasury reviewers resolve the changed instructions, urgency, segregation-of-duties conflict, and any screening exception." },
      { element_id: "action", application: "Hold on unresolved verification or conflict. If all gates pass, transmit the exact approved payload once, preserve bank acknowledgment, and reconcile settlement." },
      { element_id: "record", application: "Retain all source records, independent verification, screening evidence, role checks, approvals, payload hash, idempotency key, acknowledgment, settlement reconciliation, and any incident record." },
    ],
    accountable_conclusion: "Authorized people approve the beneficiary and payment. The agent cannot infer approval from urgency, an invoice, a message, or its own confidence.",
  },
] as const;

export const controlModelSourceBasis = [
  { id: "src_1v1zwt5", title: "COSO Internal Control—Integrated Framework", url: "https://www.coso.org/guidance-on-ic", classification: "authoritative-requirement", scope: "Internal-control objectives, components, accountability, control activities, information, and monitoring; applicability depends on the entity's framework." },
  { id: "src_075usnq", title: "PCAOB AS 2201", url: "https://pcaobus.org/oversight/standards/auditing-standards/details/AS2201", classification: "authoritative-requirement", scope: "ICFR audit requirements for in-scope US public-company audits; elsewhere it informs the control and evidence pattern without becoming binding." },
  { id: "src_gaogb25", title: "GAO 2025 Green Book", url: "https://www.gao.gov/products/gao-25-107721", classification: "authoritative-requirement", scope: "US federal internal-control standard; outside that scope it is an official implementation reference, not binding authority." },
  { id: "src_0pywo86", title: "NIST SP 800-53 Rev. 5", url: "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final", classification: "official-guidance", scope: "Security and privacy control catalog used here for access, logging, separation of duties, change, and recovery patterns." },
  { id: "src_nachafm", title: "Nacha fraud-monitoring rule summary", url: "https://www.nacha.org/rules/risk-management-topics-fraud-monitoring-phase-2", classification: "authoritative-requirement", scope: "Applies only to specified ACH participants and effective periods; used in the payment example as a scoped primary rule source." },
  { id: "src_ofaccomp", title: "OFAC Framework for Compliance Commitments", url: "https://ofac.treasury.gov/media/16331/download?inline", classification: "official-guidance", scope: "Official sanctions-compliance framework; current programs, facts, and legal advice control." },
] as const;

export const accountingAgentControlModel = {
  id: controlModelId,
  version: controlModelVersion,
  title: "Accounting Agent Control Model",
  description: "A nine-element reference for designing, running, reviewing, and recording governed accounting-agent work.",
  prepared_at: controlModelPreparedAt,
  review_status: controlModelReviewStatus,
  review_note: "Maintainer review is pending. Independent or professional review is not claimed.",
  primary_mode: "reference",
  evidence_classification: "implementation-pattern",
  intended_audience: ["Accounting practitioners", "Reviewers and control owners", "Agent builders", "Risk and assurance teams"],
  prerequisites: ["A bounded accounting objective", "A named accountable owner and reviewer", "Approved evidence and system boundaries"],
  expected_outcome: "A complete control record that makes preparation, judgment, approval, execution, and retained evidence independently inspectable.",
  limitations: [
    "This editorial model is not an accounting standard, legal rule, audit opinion, certification, or substitute for entity-specific control design.",
    "Source applicability depends on the entity, transaction, period, jurisdiction, framework, and facts.",
    "A complete model record does not establish that a control operated effectively or that an accounting conclusion is correct.",
  ],
  next_action: "Apply the nine elements to one workflow record, then route the completed design and unresolved decisions to the accountable reviewer.",
  governing_invariant: "Agents may prepare accounting work; accountable people approve conclusions and sensitive external actions.",
  elements: controlModelElements,
  scenarios: controlModelScenarios,
  workflow_mapping: {
    expected_record_count: 60,
    contract: buildWorkflowControlModelMapping(),
    boundary: "Every workflow exposes the same nine element IDs and points each element to canonical workflow fields. Mapping does not grant authority or professional review.",
  },
  source_basis: controlModelSourceBasis,
  rights: {
    editorial_content: "CC-BY-4.0",
    factual_metadata_and_synthetic_examples: "CC0-1.0",
    external_sources: "Publisher terms apply; no external full text is stored in this record.",
  },
} as const;

function markdownCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

export function renderControlModelMarkdown() {
  const lines = [
    `# ${accountingAgentControlModel.title}`,
    "",
    `> ${accountingAgentControlModel.description}`,
    "",
    `- Model ID: \`${accountingAgentControlModel.id}\`; version ${accountingAgentControlModel.version}`,
    `- Prepared: ${accountingAgentControlModel.prepared_at}`,
    `- Review status: ${accountingAgentControlModel.review_status}`,
    `- Evidence classification: Implementation pattern`,
    "",
    `**Governing invariant:** ${accountingAgentControlModel.governing_invariant}`,
    "",
    "## Use and limits",
    "",
    `- Expected outcome: ${accountingAgentControlModel.expected_outcome}`,
    `- Next action: ${accountingAgentControlModel.next_action}`,
    ...accountingAgentControlModel.limitations.map((item) => `- Limitation: ${item}`),
    "",
    "## Nine elements",
    "",
    "| # | Stable ID | Element | Governing question | Required record | Failure boundary |",
    "|---:|---|---|---|---|---|",
    ...accountingAgentControlModel.elements.map((element) => `| ${element.ordinal} | \`${element.id}\` | ${element.label} | ${markdownCell(element.question)} | ${markdownCell(element.required_record.join("; "))} | ${markdownCell(element.failure_boundary)} |`),
    "",
    "## Synthetic scenarios",
    "",
  ];

  for (const scenario of accountingAgentControlModel.scenarios) {
    lines.push(
      `### ${scenario.title}`,
      "",
      `- ID: \`${scenario.id}\``,
      "- Evidence classification: Synthetic example",
      `- Context: ${scenario.context}`,
      `- Lesson: ${scenario.intended_lesson}`,
      "",
      "| Element | Application |",
      "|---|---|",
      ...scenario.elements.map((item) => `| ${controlModelElements.find((element) => element.id === item.element_id)?.label ?? item.element_id} | ${markdownCell(item.application)} |`),
      "",
      `**Accountable conclusion:** ${scenario.accountable_conclusion}`,
      "",
    );
  }

  lines.push(
    "## Workflow mapping",
    "",
    `All ${accountingAgentControlModel.workflow_mapping.expected_record_count} workflow records expose \`control_model\` with model ID, version, and source-field mappings for the same nine element IDs.`,
    "",
    ...accountingAgentControlModel.workflow_mapping.contract.elements.map((item) => `- **${controlModelElements.find((element) => element.id === item.element_id)?.label} (\`${item.element_id}\`):** ${item.source_fields.map((field) => `\`${field}\``).join(", ")}`),
    "",
    "## Source basis",
    "",
    ...accountingAgentControlModel.source_basis.map((source) => `- [${source.title}](${source.url}) — ${source.classification}. ${source.scope}`),
    "",
    "## Rights and review",
    "",
    `- ${accountingAgentControlModel.review_note}`,
    `- Original editorial content: ${accountingAgentControlModel.rights.editorial_content}`,
    `- Project-created factual metadata and synthetic examples: ${accountingAgentControlModel.rights.factual_metadata_and_synthetic_examples}`,
    `- External sources: ${accountingAgentControlModel.rights.external_sources}`,
  );

  return lines.join("\n").trimEnd() + "\n";
}
