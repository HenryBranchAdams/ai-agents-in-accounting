import { searchItems } from "./content";
import { authorityLevels } from "./domain-model";
import { controlPatterns, sensitiveActions } from "./governance-data";
import { ecosystemLayers } from "./ecosystem-data";
import { packs, benchmarkCases, releaseNotes } from "./platform-data";
import { glossary, templates } from "./reference-data";
import {
  resourceCurationById,
  resources,
  sourceRelationshipProfiles,
} from "./resources-data";
import { workflowRecords } from "./workflows-data";

export type SearchDocument = {
  id: string;
  record_type: string;
  title: string;
  summary: string;
  canonical_path: string;
  api_path: string | null;
  family: string | null;
  authority: string | null;
  topic: string | null;
  kind: string | null;
  keywords: string[];
};

export const searchRecordTypes = [
  "page", "workflow", "resource", "authority", "control", "sensitive-action",
  "template", "glossary", "pack", "benchmark", "change",
  "ecosystem",
] as const;

const documents: SearchDocument[] = [
  ...searchItems.map((item, index) => ({
    id: `page-${index + 1}`,
    record_type: "page",
    title: item.title,
    summary: item.detail,
    canonical_path: item.href,
    api_path: null,
    family: null,
    authority: null,
    topic: null,
    kind: item.category,
    keywords: [item.category],
  })),
  ...workflowRecords.map((item) => ({
    id: item.id,
    record_type: "workflow",
    title: item.name,
    summary: item.summary,
    canonical_path: `/workflows/${item.family}/${item.id}`,
    api_path: `/api/v1/workflows/${item.id}`,
    family: item.family,
    authority: item.authority_level,
    topic: null,
    kind: "workflow",
    keywords: [
      item.accounting_objective,
      ...item.outputs,
      ...(item.brief ? [
        item.brief.outcome,
        item.brief.why_agentic,
        item.brief.default_boundary,
        item.brief.top_check,
        item.brief.top_failure,
        item.brief.expected_artifact,
        item.brief.pilot_suitability.rating.replaceAll("-", " "),
        item.brief.pilot_suitability.rationale,
        ...item.brief.best_fit,
        ...item.brief.poor_fit,
      ] : []),
    ],
  })),
  ...resources.map((item) => ({
    id: item.id,
    record_type: "resource",
    title: item.title,
    summary: item.note,
    canonical_path: `/resources/${item.id}`,
    api_path: `/api/v1/resources/${item.id}`,
    family: null,
    authority: null,
    topic: item.topic,
    kind: item.kind,
    keywords: [
      item.owner,
      item.jurisdiction,
      item.date,
      ...(resourceCurationById[item.id]?.applicability ?? []),
      resourceCurationById[item.id]?.applicability_note ?? "",
      resourceCurationById[item.id]?.temporal_role ?? "",
      resourceCurationById[item.id]?.lifecycle ?? "",
      resourceCurationById[item.id]?.publication_status ?? "",
      resourceCurationById[item.id]?.method ?? "",
      resourceCurationById[item.id]?.transfer_limit ?? "",
      resourceCurationById[item.id]?.source_updated_at ?? "",
      resourceCurationById[item.id]?.next_review_at ?? "",
      ...(sourceRelationshipProfiles[item.id]?.questions ?? []),
      ...(sourceRelationshipProfiles[item.id]?.claims.map((claim) => claim.text) ?? []),
      ...(sourceRelationshipProfiles[item.id]?.contrary_claims.map((claim) => claim.text) ?? []),
      ...(sourceRelationshipProfiles[item.id]?.limitations ?? []),
      sourceRelationshipProfiles[item.id]?.next_action ?? "",
    ],
  })),
  ...authorityLevels.map((item) => ({
    id: `authority-${item.id}`,
    record_type: "authority",
    title: `${item.id === "human-only" ? "Human-only" : item.id}: ${item.label}`,
    summary: item.boundary,
    canonical_path: `/authority#level-${item.id}`,
    api_path: "/api/v1/authority-levels",
    family: null,
    authority: item.id,
    topic: null,
    kind: "authority",
    keywords: [item.agent_role, item.execution_rule],
  })),
  ...controlPatterns.map((item) => ({
    id: item.id,
    record_type: "control",
    title: item.name,
    summary: item.objective,
    canonical_path: `/controls#${item.id}`,
    api_path: "/api/v1/controls",
    family: null,
    authority: null,
    topic: null,
    kind: "control",
    keywords: [item.risk, ...item.procedure],
  })),
  ...sensitiveActions.map((item) => ({
    id: item.id,
    record_type: "sensitive-action",
    title: item.name,
    summary: item.summary,
    canonical_path: `/sensitive-actions#${item.id}`,
    api_path: "/api/v1/sensitive-actions",
    family: null,
    authority: item.default_authority,
    topic: null,
    kind: "sensitive-action",
    keywords: [...item.human_only_conditions, ...item.limits],
  })),
  ...templates.map((item) => ({
    id: item.id,
    record_type: "template",
    title: item.name,
    summary: item.purpose,
    canonical_path: `/templates#${item.id}`,
    api_path: "/api/v1/templates",
    family: null,
    authority: null,
    topic: null,
    kind: "template",
    keywords: [item.use_when],
  })),
  ...glossary.map((item) => ({
    id: item.id,
    record_type: "glossary",
    title: item.term,
    summary: item.definition,
    canonical_path: `/glossary#${item.id}`,
    api_path: "/api/v1/glossary",
    family: null,
    authority: null,
    topic: null,
    kind: "glossary",
    keywords: item.related,
  })),
  ...packs.map((item) => ({
    id: item.id,
    record_type: "pack",
    title: item.title,
    summary: item.summary,
    canonical_path: `/packs/${item.id}`,
    api_path: `/api/v1/packs/${item.id}`,
    family: item.process_family,
    authority: item.authority_level,
    topic: null,
    kind: "workflow-pack",
    keywords: [...item.workflow_ids, ...item.procedures],
  })),
  ...benchmarkCases.map((item) => ({
    id: item.id,
    record_type: "benchmark",
    title: item.title,
    summary: item.objective,
    canonical_path: `/bench#${item.id}`,
    api_path: `/api/v1/benchmark?pack=${item.pack_id}`,
    family: packs.find((pack) => pack.id === item.pack_id)?.process_family ?? null,
    authority: null,
    topic: null,
    kind: item.case_type,
    keywords: item.expected.exception_codes,
  })),
  ...releaseNotes.map((item) => ({
    id: `release-${item.id}`,
    record_type: "change",
    title: item.title,
    summary: item.summary,
    canonical_path: `/changes#release-${item.id}`,
    api_path: null,
    family: null,
    authority: null,
    topic: null,
    kind: "project-release",
    keywords: item.changes,
  })),
  ...ecosystemLayers.map((item) => ({
    id: `ecosystem-${item.id}`,
    record_type: "ecosystem",
    title: item.name,
    summary: item.role,
    canonical_path: `/ecosystem#${item.id}`,
    api_path: "/api/v1/ecosystem",
    family: null,
    authority: null,
    topic: "Agent engineering",
    kind: item.posture,
    keywords: [item.use_here, item.boundary, ...item.source_ids],
  })),
];

function normalizedText(value: unknown) {
  return String(value ?? "").toLowerCase();
}

function rank(document: SearchDocument, terms: string[]) {
  const id = normalizedText(document.id);
  const title = normalizedText(document.title);
  const summary = normalizedText(document.summary);
  const keywords = normalizedText(document.keywords.join(" "));
  const query = terms.join(" ");
  if (id === query || title === query) return 0;
  if (id.startsWith(query) || title.startsWith(query)) return 1;
  if (terms.every((term) => title.includes(term))) return 2;
  if (terms.every((term) => `${summary} ${keywords}`.includes(term))) return 3;
  return null;
}

export function searchCatalog({
  query,
  types,
  family,
  authority,
  topic,
  kind,
}: {
  query: string;
  types?: string[];
  family?: string;
  authority?: string;
  topic?: string;
  kind?: string;
}) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return documents.flatMap((document) => {
    if (types?.length && !types.includes(document.record_type)) return [];
    if (family && document.family !== family) return [];
    if (authority && document.authority !== authority) return [];
    if (topic && document.topic !== topic) return [];
    if (kind && document.kind !== kind) return [];
    const resultRank = rank(document, terms);
    if (resultRank === null) return [];
    const matchedFields = [
      normalizedText(document.id).includes(terms[0] ?? "") ? "id" : null,
      terms.some((term) => normalizedText(document.title).includes(term)) ? "title" : null,
      terms.some((term) => normalizedText(document.summary).includes(term)) ? "summary" : null,
      terms.some((term) => normalizedText(document.keywords.join(" ")).includes(term)) ? "keywords" : null,
    ].filter((field): field is string => Boolean(field));
    return [{ ...document, rank: resultRank, matched_fields: matchedFields }];
  }).sort((left, right) => left.rank - right.rank
    || left.record_type.localeCompare(right.record_type)
    || left.title.localeCompare(right.title)
    || left.id.localeCompare(right.id));
}
