export const corpusReviewedAt = "2026-08-23";
export const corpusModifiedAt = "2026-08-25T00:00:00.000Z";
export const corpusVersion = "2026-08-25.2";
export const domainSchemaVersion = "1.0";

export type ControlModelElementId =
  | "objective"
  | "scope"
  | "evidence"
  | "procedure"
  | "checks"
  | "authority"
  | "review"
  | "action"
  | "record";

export type WorkflowControlModelMapping = {
  model_id: "accounting-agent-control-model";
  model_version: "1.0.0";
  elements: Array<{
    element_id: ControlModelElementId;
    source_fields: string[];
  }>;
};

export type AuthorityLevelId = "A0" | "A1" | "A2" | "A3" | "A4" | "human-only";

export type AuthorityLevel = {
  id: AuthorityLevelId;
  label: string;
  agent_role: string;
  execution_rule: string;
  required_controls: string[];
  accounting_example: string;
  boundary: string;
};

export const authorityLevels: AuthorityLevel[] = [
  {
    id: "A0",
    label: "Explain",
    agent_role: "Explain a concept or retrieve approved guidance without changing a work record.",
    execution_rule: "No accounting or operational effect is permitted.",
    required_controls: ["Approved source scope", "Citation capture", "No write tools"],
    accounting_example: "Explain the difference between a timing item and an error in a bank reconciliation.",
    boundary: "The response is educational and cannot be treated as an approval or accounting conclusion.",
  },
  {
    id: "A1",
    label: "Prepare",
    agent_role: "Collect, normalize, calculate, classify, and draft evidence-linked work.",
    execution_rule: "A person performs any posting, submission, communication, or other external action.",
    required_controls: ["Read-only or draft-only tools", "Deterministic validation", "Named reviewer"],
    accounting_example: "Prepare a reconciliation and proposed journal entry for review.",
    boundary: "The output is preparer work. It is not an approved conclusion or executed transaction.",
  },
  {
    id: "A2",
    label: "Recommend",
    agent_role: "Propose a conclusion or action and show the evidence, calculation, alternatives, and uncertainty.",
    execution_rule: "A named person decides whether to accept, modify, reject, or escalate the recommendation.",
    required_controls: ["Decision criteria", "Materiality thresholds", "Attributable review decision"],
    accounting_example: "Recommend whether an unmatched item should be recorded, investigated, or treated as timing.",
    boundary: "The agent may frame judgment but may not assume the accountable person's authority.",
  },
  {
    id: "A3",
    label: "Execute after approval",
    agent_role: "Perform one constrained action after the exact payload and authority have been approved.",
    execution_rule: "Approval is recorded before execution; the executing tool independently verifies scope, approver, limits, and payload integrity.",
    required_controls: ["Pre-action approval", "Least-privilege write tool", "Idempotency", "Post-action reconciliation"],
    accounting_example: "Submit an approved journal entry to an ERP staging queue without posting it to the ledger.",
    boundary: "Approval cannot be inferred from a prompt, chat message, or the agent's own state.",
  },
  {
    id: "A4",
    label: "Execute within policy",
    agent_role: "Perform low-risk, reversible actions inside deterministic policy and monitoring limits.",
    execution_rule: "The policy engine, not the model, decides whether an action is allowed and routes every exception.",
    required_controls: ["Deterministic policy", "Reversibility", "Continuous monitoring", "Kill switch"],
    accounting_example: "Update a close-task status when required evidence is present and no accounting record changes.",
    boundary: "Do not use this level for material, irreversible, externally attributable, fiduciary, or certification actions.",
  },
  {
    id: "human-only",
    label: "Human-only",
    agent_role: "Prepare support and surface open matters without making the decision, attestation, or certification.",
    execution_rule: "An authorized person performs and owns the act.",
    required_controls: ["Named accountable person", "Direct review", "Attributable sign-off", "No delegated credential"],
    accounting_example: "Management signs an ICFR certification after reviewing the supporting assessment.",
    boundary: "Final approval, legal attestation, fiduciary authority, and professional certification are not delegated to a model.",
  },
];

export type AuthorityDecisionOutcome = {
  kind: "step" | "authority" | "stop";
  target: string;
  label: string;
};

export type AuthorityDecisionStep = {
  id: string;
  question: string;
  why_it_matters: string;
  yes: AuthorityDecisionOutcome;
  no: AuthorityDecisionOutcome;
};

export const authorityDecisionGuide = {
  id: "authority-decision-guide",
  version: "1.0.0",
  prepared_at: "2026-08-27",
  review_status: "maintainer-review-pending",
  review_note:
    "Maintainer review is pending. Subject-matter, independent, professional, audit, or assurance review is not claimed.",
  primary_mode: "reference",
  evidence_classification: "implementation-pattern",
  intended_audience:
    "Accounting practitioners, reviewers, control owners, transformation leaders, and builders who need to classify one proposed agent action.",
  prerequisites: [
    "Name one observable action and the system or record it may affect.",
    "Identify the accountable owner and any required approver before assigning an authority level.",
  ],
  expected_outcome:
    "Assign the smallest proposed action to A0, A1, A2, A3, A4, or human-only; identify the controls and separation of duties required; and stop when the action cannot be bounded safely.",
  operating_rule: {
    id: "authority-operating-rule",
    text: "Agents may prepare accounting work. Accountable people approve conclusions and sensitive external actions.",
    evidence_classification: "editorial-recommendation",
  },
  decision_steps: [
    {
      id: "decision-smallest-action",
      question: "Can you state one observable action, its target, and its possible effect?",
      why_it_matters: "Authority belongs to actions, not to a product name, model, workflow, or confidence score.",
      yes: { kind: "step", target: "decision-human-owned", label: "Test whether the responsibility is inherently human-owned." },
      no: { kind: "stop", target: "stop-split-action", label: "Stop and split the workflow into smaller actions." },
    },
    {
      id: "decision-human-owned",
      question: "Does the action approve an accounting conclusion, sign or certify, exercise fiduciary discretion, or assume a person's identity?",
      why_it_matters: "These responsibilities remain attributable to an authorized person even when an agent prepares the support.",
      yes: { kind: "authority", target: "human-only", label: "Human-only. The agent may prepare support but may not perform the act." },
      no: { kind: "step", target: "decision-informational", label: "Determine whether the action is informational." },
    },
    {
      id: "decision-informational",
      question: "Does the action only explain or retrieve approved information without changing a work record?",
      why_it_matters: "A response that creates no work record or external effect is educational or informational, not approval.",
      yes: { kind: "authority", target: "A0", label: "A0 — Explain." },
      no: { kind: "step", target: "decision-preparatory", label: "Determine whether the action only prepares work." },
    },
    {
      id: "decision-preparatory",
      question: "Does the action collect, normalize, calculate, classify, or draft evidence-linked work without choosing the conclusion?",
      why_it_matters: "Preparation may be substantial while still leaving judgment and approval with named people.",
      yes: { kind: "authority", target: "A1", label: "A1 — Prepare." },
      no: { kind: "step", target: "decision-recommendatory", label: "Determine whether the action recommends a judgment." },
    },
    {
      id: "decision-recommendatory",
      question: "Does the action propose a conclusion or treatment while a named person accepts, modifies, rejects, or escalates it?",
      why_it_matters: "A recommendation may frame judgment but cannot inherit the accountable person's decision authority.",
      yes: { kind: "authority", target: "A2", label: "A2 — Recommend." },
      no: { kind: "step", target: "decision-after-approval", label: "Test the proposed execution path." },
    },
    {
      id: "decision-after-approval",
      question: "Is this one exact action or payload already approved by an attributable person and independently verifiable by the executing tool?",
      why_it_matters: "A3 is a narrow commit step after approval, not general permission to decide, edit, or expand the payload.",
      yes: { kind: "authority", target: "A3", label: "A3 — Execute the exact approved action once, within enforced limits." },
      no: { kind: "step", target: "decision-policy-execution", label: "Test whether a low-risk policy can authorize the action." },
    },
    {
      id: "decision-policy-execution",
      question: "Is the effect low-risk, reversible, non-fiduciary, and allowed by deterministic policy with monitoring and exception routing?",
      why_it_matters: "A4 relies on policy and reversibility; model confidence or prior success is not the policy engine.",
      yes: { kind: "authority", target: "A4", label: "A4 — Execute within deterministic policy." },
      no: { kind: "stop", target: "stop-human-decision", label: "Stop. Route the action to an authorized person or redesign it as preparation." },
    },
  ] as readonly AuthorityDecisionStep[],
  stop_conditions: [
    "The action, target, entity, period, amount, recipient, or possible effect is not specific.",
    "Required evidence is missing, contradictory, stale, or outside the approved scope.",
    "The proposed authority depends on model confidence, fluency, prior success, a chat response, or silence.",
    "Approval is not attributable, current, within the person's authority, and bound to the exact payload.",
    "The executing tool cannot independently enforce identity, scope, limits, payload integrity, and idempotency.",
    "One actor can prepare, alter the payload, approve, execute, and conceal or reconcile the same action without independent challenge.",
    "The action is a final conclusion, signature, attestation, certification, fiduciary decision, or other inherently human-owned responsibility.",
  ],
  execution_comparison: [
    {
      id: "compare-a3",
      level_id: "A3",
      entry_condition: "A named person has approved the exact action or immutable payload.",
      decision_owner: "The person owns the conclusion and approval; deterministic controls authorize only the matching execution call.",
      permitted_effect: "One constrained, idempotent action within approved entity, period, accounts, amount, recipient, and time limits.",
      accounting_example: "Submit an approved journal-entry payload to an ERP staging queue without changing its lines or posting beyond the approved interface.",
      stop_when: "The payload, authority, limit, system state, or approval changes or cannot be verified.",
    },
    {
      id: "compare-a4",
      level_id: "A4",
      entry_condition: "A deterministic policy permits a low-risk, reversible, non-accounting effect without a new case-specific approval.",
      decision_owner: "The policy owner defines the rule; the policy engine, not the model, allows or rejects the action.",
      permitted_effect: "Only the reversible operational effect named by policy, with monitoring and exception routing.",
      accounting_example: "Mark a close task complete when required evidence fields and deterministic dependency checks pass, without posting or locking the period.",
      stop_when: "The effect becomes material, irreversible, externally attributable, fiduciary, or dependent on judgment.",
    },
    {
      id: "compare-human-only",
      level_id: "human-only",
      entry_condition: "The act carries accounting, legal, fiduciary, control, professional, or external accountability.",
      decision_owner: "An identified and authorized person directly reviews the current evidence and performs the act.",
      permitted_effect: "The agent may prepare a decision packet; it may not click, sign, attest, certify, approve, or impersonate the person.",
      accounting_example: "Approve the accounting treatment, release a material payment, sign an ICFR certification, or authorize final close.",
      stop_when: "Always stop the agent before the human-owned act; preserve the attributable decision separately.",
    },
  ],
  mixed_level_workflow: {
    id: "synthetic-accrual-authority-walkthrough",
    title: "Synthetic accrual entry and close-task walkthrough",
    fictional: true,
    evidence_classification: "synthetic-example",
    context:
      "A fictional entity is preparing an August 2026 expense accrual. The evidence, proposed entry, approval, staging submission, close-task status, and reporting certification are separate actions.",
    actions: [
      { id: "mixed-explain-policy", action: "Retrieve and explain the approved accrual policy.", level_id: "A0", why: "No work record or accounting effect is created.", accountable_person: "Policy owner maintains the approved guidance." },
      { id: "mixed-prepare-entry", action: "Assemble evidence, calculate the estimate, and draft balanced entry lines.", level_id: "A1", why: "The agent prepares evidence-linked work but does not choose or approve the conclusion.", accountable_person: "Preparer and reviewer challenge completeness and calculation." },
      { id: "mixed-recommend-treatment", action: "Recommend the accrual treatment and show alternatives, uncertainty, and proposed reversal.", level_id: "A2", why: "A recommendation frames judgment while the named reviewer decides.", accountable_person: "Authorized reviewer accepts, modifies, rejects, or escalates." },
      { id: "mixed-approve-entry", action: "Approve the accounting conclusion and exact entry payload.", level_id: "human-only", why: "Approval assigns accounting accountability and cannot be inferred from agent confidence.", accountable_person: "Authorized approver performs an attributable decision." },
      { id: "mixed-submit-entry", action: "Submit the unchanged approved payload once to the ERP staging queue.", level_id: "A3", why: "Execution follows approval of the exact payload and is independently constrained.", accountable_person: "Approver owns the decision; system owner owns the constrained interface." },
      { id: "mixed-update-task", action: "Mark the close task complete when specified evidence and dependency checks pass.", level_id: "A4", why: "The status change is reversible, non-accounting, and permitted only by deterministic policy.", accountable_person: "Close owner defines and monitors the policy." },
      { id: "mixed-certify-close", action: "Authorize final close or certify the reporting result.", level_id: "human-only", why: "Final close and certification carry control, legal, and external accountability.", accountable_person: "Authorized management performs the act." },
    ],
    finished_artifact:
      "An action register that records each stable action ID, authority level, responsible person, required approval, enforcement point, stop condition, and retained evidence.",
  },
  common_misclassifications: [
    { id: "misclassification-confidence", mistaken_claim: "High model confidence turns a recommendation into an approval.", correction: "Confidence may inform review but never changes A2 into human approval authority." },
    { id: "misclassification-whole-agent", mistaken_claim: "The entire agent or workflow is A3.", correction: "Classify each action. One workflow may contain A0, A1, A2, A3, A4, and human-only steps." },
    { id: "misclassification-chat-approval", mistaken_claim: "A person saying “looks good” in chat is enough for A3.", correction: "Approval must be authenticated, attributable, within authority, current, and bound to the exact payload." },
    { id: "misclassification-reversible-a4", mistaken_claim: "Any reversible action qualifies for A4.", correction: "A4 also requires low risk, deterministic policy, monitoring, exception routing, and no human-owned judgment." },
    { id: "misclassification-staging", mistaken_claim: "Submitting to a staging queue is always harmless preparation.", correction: "Classify the actual effect and permissions. A staging write is A3 when it changes a controlled system after exact approval." },
    { id: "misclassification-human-loop", mistaken_claim: "Any human in the loop provides segregation of duties.", correction: "The person must be identified, authorized, appropriately independent, and unable to approve a payload they or the agent can silently change afterward." },
  ],
  segregation_of_duties_examples: [
    { id: "sod-entry-approval", unsafe_combination: "The same agent prepares an entry and treats its own recommendation as approval.", safer_design: "The agent prepares under A1/A2; an authorized person approves the exact payload; a constrained tool performs any A3 submission.", principle: "Preparation, approval, and execution remain distinguishable and attributable." },
    { id: "sod-vendor-payment", unsafe_combination: "One identity changes vendor bank data and releases the resulting payment.", safer_design: "Independent verification and approval govern master-data change; payment preparation and release use separate roles and credentials.", principle: "Maintenance, payment preparation, and fiduciary release are incompatible duties." },
    { id: "sod-payload-change", unsafe_combination: "The executor can edit an approved payload before sending it.", safer_design: "Approval binds an immutable payload hash; the executing tool rejects any field or version difference.", principle: "Approval applies to the exact effect, not a general request." },
    { id: "sod-self-reconciliation", unsafe_combination: "The executor is the only party that checks and clears its own result.", safer_design: "Preserve the execution receipt and reconcile it independently to the approved payload and authoritative system.", principle: "Execution evidence is challenged separately from execution." },
  ],
  sensitive_action_mappings: [
    { id: "mapping-journal-posting", sensitive_action_id: "sa-journal-posting", href: "/sensitive-actions#sa-journal-posting", rule: "Prepare and recommend under A1/A2; keep conclusion approval human-owned; use A3 only for the exact approved payload." },
    { id: "mapping-cash-movement", sensitive_action_id: "sa-cash-movement", href: "/sensitive-actions#sa-cash-movement", rule: "The agent may prepare a payment packet; fiduciary approval remains human-owned; any A3 submission must be exact, one-time, and independently authorized." },
    { id: "mapping-final-approval", sensitive_action_id: "sa-final-approval", href: "/sensitive-actions#sa-final-approval", rule: "Always human-only when the decision carries accounting, legal, fiduciary, control, professional, or external accountability." },
    { id: "mapping-certification", sensitive_action_id: "sa-certification", href: "/sensitive-actions#sa-certification", rule: "The agent may prepare support but may not sign, click, attest, certify, or assume the certifier's identity." },
    { id: "mapping-close", sensitive_action_id: "sa-unsupervised-close", href: "/sensitive-actions#sa-unsupervised-close", rule: "A4 may update a reversible task status under deterministic policy; final close, period lock, material override, and reporting certification remain human-owned." },
  ],
  limitations: [
    "The A0–A4 labels and decision tree are an Accounting Agents implementation pattern, not a professional standard or grant of authority.",
    "The correct classification depends on the exact action, system effect, entity, period, amount, evidence, jurisdiction, policy, and accountable roles.",
    "A lower-risk label does not replace current legal, regulatory, contractual, accounting, audit, security, or organizational requirements.",
    "Maintainer review and automated tests are not subject-matter review, independent assurance, certification, or professional sign-off.",
  ],
  next_action:
    "Choose one real or synthetic workflow, split it into observable actions, apply the decision tree to each action, and carry the resulting action register into the Control Model and sensitive-action guidance.",
  source_basis: [
    { id: "src_1v1zwt5", evidence_classification: "authoritative-requirement", scope: "COSO internal-control principles support accountability, control activities, information, and monitoring; applicability depends on the entity's adopted framework and facts." },
    { id: "src_gaogb25", evidence_classification: "authoritative-requirement", scope: "The 2025 Green Book addresses authority, responsibility, segregation of duties, access, and control activities for US federal entities; outside that scope it is guidance, not binding law." },
    { id: "src_075usnq", evidence_classification: "authoritative-requirement", scope: "PCAOB AS 2201 informs ICFR responsibility and control evaluation in in-scope public-company audits; it does not adopt the A0–A4 labels." },
    { id: "src_0pywo86", evidence_classification: "authoritative-requirement", scope: "NIST SP 800-53 provides control patterns for access enforcement, least privilege, separation of duties, audit records, and change control; applicability depends on the system and adopted control baseline." },
  ],
  rights: {
    editorial_content: "CC-BY-4.0",
    synthetic_examples_and_factual_metadata: "CC0-1.0",
    external_sources: "Publisher terms apply; no external full text is stored in this guide.",
  },
} as const;

export type ProcessFamilyId =
  | "record-to-report"
  | "procure-to-pay"
  | "order-to-cash"
  | "treasury-cash"
  | "assets-inventory"
  | "tax-regulatory"
  | "audit-icfr"
  | "technical-policy";

export type ProcessFamily = {
  id: ProcessFamilyId;
  name: string;
  short_name: string;
  summary: string;
  accountable_owner: string;
  reviewer: string;
  source_ids: string[];
  default_inputs: string[];
  default_read_tools: string[];
  default_checks: string[];
  segregation_of_duties: string[];
};

export type WorkflowAction = {
  action: string;
  authority_level: AuthorityLevelId;
  agent_role: string;
  human_role: string;
};

export type WorkflowSourceLink = {
  source_id: string;
  supports: "framework baseline" | "workflow-specific claim" | "evidence design" | "documentation design";
  claims: Array<{
    text: string;
    placement: "objective" | "evidence" | "authority" | "record";
  }>;
  applicability: string;
};

export type WorkflowRecord = {
  id: string;
  version: "1";
  family: ProcessFamilyId;
  family_name: string;
  name: string;
  summary: string;
  accounting_objective: string;
  accountable_owner: string;
  reviewer: string;
  trigger: string;
  scope: string;
  entity_scope: string;
  period_scope: string;
  trigger_scope: string;
  jurisdiction: string;
  inputs: string[];
  control_totals: string[];
  source_ids: string[];
  source_links: WorkflowSourceLink[];
  agent_procedures: string[];
  deterministic_checks: string[];
  read_tools: string[];
  write_tools: string[];
  authority_level: AuthorityLevelId;
  actions: WorkflowAction[];
  thresholds: string[];
  human_decisions: string[];
  segregation_of_duties: string[];
  stop_conditions: string[];
  outputs: string[];
  proposed_accounting_effects: string;
  run_record: string[];
  control_model: WorkflowControlModelMapping;
  retention: string;
  reproducibility: string;
  failure_modes: string[];
  recovery_actions: string[];
  pilot_measures: string[];
  production_signals: string[];
  reviewed_at: string;
  review_status: "published educational synthesis; professional sign-off not asserted";
  provenance: {
    publisher: "Accounting Agents";
    annotation_type: "original educational workflow record";
    source_basis: string[];
    review_process: "automated integrity checks and maintainer editorial review";
  };
};

export type SensitiveActionRecord = {
  id: string;
  version: "1";
  name: string;
  summary: string;
  default_authority: AuthorityLevelId;
  agent_may_prepare: string[];
  agent_may_execute: string[];
  human_only_conditions: string[];
  identity_and_sod: string[];
  limits: string[];
  approval_evidence: string[];
  pre_execution_checks: string[];
  rollback_or_compensation: string[];
  logging_and_review: string[];
  source_ids: string[];
  reviewed_at: string;
};

export type ControlPattern = {
  id: string;
  version: "1";
  name: string;
  risk: string;
  objective: string;
  procedure: string[];
  evidence: string[];
  exceptions: string[];
  owner: string;
  frequency: string;
  source_ids: string[];
  reviewed_at: string;
};

export type TemplateRecord = {
  id: string;
  version: "1";
  name: string;
  purpose: string;
  use_when: string;
  sections: Array<{ heading: string; prompt: string }>;
  reviewed_at: string;
};

export type GlossaryEntry = {
  id: string;
  term: string;
  definition: string;
  related: string[];
};
