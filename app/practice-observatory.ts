import { readingRoomSections } from "./reading-room-data";
import {
  resourceCurationById,
  resourceIndustryFacets,
  resources,
  sourceEvidenceTiers,
  sourceRelationshipProfiles,
  type Resource,
  type ResourceIndustry,
} from "./resources-data";

export const practiceObservatoryId = "accounting-agents-practice-observatory";

export const practiceObservatoryLaneIds = [
  "official-standard",
  "research",
  "product",
  "disclosed-practice",
  "technical-development",
] as const;

export type PracticeObservatoryLaneId = (typeof practiceObservatoryLaneIds)[number];

const productSourceIds = new Set([
  "src_netsuite26ai",
  "src_sageclose25",
  "src_digitsagents25",
  "src_prophixagents25",
  "src_workiva26agents",
]);

const disclosedPracticeSourceIds = new Set(["src_rivianagents"]);

export const practiceObservatoryLanes = [
  {
    id: "official-standard",
    label: "Official and standards developments",
    description: "Rules, standards, consultations, and official guidance from issuing bodies. Applicability still depends on jurisdiction, entity, period, and facts.",
  },
  {
    id: "research",
    label: "Research",
    description: "Original research with a stated method. A study supports only the population, task, model, setting, and outcomes it actually examined.",
  },
  {
    id: "product",
    label: "Products",
    description: "First-party product releases and feature descriptions. Availability and provider claims are not independent evidence of accuracy, adoption, control effectiveness, or outcomes.",
  },
  {
    id: "disclosed-practice",
    label: "Disclosed practice",
    description: "Named implementation examples with a visible operating context. One disclosure cannot establish general effectiveness, prevalence, savings, or fitness elsewhere.",
  },
  {
    id: "technical-development",
    label: "Technical developments",
    description: "Interfaces, protocols, and engineering material that may shape accounting-agent systems without establishing accounting authority or production readiness.",
  },
] as const satisfies readonly { id: PracticeObservatoryLaneId; label: string; description: string }[];

const evidenceTierLabelById = new Map(sourceEvidenceTiers.map((tier) => [tier.id, tier.label]));
const industryLabelById = new Map(resourceIndustryFacets.map((industry) => [industry.id, industry.label]));
const shelfByResourceId = new Map(
  readingRoomSections.flatMap((section) => section.resources.map((resource) => [
    resource.id,
    { id: section.id, label: section.title, href: `/reading-room#${section.id}` },
  ] as const)),
);

function laneFor(resource: Resource): PracticeObservatoryLaneId {
  if (resource.kind === "Rule or standard" || resource.kind === "Official guidance") return "official-standard";
  if (resource.kind === "Research paper") return "research";
  if (resource.kind === "Technical reference") return "technical-development";
  if (resource.kind === "Practice example") {
    if (productSourceIds.has(resource.id)) return "product";
    if (disclosedPracticeSourceIds.has(resource.id)) return "disclosed-practice";
  }
  throw new Error(`Current-development source ${resource.id} has no observatory lane.`);
}

const currentDevelopmentResources = resources.filter(
  (resource) => resourceCurationById[resource.id]?.temporal_role === "current-development",
);

export type PracticeObservatoryItem = {
  id: string;
  resource_id: string;
  lane_id: PracticeObservatoryLaneId;
  title: string;
  publisher: string;
  source_type: Resource["kind"];
  topic: Resource["topic"];
  published_or_status: string;
  jurisdiction: string;
  access: string;
  summary: string;
  catalog_href: string;
  original_source_href: string;
  source_updated_at: string | null;
  record_reviewed_at: string;
  source_verified_at: string;
  next_review_at: string;
  lifecycle: string;
  publication_status: string;
  applicability: { id: ResourceIndustry; label: string }[];
  applicability_note: string;
  method: string;
  transfer_limit: string;
  commercial_interest: string;
  evidence_tier: string | null;
  evidence_tier_label: string;
  relationship_profiled: boolean;
  review_status: string;
  reading_room_shelf: { id: string; label: string; href: string } | null;
};

export const practiceObservatoryItems: PracticeObservatoryItem[] = currentDevelopmentResources
  .map((resource) => {
    const curation = resourceCurationById[resource.id];
    if (!curation) throw new Error(`Current-development source ${resource.id} is missing curation.`);
    const relationshipProfile = sourceRelationshipProfiles[resource.id] ?? null;

    return {
      id: `observatory-${resource.id}`,
      resource_id: resource.id,
      lane_id: laneFor(resource),
      title: resource.title,
      publisher: resource.owner,
      source_type: resource.kind,
      topic: resource.topic,
      published_or_status: resource.date,
      jurisdiction: resource.jurisdiction,
      access: resource.access,
      summary: resource.note,
      catalog_href: `/resources/${resource.id}`,
      original_source_href: resource.href,
      source_updated_at: curation.source_updated_at,
      record_reviewed_at: curation.record_reviewed_at,
      source_verified_at: curation.source_verified_at,
      next_review_at: curation.next_review_at,
      lifecycle: curation.lifecycle,
      publication_status: curation.publication_status,
      applicability: curation.applicability.map((id) => ({
        id,
        label: industryLabelById.get(id) ?? id,
      })),
      applicability_note: curation.applicability_note,
      method: curation.method,
      transfer_limit: curation.transfer_limit,
      commercial_interest: curation.commercial_interest,
      evidence_tier: relationshipProfile?.evidence_tier ?? null,
      evidence_tier_label: relationshipProfile
        ? evidenceTierLabelById.get(relationshipProfile.evidence_tier) ?? relationshipProfile.evidence_tier
        : "Not assigned · relationship profile pending",
      relationship_profiled: Boolean(relationshipProfile),
      review_status: curation.review_status,
      reading_room_shelf: shelfByResourceId.get(resource.id) ?? null,
    };
  })
  .sort((left, right) => {
    if (left.source_updated_at && right.source_updated_at) {
      return right.source_updated_at.localeCompare(left.source_updated_at) || left.title.localeCompare(right.title);
    }
    if (left.source_updated_at) return -1;
    if (right.source_updated_at) return 1;
    return left.title.localeCompare(right.title);
  });

const laneCounts = Object.fromEntries(
  practiceObservatoryLanes.map((lane) => [
    lane.id,
    practiceObservatoryItems.filter((item) => item.lane_id === lane.id).length,
  ]),
) as Record<PracticeObservatoryLaneId, number>;

export const accountingAgentsPracticeObservatory = {
  id: practiceObservatoryId,
  version: "1.0.0",
  title: "Practice observatory: current accounting-agent developments",
  description:
    "A dated, source-linked index of material official developments, research, products, technical work, and disclosed practice in accounting agents.",
  prepared_at: "2026-08-27",
  snapshot_as_of: "2026-08-27",
  review_status: "maintainer-review-pending",
  review_note:
    "Maintainer review is pending. Subject-matter, independent, professional, audit, certification, or assurance review is not claimed.",
  primary_mode: "evidence-synthesis",
  evidence_classification: "editorial-recommendation",
  governing_rule: {
    id: "observatory-governing-rule",
    text: "Agents may prepare accounting work; accountable people approve conclusions and sensitive external actions.",
    evidence_classification: "editorial-recommendation",
    implication:
      "A source, product announcement, study, or disclosed deployment can inform investigation; it does not authorize reliance, posting, filing, payment, approval, certification, or external communication.",
  },
  scope: {
    question: "What recent material in the maintained source catalog deserves a closer look, and what does each item actually establish?",
    admission_rules: [
      "Include only canonical catalog records explicitly reviewed as current-development.",
      "Link both the stable Accounting Agents catalog record and the publisher's original source page.",
      "Preserve source type, method, commercial interest, industry applicability, freshness, and transfer limit.",
      "Assign product and disclosed-practice lanes only through an explicit reviewed source list; do not infer adoption from marketing language.",
      "Show an evidence tier only when a relationship profile assigns one; otherwise say that profiling is pending.",
    ],
    exclusions: [
      "No score, ranking, leaderboard, winner, adoption rate, market-share estimate, ROI claim, or effectiveness claim.",
      "No automated news monitoring or claim that this snapshot is exhaustive or continuously current.",
      "No new benchmark cases, evaluation tracks, or LedgerBench expansion.",
    ],
  },
  freshness: {
    ordering: "Descending source_updated_at; records without a normalized source update date appear last and are not guessed.",
    source_date_boundary: "The publisher's date or status, source update date, catalog review date, verification date, and next review date are distinct fields.",
    monitoring_boundary: "This is a maintained catalog snapshot, not an automatic alerting service or a representation that no later source exists.",
  },
  counts: {
    records: practiceObservatoryItems.length,
    lanes: practiceObservatoryLanes.length,
    lane_records: laneCounts,
    relationship_profiled_records: practiceObservatoryItems.filter((item) => item.relationship_profiled).length,
    general_applicability_records: practiceObservatoryItems.filter((item) => item.applicability.some((industry) => industry.id === "general")).length,
    industry_specific_applicability_records: practiceObservatoryItems.filter((item) => item.applicability.some((industry) => industry.id !== "general")).length,
  },
  lanes: practiceObservatoryLanes,
  items: practiceObservatoryItems,
  limitations: [
    "The index is a bounded editorial selection over the maintained catalog, not a complete census of the field.",
    "Inclusion means the record warrants attention; it is not endorsement, validation, professional reliance, or evidence of general effectiveness.",
    "Official material may be authoritative or useful guidance yet still be inapplicable to a particular entity, jurisdiction, transaction, or period.",
    "Research findings do not transfer beyond the studied task, population, model, data, setting, and outcome without additional support.",
    "Product and disclosed-practice records retain publisher, commercial-interest, selection, and context limits.",
    "External source rights remain unknown unless the publisher documents a grant; this project stores metadata and original editorial summaries, not third-party full text.",
  ],
  next_action:
    "Filter to the question and industry, open the catalog record to inspect its method and transfer limit, then verify the current primary source before relying on it.",
  rights: {
    editorial_content: "CC BY 4.0",
    factual_metadata: "CC0 1.0",
    external_sources: "Publisher terms apply; external full text is not stored or relicensed.",
  },
} as const;

function escapeMarkdown(value: string) {
  return value.replace(/([\\[\]|])/g, "\\$1").replace(/\n/g, " ");
}

export function renderPracticeObservatoryMarkdown(origin = "") {
  const observatory = accountingAgentsPracticeObservatory;
  const lines = [
    `# ${observatory.title}`,
    "",
    `> ${observatory.description}`,
    "",
    `- Observatory ID: \`${observatory.id}\`; version ${observatory.version}`,
    `- Snapshot as of: ${observatory.snapshot_as_of}`,
    `- Review status: ${observatory.review_status}`,
    `- Primary mode: ${observatory.primary_mode}`,
    `- Evidence classification: ${observatory.evidence_classification}`,
    `- Coverage: ${observatory.counts.records} records across ${observatory.counts.lanes} lanes`,
    "",
    `**${observatory.governing_rule.text}**`,
    "",
    observatory.governing_rule.implication,
    "",
    "## Method and boundaries",
    "",
    observatory.scope.question,
    "",
    ...observatory.scope.admission_rules.map((rule) => `- ${rule}`),
    "",
    "This index does not provide:",
    "",
    ...observatory.scope.exclusions.map((exclusion) => `- ${exclusion}`),
    "",
    `Freshness: ${observatory.freshness.ordering} ${observatory.freshness.source_date_boundary} ${observatory.freshness.monitoring_boundary}`,
    "",
  ];

  for (const lane of observatory.lanes) {
    const laneItems = observatory.items.filter((item) => item.lane_id === lane.id);
    lines.push(`## ${lane.label} (${laneItems.length})`, "", lane.description, "");

    for (const item of laneItems) {
      lines.push(
        `### ${escapeMarkdown(item.title)}`,
        "",
        `- Observatory record: \`${item.id}\``,
        `- Source ID: \`${item.resource_id}\``,
        `- Publisher: ${item.publisher}`,
        `- Source type: ${item.source_type}`,
        `- Topic: ${item.topic}`,
        `- Publisher date or status: ${item.published_or_status}`,
        `- Normalized source update: ${item.source_updated_at ?? "not normalized; not guessed"}`,
        `- Catalog reviewed / source verified / next review: ${item.record_reviewed_at} / ${item.source_verified_at} / ${item.next_review_at}`,
        `- Lifecycle / publication status: ${item.lifecycle} / ${item.publication_status}`,
        `- Industry applicability: ${item.applicability.map((industry) => `${industry.label} (\`${industry.id}\`)`).join(", ")}`,
        `- Evidence tier: ${item.evidence_tier_label}`,
        `- Commercial interest: ${item.commercial_interest}`,
        `- Method: ${item.method}`,
        `- Transfer limit: ${item.transfer_limit}`,
        `- Catalog record: ${origin}${item.catalog_href}`,
        `- Original source: ${item.original_source_href}`,
        `- Reading-room shelf: ${item.reading_room_shelf ? `[${item.reading_room_shelf.label}](${origin}${item.reading_room_shelf.href})` : "not assigned"}`,
        "",
        item.summary,
        "",
      );
    }
  }

  lines.push(
    "## Limitations and next action",
    "",
    ...observatory.limitations.map((limitation) => `- ${limitation}`),
    "",
    `Next action: ${observatory.next_action}`,
    "",
    `Review note: ${observatory.review_note}`,
    "",
    `Rights: editorial content ${observatory.rights.editorial_content}; factual metadata ${observatory.rights.factual_metadata}; ${observatory.rights.external_sources}`,
    "",
  );

  return lines.join("\n");
}
