import type { EvidenceClassificationId } from "./content-contract";
import {
  resourceCurationById,
  resources,
  sourceEvidenceTiers,
  sourceRelationshipProfiles,
  type SourceEvidenceTier,
} from "./resources-data";

export const coreCourseId = "accounting-agents-core-course";
export const coreCourseVersion = "1.0.0";
export const coreCoursePreparedAt = "2026-08-27";

export const coreCourseLensIds = [
  "accounting-practitioner",
  "reviewer-assurance",
  "agent-builder",
  "control-owner",
] as const;

export type CoreCourseLensId = (typeof coreCourseLensIds)[number];
export type CoreCourseReadingRole = "required" | "framework-choice" | "case-comparison";

type CoreCourseReadingSpec = {
  id: string;
  order: number;
  resource_id: string;
  role: CoreCourseReadingRole;
  contribution: string;
  why_it_matters: string;
  learning_outcome: string;
  related_workflow_ids: string[];
  audience_lenses: CoreCourseLensId[];
  evidence_tier?: SourceEvidenceTier;
  importance?: "core" | "high" | "supporting";
  estimated_reading_minutes?: number;
  key_limitation?: string;
};

export type CoreCourseReading = CoreCourseReadingSpec & {
  title: string;
  publisher: string;
  source_type: string;
  topic: string;
  catalog_href: string;
  original_href: string;
  evidence_tier: SourceEvidenceTier;
  evidence_tier_label: string;
  importance: "core" | "high" | "supporting";
  estimated_reading_minutes: number;
  key_limitation: string;
  source_status: string;
  source_lifecycle: string;
  source_verified_at: string | null;
  relationship_profiled: boolean;
};

export type CoreCourseModule = {
  id: string;
  order: number;
  title: string;
  question: string;
  accountants_bridge: string;
  builders_bridge: string;
  assignment: string;
  related_material: { label: string; href: string }[];
  readings: CoreCourseReading[];
};

const resourceById = new Map(resources.map((resource) => [resource.id, resource]));
const evidenceTierLabelById = new Map(sourceEvidenceTiers.map((tier) => [tier.id, tier.label]));

function resolveReading(spec: CoreCourseReadingSpec): CoreCourseReading {
  const resource = resourceById.get(spec.resource_id);
  if (!resource) throw new Error(`Unknown core-course source: ${spec.resource_id}`);

  const profile = sourceRelationshipProfiles[spec.resource_id];
  const curation = resourceCurationById[spec.resource_id];
  const evidenceTier = spec.evidence_tier ?? profile?.evidence_tier;
  const importance = spec.importance ?? profile?.importance;
  const readingMinutes = spec.estimated_reading_minutes ?? profile?.estimated_reading_minutes;
  const keyLimitation = spec.key_limitation ?? profile?.limitations[0];

  if (!evidenceTier || !importance || !readingMinutes || !keyLimitation) {
    throw new Error(`Incomplete core-course curation for ${spec.resource_id}`);
  }
  if (profile && profile.evidence_tier !== evidenceTier) {
    throw new Error(`Core-course evidence tier disagrees with source profile for ${spec.resource_id}`);
  }

  return {
    ...spec,
    title: resource.title,
    publisher: resource.owner,
    source_type: resource.kind,
    topic: resource.topic,
    catalog_href: `/resources/${resource.id}`,
    original_href: resource.href,
    evidence_tier: evidenceTier,
    evidence_tier_label: evidenceTierLabelById.get(evidenceTier) ?? evidenceTier,
    importance,
    estimated_reading_minutes: readingMinutes,
    key_limitation: keyLimitation,
    source_status: curation?.publication_status ?? resource.date,
    source_lifecycle: curation?.lifecycle ?? "catalog record only",
    source_verified_at: curation?.source_verified_at ?? null,
    relationship_profiled: Boolean(profile),
  };
}

const courseModules: CoreCourseModule[] = [
  {
    id: "module-professional-boundary",
    order: 1,
    title: "Professional and reporting boundary",
    question: "What makes agent-prepared work accounting work rather than a plausible system output?",
    accountants_bridge:
      "Connect familiar professional duties, reporting frameworks, and internal control to the design of an agent system.",
    builders_bridge:
      "Learn why accounting authority, framework applicability, accountability, and control objectives must be explicit system inputs.",
    assignment:
      "Write the applicable reporting framework, professional responsibility, control objective, and human conclusion owner for one synthetic workflow.",
    related_material: [
      { label: "Start here", href: "/start-here" },
      { label: "Authority ladder", href: "/authority" },
      { label: "Accounting Agent Control Model", href: "/control-model" },
    ],
    readings: [
      resolveReading({
        id: "canon-01-aicpa-code",
        order: 1,
        resource_id: "src_10b9y2x",
        role: "required",
        contribution: "Professional duties, ethical principles, and rule applicability for AICPA members and engagements.",
        why_it_matters: "An agent does not inherit professional standing, independence, judgment, or approval authority from the person or firm using it.",
        learning_outcome: "State which professional responsibilities remain human-owned and which source scope must be verified before reliance.",
        related_workflow_ids: ["wf-audit-management-review", "wf-technical-memoranda"],
        audience_lenses: ["accounting-practitioner", "reviewer-assurance", "control-owner"],
      }),
      resolveReading({
        id: "canon-02-fasb-asc",
        order: 2,
        resource_id: "src_1os761s",
        role: "framework-choice",
        contribution: "The authoritative source of nongovernmental US GAAP recognition, measurement, presentation, and disclosure requirements.",
        why_it_matters: "A model-generated treatment is not authoritative support; the applicable Codification text and facts remain the basis for the conclusion.",
        learning_outcome: "Route a US GAAP question to current authoritative literature and separate research from approval of the accounting conclusion.",
        related_workflow_ids: ["wf-technical-accounting-research", "wf-technical-memoranda", "wf-r2r-journal-entry"],
        audience_lenses: ["accounting-practitioner", "reviewer-assurance", "agent-builder"],
      }),
      resolveReading({
        id: "canon-03-ifrs-navigator",
        order: 3,
        resource_id: "src_0n4x3cf",
        role: "framework-choice",
        contribution: "The official route to IFRS Accounting Standards and related issued material.",
        why_it_matters: "Framework, jurisdiction, effective date, and access tier must be known before an agent can retrieve or cite applicable IFRS material.",
        learning_outcome: "Route an IFRS question to the current official source and record local adoption and effective-period limits.",
        related_workflow_ids: ["wf-technical-accounting-research", "wf-technical-memoranda", "wf-r2r-financial-reporting"],
        audience_lenses: ["accounting-practitioner", "reviewer-assurance", "agent-builder"],
      }),
      resolveReading({
        id: "canon-04-coso-ic",
        order: 4,
        resource_id: "src_1v1zwt5",
        role: "required",
        contribution: "A durable framework for control objectives, components, principles, information, communication, and monitoring.",
        why_it_matters: "Agent controls must operate inside the entity's control system; a passing model evaluation does not establish control design or operating effectiveness.",
        learning_outcome: "Map an agent-assisted workflow to control objectives, responsible people, activities, evidence, and monitoring without claiming effectiveness.",
        related_workflow_ids: ["wf-audit-icfr-design", "wf-audit-icfr-testing", "wf-audit-management-review"],
        audience_lenses: ["accounting-practitioner", "reviewer-assurance", "agent-builder", "control-owner"],
      }),
    ],
  },
  {
    id: "module-evidence-review",
    order: 2,
    title: "Evidence, documentation, and review",
    question: "What must the retained record let an accountable reviewer understand and challenge?",
    accountants_bridge:
      "Translate audit-evidence and documentation ideas into everyday reconciliations, entries, estimates, memos, and control workpapers.",
    builders_bridge:
      "Treat provenance, contradictory evidence, performer and reviewer attribution, period state, and later changes as product requirements.",
    assignment:
      "Specify the minimum evidence packet, deterministic checks, unresolved exceptions, reviewer decision, and retained change record for the synthetic workflow.",
    related_material: [
      { label: "Reviewer field guide", href: "/reviewer-guide" },
      { label: "Evidence and assurance", href: "/evidence-assurance" },
      { label: "Bank-reconciliation workflow brief", href: "/workflows/record-to-report/wf-r2r-bank-reconciliations" },
    ],
    readings: [
      resolveReading({
        id: "canon-05-as-1105",
        order: 5,
        resource_id: "src_0vf7hhg",
        role: "required",
        contribution: "A normative PCAOB account of audit-evidence sufficiency, appropriateness, relevance, reliability, and contradiction.",
        why_it_matters: "The source makes visible why retrieved material, model confidence, and a clean narrative are not substitutes for appropriate evidence.",
        learning_outcome: "Define evidence quality, contradiction handling, and stop conditions for a bounded accounting-agent procedure.",
        related_workflow_ids: ["wf-audit-evidence-evaluation", "wf-audit-population-evidence"],
        audience_lenses: ["accounting-practitioner", "reviewer-assurance", "agent-builder", "control-owner"],
      }),
      resolveReading({
        id: "canon-06-as-1215",
        order: 6,
        resource_id: "src_1l45nk0",
        role: "required",
        contribution: "A normative PCAOB baseline for reviewable documentation, attribution, completion, retention, and later changes.",
        why_it_matters: "Tool traces can aid diagnosis, but they do not by themselves explain purpose, evidence, exceptions, judgment, review, and disposition.",
        learning_outcome: "Specify a workpaper and change record that an experienced reviewer can understand without replaying hidden system state.",
        related_workflow_ids: ["wf-audit-evidence-evaluation", "wf-audit-management-review", "wf-technical-memoranda"],
        audience_lenses: ["accounting-practitioner", "reviewer-assurance", "agent-builder", "control-owner"],
      }),
      resolveReading({
        id: "canon-07-as-2201",
        order: 7,
        resource_id: "src_075usnq",
        role: "required",
        contribution: "A normative PCAOB source for top-down, risk-based ICFR audit work and the distinction between design and operating effectiveness.",
        why_it_matters: "An agent can prepare evidence and tests, but management and auditor responsibilities, control conclusions, and applicable criteria remain distinct.",
        learning_outcome: "Separate control performance, management assessment, audit testing, and accountable conclusions in an agent-assisted ICFR workflow.",
        related_workflow_ids: ["wf-audit-icfr-design", "wf-audit-icfr-testing", "wf-audit-management-review"],
        audience_lenses: ["accounting-practitioner", "reviewer-assurance", "control-owner"],
      }),
      resolveReading({
        id: "canon-08-aicpa-ai-audit",
        order: 8,
        resource_id: "src_0wjye53",
        role: "required",
        contribution: "Professional guidance that frames generative and agentic AI use in audit through competence, skepticism, evidence, supervision, and documentation.",
        why_it_matters: "It connects AI-specific operating questions to familiar audit responsibilities without treating an AI capability as audit evidence or an audit conclusion.",
        learning_outcome: "Identify the audit responsibilities and documentation questions that remain when an agent prepares part of the work.",
        related_workflow_ids: ["wf-audit-evidence-evaluation", "wf-audit-management-review"],
        audience_lenses: ["reviewer-assurance", "agent-builder", "control-owner"],
      }),
    ],
  },
  {
    id: "module-agent-systems",
    order: 3,
    title: "Agent systems and risk",
    question: "What turns a language model into a bounded, observable, and governable system?",
    accountants_bridge:
      "Learn models, tools, state, orchestration, permissions, and failure modes through accounting evidence and approval examples rather than code.",
    builders_bridge:
      "Connect agent patterns to explicit objectives, evidence contracts, least privilege, deterministic controls, durable records, and human decisions.",
    assignment:
      "Draw the model, approved tools, durable state, permissions, deterministic checks, approval gate, and retained record for the synthetic workflow.",
    related_material: [
      { label: "Agent fundamentals", href: "/fundamentals" },
      { label: "System architecture", href: "/architecture" },
      { label: "Security and identity", href: "/security-identity" },
    ],
    readings: [
      resolveReading({
        id: "canon-09-react",
        order: 9,
        resource_id: "src_react2023",
        role: "required",
        contribution: "A foundational research pattern for interleaving language-model reasoning with actions in an external environment.",
        why_it_matters: "It gives accountants a concrete picture of why an agent can choose tools and steps, while giving builders a baseline pattern whose accounting controls remain unspecified.",
        learning_outcome: "Distinguish model reasoning, tool action, observation, and external authorization in an accounting-agent loop.",
        related_workflow_ids: ["wf-r2r-bank-reconciliations", "wf-audit-evidence-evaluation"],
        audience_lenses: ["accounting-practitioner", "reviewer-assurance", "agent-builder", "control-owner"],
        evidence_tier: "tier-3-research",
        importance: "core",
        estimated_reading_minutes: 25,
        key_limitation: "The paper studies general interactive tasks, not accounting accuracy, professional judgment, approval, or control effectiveness.",
      }),
      resolveReading({
        id: "canon-10-nist-ai-rmf",
        order: 10,
        resource_id: "src_0nrsy1i",
        role: "required",
        contribution: "A voluntary, risk-based framework organized around govern, map, measure, and manage functions.",
        why_it_matters: "It supplies a common risk vocabulary for owners, builders, and reviewers without replacing accounting frameworks, laws, or professional standards.",
        learning_outcome: "Map an accounting-agent pilot to named risk owners, context, measures, controls, monitoring, and escalation.",
        related_workflow_ids: ["wf-audit-icfr-design", "wf-audit-management-review"],
        audience_lenses: ["reviewer-assurance", "agent-builder", "control-owner"],
        evidence_tier: "tier-2-official-guidance",
        importance: "core",
        estimated_reading_minutes: 30,
        key_limitation: "The AI RMF is voluntary general guidance and does not determine accounting treatment, audit compliance, or system effectiveness.",
      }),
      resolveReading({
        id: "canon-11-nist-genai-profile",
        order: 11,
        resource_id: "src_0ao5x0t",
        role: "required",
        contribution: "A companion risk profile for generative-AI risks and suggested actions across the AI lifecycle.",
        why_it_matters: "It helps teams look beyond answer accuracy to provenance, confabulation, information integrity, misuse, privacy, and monitoring.",
        learning_outcome: "Add generative-AI-specific risks and evidence requirements to the accounting workflow's risk register and test plan.",
        related_workflow_ids: ["wf-audit-icfr-design", "wf-audit-evidence-evaluation"],
        audience_lenses: ["reviewer-assurance", "agent-builder", "control-owner"],
        evidence_tier: "tier-2-official-guidance",
        importance: "high",
        estimated_reading_minutes: 30,
        key_limitation: "The profile is cross-sector guidance, not an accounting, audit, security-certification, or legal compliance determination.",
      }),
      resolveReading({
        id: "canon-12-hidden-debt",
        order: 12,
        resource_id: "src_1ttzngc",
        role: "required",
        contribution: "A system-level account of data dependencies, feedback loops, undeclared consumers, configuration debt, and boundary erosion in machine-learning systems.",
        why_it_matters: "Accounting agents inherit dependencies across ledgers, spreadsheets, close tools, workpapers, identities, and downstream reports that a successful demo can hide.",
        learning_outcome: "List the data, configuration, consumer, monitoring, and change dependencies that must be owned beyond the model prompt.",
        related_workflow_ids: ["wf-r2r-close-orchestration", "wf-r2r-financial-reporting"],
        audience_lenses: ["agent-builder", "control-owner", "reviewer-assurance"],
        evidence_tier: "tier-3-research",
        importance: "high",
        estimated_reading_minutes: 18,
        key_limitation: "The paper predates modern language-model agents and offers qualitative engineering analysis rather than accounting outcome evidence.",
      }),
    ],
  },
  {
    id: "module-evaluation",
    order: 4,
    title: "Evaluation and accounting-native evidence",
    question: "What evidence supports a bounded claim that an accounting-agent system works?",
    accountants_bridge:
      "Read experiments and benchmarks as evidence with samples, tasks, methods, failure modes, and transfer limits—not as product scores.",
    builders_bridge:
      "Separate model behavior from system behavior, use held-out known-answer work, and move deterministic accounting checks out of model judgment where possible.",
    assignment:
      "Write one testable claim, known-answer cases, deterministic checks, expert-review questions, failure thresholds, and an explicit non-claim for the synthetic workflow.",
    related_material: [
      { label: "Evaluation and testing", href: "/evaluation" },
      { label: "Evidence and assurance", href: "/evidence-assurance" },
      { label: "Coverage and gaps", href: "/coverage" },
    ],
    readings: [
      resolveReading({
        id: "canon-13-agents-that-matter",
        order: 13,
        resource_id: "src_0j5fy58",
        role: "required",
        contribution: "A peer-reviewed critique and framework for evaluating agent systems with cost, reproducibility, holdouts, shortcuts, and downstream utility in view.",
        why_it_matters: "It helps prevent one favorable run or a model-only score from becoming a broad claim about accounting-workflow value.",
        learning_outcome: "Design an evaluation that identifies the system, held-out work, cost, repeatability, shortcuts, and decision-relevant outcome.",
        related_workflow_ids: ["wf-r2r-bank-reconciliations", "wf-audit-evidence-evaluation"],
        audience_lenses: ["reviewer-assurance", "agent-builder", "control-owner"],
        evidence_tier: "tier-3-research",
        importance: "core",
        estimated_reading_minutes: 25,
        key_limitation: "Its examples are general agent benchmarks rather than validated accounting workflows, control tests, or professional-review studies.",
      }),
      resolveReading({
        id: "canon-14-finbalance",
        order: 14,
        resource_id: "src_0qwi4ry",
        role: "required",
        contribution: "An accounting-native reconciliation benchmark that exposes multi-document evidence, ambiguity, and reliability limits.",
        why_it_matters: "It supplies field-specific evidence that plausible language performance does not settle longer, evidence-linked accounting work.",
        learning_outcome: "Explain what a bounded accounting benchmark can and cannot establish about a supervised workflow in a different environment.",
        related_workflow_ids: ["wf-r2r-bank-reconciliations", "wf-r2r-balance-reconciliations"],
        audience_lenses: ["accounting-practitioner", "reviewer-assurance", "agent-builder"],
      }),
      resolveReading({
        id: "canon-15-agentic-auditing",
        order: 15,
        resource_id: "src_agenticaudit",
        role: "required",
        contribution: "An exploratory research design for decomposing audit work across specialized agents and retained evidence.",
        why_it_matters: "It is useful as an architecture hypothesis while making clear that orchestration does not confer audit authority or prove evidence sufficiency.",
        learning_outcome: "Separate a promising multi-agent design from the deterministic checks, methodology approval, known-answer testing, and human review still required.",
        related_workflow_ids: ["wf-audit-population-evidence", "wf-audit-evidence-evaluation"],
        audience_lenses: ["reviewer-assurance", "agent-builder"],
      }),
      resolveReading({
        id: "canon-16-auditflow",
        order: 16,
        resource_id: "src_auditflow26",
        role: "required",
        contribution: "A research example of combining graph-grounded financial-reporting work with executable deterministic validation.",
        why_it_matters: "Its ablation makes a concrete case for moving inspectable rule checks out of model judgment in a bounded structured-data task.",
        learning_outcome: "Identify which accounting verification operations should be deterministic, typed, reproducible, and retained as evidence.",
        related_workflow_ids: ["wf-r2r-financial-tieout", "wf-audit-evidence-evaluation"],
        audience_lenses: ["reviewer-assurance", "agent-builder", "control-owner"],
      }),
      resolveReading({
        id: "canon-17-ifrs-xbrl-experiment",
        order: 17,
        resource_id: "src_06z3svl",
        role: "required",
        contribution: "An official-staff experiment on how structured XBRL data and tool use affect model performance in financial and sustainability analysis.",
        why_it_matters: "It gives readers a bounded example of how information structure and tools can change performance without proving a production accounting outcome.",
        learning_outcome: "State the tested method, result boundary, and additional evidence needed before transferring a structured-data finding into a workflow.",
        related_workflow_ids: ["wf-r2r-financial-tieout", "wf-r2r-financial-reporting"],
        audience_lenses: ["accounting-practitioner", "reviewer-assurance", "agent-builder"],
        evidence_tier: "tier-3-research",
        importance: "high",
        estimated_reading_minutes: 20,
        key_limitation: "The experiment is an official staff study in selected analysis tasks, not a general result for ledgers, controls, audit evidence, or production systems.",
      }),
    ],
  },
  {
    id: "module-pilot",
    order: 5,
    title: "Practice claims and supervised pilots",
    question: "How should a team turn guidance, research, and product documentation into a safe local learning plan?",
    accountants_bridge:
      "Separate documented feature availability from accuracy, control effectiveness, value, and fit in the team's own accounting process.",
    builders_bridge:
      "Translate provider capabilities into permissions, data, known-answer cases, review capacity, stop conditions, monitoring, and rollback requirements.",
    assignment:
      "Prepare a supervised-pilot question that names the feature, synthetic task, known answer, evidence, authority boundary, reviewer, failure threshold, rollback, and non-claims.",
    related_material: [
      { label: "Pilot checklist", href: "/pilot" },
      { label: "Controls and authority", href: "/controls" },
      { label: "Workflow brief pilot", href: "/workflows/record-to-report/wf-r2r-bank-reconciliations" },
    ],
    readings: [
      resolveReading({
        id: "canon-18-osfi-agentic-ai",
        order: 18,
        resource_id: "src_osfi26agent",
        role: "case-comparison",
        contribution: "Official financial-sector risk guidance on generative and agentic AI implications for technology, cyber security, and operational resilience.",
        why_it_matters: "It demonstrates how a regulator frames ownership, access, concentration, monitoring, and resilience without certifying a specific product or accounting workflow.",
        learning_outcome: "Add operational-resilience, provider, identity, monitoring, and incident questions to the supervised-pilot plan.",
        related_workflow_ids: ["wf-r2r-close-orchestration", "wf-treasury-cash-position"],
        audience_lenses: ["reviewer-assurance", "agent-builder", "control-owner"],
      }),
      resolveReading({
        id: "canon-19-netsuite-release",
        order: 19,
        resource_id: "src_netsuite26ai",
        role: "case-comparison",
        contribution: "First-party documentation of AI-supported close, reconciliation, flux, and EPM capabilities for a named release.",
        why_it_matters: "It teaches readers to convert provider feature language into a testable local diligence question rather than an effectiveness or ROI claim.",
        learning_outcome: "Separate documented availability from unverified accuracy, control, regional, edition, and customer-outcome claims.",
        related_workflow_ids: ["wf-r2r-close-orchestration", "wf-r2r-balance-reconciliations", "wf-r2r-flux-analysis"],
        audience_lenses: ["accounting-practitioner", "agent-builder", "control-owner"],
      }),
      resolveReading({
        id: "canon-20-sage-close",
        order: 20,
        resource_id: "src_sageclose25",
        role: "case-comparison",
        contribution: "First-party release documentation for close monitoring, reconciliation assistance, permissions, dependencies, and regional limits.",
        why_it_matters: "Paired with another provider record, it shows how superficially similar product claims can differ in scope, dependencies, and test requirements.",
        learning_outcome: "Write a provider-neutral comparison that preserves feature scope, commercial interest, dependencies, and missing outcome evidence.",
        related_workflow_ids: ["wf-r2r-close-orchestration", "wf-r2r-balance-reconciliations"],
        audience_lenses: ["accounting-practitioner", "agent-builder", "control-owner"],
      }),
    ],
  },
];

export const coreCourseReadings = courseModules.flatMap((module) => module.readings);
export const coreCourseEstimatedMinutes = coreCourseReadings.reduce(
  (total, reading) => total + reading.estimated_reading_minutes,
  0,
);

export const accountingAgentsCoreCourse = {
  id: coreCourseId,
  version: coreCourseVersion,
  title: "Core course: accounting agents from evidence to governed work",
  description:
    "A deliberate 20-source course that bridges accounting and agent systems, then turns authority, evidence, evaluation, and product claims into one supervised synthetic design brief.",
  prepared_at: coreCoursePreparedAt,
  review_status: "maintainer-review-pending",
  review_note:
    "This course is an editorial learning path under maintainer review. Subject-matter, independent, professional, audit, certification, or assurance review is not claimed.",
  primary_mode: "tutorial",
  evidence_classification: "editorial-recommendation" as EvidenceClassificationId,
  intended_audience:
    "Accounting practitioners, reviewers and assurance teams, agent builders, and control owners who need a shared vocabulary for governed accounting-agent work.",
  prerequisites: [
    "Complete the five-minute Start here orientation or be able to state the accountable-human boundary.",
    "Choose one fictional or clean-room synthetic accounting workflow; do not use employer, client, engagement, bank, vendor, customer, employee, or taxpayer data.",
    "Confirm the applicable reporting, professional, regulatory, and control context before transferring any source to real work.",
  ],
  learning_objectives: [
    "Distinguish professional and accounting authority from guidance, research, technical documentation, and provider claims.",
    "Explain models, tools, state, permissions, deterministic checks, review, and retained records in shared accounting and engineering language.",
    "Specify evidence, documentation, authority, and stop conditions for one bounded accounting-agent workflow.",
    "Evaluate a research or product claim by its method, context, contrary evidence, and transfer limit.",
    "Produce a supervised synthetic transfer brief that keeps conclusions and sensitive external actions with accountable people.",
  ],
  governing_rule: {
    id: "core-course-governing-rule",
    text: "Agents may prepare accounting work. Accountable people approve conclusions and sensitive external actions.",
    evidence_classification: "editorial-recommendation" as EvidenceClassificationId,
    implication:
      "Every module must preserve the distinction between evidence, prepared work, review, approval, execution, and the retained record.",
  },
  selection_basis: {
    target: "Twenty primary, original-research, official, or first-party practice sources in a deliberate learning sequence.",
    admission_rules: [
      "The source contributes a distinct learning outcome needed to specify, review, evaluate, or pilot governed accounting-agent work.",
      "Evidence weight, current status, commercial interest where applicable, and a material limitation are visible beside the reading.",
      "No source is included only because it is prominent, recent, widely marketed, or favorable to agent adoption.",
      "The course links to project metadata and the publisher's primary page; it does not reproduce or relicense external full text.",
    ],
    framework_choice:
      "Read the FASB or IFRS authority route that matches the fictional exercise, and compare the other only if cross-framework transfer is part of the learning objective.",
    product_comparison:
      "The two provider records are comparison exercises, not endorsements or evidence of accuracy, control effectiveness, customer outcomes, savings, or ROI.",
  },
  audience_lenses: [
    {
      id: "accounting-practitioner" as CoreCourseLensId,
      label: "Accounting practitioner",
      use_when: "You know the accounting work and need a no-code mental model of agents, evidence, evaluation, and review.",
      focus: "Follow the accountants bridge in each module and keep the workpaper, exception, framework, and conclusion owner concrete.",
      completion_artifact: "A governed-workflow transfer brief for one clean-room synthetic accounting task.",
    },
    {
      id: "reviewer-assurance" as CoreCourseLensId,
      label: "Reviewer or assurance team",
      use_when: "You need to challenge agent-prepared work, source applicability, evidence sufficiency, and system claims.",
      focus: "Prioritize evidence, documentation, control, evaluation, reviewer competence, independence, and re-review triggers.",
      completion_artifact: "A review plan with required evidence, deterministic checks, stop conditions, disposition, and re-review triggers.",
    },
    {
      id: "agent-builder" as CoreCourseLensId,
      label: "Agent builder",
      use_when: "You understand software or AI systems and need the accounting concepts that must become system contracts.",
      focus: "Follow the builders bridge and translate assertions, period state, provenance, authority, review, and documentation into product requirements.",
      completion_artifact: "An accounting-control contract for one synthetic workflow, including permissions, checks, approval, and retained evidence.",
    },
    {
      id: "control-owner" as CoreCourseLensId,
      label: "Control owner",
      use_when: "You own a process, control, transformation, risk, or operational-resilience decision.",
      focus: "Prioritize accountable roles, control objectives, monitoring, provider dependencies, incident paths, and evidence for an adoption decision.",
      completion_artifact: "A control-and-authority map plus a supervised-pilot decision with explicit non-claims.",
    },
  ],
  modules: courseModules,
  capstone: {
    id: "core-course-supervised-cash-transfer",
    title: "Synthetic capstone: bound a cash-reconciliation assistant",
    fictional: true,
    evidence_classification: "synthetic-example" as EvidenceClassificationId,
    context:
      "Fictional Cedar & Pine LLC wants an assistant to compare a synthetic August 2026 bank statement and ledger, prepare matches and exceptions, and assemble a reviewer packet. One $850 ledger receipt lacks bank or subsequent-period support. No production data, posting credential, bank access, or real entity is involved.",
    guided_steps: [
      "Name the applicable fictional framework, professional context, control objective, process owner, preparer, reviewer role, and conclusion owner.",
      "Define the approved evidence, provenance fields, control totals, matching rules, contradictory-evidence handling, and minimum reviewer packet.",
      "Draw the model, tools, durable state, permissions, deterministic checks, approval gate, monitoring, and retained change record.",
      "Write known-answer normal, missing-evidence, duplicate, wrong-period, prompt-injection, and unauthorized-action cases, plus the claims those tests cannot establish.",
      "Convert one provider capability into a synthetic test question with version, region, dependencies, failure threshold, stop condition, rollback, and no ROI or effectiveness assumption.",
      "Record the $850 item as unresolved, request the missing evidence, prohibit a guessed classification or posting, and route the packet to the accountable reviewer.",
    ],
    deliberate_exception:
      "The missing bank evidence prevents a supported classification. The correct capstone result is an unresolved exception and reviewer request—not a forced tie-out, guessed deposit-in-transit label, or proposed posting.",
    finished_artifact: {
      id: "core-course-transfer-brief",
      title: "Governed accounting-agent transfer brief",
      fields: [
        "Fictional entity, workflow, period, framework, objective, and scope",
        "Evidence register, provenance, control totals, and missing or contrary evidence",
        "Model, tools, state, permissions, deterministic checks, and stop conditions",
        "Action-by-action authority classification, preparer, reviewer role, conclusion owner, and segregation of duties",
        "Known-answer tests, failure threshold, explicit non-claims, monitoring, rollback, and re-review triggers",
        "Unresolved $850 exception, requested evidence, reviewer decision required, and no posting or external action",
        "Source IDs used, applicability checks, limitations, source date or lifecycle, and course reading IDs",
      ],
    },
    safe_reset:
      "Use only the fictional facts above or another clean-room synthetic case. Delete local notes and restart from the blank field list; the site stores no capstone data.",
  },
  knowledge_check: [
    {
      id: "course-check-source-weight",
      prompt: "A provider release page documents an AI reconciliation feature. What does that establish?",
      options: [
        { id: "feature-claim", label: "The provider's documented feature claim for the stated release and context" },
        { id: "control-effective", label: "That the feature is an effective accounting control" },
        { id: "roi-proven", label: "That customers will realize savings or ROI" },
      ],
      correct_option_id: "feature-claim",
      correct_feedback: "Correct. Availability and feature scope still require current verification; accuracy, controls, outcomes, and value need separate evidence.",
      incorrect_feedback: "Provider documentation is useful first-party evidence of what the provider says, not independent effectiveness, control, outcome, or ROI evidence.",
    },
    {
      id: "course-check-documentation",
      prompt: "Which record is sufficient for accountable review of an agent-prepared reconciliation?",
      options: [
        { id: "chat-only", label: "A polished final narrative" },
        { id: "tool-log-only", label: "The tool and model trace alone" },
        { id: "evidence-workpaper", label: "An evidence-linked workpaper with procedures, checks, exceptions, judgments, attribution, and disposition" },
      ],
      correct_option_id: "evidence-workpaper",
      correct_feedback: "Correct. Traces can support diagnosis, but review needs an intelligible evidence-linked workpaper and decision record.",
      incorrect_feedback: "A narrative or trace alone does not establish source completeness, evidence quality, exceptions, judgment, review, or approval.",
    },
    {
      id: "course-check-evaluation",
      prompt: "A system passes one accounting benchmark. What is the strongest warranted conclusion?",
      options: [
        { id: "bounded-result", label: "It achieved the reported result under the benchmark's stated task, data, method, and scoring conditions" },
        { id: "production-ready", label: "It is production-ready for the related workflow" },
        { id: "professional-reliance", label: "Its conclusions can receive professional reliance" },
      ],
      correct_option_id: "bounded-result",
      correct_feedback: "Correct. Transfer to a production workflow requires separate evidence about data, controls, permissions, review, reliability, cost, and operating context.",
      incorrect_feedback: "A benchmark result is bounded evidence, not production qualification, professional review, control assurance, or authority to act.",
    },
    {
      id: "course-check-missing-evidence",
      prompt: "The synthetic $850 item lacks required bank evidence. What belongs in the transfer brief?",
      options: [
        { id: "guess-transit", label: "A deposit-in-transit conclusion so the account can close" },
        { id: "stop-route", label: "An unresolved exception, evidence request, stop condition, and accountable reviewer decision" },
        { id: "auto-post", label: "A proposed entry because the difference equals $850" },
      ],
      correct_option_id: "stop-route",
      correct_feedback: "Correct. The agent preserves uncertainty and prepares the decision packet; the accountable reviewer owns the conclusion.",
      incorrect_feedback: "Missing evidence does not authorize a guessed classification, forced tie-out, or posting proposal.",
    },
  ],
  completion_artifact: {
    id: "core-course-completion-note",
    title: "Core-course completion note",
    statements: [
      "I can distinguish authority, official guidance, research, technical or practice evidence, and editorial recommendation.",
      "I can explain an accounting agent as a governed system of model, tools, state, permissions, checks, review, action, and record.",
      "I can identify the evidence, documentation, evaluation, and authority needed for one bounded synthetic workflow.",
      "I can state what a research result or provider claim does not establish.",
      "I kept conclusions and sensitive external actions with an accountable person.",
    ],
    interpretation_boundary:
      "Completion records understanding of this maintainer-review-pending educational course. It does not establish accounting competence, reviewer appointment, system suitability, control effectiveness, professional reliance, certification, or authority to act.",
  },
  limitations: [
    "This course is educational material and an editorial sequence, not accounting, audit, tax, legal, investment, security, or regulatory advice.",
    "The twenty readings are a bounded core, not a complete archive, universal authority hierarchy, ranking, or claim that every reader must use every source.",
    "FASB, IFRS, PCAOB, AICPA, COSO, NIST, OSFI, research, and provider material have different scopes; verify the applicable entity, facts, transaction, period, jurisdiction, framework, version, and current primary text.",
    "Research and benchmark findings do not establish production accuracy, control effectiveness, adoption, prevalence, savings, ROI, or professional-review outcomes outside their stated methods and samples.",
    "Provider documentation is time-, product-, edition-, region-, and dependency-specific and reflects a commercial interest; it is not independent outcome evidence.",
    "Maintainer review and automated checks are not subject-matter review, independent review, audit, certification, assurance, or human approval.",
  ],
  next_action:
    "Choose one audience lens, complete the five modules in order, produce the fictional transfer brief, and route any real-world adaptation to the accountable framework, control, security, legal, and professional owners.",
  rights: {
    editorial_content: "CC-BY-4.0",
    synthetic_example_and_factual_metadata: "CC0-1.0",
    external_sources: "Publisher terms apply; the course stores metadata and original summaries, not external full text.",
  },
} as const;

function markdownCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

export function renderCoreCourseMarkdown() {
  const course = accountingAgentsCoreCourse;
  const lines = [
    `# ${course.title}`,
    "",
    `> ${course.description}`,
    "",
    `- Course ID: \`${course.id}\`; version ${course.version}`,
    `- Prepared: ${course.prepared_at}`,
    `- Review status: ${course.review_status}`,
    `- Primary mode: Tutorial`,
    `- Evidence classification: ${course.evidence_classification}`,
    `- Readings: ${coreCourseReadings.length}; estimated reading time: ${coreCourseEstimatedMinutes} minutes`,
    "",
    "## Before you begin",
    "",
    `- Intended audience: ${course.intended_audience}`,
    ...course.prerequisites.map((item) => `- Prerequisite: ${item}`),
    ...course.learning_objectives.map((item) => `- Learning objective: ${item}`),
    "",
    "## Governing rule",
    "",
    `**${course.governing_rule.text}**`,
    "",
    `- Evidence classification: ${course.governing_rule.evidence_classification}`,
    `- Implication: ${course.governing_rule.implication}`,
    "",
    "## Choose an audience lens",
    "",
    "| Lens | Use when | Focus | Completion artifact |",
    "|---|---|---|---|",
    ...course.audience_lenses.map((lens) => `| \`${lens.id}\` · ${lens.label} | ${markdownCell(lens.use_when)} | ${markdownCell(lens.focus)} | ${markdownCell(lens.completion_artifact)} |`),
    "",
    "## Source-selection basis",
    "",
    course.selection_basis.target,
    "",
    ...course.selection_basis.admission_rules.map((item) => `- ${item}`),
    "",
    `Framework choice: ${course.selection_basis.framework_choice}`,
    "",
    `Product comparison: ${course.selection_basis.product_comparison}`,
    "",
  ];

  for (const courseModule of course.modules) {
    lines.push(
      `## ${courseModule.order}. ${courseModule.title}`,
      "",
      `**Guiding question:** ${courseModule.question}`,
      "",
      `- Accountants bridge: ${courseModule.accountants_bridge}`,
      `- Builders bridge: ${courseModule.builders_bridge}`,
      `- Module assignment: ${courseModule.assignment}`,
      `- Related material: ${courseModule.related_material.map((item) => `[${item.label}](${item.href})`).join(" · ")}`,
      "",
    );

    for (const reading of courseModule.readings) {
      lines.push(
        `### ${String(reading.order).padStart(2, "0")}. ${reading.title}`,
        "",
        `- Reading ID: \`${reading.id}\`; source ID: \`${reading.resource_id}\``,
        `- Publisher: ${reading.publisher}; source type: ${reading.source_type}; topic: ${reading.topic}`,
        `- Evidence weight: ${reading.evidence_tier_label}; importance: ${reading.importance}; role: ${reading.role}`,
        `- Estimated reading time: ${reading.estimated_reading_minutes} minutes`,
        `- Source status: ${reading.source_status}; lifecycle: ${reading.source_lifecycle}; verified: ${reading.source_verified_at ?? "not recorded"}`,
        `- Contribution: ${reading.contribution}`,
        `- Why it matters: ${reading.why_it_matters}`,
        `- Key limitation: ${reading.key_limitation}`,
        `- Learning outcome: ${reading.learning_outcome}`,
        `- Related workflows: ${reading.related_workflow_ids.map((id) => `\`${id}\``).join(", ")}`,
        `- Audience lenses: ${reading.audience_lenses.map((id) => `\`${id}\``).join(", ")}`,
        `- [Catalog record](${reading.catalog_href}) · [Original source](${reading.original_href})`,
        "",
      );
    }
  }

  lines.push(
    `## ${course.capstone.title}`,
    "",
    `- Capstone ID: \`${course.capstone.id}\``,
    `- Evidence classification: ${course.capstone.evidence_classification}`,
    `- Fictional: ${course.capstone.fictional}`,
    `- Context: ${course.capstone.context}`,
    "",
    ...course.capstone.guided_steps.map((step, index) => `${index + 1}. ${step}`),
    "",
    `**Deliberate exception:** ${course.capstone.deliberate_exception}`,
    "",
    `### Finished artifact: ${course.capstone.finished_artifact.title}`,
    "",
    `Artifact ID: \`${course.capstone.finished_artifact.id}\``,
    "",
    ...course.capstone.finished_artifact.fields.map((field) => `- ${field}`),
    "",
    `Safe reset: ${course.capstone.safe_reset}`,
    "",
    "## Knowledge check",
    "",
  );

  for (const question of course.knowledge_check) {
    lines.push(
      `### ${question.prompt}`,
      "",
      ...question.options.map((option) => `- ${option.id === question.correct_option_id ? "[x]" : "[ ]"} ${option.label} (\`${option.id}\`)`),
      "",
      `Answer: \`${question.correct_option_id}\`. ${question.correct_feedback}`,
      "",
    );
  }

  lines.push(
    "## Completion artifact",
    "",
    `**${course.completion_artifact.title}** (\`${course.completion_artifact.id}\`)`,
    "",
    ...course.completion_artifact.statements.map((statement) => `- ${statement}`),
    "",
    `Interpretation boundary: ${course.completion_artifact.interpretation_boundary}`,
    "",
    "## Limitations",
    "",
    ...course.limitations.map((limitation) => `- ${limitation}`),
    "",
    `Next action: ${course.next_action}`,
    "",
    `Review note: ${course.review_note}`,
    "",
    `Rights: editorial content ${course.rights.editorial_content}; synthetic example and factual metadata ${course.rights.synthetic_example_and_factual_metadata}; ${course.rights.external_sources}`,
    "",
  );

  return lines.join("\n");
}
