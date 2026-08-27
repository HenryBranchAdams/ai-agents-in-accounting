import type { EvidenceClassificationId } from "./content-contract";

export const reviewerGuideId = "accounting-agent-reviewer-field-guide";
export const reviewerGuideVersion = "1.0.0";
export const reviewerGuidePreparedAt = "2026-08-27";

export const reviewerDispositions = ["approve", "modify-and-resubmit", "reject", "escalate"] as const;
export type ReviewerDisposition = (typeof reviewerDispositions)[number];

export type ReviewerCalibrationOption = {
  id: ReviewerDisposition;
  label: string;
};

export const accountingAgentReviewerGuide = {
  id: reviewerGuideId,
  version: reviewerGuideVersion,
  title: "Review agent-prepared accounting work",
  description:
    "A practical field guide for challenging evidence-linked accounting work, recording a defensible disposition, and stopping when support, authority, or reviewer independence is missing.",
  prepared_at: reviewerGuidePreparedAt,
  review_status: "maintainer-review-pending",
  review_note:
    "Maintainer review is pending. Subject-matter, independent, professional, audit, certification, or assurance review is not claimed.",
  primary_mode: "how-to",
  evidence_classification: "implementation-pattern" as EvidenceClassificationId,
  intended_audience:
    "Accounting reviewers, control owners, approvers, finance-transformation leads, internal-audit partners, and builders designing a review interface.",
  use_when:
    "Use this before accepting, modifying, rejecting, or escalating an agent-prepared workpaper, recommendation, proposed entry, research memo, control assessment, or other accounting artifact.",
  prerequisites: [
    "The objective, entity, period, population, applicable framework, materiality or precision, and reviewer authority are stated.",
    "The submitted packet has a stable version, source register, procedure record, deterministic check results, exceptions, proposed effects, and named decision owner.",
    "The reviewer is competent for the named scope, has disclosed relevant conflicts, and has not delegated the conclusion back to the agent.",
  ],
  required_inputs: [
    "Versioned reviewer packet and workpaper",
    "Source register with provenance, period, and applicability",
    "Population definition, control totals, exclusions, and materiality or precision",
    "Procedure record, deterministic checks, exceptions, contradictions, and unresolved questions",
    "Exact proposed conclusion or effect and its authority classification",
    "Preparer identity, reviewer identity or role, required approver, and re-review triggers",
  ],
  reader_outcome:
    "Produce a reviewer decision record that shows what was inspected, what was challenged, what changed, the disposition, the accountable actor, any conditions, and whether later action is separately authorized.",
  governing_rule: {
    id: "review-governing-rule",
    text: "Agents may prepare accounting work. Accountable people approve conclusions and sensitive external actions.",
    evidence_classification: "editorial-recommendation" as EvidenceClassificationId,
    implication:
      "Review is a substantive challenge of current evidence and judgment. A passing check, polished narrative, confidence score, or click-through does not transfer the reviewer’s accountability to the system.",
  },
  review_sequence: [
    {
      id: "review-step-mandate",
      label: "Confirm the mandate",
      action:
        "Confirm the exact artifact, entity, period, population, framework, conclusion, proposed effect, reviewer authority, and decision required.",
      challenge_questions: [
        "Is the requested decision within this reviewer’s assigned scope and authority?",
        "Are preparation, review, approval, and execution distinct actions?",
      ],
      proceed_when: "The scope and decision owner are specific and attributable.",
      stop_when: "The reviewer, scope, authority, or requested decision is missing or ambiguous.",
    },
    {
      id: "review-step-freeze-packet",
      label: "Freeze the packet",
      action:
        "Record the packet ID, version, preparer, submitted time, configuration, source versions, and exact proposed effect before review begins.",
      challenge_questions: [
        "Can the packet or proposed payload change after review without invalidating the decision?",
        "Can another reviewer reproduce the reviewed version?",
      ],
      proceed_when: "The reviewed artifact and proposed effect are immutable or any change forces re-review.",
      stop_when: "The reviewed version cannot be identified or can change silently.",
    },
    {
      id: "review-step-completeness",
      label: "Challenge completeness and provenance",
      action:
        "Reconcile source populations to control totals, inspect exclusions, trace material claims to approved evidence, and test period, entity, ownership, and applicability.",
      challenge_questions: [
        "What could be missing from the population or evidence set?",
        "Is any support fabricated, stale, contradictory, outside the approved scope, or inapplicable to these facts?",
      ],
      proceed_when: "Material claims and population boundaries are traceable to current, applicable evidence.",
      stop_when: "Completeness cannot be established or material support is missing, contradictory, fabricated, or inapplicable.",
    },
    {
      id: "review-step-reproduce",
      label: "Reproduce deterministic checks",
      action:
        "Reperform material calculations, tie-outs, schema checks, duplicate tests, threshold tests, and reconciliations from the retained inputs.",
      challenge_questions: [
        "Do the checks test the asserted objective at the required precision?",
        "Were failed checks, manual overrides, and excluded records preserved?",
      ],
      proceed_when: "Required checks pass on the reviewed inputs and any exception remains visible.",
      stop_when: "A required check cannot be reproduced, is too coarse, or was bypassed without attributable approval.",
    },
    {
      id: "review-step-exceptions",
      label: "Inspect exceptions and contradictions",
      action:
        "Read the full exception population, compare proposed resolutions to evidence, search for contrary facts, and preserve unresolved matters.",
      challenge_questions: [
        "Did the agent explain away an exception because the preferred answer was plausible?",
        "Would a different source, time window, or grouping change the result?",
      ],
      proceed_when: "Each material exception has support, an owner, and a recorded disposition or escalation.",
      stop_when: "A contradiction is hidden, a material exception is unresolved, or the proposed treatment exceeds the evidence.",
    },
    {
      id: "review-step-judgment",
      label: "Assess materiality, judgment, and alternatives",
      action:
        "Evaluate quantitative and qualitative materiality, assumptions, uncertainty, alternatives, contrary support, bias, and the limits of the applicable authority.",
      challenge_questions: [
        "Is a numerical threshold being used as a substitute for judgment?",
        "Are assumptions and valid alternatives visible, and does the conclusion remain supportable if a key assumption changes?",
      ],
      proceed_when: "The accountable reviewer can explain the selected treatment, alternatives, uncertainty, and applicability in their own words.",
      stop_when: "The conclusion depends on unstated assumptions, unsupported precision, or an authority outside its scope.",
    },
    {
      id: "review-step-disposition",
      label: "Choose a disposition",
      action:
        "Approve the reviewed artifact, require modification and resubmission, reject it, or escalate it to a person with the necessary expertise or authority.",
      challenge_questions: [
        "Does the disposition match the evidence rather than the cost of rework?",
        "Does approval apply only to the frozen artifact and exact conclusion or effect?",
      ],
      proceed_when: "The disposition, actor, rationale, conditions, and scope are explicit.",
      stop_when: "The reviewer cannot defend the decision or lacks competence, independence, or authority for the matter.",
    },
    {
      id: "review-step-record",
      label: "Record and route",
      action:
        "Seal the review record, retain changes and unresolved matters, identify re-review triggers, and route any separately approved action through its own authority controls.",
      challenge_questions: [
        "What later change would invalidate this decision?",
        "Is execution separately authorized, constrained, attributable, and reconciled?",
      ],
      proceed_when: "The record is attributable, payload-bound, reproducible, retained, and explicit about later authority.",
      stop_when: "The decision cannot be tied to the reviewed version or is being treated as general permission to execute.",
    },
  ],
  disposition_guide: [
    {
      id: "disposition-approve",
      disposition: "approve" as ReviewerDisposition,
      use_when: "The current packet is complete enough for the named decision, material evidence is applicable, checks reproduce, and judgment is supportable within the reviewer’s authority.",
      record: "Exact artifact and version, conclusion or preparatory output accepted, rationale, conditions, reviewer, time, and any separate approval or execution boundary.",
    },
    {
      id: "disposition-modify",
      disposition: "modify-and-resubmit" as ReviewerDisposition,
      use_when: "The work can be corrected without changing the reviewer, scope, or underlying decision authority.",
      record: "Required changes, owner, due point, affected claims or calculations, and a new version that must be reviewed again.",
    },
    {
      id: "disposition-reject",
      disposition: "reject" as ReviewerDisposition,
      use_when: "The proposed conclusion or work product is unsupported, misleading, fabricated, inapplicable, or inconsistent with required controls.",
      record: "Rejected conclusion or artifact, decisive evidence, reason, affected downstream work, and whether correction is permitted.",
    },
    {
      id: "disposition-escalate",
      disposition: "escalate" as ReviewerDisposition,
      use_when: "Material evidence is unresolved, a conflict exists, or the matter exceeds the reviewer’s competence, independence, scope, or authority.",
      record: "Open question, evidence gathered, conflict or authority gap, prohibited interim action, and the accountable escalation owner.",
    },
  ],
  stop_conditions: [
    "The packet, population, evidence, proposed effect, or reviewed version is not identifiable.",
    "Material evidence is missing, contradictory, fabricated, stale, unauthorized, or inapplicable.",
    "A required deterministic check fails, cannot be reproduced, or was bypassed without attributable approval.",
    "The conclusion depends on hidden assumptions, unsupported precision, or a confidence score rather than evidence.",
    "The reviewer lacks competence, independence, named scope, or authority for the decision.",
    "The same actor can prepare, alter, approve, execute, and conceal or reconcile the effect without independent challenge.",
    "A proposed sensitive action is being inferred from review instead of receiving its own payload-bound authorization.",
  ],
  minimum_reviewer_packet: [
    { id: "packet-objective", field: "Objective and decision", challenge: "What exact question must the reviewer decide, and what is not being decided?" },
    { id: "packet-scope", field: "Scope and applicability", challenge: "Which entity, period, population, framework, jurisdiction, thresholds, and exclusions apply?" },
    { id: "packet-version", field: "Version and actors", challenge: "Which immutable artifact, preparer, reviewer role, approver, configuration, and timestamps are in scope?" },
    { id: "packet-sources", field: "Source register", challenge: "Where did each material fact come from, and is the source current, complete, authorized, and applicable?" },
    { id: "packet-procedure", field: "Procedure record", challenge: "What was done, with which tools and rules, and where did the actual path differ from the approved method?" },
    { id: "packet-checks", field: "Deterministic checks", challenge: "Can the reviewer reproduce control totals, calculations, tie-outs, thresholds, and failed checks?" },
    { id: "packet-exceptions", field: "Exceptions and contradictions", challenge: "What remains missing, unusual, contradictory, prohibited, or unresolved?" },
    { id: "packet-judgment", field: "Judgment and alternatives", challenge: "Which assumptions, estimates, materiality factors, alternatives, uncertainty, and contrary support matter?" },
    { id: "packet-effects", field: "Exact proposed effect", challenge: "What conclusion, entry, action, communication, or filing payload is proposed, and at what authority level?" },
    { id: "packet-disposition", field: "Review disposition", challenge: "Who approved, modified, rejected, or escalated what exact version, why, and with which conditions?" },
    { id: "packet-rereview", field: "Re-review triggers", challenge: "Which source, fact, assumption, threshold, payload, configuration, or time change invalidates the decision?" },
    { id: "packet-retention", field: "Retention and downstream effect", challenge: "Where is the record retained, what later work relied on it, and how will correction propagate?" },
  ],
  automation_bias_traps: [
    {
      id: "trap-fluent-output",
      trap: "Treating polished prose as evidence of completeness or correctness.",
      countermeasure: "Start with population, source, check, and exception evidence before reading the proposed narrative conclusion.",
    },
    {
      id: "trap-confidence-score",
      trap: "Using model confidence as authority, materiality, or an approval threshold.",
      countermeasure: "Use evidence, applicable criteria, deterministic tests, and accountable judgment; confidence does not grant authority.",
    },
    {
      id: "trap-anchoring",
      trap: "Anchoring on the agent’s first classification or proposed adjustment.",
      countermeasure: "Form an independent expectation, inspect contrary evidence, and ask what result a different assumption would produce.",
    },
    {
      id: "trap-exception-fatigue",
      trap: "Clearing repeated exceptions because they are familiar or costly to investigate.",
      countermeasure: "Review the full exception population, trend recurrence, and escalate unresolved material items instead of normalizing them.",
    },
    {
      id: "trap-rubber-stamp",
      trap: "Treating a human click or brief chat response as substantive review.",
      countermeasure: "Require an attributable, version-bound decision record that shows the challenge performed and the evidence considered.",
    },
  ],
  worked_examples: [
    {
      id: "review-example-good-accrual",
      label: "Acceptable completed review record",
      domain: "Accrual and proposed entry",
      evidence_classification: "synthetic-example" as EvidenceClassificationId,
      fictional: true,
      facts:
        "Fictional Northwind Demo Co. has a synthetic August 2026 service log for 120 hours at an approved $100 rate, a complete purchase-order population, and a $12,000 unbilled service accrual prepared by an agent with a September 1 reversal.",
      challenge:
        "The reviewer ties the service-log population to the approved purchase order, reproduces 120 × $100, checks cutoff and reversal, inspects subsequent synthetic invoicing, and confirms no contradictory evidence or excluded vendors.",
      disposition: "approve" as ReviewerDisposition,
      record:
        "The fictional accountable reviewer accepts only packet `synthetic-accrual-review-v1` and the exact $12,000 proposed entry for separate approval-gated staging. The record names the evidence, checks, rationale, reviewer role, synthetic timestamp, re-review triggers, and no posting authority.",
      why: "The decision is evidence-linked, reproducible, version-bound, attributable, and explicit about later authority.",
    },
    {
      id: "review-example-stop-reconciliation",
      label: "Do not proceed",
      domain: "Bank reconciliation",
      evidence_classification: "synthetic-example" as EvidenceClassificationId,
      fictional: true,
      facts:
        "A synthetic $850 ledger receipt has no bank transaction or subsequent-bank evidence, but the agent labels it a deposit in transit so the reconciliation appears complete.",
      challenge:
        "The reviewer finds that the proposed classification exceeds the evidence and that the missing bank support is material to the stated completion criterion.",
      disposition: "escalate" as ReviewerDisposition,
      record:
        "Keep the item unresolved, reject the completed status, request the missing evidence, identify the owner, and prohibit any entry or close representation until the reviewer resolves the exception.",
      why: "A plausible explanation is not evidence, and a forced tie-out would conceal the missing support.",
    },
    {
      id: "review-example-conflict-control",
      label: "Conflict requiring reassignment",
      domain: "Control assessment",
      evidence_classification: "synthetic-example" as EvidenceClassificationId,
      fictional: true,
      facts:
        "The proposed reviewer designed the fictional close control, performed the agent-assisted control, cleared its exceptions, and is asked to conclude on operating effectiveness.",
      challenge:
        "The role combination prevents an independent challenge of design, performance, exception handling, and the final assessment.",
      disposition: "escalate" as ReviewerDisposition,
      record:
        "Disclose the conflict, preserve the prepared evidence, appoint an appropriately authorized reviewer outside the incompatible duties, and do not publish an effectiveness conclusion in the interim.",
      why: "A human in the loop is not sufficient when the human owns incompatible duties or lacks an independent basis for challenge.",
    },
    {
      id: "review-example-reject-research",
      label: "Claim that must not be published",
      domain: "Technical accounting research",
      evidence_classification: "synthetic-example" as EvidenceClassificationId,
      fictional: true,
      facts:
        "An agent cites a superseded summary outside the entity’s framework and labels its memo “professionally reviewed” even though no qualified reviewer appointment or completed review record exists.",
      challenge:
        "The source is inapplicable, contrary current authority is absent, and the review label is unsupported.",
      disposition: "reject" as ReviewerDisposition,
      record:
        "Remove the claim, replace the source with current applicable primary authority, document contrary support and open facts, and route the revised memo through a properly appointed accountable reviewer.",
      why: "Source retrieval and maintainer checks do not establish applicability or professional review.",
    },
  ],
  calibration_exercise: [
    {
      id: "calibration-reconciliation",
      domain: "Reconciliation",
      prompt: "The workpaper ties only after an unsupported $850 transit classification, and required bank evidence is missing. What is the defensible disposition?",
      options: [
        { id: "approve", label: "Approve because the balance now ties" },
        { id: "modify-and-resubmit", label: "Rewrite the explanation but keep the classification" },
        { id: "reject", label: "Reject the entire workflow permanently" },
        { id: "escalate", label: "Keep the exception open, request evidence, and escalate the unresolved treatment" },
      ] as readonly ReviewerCalibrationOption[],
      correct_option_id: "escalate" as ReviewerDisposition,
      rationale: "The missing evidence prevents the stated completion result. Preserve the exception and route the accountable decision rather than guessing.",
    },
    {
      id: "calibration-accrual",
      domain: "Accrual",
      prompt: "The calculation reproduces, but the agent used September service hours in an August accrual. The source set is complete and the error is correctable. What is the defensible disposition?",
      options: [
        { id: "approve", label: "Approve because the total calculation is mathematically correct" },
        { id: "modify-and-resubmit", label: "Correct cutoff, issue a new version, and review it again" },
        { id: "reject", label: "Reject all future use of the agent" },
        { id: "escalate", label: "Escalate without identifying a required correction" },
      ] as readonly ReviewerCalibrationOption[],
      correct_option_id: "modify-and-resubmit" as ReviewerDisposition,
      rationale: "The packet has a correctable period error. The reviewed version cannot be approved, but a precise correction and re-review path is available.",
    },
    {
      id: "calibration-research",
      domain: "Technical research",
      prompt: "A memo reaches a confident conclusion using a superseded source from another framework and omits contrary current authority. What is the defensible disposition?",
      options: [
        { id: "approve", label: "Approve because the memo is clear and confident" },
        { id: "modify-and-resubmit", label: "Add a disclaimer without changing the source basis" },
        { id: "reject", label: "Reject the conclusion and require current applicable primary authority" },
        { id: "escalate", label: "Escalate only after publishing the draft" },
      ] as readonly ReviewerCalibrationOption[],
      correct_option_id: "reject" as ReviewerDisposition,
      rationale: "The conclusion is built on inapplicable support and hides contrary authority. It must not be published as supported work.",
    },
    {
      id: "calibration-control",
      domain: "Control assessment",
      prompt: "The only proposed reviewer designed and performed the control and cleared the same exceptions. What is the defensible disposition?",
      options: [
        { id: "approve", label: "Approve because a human performed the review" },
        { id: "modify-and-resubmit", label: "Ask the same reviewer for more detail" },
        { id: "reject", label: "Delete the prepared evidence" },
        { id: "escalate", label: "Disclose the conflict and appoint an authorized reviewer outside the incompatible duties" },
      ] as readonly ReviewerCalibrationOption[],
      correct_option_id: "escalate" as ReviewerDisposition,
      rationale: "The evidence can be preserved, but the final assessment needs an appropriately authorized reviewer without the incompatible role combination.",
    },
  ],
  review_program_scaffold: {
    id: "subject-matter-review-program-scaffold",
    evidence_classification: "editorial-recommendation" as EvidenceClassificationId,
    approval_status: "maintainer-approval-required",
    claim_boundary:
      "This scaffold defines fields and visible states. It does not appoint a reviewer or establish that subject-matter, independent, professional, audited, certified, or assured review occurred.",
    qualification_fields: [
      "Named domain and decision scope",
      "Relevant current knowledge and experience",
      "Applicable credentials or role requirements when the scope requires them",
      "Ability to evaluate the evidence, framework, systems, estimates, controls, and materiality involved",
      "Documented limitations and matters requiring another specialist",
    ],
    appointment_fields: [
      "Reviewer identity and organization",
      "Appointing accountable maintainer",
      "Named pages, claims, versions, domains, jurisdictions, and periods",
      "Qualifications basis and disclosed limitations",
      "Conflict assessment and safeguards",
      "Required review evidence, completion criteria, expiration, and re-review cadence",
    ],
    conflict_questions: [
      "Did the reviewer prepare, approve, execute, sell, sponsor, or materially benefit from the work being reviewed?",
      "Can the reviewer challenge the work without incompatible duties, reporting pressure, or undisclosed commercial interest?",
      "Does the proposed safeguard actually create an appropriately authorized second perspective?",
    ],
    re_review_triggers: [
      "Source, law, standard, framework, or regulator guidance changes",
      "Material facts, scope, population, jurisdiction, period, or assumptions change",
      "A correction, incident, contrary source, conflict, or unsupported claim is identified",
      "A model, prompt, policy, tool, schema, evaluator, template, or proposed payload changes materially",
      "The appointment or stated review period expires",
    ],
    review_states: [
      { id: "review-state-proposed", state: "proposed", meaning: "A reviewer or scope has been suggested but not approved or appointed.", allowed_claim: "Proposed review only; no completed review claim." },
      { id: "review-state-appointed", state: "appointed", meaning: "An accountable maintainer approved a reviewer, scope, conflict assessment, and review criteria.", allowed_claim: "Reviewer appointed for the named scope; completion is not claimed." },
      { id: "review-state-completed", state: "completed", meaning: "The appointed reviewer completed the named procedure on the exact version and a retained record exists.", allowed_claim: "Describe only the documented reviewer type, scope, version, date, and conclusion." },
      { id: "review-state-expired", state: "expired", meaning: "The review period or appointment ended or a required freshness window passed.", allowed_claim: "Historical review only; current reliance requires re-review." },
      { id: "review-state-superseded", state: "superseded", meaning: "A later version or review record replaced this one.", allowed_claim: "Do not present the superseded record as current; link the replacement." },
      { id: "review-state-unavailable", state: "unavailable", meaning: "No qualifying appointment or completed record is available for the claim.", allowed_claim: "State that subject-matter or other elevated review is not claimed." },
    ],
    current_project_claim_state: {
      state: "unavailable",
      note: "This guide publishes no subject-matter reviewer appointment or completed subject-matter review record. Maintainer review remains pending.",
    },
  },
  related_material: [
    { id: "review-link-evidence", kind: "explanation", label: "Why evidence and assurance labels differ", href: "/evidence-assurance" },
    { id: "review-link-authority", kind: "reference", label: "Classify each action and approval boundary", href: "/authority" },
    { id: "review-link-control-model", kind: "reference", label: "Apply the nine-element Control Model", href: "/control-model" },
    { id: "review-link-template", kind: "template", label: "Use the workpaper and reviewer-packet fields", href: "/templates#tpl-reviewer-packet" },
    { id: "review-link-bank-case", kind: "case", label: "Inspect the synthetic bank-reconciliation pack", href: "/packs/bank-reconciliation" },
    { id: "review-link-accrual-case", kind: "case", label: "Inspect the synthetic accrual-entry pack", href: "/packs/accrual-journal-entry" },
    { id: "review-link-research-case", kind: "case", label: "Inspect technical and policy workflows", href: "/workflows/technical-policy" },
    { id: "review-link-control-case", kind: "case", label: "Inspect the synthetic ICFR-control-review pack", href: "/packs/icfr-control-review" },
  ],
  limitations: [
    "This field guide is an educational implementation pattern, not accounting, audit, tax, legal, investment, regulatory, or professional advice.",
    "Reviewer competence, independence, authority, evidence, materiality, and required procedures depend on the exact entity, facts, role, framework, jurisdiction, engagement, and current requirements.",
    "A completed checklist, maintainer review, automated test, or human click does not establish subject-matter review, professional judgment, control effectiveness, or assurance.",
    "Approval of a work product does not authorize posting, payment, filing, certification, communication, or another sensitive external action; authorize and constrain that effect separately.",
  ],
  next_action:
    "Choose one current or synthetic reviewer packet, apply every review step, record one of the four dispositions, and route any unresolved evidence, conflict, or authority gap to the accountable person.",
  source_basis: [
    {
      id: "src_1qpx6gc",
      title: "PCAOB AS 1000, General Responsibilities of the Auditor in Conducting an Audit",
      href: "/resources/src_1qpx6gc",
      evidence_classification: "authoritative-requirement" as EvidenceClassificationId,
      scope: "Binding for in-scope US public-company audits. Competence, due professional care, skepticism, and auditor responsibility do not automatically govern other work or make this guide an audit procedure.",
    },
    {
      id: "src_0vf7hhg",
      title: "PCAOB AS 1105, Audit Evidence",
      href: "/resources/src_0vf7hhg",
      evidence_classification: "authoritative-requirement" as EvidenceClassificationId,
      scope: "Binding for in-scope US public-company audits. It informs the evidence challenge but is not automatically applicable to controllership or other non-audit review.",
    },
    {
      id: "src_1l42i21",
      title: "PCAOB AS 1201, Supervision of the Audit Engagement",
      href: "/resources/src_1l42i21",
      evidence_classification: "authoritative-requirement" as EvidenceClassificationId,
      scope: "Binding for in-scope US public-company audits. Its direction, supervision, and review requirements illustrate why technology does not remove assigned human responsibilities.",
    },
    {
      id: "src_1l45nk0",
      title: "PCAOB AS 1215, Audit Documentation",
      href: "/resources/src_1l45nk0",
      evidence_classification: "authoritative-requirement" as EvidenceClassificationId,
      scope: "Binding for in-scope US public-company audits. It supports traceable documentation concepts; retention and documentation requirements elsewhere may differ.",
    },
    {
      id: "src_0gq92vl",
      title: "PCAOB AS 2301, Responses to Risks of Material Misstatement",
      href: "/resources/src_0gq92vl",
      evidence_classification: "authoritative-requirement" as EvidenceClassificationId,
      scope: "Binding for in-scope US public-company audits. Objectives, populations, precision, and exception handling must be adapted to the actual work and authority.",
    },
    {
      id: "src_secsab0099",
      title: "SEC Staff Accounting Bulletin No. 99 — Materiality",
      href: "/resources/src_secsab0099",
      evidence_classification: "official-guidance" as EvidenceClassificationId,
      scope: "SEC staff guidance for US registrants. It explains why quantitative thresholds do not replace qualitative analysis; it is not a universal materiality rule.",
    },
    {
      id: "src_1f8xnth",
      title: "IAASB, Addressing Risk of Overreliance on Technology",
      href: "/resources/src_1f8xnth",
      evidence_classification: "official-guidance" as EvidenceClassificationId,
      scope: "Official audit-technology guidance on overreliance. It informs the automation-bias section but does not itself establish local accounting or assurance requirements.",
    },
  ],
  rights: {
    editorial_content: "CC-BY-4.0",
    synthetic_examples_and_factual_metadata: "CC0-1.0",
    external_sources: "Publisher terms apply; no external full text is stored in this record.",
  },
} as const;

function markdownCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function labelDisposition(value: ReviewerDisposition) {
  return {
    approve: "Approve",
    "modify-and-resubmit": "Modify and resubmit",
    reject: "Reject",
    escalate: "Escalate",
  }[value];
}

export function renderReviewerGuideMarkdown() {
  const guide = accountingAgentReviewerGuide;
  const lines = [
    `# ${guide.title}`,
    "",
    `> ${guide.description}`,
    "",
    `- Guide ID: \`${guide.id}\`; version ${guide.version}`,
    `- Prepared: ${guide.prepared_at}`,
    `- Review status: ${guide.review_status}`,
    "- Primary mode: How-to",
    `- Evidence classification: ${guide.evidence_classification}`,
    "",
    "## Outcome and prerequisites",
    "",
    `- Intended audience: ${guide.intended_audience}`,
    `- Use when: ${guide.use_when}`,
    `- Expected outcome: ${guide.reader_outcome}`,
    ...guide.prerequisites.map((item) => `- Prerequisite: ${item}`),
    "",
    "### Required inputs",
    "",
    ...guide.required_inputs.map((item) => `- ${item}`),
    "",
    "## Governing rule",
    "",
    `**${guide.governing_rule.text}**`,
    "",
    `- Stable ID: \`${guide.governing_rule.id}\``,
    `- Evidence classification: ${guide.governing_rule.evidence_classification}`,
    `- Implication: ${guide.governing_rule.implication}`,
    "",
    "## Ordered review procedure",
    "",
  ];

  for (const [index, step] of guide.review_sequence.entries()) {
    lines.push(
      `### ${index + 1}. ${step.label} (\`${step.id}\`)`,
      "",
      step.action,
      "",
      ...step.challenge_questions.map((item) => `- Challenge: ${item}`),
      `- Proceed when: ${step.proceed_when}`,
      `- Stop when: ${step.stop_when}`,
      "",
    );
  }

  lines.push(
    "## Disposition guide",
    "",
    "| Stable ID | Disposition | Use when | Record |",
    "|---|---|---|---|",
    ...guide.disposition_guide.map((item) => `| \`${item.id}\` | ${labelDisposition(item.disposition)} | ${markdownCell(item.use_when)} | ${markdownCell(item.record)} |`),
    "",
    "## Stop conditions",
    "",
    ...guide.stop_conditions.map((item) => `- ${item}`),
    "",
    "## Minimum reviewer packet",
    "",
    "| Stable ID | Field | Reviewer challenge |",
    "|---|---|---|",
    ...guide.minimum_reviewer_packet.map((item) => `| \`${item.id}\` | ${item.field} | ${markdownCell(item.challenge)} |`),
    "",
    "## Automation-bias traps",
    "",
    "| Stable ID | Trap | Countermeasure |",
    "|---|---|---|",
    ...guide.automation_bias_traps.map((item) => `| \`${item.id}\` | ${markdownCell(item.trap)} | ${markdownCell(item.countermeasure)} |`),
    "",
    "## Completed and failure examples",
    "",
  );

  for (const example of guide.worked_examples) {
    lines.push(
      `### ${example.label}: ${example.domain} (\`${example.id}\`)`,
      "",
      "- Evidence classification: synthetic-example",
      "- Fictional: true",
      `- Facts: ${example.facts}`,
      `- Challenge: ${example.challenge}`,
      `- Disposition: ${labelDisposition(example.disposition)}`,
      `- Review record: ${example.record}`,
      `- Why: ${example.why}`,
      "",
    );
  }

  lines.push("## Calibration exercise", "");
  for (const item of guide.calibration_exercise) {
    lines.push(
      `### ${item.domain}: ${item.prompt} (\`${item.id}\`)`,
      "",
      ...item.options.map((option) => `- ${option.id === item.correct_option_id ? "[x]" : "[ ]"} ${option.label} (\`${option.id}\`)`),
      "",
      `Answer: ${labelDisposition(item.correct_option_id)}. ${item.rationale}`,
      "",
    );
  }

  const program = guide.review_program_scaffold;
  lines.push(
    "## Subject-matter review program scaffold",
    "",
    `- Scaffold ID: \`${program.id}\``,
    `- Evidence classification: ${program.evidence_classification}`,
    `- Approval status: ${program.approval_status}`,
    `- Claim boundary: ${program.claim_boundary}`,
    "",
    "### Qualification fields",
    "",
    ...program.qualification_fields.map((item) => `- ${item}`),
    "",
    "### Appointment fields",
    "",
    ...program.appointment_fields.map((item) => `- ${item}`),
    "",
    "### Conflict questions",
    "",
    ...program.conflict_questions.map((item) => `- ${item}`),
    "",
    "### Re-review triggers",
    "",
    ...program.re_review_triggers.map((item) => `- ${item}`),
    "",
    "### Visible review states",
    "",
    "| Stable ID | State | Meaning | Allowed claim |",
    "|---|---|---|---|",
    ...program.review_states.map((item) => `| \`${item.id}\` | ${item.state} | ${markdownCell(item.meaning)} | ${markdownCell(item.allowed_claim)} |`),
    "",
    `Current project claim state: ${program.current_project_claim_state.state} — ${program.current_project_claim_state.note}`,
    "",
    "## Related material",
    "",
    ...guide.related_material.map((item) => `- [${item.label}](${item.href}) (\`${item.id}\`; ${item.kind})`),
    "",
    "## Limitations",
    "",
    ...guide.limitations.map((item) => `- ${item}`),
    "",
    `Next action: ${guide.next_action}`,
    "",
    "## Source basis",
    "",
    ...guide.source_basis.map((source) => `- [${source.title}](${source.href}) (\`${source.id}\`; ${source.evidence_classification}) — ${source.scope}`),
    "",
    "## Rights and review",
    "",
    `- ${guide.review_note}`,
    `- Original editorial content: ${guide.rights.editorial_content}`,
    `- Project-created synthetic examples and factual metadata: ${guide.rights.synthetic_examples_and_factual_metadata}`,
    `- External sources: ${guide.rights.external_sources}`,
  );

  return lines.join("\n").trimEnd() + "\n";
}
