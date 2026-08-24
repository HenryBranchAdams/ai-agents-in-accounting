export const corpusReviewedAt = "2026-08-23";
export const corpusModifiedAt = "2026-08-23T00:00:00.000Z";
export const corpusVersion = "2026-08-23.5";
export const domainSchemaVersion = "1.0";

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
