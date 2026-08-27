import type { EvidenceClassificationId } from "./content-contract";

export const startHereId = "accounting-agents-start-here";
export const startHereVersion = "1.0.0";
export const startHerePreparedAt = "2026-08-27";

export type StartHereOption = {
  id: string;
  label: string;
};

export type StartHereKnowledgeQuestion = {
  id: string;
  prompt: string;
  options: readonly StartHereOption[];
  correct_option_id: string;
  correct_feedback: string;
  incorrect_feedback: string;
};

export const accountingAgentsStartHere = {
  id: startHereId,
  version: startHereVersion,
  title: "Start here: accounting agents in five minutes",
  description:
    "A short, nontechnical orientation to what an accounting agent is, how evidence becomes reviewable work, and where accountable people remain in control.",
  prepared_at: startHerePreparedAt,
  review_status: "maintainer-review-pending",
  review_note:
    "Maintainer review is pending. Subject-matter, independent, professional, audit, or assurance review is not claimed.",
  primary_mode: "tutorial",
  intended_audience: "New readers from accounting, finance transformation, engineering, risk and assurance, research, or education.",
  prerequisites: [
    "No AI or engineering background is required.",
    "No production system, confidential information, or real accounting data is used.",
  ],
  learning_objectives: [
    "Distinguish an accounting agent from chat, a copilot, and a fixed workflow.",
    "Trace evidence through observation, claim, judgment, and an accountable decision.",
    "Recognize when an agent must stop, preserve the exception, and ask a person to decide.",
    "Choose the next learning path that fits your role.",
  ],
  definition: {
    id: "orientation-definition",
    text:
      "An accounting agent is a governed system that uses a model, approved tools, evidence, and recorded controls to pursue a bounded accounting objective while accountable people retain conclusions and sensitive external actions.",
    evidence_classification: "implementation-pattern" as EvidenceClassificationId,
    reliance_boundary:
      "This is the project’s operating definition, not a professional standard or a claim that any particular system is effective or suitable.",
  },
  comparisons: [
    {
      id: "comparison-chat",
      label: "Chat",
      controller: "A person asks each question.",
      behavior: "Returns an answer to the current prompt.",
      accounting_example: "Explain why a bank balance and ledger balance may differ.",
      boundary: "The answer is not a workpaper, approval, or system action.",
    },
    {
      id: "comparison-copilot",
      label: "Copilot",
      controller: "A person remains inside the task.",
      behavior: "Assists with part of the person’s workflow.",
      accounting_example: "Draft an explanation for a reconciling item selected by the accountant.",
      boundary: "The person directs the task and reviews the draft.",
    },
    {
      id: "comparison-fixed-workflow",
      label: "Fixed workflow",
      controller: "Predefined rules choose the steps.",
      behavior: "Runs the same specified sequence when its conditions are met.",
      accounting_example: "Match transactions when the approved date, amount, and identifier rules agree.",
      boundary: "Unexpected facts leave the rule path and become exceptions.",
    },
    {
      id: "comparison-accounting-agent",
      label: "Accounting agent",
      controller: "A model selects permitted steps and tools within recorded limits.",
      behavior: "Pursues a bounded outcome, keeps state, checks work, and routes exceptions.",
      accounting_example: "Investigate unmatched cash items, prepare support, and assemble a reviewer packet.",
      boundary: "The agent does not approve the accounting conclusion or take an unapproved sensitive action.",
    },
  ],
  governing_rule: {
    id: "orientation-governing-rule",
    text: "Agents may prepare accounting work. Accountable people approve conclusions and sensitive external actions.",
    evidence_classification: "editorial-recommendation" as EvidenceClassificationId,
    implication:
      "Write the boundary before the run, enforce it outside the prompt, and keep preparation, review, approval, and execution distinguishable in the retained record.",
  },
  evidence_to_decision_chain: [
    {
      id: "chain-evidence",
      label: "Evidence",
      text: "Approved synthetic bank and ledger extracts carry source identifiers, periods, and control totals.",
      owner: "System of record and preparer",
    },
    {
      id: "chain-observation",
      label: "Observation",
      text: "One synthetic $850 ledger receipt has no matching bank transaction through period end.",
      owner: "Agent may prepare",
    },
    {
      id: "chain-claim",
      label: "Claim",
      text: "The $850 difference remains unresolved with the currently approved evidence.",
      owner: "Agent may prepare and support",
    },
    {
      id: "chain-judgment",
      label: "Judgment",
      text: "The item could be a deposit in transit, a wrong-period record, or an error; the available evidence does not settle which.",
      owner: "Agent may identify alternatives, not choose the conclusion",
    },
    {
      id: "chain-decision",
      label: "Decision",
      text: "A named reviewer obtains or evaluates additional support and approves, modifies, rejects, or escalates the treatment.",
      owner: "Accountable person",
    },
    {
      id: "chain-action-record",
      label: "Action and record",
      text: "Only an exact separately approved effect may proceed; the evidence, checks, exception, decision, and any receipt remain in the workpaper.",
      owner: "Constrained system and accountable person",
    },
  ],
  scenario: {
    id: "synthetic-cash-exception-orientation",
    title: "A bank reconciliation with one missing piece of evidence",
    evidence_classification: "synthetic-example" as EvidenceClassificationId,
    fictional: true,
    context:
      "Fictional Cedar & Pine LLC is reconciling an August 2026 cash account. The synthetic bank statement ends at $125,240 and the synthetic ledger ends at $124,390. Exact matching explains every difference except one $850 ledger receipt. The approved evidence set has no matching bank transaction or subsequent-bank support.",
    guided_steps: [
      "Confirm the fictional entity, account, period, source versions, and control totals.",
      "Run the specified exact matches and reproduce the $850 remaining difference.",
      "Record the unmatched receipt, the searches performed, and the missing bank evidence.",
      "Do not label the item a deposit in transit merely because that explanation is plausible.",
      "Prepare a reviewer packet with the exception, possible explanations, requested evidence, and no proposed posting.",
      "Route the packet to the named reviewer, who decides whether to obtain more evidence, adjust the treatment, or escalate.",
    ],
    deliberate_exception:
      "Required bank evidence is missing. The safe result is a visible unresolved exception—not a guessed classification or a fabricated tie-out.",
    finished_artifact: {
      id: "orientation-reviewer-packet",
      label: "Orientation reviewer packet",
      fields: [
        "Entity, account, period, and source identifiers",
        "Bank and ledger control totals",
        "Matched population and remaining $850 difference",
        "Missing evidence and searches performed",
        "Possible explanations labeled as unresolved",
        "Named reviewer and required decision",
        "Explicit statement: no entry, posting, or external action prepared",
      ],
    },
    safe_reset:
      "The scenario is fictional, read-only, and stores no answers or accounting data. Use Reset in the knowledge check to start again.",
  },
  knowledge_check: [
    {
      id: "check-accountable-decision",
      prompt: "Who approves the accounting conclusion in this lesson?",
      options: [
        { id: "agent-confidence", label: "The agent, when its confidence is high" },
        { id: "accountable-reviewer", label: "The named accountable reviewer" },
        { id: "workflow-ownerless", label: "The workflow automatically, after matching" },
      ],
      correct_option_id: "accountable-reviewer",
      correct_feedback: "Correct. The agent prepares and supports the work; the accountable reviewer owns the conclusion.",
      incorrect_feedback: "The agent’s confidence or a passing workflow step does not grant approval authority.",
    },
    {
      id: "check-missing-evidence",
      prompt: "What should happen when the $850 item lacks required bank evidence?",
      options: [
        { id: "assume-transit", label: "Classify it as a deposit in transit" },
        { id: "force-tie", label: "Create an offset so the reconciliation ties" },
        { id: "stop-record-escalate", label: "Record the exception, stop, and route it for review" },
      ],
      correct_option_id: "stop-record-escalate",
      correct_feedback: "Correct. Missing material evidence remains visible and is routed to the accountable reviewer.",
      incorrect_feedback: "A plausible explanation or forced tie-out would hide the missing evidence instead of resolving it.",
    },
    {
      id: "check-agent-distinction",
      prompt: "What most clearly distinguishes an accounting agent from a fixed workflow?",
      options: [
        { id: "always-writes", label: "It can always write to the ledger" },
        { id: "selects-bounded-steps", label: "It can select permitted steps and tools within recorded limits" },
        { id: "needs-no-controls", label: "It replaces predefined rules and controls" },
      ],
      correct_option_id: "selects-bounded-steps",
      correct_feedback: "Correct. The agent can choose among permitted steps, while deterministic rules, permissions, checks, and human decisions still constrain the work.",
      incorrect_feedback: "Agency does not imply write authority and does not replace deterministic controls.",
    },
  ] as readonly StartHereKnowledgeQuestion[],
  completion_artifact: {
    id: "orientation-completion-note",
    title: "Orientation completion note",
    statements: [
      "I can distinguish chat, copilot, fixed workflow, and accounting agent.",
      "I can trace evidence to an accountable decision without hiding uncertainty.",
      "I know that missing evidence creates an exception, not permission to guess.",
      "I know that accountable people retain conclusions and sensitive external actions.",
    ],
    interpretation_boundary:
      "Completing this orientation shows understanding of the bounded lesson; it does not establish accounting competence, system suitability, or authority to act.",
  },
  audience_paths: [
    {
      id: "path-accounting-practitioner",
      label: "Accounting practitioner",
      href: "/packs/bank-reconciliation",
      next: "Inspect the synthetic bank-reconciliation pack",
      outcome: "See the lesson boundary expressed as inputs, procedures, checks, exceptions, and a reference output.",
    },
    {
      id: "path-transformation-leader",
      label: "Finance transformation leader",
      href: "/pilot",
      next: "Choose and bound a supervised pilot",
      outcome: "Evaluate workflow fit, evidence readiness, review capacity, and stop conditions before adoption.",
    },
    {
      id: "path-agent-builder",
      label: "Agent builder",
      href: "/architecture",
      next: "Separate model work from controls and durable state",
      outcome: "Map skill, tools, policy, templates, evaluators, permissions, and records into a governed system.",
    },
    {
      id: "path-risk-assurance",
      label: "Risk, controls, and assurance",
      href: "/control-model",
      next: "Apply the Accounting Agent Control Model",
      outcome: "Challenge objective, scope, evidence, procedure, checks, authority, review, action, and record.",
    },
    {
      id: "path-research-education",
      label: "Researcher or educator",
      href: "/reading-room",
      next: "Follow the curated reading room",
      outcome: "Trace papers, guidance, practice examples, limitations, and current developments to their sources.",
    },
  ],
  limitations: [
    "This orientation is educational material, not accounting, audit, tax, legal, investment, or regulatory advice.",
    "The fictional scenario does not establish that an agent, control, or workflow is effective in production.",
    "Source applicability depends on the entity, facts, transaction, period, jurisdiction, framework, and current authoritative material.",
    "Maintainer review and automated tests are not subject-matter review, independent assurance, certification, or professional sign-off.",
  ],
  next_action:
    "Complete the knowledge check, choose one role path, and carry the governing rule into the next page.",
  source_basis: [
    {
      id: "src_1v1zwt5",
      title: "COSO Internal Control—Integrated Framework",
      href: "/resources/src_1v1zwt5",
      evidence_classification: "authoritative-requirement" as EvidenceClassificationId,
      scope:
        "Primary internal-control source for objectives, accountability, control activities, information, and monitoring. Applicability depends on the entity’s adopted framework and facts.",
    },
    {
      id: "src_0vf7hhg",
      title: "PCAOB AS 1105, Audit Evidence",
      href: "/resources/src_0vf7hhg",
      evidence_classification: "authoritative-requirement" as EvidenceClassificationId,
      scope:
        "Binding for in-scope US public-company audits. It illustrates evidence sufficiency, appropriateness, and reliability but is not automatically binding outside that scope.",
    },
  ],
  rights: {
    editorial_content: "CC-BY-4.0",
    synthetic_example_and_factual_metadata: "CC0-1.0",
    external_sources: "Publisher terms apply; no external full text is stored in this record.",
  },
} as const;

function markdownCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

export function renderStartHereMarkdown() {
  const lesson = accountingAgentsStartHere;
  const lines = [
    `# ${lesson.title}`,
    "",
    `> ${lesson.description}`,
    "",
    `- Lesson ID: \`${lesson.id}\`; version ${lesson.version}`,
    `- Prepared: ${lesson.prepared_at}`,
    `- Review status: ${lesson.review_status}`,
    `- Primary mode: Tutorial`,
    "",
    "## Before you begin",
    "",
    `- Intended audience: ${lesson.intended_audience}`,
    ...lesson.prerequisites.map((item) => `- Prerequisite: ${item}`),
    ...lesson.learning_objectives.map((item) => `- Learning objective: ${item}`),
    "",
    "## One-sentence definition",
    "",
    lesson.definition.text,
    "",
    `- Evidence classification: ${lesson.definition.evidence_classification}`,
    `- Reliance boundary: ${lesson.definition.reliance_boundary}`,
    "",
    "## Chat, copilot, fixed workflow, and accounting agent",
    "",
    "| Stable ID | Pattern | Controller | Behavior | Accounting example | Boundary |",
    "|---|---|---|---|---|---|",
    ...lesson.comparisons.map((item) => `| \`${item.id}\` | ${item.label} | ${markdownCell(item.controller)} | ${markdownCell(item.behavior)} | ${markdownCell(item.accounting_example)} | ${markdownCell(item.boundary)} |`),
    "",
    "## Governing rule",
    "",
    `**${lesson.governing_rule.text}**`,
    "",
    `- Evidence classification: ${lesson.governing_rule.evidence_classification}`,
    `- Implication: ${lesson.governing_rule.implication}`,
    "",
    "## Evidence-to-decision chain",
    "",
    "| Stable ID | Step | Synthetic lesson application | Owner |",
    "|---|---|---|---|",
    ...lesson.evidence_to_decision_chain.map((item) => `| \`${item.id}\` | ${item.label} | ${markdownCell(item.text)} | ${markdownCell(item.owner)} |`),
    "",
    `## Synthetic scenario: ${lesson.scenario.title}`,
    "",
    `- Scenario ID: \`${lesson.scenario.id}\``,
    "- Evidence classification: synthetic-example",
    "- Fictional: true",
    `- Context: ${lesson.scenario.context}`,
    "",
    ...lesson.scenario.guided_steps.map((item, index) => `${index + 1}. ${item}`),
    "",
    `**Deliberate exception:** ${lesson.scenario.deliberate_exception}`,
    "",
    `**Finished artifact — ${lesson.scenario.finished_artifact.label}** (\`${lesson.scenario.finished_artifact.id}\`)`,
    "",
    ...lesson.scenario.finished_artifact.fields.map((item) => `- ${item}`),
    "",
    `Safe reset: ${lesson.scenario.safe_reset}`,
    "",
    "## Two-minute knowledge check",
    "",
  ];

  for (const question of lesson.knowledge_check) {
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
    `**${lesson.completion_artifact.title}** (\`${lesson.completion_artifact.id}\`)`,
    "",
    ...lesson.completion_artifact.statements.map((item) => `- ${item}`),
    "",
    `Interpretation boundary: ${lesson.completion_artifact.interpretation_boundary}`,
    "",
    "## Choose your next path",
    "",
    "| Audience | Next page | Expected outcome |",
    "|---|---|---|",
    ...lesson.audience_paths.map((path) => `| ${path.label} | [${path.next}](${path.href}) | ${markdownCell(path.outcome)} |`),
    "",
    "## Limitations",
    "",
    ...lesson.limitations.map((item) => `- ${item}`),
    "",
    `Next action: ${lesson.next_action}`,
    "",
    "## Source basis",
    "",
    ...lesson.source_basis.map((source) => `- [${source.title}](${source.href}) (\`${source.id}\`; ${source.evidence_classification}) — ${source.scope}`),
    "",
    "## Rights and review",
    "",
    `- ${lesson.review_note}`,
    `- Original editorial content: ${lesson.rights.editorial_content}`,
    `- Project-created synthetic example and factual metadata: ${lesson.rights.synthetic_example_and_factual_metadata}`,
    `- External sources: ${lesson.rights.external_sources}`,
  );

  return lines.join("\n").trimEnd() + "\n";
}
