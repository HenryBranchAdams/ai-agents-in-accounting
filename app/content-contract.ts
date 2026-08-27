export const contentContractId = "content-contract";
export const contentContractVersion = "1.0.0";
export const contentContractPreparedAt = "2026-08-25";
export const contentContractReviewStatus = "maintainer-review-pending";
export const contentContractReviewNote =
  "Maintainer review is pending. Independent or professional review is not claimed.";

export const contentModeIds = [
  "tutorial",
  "how-to",
  "explanation",
  "reference",
  "case-study",
  "evidence-synthesis",
  "program-documentation",
] as const;

export type ContentModeId = (typeof contentModeIds)[number];

export type ContentMode = {
  id: ContentModeId;
  label: string;
  reader_need: string;
  required_anatomy: readonly string[];
  completion_standard: string;
  mixing_quality_boundary: string;
};

export const contentModes: readonly ContentMode[] = [
  {
    id: "tutorial",
    label: "Tutorial",
    reader_need: "Teach me by guiding me through a safe, complete experience.",
    required_anatomy: [
      "Intended learner, prerequisites, and learning objectives",
      "A complete clean-room synthetic environment with a safe reset path",
      "Guided actions, a deliberate exception or failure, and a finished artifact",
      "Knowledge check and a clear next lesson or transfer into real work",
    ],
    completion_standard:
      "The learner can complete the bounded experience, explain the key decision points, and produce the stated artifact without external production data.",
    mixing_quality_boundary:
      "Keep instruction and practice central. Link to reference and explanation material instead of turning the lesson into a catalog or policy dump.",
  },
  {
    id: "how-to",
    label: "How-to",
    reader_need: "Help me accomplish a concrete task in my real environment.",
    required_anatomy: [
      "Concrete outcome, when to use it, prerequisites, and required inputs",
      "Ordered actions with decision branches, stop conditions, and an output artifact",
      "Links to the explanation for why and the reference for exact details",
    ],
    completion_standard:
      "A practitioner can follow the ordered procedure, make its stated decisions, and verify the output and boundary in their own governed context.",
    mixing_quality_boundary:
      "Organize around the task and its decisions. Do not replace the procedure with a conceptual essay or a complete record dump.",
  },
  {
    id: "explanation",
    label: "Explanation",
    reader_need: "Help me understand why this works this way.",
    required_anatomy: [
      "A clear why question and the accounting context",
      "Connections to familiar accounting, control, evidence, or system concepts",
      "At least one concrete example, implications, trade-offs, and source links",
    ],
    completion_standard:
      "The reader can explain the governing idea, its trade-offs, and when the idea does or does not transfer to a different context.",
    mixing_quality_boundary:
      "Develop one explanatory argument. Keep procedures and exhaustive field definitions in linked how-to or reference pages.",
  },
  {
    id: "reference",
    label: "Reference",
    reader_need: "Give me a precise answer while I work.",
    required_anatomy: [
      "Stable identifier, precise scope, concise definition or record structure",
      "Inherited versus unique fields, status, review date, source basis, and cross-links",
      "Machine-readable representation where the record is intended for reuse",
    ],
    completion_standard:
      "A reader can find the exact bounded fact or field, determine its applicability and status, and reuse the record without guessing what it establishes.",
    mixing_quality_boundary:
      "Keep the record concise and structured. Do not make reference pages carry a tutorial, a broad argument, or an unmarked recommendation.",
  },
  {
    id: "case-study",
    label: "Case study",
    reader_need: "Help me examine a concrete fact pattern or implementation and what it can establish.",
    required_anatomy: [
      "Evidence tier, fact pattern, operating context, and scope",
      "Architecture or process, authority boundary, measured or observed outcome",
      "Limitations, contrary evidence, and an explicit statement of what cannot be inferred",
    ],
    completion_standard:
      "The reader can distinguish observed facts, reported claims, interpretation, and unanswered questions, then identify what would need independent support.",
    mixing_quality_boundary:
      "Keep the case bounded and evidence-tiered. A single case is not general effectiveness, adoption, ROI, professional review, or production readiness evidence.",
  },
  {
    id: "evidence-synthesis",
    label: "Evidence synthesis",
    reader_need: "Help me understand where evidence converges, conflicts, and remains unknown.",
    required_anatomy: [
      "A defined question, source selection basis, and scope or transfer limits",
      "Claims separated from interpretation, with supporting and contrary evidence visible",
      "Practical implications, unresolved questions, and links to affected workflows or controls",
    ],
    completion_standard:
      "The reader can trace a synthesis claim to its sources, state the strength and limits of the evidence, and identify what remains unresolved.",
    mixing_quality_boundary:
      "Synthesize evidence rather than silently ranking sources or presenting an editorial conclusion as an authoritative requirement.",
  },
  {
    id: "program-documentation",
    label: "Program documentation",
    reader_need: "Help me understand how this project, program, contract, or release works.",
    required_anatomy: [
      "Purpose, scope, terminology, roles, lifecycle, and version or review state",
      "Normative contracts, governance, limits, and links to operational examples",
      "Change, correction, rights, and applicability notes where they affect use",
    ],
    completion_standard:
      "A participant can identify the contract, follow the documented lifecycle, locate the applicable machine or human surface, and state the boundary of what the program proves.",
    mixing_quality_boundary:
      "Document the program and its contracts. Keep field teaching, task procedures, and evidence claims in their assigned modes and link them explicitly.",
  },
] as const;

export const evidenceClassificationIds = [
  "authoritative-requirement",
  "official-guidance",
  "editorial-recommendation",
  "implementation-pattern",
  "synthetic-example",
  "empirical-evidence",
  "unresolved-question",
] as const;

export type EvidenceClassificationId = (typeof evidenceClassificationIds)[number];

export type EvidenceClassification = {
  id: EvidenceClassificationId;
  label: string;
  meaning: string;
  display_reliance_boundary: string;
};

export const evidenceClassifications: readonly EvidenceClassification[] = [
  {
    id: "authoritative-requirement",
    label: "Authoritative requirement",
    meaning: "A requirement from an applicable standard, law, regulation, contract, or other authoritative source within its stated scope.",
    display_reliance_boundary:
      "Display the publisher, jurisdiction, effective period, and applicability. Rely on it for a conclusion only after current scope, entity, transaction, period, and effective date are verified.",
  },
  {
    id: "official-guidance",
    label: "Official guidance",
    meaning: "Interpretation, implementation, risk, or supervisory guidance issued by a public body or professional institution.",
    display_reliance_boundary:
      "Display it as guidance rather than an automatic requirement. Use it to inform implementation or risk judgment, and do not imply that it changes the applicable authority hierarchy.",
  },
  {
    id: "editorial-recommendation",
    label: "Editorial recommendation",
    meaning: "A project-authored judgment about a useful approach, sequencing, design choice, or reading path.",
    display_reliance_boundary:
      "Label it as the project’s recommendation. It may guide a decision but is not accounting, legal, audit, regulatory, or professional authority.",
  },
  {
    id: "implementation-pattern",
    label: "Implementation pattern",
    meaning: "A documented design or operating pattern that illustrates how a system or team could implement a capability.",
    display_reliance_boundary:
      "Display the context, owner, assumptions, and limits. Treat it as a pattern to evaluate, not proof that the pattern is effective, compliant, or suitable elsewhere.",
  },
  {
    id: "synthetic-example",
    label: "Synthetic example",
    meaning: "A clean-room fictional fact pattern, fixture, output, or teaching scenario created for this project.",
    display_reliance_boundary:
      "Mark it as synthetic and fictional. Use it for learning, testing, and demonstration only; never treat it as a client, employer, engagement, bank, taxpayer, or other real-world record.",
  },
  {
    id: "empirical-evidence",
    label: "Empirical evidence",
    meaning: "A reported observation, benchmark, survey, experiment, evaluation, deployment report, or other finding with an identifiable method and publisher.",
    display_reliance_boundary:
      "Display the method, sample or operating context, date, uncertainty, and transfer limits. Rely only for the bounded finding; do not turn it into universal effectiveness, adoption, or ROI proof.",
  },
  {
    id: "unresolved-question",
    label: "Unresolved question",
    meaning: "A material uncertainty, disagreement, missing evidence, or question that the current corpus does not settle.",
    display_reliance_boundary:
      "Make the uncertainty visible beside related claims. It is a prompt for investigation or review, not a basis for an accounting conclusion, approval, or external action.",
  },
] as const;

export type ReleaseGateImprovement = {
  id: string;
  label: string;
  test: string;
  evidence_examples: readonly string[];
};

export const releaseGate = {
  principle:
    "A content release qualifies as educational progress only when it makes a demonstrable improvement in learning, task completion, review, safety, adoption decisions, or evidence traceability.",
  qualifying_improvements: [
    {
      id: "learning",
      label: "Learning improvement",
      test: "A learner can acquire or demonstrate a new bounded skill.",
      evidence_examples: ["orientation or knowledge-check completion", "completed synthetic lesson artifact"],
    },
    {
      id: "task-completion",
      label: "Task improvement",
      test: "A practitioner can complete a concrete task with the required output and stop conditions.",
      evidence_examples: ["case completion", "verified workflow or template artifact"],
    },
    {
      id: "review",
      label: "Review improvement",
      test: "A reviewer can understand, challenge, and disposition prepared work more effectively.",
      evidence_examples: ["reviewer calibration result", "fewer unexplained or unsupported exceptions"],
    },
    {
      id: "safety",
      label: "Safety improvement",
      test: "A builder or operator can implement a safer authority, evidence, or action boundary.",
      evidence_examples: ["hard-gate or stop-condition coverage", "safe refusal and approval-boundary test"],
    },
    {
      id: "adoption-decision",
      label: "Adoption-decision improvement",
      test: "A leader can make a more informed decision about whether, where, and how to pilot or adopt an agent.",
      evidence_examples: ["pilot-selection exercise", "documented decision with limitations and alternatives"],
    },
    {
      id: "evidence-traceability",
      label: "Evidence-traceability improvement",
      test: "A researcher or practitioner can trace a material claim to appropriate supporting and contrary evidence.",
      evidence_examples: ["source-to-claim coverage", "applicability and freshness review"],
    },
  ] as readonly ReleaseGateImprovement[],
  non_qualifying_basis:
    "Corpus count alone—and likewise page count, source count, workflow count, downloads, or a new label alone—is not release evidence and cannot satisfy the gate.",
  required_boundary:
    "A release must preserve the rule that agents may prepare accounting work while accountable people approve conclusions and sensitive external actions.",
} as const;

export type SuccessMeasure = {
  id: string;
  label: string;
  question: string;
  signal: string;
  interpretation_boundary: string;
};

export const successMeasures: readonly SuccessMeasure[] = [
  {
    id: "orientation-completion",
    label: "Orientation completion",
    question: "Do new readers complete the orientation and reach an appropriate next path?",
    signal: "Orientation starts, completion, knowledge-check result, and next-path selection.",
    interpretation_boundary: "Completion indicates reach and comprehension of the bounded orientation; it does not establish field competence.",
  },
  {
    id: "case-completion",
    label: "Case completion",
    question: "Can a learner complete a canonical synthetic case and produce the intended artifact?",
    signal: "Case start, reset, completion, artifact checks, exception handling, and safe-stop result.",
    interpretation_boundary: "A completed synthetic case demonstrates the lesson boundary only; it does not qualify production use.",
  },
  {
    id: "time-to-useful-material",
    label: "Time to useful material",
    question: "How quickly can a reader reach a relevant workflow, source, template, or decision aid?",
    signal: "Time from entry to first useful material, successful search, or selected route.",
    interpretation_boundary: "Faster retrieval is useful only if the material is applicable, understandable, and correctly bounded.",
  },
  {
    id: "reviewer-understanding",
    label: "Reviewer understanding",
    question: "Can reviewers identify support, judgment, exceptions, and approval boundaries in prepared work?",
    signal: "Calibration answers, challenge coverage, disposition quality, and reviewer-reported clarity.",
    interpretation_boundary: "Reported understanding is not independent assurance or professional sign-off.",
  },
  {
    id: "pilot-selection",
    label: "Pilot selection",
    question: "Can a leader select a defensible first pilot or correctly decide not to pilot?",
    signal: "Selection exercise accuracy, rationale completeness, boundary coverage, and use of do-not-pilot outcomes.",
    interpretation_boundary: "A decision aid supports adoption judgment; it does not predict ROI or guarantee implementation success.",
  },
  {
    id: "source-to-claim-coverage",
    label: "Source-to-claim coverage",
    question: "Can a reader trace material claims to applicable supporting and contrary sources?",
    signal: "Claim links, source applicability, contrary evidence, and unresolved-question coverage.",
    interpretation_boundary: "Coverage measures traceability of recorded claims, not truth of every claim or current legal effect.",
  },
  {
    id: "freshness",
    label: "Freshness",
    question: "Are sources, pages, and claims reviewed within their stated freshness window?",
    signal: "Review dates, overdue records, supersession notices, and stale-source warnings.",
    interpretation_boundary: "A current review date does not make an external source applicable; readers must still verify current primary material.",
  },
  {
    id: "review-status",
    label: "Review status",
    question: "Can a reader tell what maintainer, subject-matter, independent, or professional review has actually occurred?",
    signal: "Visible review state, named scope where applicable, and absence of unsupported assurance labels.",
    interpretation_boundary: "Maintainer review is not independent, professional, audited, certified, or assured review.",
  },
  {
    id: "practitioner-use",
    label: "Practitioner use",
    question: "Do practitioners use the material to prepare, review, or govern bounded accounting work?",
    signal: "Contributions, teaching use, template or case reuse, workflow references, and disclosed practitioner feedback.",
    interpretation_boundary: "Use is evidence of utility or reach, not evidence of accuracy, adoption prevalence, savings, or control effectiveness.",
  },
] as const;

export type ContentPageAssignment = {
  path: string;
  primary_mode: ContentModeId;
  page_kind: "static" | "dynamic";
};

export const contentPageAssignments: readonly ContentPageAssignment[] = [
  { path: "/", primary_mode: "explanation", page_kind: "static" },
  { path: "/start-here", primary_mode: "tutorial", page_kind: "static" },
  { path: "/fundamentals", primary_mode: "explanation", page_kind: "static" },
  { path: "/lifecycle", primary_mode: "reference", page_kind: "static" },
  { path: "/coverage", primary_mode: "reference", page_kind: "static" },
  { path: "/authority", primary_mode: "reference", page_kind: "static" },
  { path: "/reviewer-guide", primary_mode: "how-to", page_kind: "static" },
  { path: "/workflows", primary_mode: "reference", page_kind: "static" },
  { path: "/control-model", primary_mode: "reference", page_kind: "static" },
  { path: "/controls", primary_mode: "reference", page_kind: "static" },
  { path: "/sensitive-actions", primary_mode: "reference", page_kind: "static" },
  { path: "/evidence-assurance", primary_mode: "explanation", page_kind: "static" },
  { path: "/security-identity", primary_mode: "reference", page_kind: "static" },
  { path: "/architecture", primary_mode: "explanation", page_kind: "static" },
  { path: "/ecosystem", primary_mode: "reference", page_kind: "static" },
  { path: "/evaluation", primary_mode: "explanation", page_kind: "static" },
  { path: "/pilot", primary_mode: "how-to", page_kind: "static" },
  { path: "/operations", primary_mode: "how-to", page_kind: "static" },
  { path: "/templates", primary_mode: "reference", page_kind: "static" },
  { path: "/glossary", primary_mode: "reference", page_kind: "static" },
  { path: "/resources", primary_mode: "reference", page_kind: "static" },
  { path: "/reading-room", primary_mode: "evidence-synthesis", page_kind: "static" },
  { path: "/machine-access", primary_mode: "program-documentation", page_kind: "static" },
  { path: "/packs", primary_mode: "reference", page_kind: "static" },
  { path: "/bench", primary_mode: "program-documentation", page_kind: "static" },
  { path: "/ledgerbench", primary_mode: "program-documentation", page_kind: "static" },
  { path: "/spec", primary_mode: "program-documentation", page_kind: "static" },
  { path: "/methodology", primary_mode: "program-documentation", page_kind: "static" },
  { path: "/changes", primary_mode: "program-documentation", page_kind: "static" },
  { path: "/open-source", primary_mode: "program-documentation", page_kind: "static" },
  { path: "/content-contract", primary_mode: "program-documentation", page_kind: "static" },
  { path: "/workflows/:family", primary_mode: "reference", page_kind: "dynamic" },
  { path: "/workflows/:family/:id", primary_mode: "reference", page_kind: "dynamic" },
  { path: "/resources/:id", primary_mode: "reference", page_kind: "dynamic" },
  { path: "/packs/:id", primary_mode: "reference", page_kind: "dynamic" },
] as const;

const contentModesById = new Map(contentModes.map((mode) => [mode.id, mode]));

export function contentModeForPath(path: string): ContentMode {
  const normalizedPath = path.split("?", 1)[0].replace(/\/+$/, "") || "/";
  const exact = contentPageAssignments.find((assignment) => assignment.path === normalizedPath);
  if (exact) return contentModesById.get(exact.primary_mode) ?? contentModesById.get("reference")!;

  const dynamic = contentPageAssignments.find((assignment) => {
    if (assignment.page_kind !== "dynamic") return false;
    const prefix = assignment.path.split(":", 1)[0];
    return normalizedPath.startsWith(prefix);
  });
  return contentModesById.get(dynamic?.primary_mode ?? "reference")!;
}

export const educationalContentContract = {
  id: contentContractId,
  version: contentContractVersion,
  title: "Educational content contract",
  description:
    "A typed contract for choosing one primary educational mode, labeling evidence, gating releases, and measuring whether the corpus becomes more useful without weakening accounting accountability.",
  prepared_at: contentContractPreparedAt,
  review_status: contentContractReviewStatus,
  review_note: contentContractReviewNote,
  governing_invariant:
    "Agents may prepare accounting work. Accountable people approve conclusions and sensitive external actions.",
  source_basis: [
    {
      id: "diataxis",
      title: "Diátaxis documentation framework",
      url: "https://diataxis.fr/",
      scope: "Primary reference for the four core modes: tutorial, how-to, explanation, and reference.",
    },
  ],
  modes: contentModes,
  evidence_classifications: evidenceClassifications,
  release_gate: releaseGate,
  success_measures: successMeasures,
  measurement_status:
    "Instrumentation and results are not currently claimed. These measures are proposed for future evaluation.",
  page_assignments: contentPageAssignments,
} as const;

function markdownCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function markdownList(items: readonly string[]) {
  return items.map((item) => `- ${item}`).join("<br>");
}

export function renderContentContractMarkdown(headingLevel = 1) {
  const heading = "#".repeat(headingLevel);
  const childHeading = "#".repeat(headingLevel + 1);
  const grandchildHeading = "#".repeat(headingLevel + 2);
  const lines = [
    `${heading} ${educationalContentContract.title}`,
    "",
    `> ${educationalContentContract.description}`,
    "",
    `- Contract ID: \`${educationalContentContract.id}\`; version ${educationalContentContract.version}`,
    `- Prepared: ${educationalContentContract.prepared_at}`,
    `- Review status: ${educationalContentContract.review_status}`,
    `- Review note: ${educationalContentContract.review_note}`,
    "",
    educationalContentContract.governing_invariant,
    "",
    `${childHeading} Primary content modes`,
    "",
    "Each major page has one primary mode. Cross-links can connect modes, but a page must not make one mode carry another mode’s job.",
    "",
    "| Mode | Reader need | Required anatomy | Completion standard | Mixing and quality boundary |",
    "| --- | --- | --- | --- | --- |",
    ...educationalContentContract.modes.map((mode) => `| ${markdownCell(mode.label)} | ${markdownCell(mode.reader_need)} | ${markdownCell(markdownList(mode.required_anatomy))} | ${markdownCell(mode.completion_standard)} | ${markdownCell(mode.mixing_quality_boundary)} |`),
    "",
    `${childHeading} Evidence classifications`,
    "",
    "| Classification | Meaning | Display and reliance boundary |",
    "| --- | --- | --- |",
    ...educationalContentContract.evidence_classifications.map((classification) => `| ${markdownCell(classification.label)} | ${markdownCell(classification.meaning)} | ${markdownCell(classification.display_reliance_boundary)} |`),
    "",
    `${childHeading} Educational release gate`,
    "",
    educationalContentContract.release_gate.principle,
    "",
    ...educationalContentContract.release_gate.qualifying_improvements.map((improvement) => [
      `${grandchildHeading} ${improvement.label}`,
      "",
      improvement.test,
      "",
      ...improvement.evidence_examples.map((example) => `- Evidence example: ${example}`),
      "",
    ]).flat(),
    `**Does not qualify:** ${educationalContentContract.release_gate.non_qualifying_basis}`,
    "",
    `**Boundary:** ${educationalContentContract.release_gate.required_boundary}`,
    "",
    `${childHeading} Success measures`,
    "",
    educationalContentContract.measurement_status,
    "",
    "| Measure | Question | Instrumentation signal | Interpretation boundary |",
    "| --- | --- | --- | --- |",
    ...educationalContentContract.success_measures.map((measure) => `| ${markdownCell(measure.label)} | ${markdownCell(measure.question)} | ${markdownCell(measure.signal)} | ${markdownCell(measure.interpretation_boundary)} |`),
    "",
    `${childHeading} Primary mode assignments`,
    "",
    "| Route pattern | Page kind | Primary mode |",
    "| --- | --- | --- |",
    ...educationalContentContract.page_assignments.map((assignment) => `| ${assignment.path} | ${assignment.page_kind} | ${contentModesById.get(assignment.primary_mode)?.label ?? assignment.primary_mode} |`),
    "",
    `${childHeading} Source basis`,
    "",
    ...educationalContentContract.source_basis.map((source) => `- [${source.title}](${source.url}) — ${source.scope}`),
    "",
  ];

  return lines.join("\n").trimEnd() + "\n";
}
