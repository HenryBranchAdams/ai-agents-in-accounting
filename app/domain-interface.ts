import {
  authorityDecisionGuide,
  authorityLevels,
  corpusReviewedAt,
  type AuthorityLevel,
  type AuthorityLevelId,
  type ControlPattern,
  type GlossaryEntry,
  type SensitiveActionRecord,
  type TemplateRecord,
  type WorkflowRecord,
} from "./domain-model";
import { controlPatterns, sensitiveActions } from "./governance-data";
import { glossary, templates } from "./reference-data";
import { processFamilies, workflowRecords } from "./workflows-data";

export const allowedFamilies = processFamilies.map((family) => family.id);
export const allowedAuthorityLevels = authorityLevels.map((level) => level.id);
export const domainRightsNotice = "Original educational records and summaries are CC BY 4.0; project-created factual metadata is CC0 1.0. External source content remains subject to each publisher's terms.";

export function normalizeDomainRecord<T extends { id: string }>(record: T, collection: string) {
  const candidate = record as T & {
    version?: string;
    reviewed_at?: string;
    review_status?: string;
    provenance?: unknown;
  };

  return {
    ...record,
    version: candidate.version ?? "1",
    reviewed_at: candidate.reviewed_at ?? corpusReviewedAt,
    review_status: candidate.review_status ?? "published educational synthesis; professional sign-off not asserted",
    provenance: candidate.provenance ?? {
      publisher: "Accounting Agents",
      annotation_type: `original educational ${collection} record`,
      source_basis: "See the corresponding human guide and linked source records.",
      review_process: "automated integrity checks and maintainer editorial review",
    },
  };
}

function termsFor(query?: string) {
  return query?.trim().toLowerCase().split(/\s+/).filter(Boolean) ?? [];
}

function searchableText(value: unknown) {
  return JSON.stringify(value).toLowerCase();
}

export function searchWorkflows({
  query,
  family,
  authority,
}: {
  query?: string;
  family?: string;
  authority?: string;
}) {
  const terms = termsFor(query);

  return workflowRecords.filter((workflow) => {
    if (family && workflow.family !== family) return false;
    if (authority && workflow.authority_level !== authority) return false;
    const text = searchableText(workflow);
    return terms.every((term) => text.includes(term));
  });
}

export function searchRecords<T>({
  records,
  query,
}: {
  records: T[];
  query?: string;
}) {
  const terms = termsFor(query);
  if (!terms.length) return records;
  return records.filter((record) => {
    const text = searchableText(record);
    return terms.every((term) => text.includes(term));
  });
}

function list(lines: string[], label: string, items: string[]) {
  lines.push(`**${label}**`, "", ...items.map((item) => `- ${item}`), "");
}

function tableCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function markdownHeader(title: string, summary: string, count: number) {
  return [
    `# ${title}`,
    "",
    `> ${summary}`,
    "",
    `Records: ${count}. Reviewed: ${corpusReviewedAt}. Schema: 1.0.`,
    "",
    domainRightsNotice,
    "",
    "Educational material only. Apply current requirements for the entity, transaction, period, jurisdiction, and facts. Coverage does not grant execution authority.",
    "",
  ];
}

export function renderWorkflowsMarkdown(records: WorkflowRecord[] = workflowRecords) {
  const lines = markdownHeader(
    "Accounting-agent workflow library",
    "Evidence-linked workflow specifications across the accounting lifecycle.",
    records.length,
  );

  for (const family of processFamilies) {
    const familyRecords = records.filter((workflow) => workflow.family === family.id);
    if (!familyRecords.length) continue;
    lines.push(`## ${family.name}`, "", family.summary, "");

    for (const workflow of familyRecords) {
      lines.push(
        `### ${workflow.name}`,
        "",
        `- ID: \`${workflow.id}\`; version ${workflow.version}`,
        `- Authority: ${workflow.authority_level}`,
        `- Accountable owner: ${workflow.accountable_owner}`,
        `- Reviewer: ${workflow.reviewer}`,
        "",
      );
      if (workflow.brief) {
        lines.push(
          `#### One-minute workflow brief`,
          "",
          `- Brief ID: \`${workflow.brief.id}\`; version ${workflow.brief.version}`,
          `- Content mode: ${workflow.brief.content_mode}`,
          `- Evidence classification: ${workflow.brief.evidence_classification}`,
          `- Intended audience: ${workflow.brief.intended_audience}`,
          `- Outcome: ${workflow.brief.outcome}`,
          `- Default boundary: ${workflow.brief.default_boundary}`,
          `- Owner: ${workflow.brief.owner}`,
          `- Reviewer: ${workflow.brief.reviewer}`,
          `- Top check: ${workflow.brief.top_check}`,
          `- Top failure: ${workflow.brief.top_failure}`,
          `- Expected artifact: ${workflow.brief.expected_artifact}`,
          `- Pilot suitability: ${workflow.brief.pilot_suitability.rating}. ${workflow.brief.pilot_suitability.rationale}`,
          "",
          workflow.brief.why_agentic,
          "",
        );
        list(lines, "Prerequisites", workflow.brief.prerequisites);
        list(lines, "Good fit", workflow.brief.best_fit);
        list(lines, "Poor fit", workflow.brief.poor_fit);
        list(lines, "Pilot conditions", workflow.brief.pilot_suitability.conditions);
        lines.push(
          `**Synthetic example: ${workflow.brief.synthetic_example.title}**`,
          "",
          `- ID: \`${workflow.brief.synthetic_example.id}\``,
          `- Evidence classification: ${workflow.brief.synthetic_example.evidence_classification}`,
          `- Fictional: ${workflow.brief.synthetic_example.fictional}`,
          ...workflow.brief.synthetic_example.facts.map((fact) => `- ${fact}`),
          `- Safe decision: ${workflow.brief.synthetic_example.decision}`,
          "",
        );
        list(
          lines,
          "Related material",
          workflow.brief.related_material.map((item) => `${item.label} (${item.kind}; \`${item.id}\`) — ${item.href}`),
        );
        list(lines, "Limitations", workflow.brief.limitations);
        lines.push(
          `**Primary-source basis**`,
          "",
          ...workflow.brief.source_basis.map((source) => `- \`${source.id}\` — ${source.evidence_classification}. ${source.supports} Applicability: ${source.applicability}`),
          "",
          `- Next action: ${workflow.brief.next_action}`,
          `- Prepared: ${workflow.brief.prepared_at}`,
          `- Review status: ${workflow.brief.review_status}`,
          `- Review note: ${workflow.brief.review_note}`,
          `- Rights: editorial ${workflow.brief.rights.editorial_content}; synthetic example and factual metadata ${workflow.brief.rights.synthetic_example_and_factual_metadata}; external sources ${workflow.brief.rights.external_sources}.`,
          "",
        );
      }
      lines.push(
        "**Trigger and scope**",
        "",
        `- Trigger: ${workflow.trigger}`,
        `- Scope: ${workflow.scope}`,
        `- Entity scope: ${workflow.entity_scope}`,
        `- Period scope: ${workflow.period_scope}`,
        `- Jurisdiction: ${workflow.jurisdiction}`,
        `- Detail: /workflows/${workflow.family}/${workflow.id}`,
        `- API record: /api/v1/workflows/${workflow.id}`,
        "",
        workflow.summary,
        "",
        `**Accounting objective**`,
        "",
        workflow.accounting_objective,
        "",
      );
      list(lines, "Inputs", workflow.inputs);
      list(lines, "Control totals", workflow.control_totals);
      list(lines, "Read tools", workflow.read_tools);
      list(lines, "Write tools", workflow.write_tools);
      list(lines, "Agent procedures", workflow.agent_procedures);
      list(lines, "Deterministic checks", workflow.deterministic_checks);
      list(
        lines,
        `Accounting Agent Control Model (${workflow.control_model.model_id} v${workflow.control_model.model_version})`,
        workflow.control_model.elements.map((element) => `${element.element_id}: ${element.source_fields.join(", ")}`),
      );
      list(
        lines,
        "Action-level authority",
        workflow.actions.map((action) => `${action.action} — ${action.authority_level}. Agent: ${action.agent_role} Human: ${action.human_role}`),
      );
      list(lines, "Thresholds", workflow.thresholds);
      list(lines, "Human decisions", workflow.human_decisions);
      list(lines, "Segregation of duties", workflow.segregation_of_duties);
      list(lines, "Stop conditions", workflow.stop_conditions);
      list(lines, "Outputs", workflow.outputs);
      list(lines, "Run record", workflow.run_record);
      list(lines, "Failure modes", workflow.failure_modes);
      list(lines, "Recovery actions", workflow.recovery_actions);
      list(lines, "Pilot measures", workflow.pilot_measures);
      list(lines, "Production signals", workflow.production_signals);
      lines.push(
        `**Proposed accounting effects**`,
        "",
        workflow.proposed_accounting_effects,
        "",
        `**Retention**`,
        "",
        workflow.retention,
        "",
        `**Reproducibility**`,
        "",
        workflow.reproducibility,
        "",
        `**Source basis and applicability**`,
        "",
        ...workflow.source_links.map((source) => `- \`${source.source_id}\` — ${source.supports}. ${source.claims.map((claim) => `Claim (${claim.placement}): ${claim.text}`).join(" ")} Applicability: ${source.applicability}`),
        "",
        `**Reviewed and provenance**`,
        "",
        `- Reviewed: ${workflow.reviewed_at}`,
        `- Status: ${workflow.review_status}`,
        `- Publisher: ${workflow.provenance.publisher}`,
        `- Annotation: ${workflow.provenance.annotation_type}`,
        `- Review process: ${workflow.provenance.review_process}`,
        `- Source record IDs: ${workflow.provenance.source_basis.map((id) => `\`${id}\``).join(", ")}`,
        "",
      );
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}

export function renderAuthorityLevelsMarkdown(records: AuthorityLevel[] = authorityLevels) {
  const guide = authorityDecisionGuide;
  const lines = markdownHeader(
    "Authority ladder and decision tree",
    "Classify one action from explanation through constrained execution or human-only responsibility.",
    records.length,
  );
  lines.push(
    `- Guide ID: \`${guide.id}\`; version ${guide.version}`,
    `- Prepared: ${guide.prepared_at}`,
    `- Review status: ${guide.review_status}`,
    `- Primary mode: Reference`,
    `- Evidence classification: ${guide.evidence_classification}`,
    "",
    "## Reader outcome",
    "",
    `- Intended audience: ${guide.intended_audience}`,
    ...guide.prerequisites.map((item) => `- Prerequisite: ${item}`),
    `- Expected outcome: ${guide.expected_outcome}`,
    "",
    `**${guide.operating_rule.text}**`,
    "",
    `Evidence classification: ${guide.operating_rule.evidence_classification}.`,
    "",
    "## Authority ladder",
    "",
  );
  for (const record of records) {
    lines.push(
      `### ${record.id === "human-only" ? "Human-only" : record.id}: ${record.label}`,
      "",
      record.agent_role,
      "",
      `- Execution rule: ${record.execution_rule}`,
      `- Accounting example: ${record.accounting_example}`,
      `- Boundary: ${record.boundary}`,
      "",
    );
    list(lines, "Required controls", record.required_controls);
  }

  lines.push("## Decision tree", "");
  for (const [index, step] of guide.decision_steps.entries()) {
    lines.push(
      `### ${index + 1}. ${step.question}`,
      "",
      `- Stable ID: \`${step.id}\``,
      `- Why it matters: ${step.why_it_matters}`,
      `- Yes (${step.yes.kind}, \`${step.yes.target}\`): ${step.yes.label}`,
      `- No (${step.no.kind}, \`${step.no.target}\`): ${step.no.label}`,
      "",
    );
  }
  list(lines, "Stop instead of guessing", [...guide.stop_conditions]);

  lines.push(
    "## A3, A4, and human-only",
    "",
    "| Stable ID | Level | Entry condition | Decision owner | Permitted effect | Accounting example | Stop when |",
    "|---|---|---|---|---|---|---|",
    ...guide.execution_comparison.map((item) => `| \`${item.id}\` | ${item.level_id} | ${tableCell(item.entry_condition)} | ${tableCell(item.decision_owner)} | ${tableCell(item.permitted_effect)} | ${tableCell(item.accounting_example)} | ${tableCell(item.stop_when)} |`),
    "",
    `## Synthetic scenario: ${guide.mixed_level_workflow.title}`,
    "",
    `- Scenario ID: \`${guide.mixed_level_workflow.id}\``,
    `- Fictional: ${guide.mixed_level_workflow.fictional}`,
    `- Evidence classification: ${guide.mixed_level_workflow.evidence_classification}`,
    `- Context: ${guide.mixed_level_workflow.context}`,
    "",
    "| Stable action ID | Action | Level | Why | Accountable person |",
    "|---|---|---|---|---|",
    ...guide.mixed_level_workflow.actions.map((item) => `| \`${item.id}\` | ${tableCell(item.action)} | ${item.level_id} | ${tableCell(item.why)} | ${tableCell(item.accountable_person)} |`),
    "",
    `Finished artifact: ${guide.mixed_level_workflow.finished_artifact}`,
    "",
    "## Common misclassifications",
    "",
    "| Stable ID | Mistaken claim | Correction |",
    "|---|---|---|",
    ...guide.common_misclassifications.map((item) => `| \`${item.id}\` | ${tableCell(item.mistaken_claim)} | ${tableCell(item.correction)} |`),
    "",
    "## Segregation-of-duties comparisons",
    "",
    "| Stable ID | Unsafe combination | Safer design | Principle |",
    "|---|---|---|---|",
    ...guide.segregation_of_duties_examples.map((item) => `| \`${item.id}\` | ${tableCell(item.unsafe_combination)} | ${tableCell(item.safer_design)} | ${tableCell(item.principle)} |`),
    "",
    "## Sensitive-action mappings",
    "",
    ...guide.sensitive_action_mappings.map((item) => `- \`${item.id}\`: [${item.sensitive_action_id}](${item.href}) — ${item.rule}`),
    "",
  );
  list(lines, "Limitations", [...guide.limitations]);
  lines.push(
    "## Source basis, rights, and review",
    "",
    ...guide.source_basis.map((source) => `- [${source.id}](/resources/${source.id}) (${source.evidence_classification}) — ${source.scope}`),
    "",
    `Next action: ${guide.next_action}`,
    "",
    `- ${guide.review_note}`,
    `- Original editorial content: ${guide.rights.editorial_content}`,
    `- Project-created synthetic examples and factual metadata: ${guide.rights.synthetic_examples_and_factual_metadata}`,
    `- External sources: ${guide.rights.external_sources}`,
    "",
  );
  return lines.join("\n").trimEnd() + "\n";
}

export function renderSensitiveActionsMarkdown(records: SensitiveActionRecord[] = sensitiveActions) {
  const lines = markdownHeader(
    "Sensitive-action boundaries",
    "Preparation, approval, execution, rollback, and evidence requirements for high-impact actions.",
    records.length,
  );
  for (const record of records) {
    lines.push(
      `## ${record.name}`,
      "",
      `- ID: \`${record.id}\`; version ${record.version}`,
      `- Default authority: ${record.default_authority}`,
      "",
      record.summary,
      "",
    );
    list(lines, "Agent may prepare", record.agent_may_prepare);
    list(lines, "Agent may execute", record.agent_may_execute);
    list(lines, "Human-only conditions", record.human_only_conditions);
    list(lines, "Identity and segregation of duties", record.identity_and_sod);
    list(lines, "Limits", record.limits);
    list(lines, "Approval evidence", record.approval_evidence);
    list(lines, "Pre-execution checks", record.pre_execution_checks);
    list(lines, "Rollback or compensation", record.rollback_or_compensation);
    list(lines, "Logging and review", record.logging_and_review);
    lines.push("**Source record IDs**", "", record.source_ids.map((id) => `\`${id}\``).join(", "), "");
  }
  return lines.join("\n").trimEnd() + "\n";
}

export function renderControlsMarkdown(records: ControlPattern[] = controlPatterns) {
  const lines = markdownHeader(
    "Control patterns",
    "Reusable control designs for governed accounting-agent systems and workflows.",
    records.length,
  );
  for (const record of records) {
    lines.push(
      `## ${record.name}`,
      "",
      `- ID: \`${record.id}\`; version ${record.version}`,
      `- Owner: ${record.owner}`,
      `- Frequency: ${record.frequency}`,
      "",
      `**Risk:** ${record.risk}`,
      "",
      `**Objective:** ${record.objective}`,
      "",
    );
    list(lines, "Procedure", record.procedure);
    list(lines, "Evidence", record.evidence);
    list(lines, "Exceptions", record.exceptions);
    lines.push("**Source record IDs**", "", record.source_ids.map((id) => `\`${id}\``).join(", "), "");
  }
  return lines.join("\n").trimEnd() + "\n";
}

export function renderTemplatesMarkdown(records: TemplateRecord[] = templates) {
  const lines = markdownHeader(
    "Implementation templates",
    "Practical structures for designing, operating, reviewing, and improving accounting-agent work.",
    records.length,
  );
  for (const record of records) {
    lines.push(
      `## ${record.name}`,
      "",
      `- ID: \`${record.id}\`; version ${record.version}`,
      `- Purpose: ${record.purpose}`,
      `- Use when: ${record.use_when}`,
      "",
    );
    for (const section of record.sections) {
      lines.push(`### ${section.heading}`, "", section.prompt, "");
    }
  }
  return lines.join("\n").trimEnd() + "\n";
}

export function renderGlossaryMarkdown(records: GlossaryEntry[] = glossary) {
  const lines = markdownHeader(
    "Accounting-agent glossary",
    "Controlled terms used across the human guide and machine-readable corpus.",
    records.length,
  );
  for (const record of records) {
    lines.push(
      `## ${record.term}`,
      "",
      `ID: \`${record.id}\``,
      "",
      record.definition,
      "",
      `Related: ${record.related.join(", ")}.`,
      "",
    );
  }
  return lines.join("\n").trimEnd() + "\n";
}

export function shiftMarkdownHeadings(markdown: string, levels = 1) {
  if (levels < 1) return markdown;
  const prefix = "#".repeat(levels);
  return markdown.replace(/^(#{1,5})(?=\s)/gm, `${prefix}$1`);
}

export function renderDomainCorpusMarkdown(headingShift = 0) {
  return [
    shiftMarkdownHeadings(renderAuthorityLevelsMarkdown(), headingShift).trimEnd(),
    "",
    shiftMarkdownHeadings(renderWorkflowsMarkdown(), headingShift).trimEnd(),
    "",
    shiftMarkdownHeadings(renderSensitiveActionsMarkdown(), headingShift).trimEnd(),
    "",
    shiftMarkdownHeadings(renderControlsMarkdown(), headingShift).trimEnd(),
    "",
    shiftMarkdownHeadings(renderTemplatesMarkdown(), headingShift).trimEnd(),
    "",
    shiftMarkdownHeadings(renderGlossaryMarkdown(), headingShift).trimEnd(),
    "",
  ].join("\n");
}

export function isAuthorityLevel(value: string): value is AuthorityLevelId {
  return allowedAuthorityLevels.includes(value as AuthorityLevelId);
}
