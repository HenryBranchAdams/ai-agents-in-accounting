import { authorityLevels } from "./domain-model";
import { controlPatterns } from "./governance-data";
import {
  resourceCurationById,
  resourceIndustryFacets,
  resources,
  type ResourceIndustry,
  type ResourceTimeRole,
  type SourceEvidenceClassification,
} from "./resources-data";
import { accountingAgentReviewerGuide } from "./reviewer-guide";
import { workflowRecords } from "./workflows-data";

export const atlasId = "accounting-agents-living-atlas";
export const atlasVersion = "1.0.0";
export const atlasPreparedAt = "2026-08-28";

export const atlasClusterIds = [
  "accounting-work",
  "controls-risks",
  "agent-capabilities",
  "primary-sources",
  "industries",
] as const;

export type AtlasClusterId = (typeof atlasClusterIds)[number];

export const atlasNodeKinds = [
  "workflow",
  "learning-step",
  "human-gate",
  "control",
  "capability",
  "source",
  "industry",
] as const;

export type AtlasNodeKind = (typeof atlasNodeKinds)[number];

export const atlasTimeLayerIds = ["all", "foundational", "current-development"] as const;
export type AtlasTimeLayerId = (typeof atlasTimeLayerIds)[number];

export type AtlasNode = {
  id: string;
  canonical_record_id: string | null;
  kind: AtlasNodeKind;
  cluster: AtlasClusterId;
  label: string;
  short_label: string;
  summary: string;
  detail: string;
  evidence_classification: SourceEvidenceClassification;
  industries: ResourceIndustry[];
  temporal_role: ResourceTimeRole | null;
  href: string | null;
  reviewed_at: string;
  review_status: string;
  mobile_priority: "core" | "context" | "extended";
  position: { x: number; y: number };
  provenance: {
    source_file: string;
    source_record_id: string | null;
    derivation: string;
  };
  source: {
    publisher: string;
    published_or_status: string;
    source_type: string;
    original_href: string;
    method: string;
    transfer_limit: string;
    lifecycle: string;
  } | null;
  example: {
    title: string;
    text: string;
    evidence_classification: "synthetic-example";
  } | null;
  guide: {
    prompt: string;
    questions: string[];
    next_href: string | null;
    next_label: string | null;
  } | null;
};

export type AtlasEdge = {
  id: string;
  source: string;
  target: string;
  relationship: string;
  label: string;
  evidence_classification: "editorial-recommendation" | "implementation-pattern";
  path_edge: boolean;
};

const workflowById = new Map(workflowRecords.map((record) => [record.id, record]));
const controlById = new Map(controlPatterns.map((record) => [record.id, record]));
const resourceById = new Map(resources.map((record) => [record.id, record]));
const industryById = new Map(resourceIndustryFacets.map((record) => [record.id, record]));
const authorityById = new Map(authorityLevels.map((record) => [record.id, record]));

function requiredRecord<T>(map: Map<string, T>, id: string, kind: string): T {
  const record = map.get(id);
  if (!record) throw new Error(`Living Atlas references unknown ${kind} record ${id}.`);
  return record;
}

const bankReconciliation = requiredRecord(workflowById, "wf-r2r-bank-reconciliations", "workflow");
const balanceReconciliation = requiredRecord(workflowById, "wf-r2r-balance-reconciliations", "workflow");
const journalEntry = requiredRecord(workflowById, "wf-r2r-journal-entry", "workflow");
const humanOnly = requiredRecord(authorityById, "human-only", "authority");
const reviewerDisposition = requiredRecord(
  new Map(accountingAgentReviewerGuide.review_sequence.map((step) => [step.id, step])),
  "review-step-disposition",
  "reviewer-guide step",
);

function workflowNode({
  id,
  canonicalId,
  shortLabel,
  position,
  mobilePriority,
}: {
  id: string;
  canonicalId: string;
  shortLabel: string;
  position: AtlasNode["position"];
  mobilePriority: AtlasNode["mobile_priority"];
}): AtlasNode {
  const record = requiredRecord(workflowById, canonicalId, "workflow");
  return {
    id,
    canonical_record_id: record.id,
    kind: "workflow",
    cluster: "accounting-work",
    label: record.name,
    short_label: shortLabel,
    summary: record.summary,
    detail: record.accounting_objective,
    evidence_classification: "implementation-pattern",
    industries: ["general"],
    temporal_role: null,
    href: `/workflows/${record.family}/${record.id}`,
    reviewed_at: record.reviewed_at,
    review_status: record.review_status,
    mobile_priority: mobilePriority,
    position,
    provenance: {
      source_file: "app/workflows-data.ts",
      source_record_id: record.id,
      derivation: "Label, summary, objective, authority boundary, and destination are projected from the canonical workflow record.",
    },
    source: null,
    example: null,
    guide: null,
  };
}

function controlNode({
  id,
  position,
  mobilePriority,
}: {
  id: string;
  position: AtlasNode["position"];
  mobilePriority: AtlasNode["mobile_priority"];
}): AtlasNode {
  const record = requiredRecord(controlById, id, "control");
  return {
    id: record.id,
    canonical_record_id: record.id,
    kind: "control",
    cluster: "controls-risks",
    label: record.name,
    short_label: record.name,
    summary: record.objective,
    detail: `Risk addressed: ${record.risk}`,
    evidence_classification: "implementation-pattern",
    industries: ["general"],
    temporal_role: null,
    href: `/controls#${record.id}`,
    reviewed_at: record.reviewed_at,
    review_status: "published educational synthesis; professional sign-off not asserted",
    mobile_priority: mobilePriority,
    position,
    provenance: {
      source_file: "app/governance-data.ts",
      source_record_id: record.id,
      derivation: "Name, objective, risk, and destination are projected from the canonical control record.",
    },
    source: null,
    example: null,
    guide: null,
  };
}

const sourceClassifications: Record<string, SourceEvidenceClassification> = {
  src_0vf7hhg: "authoritative-requirement",
  src_1l45nk0: "authoritative-requirement",
  src_075usnq: "authoritative-requirement",
  src_1v1zwt5: "official-guidance",
  src_agenticaudit: "implementation-pattern",
  src_netsuite26ai: "implementation-pattern",
  src_osfi26agent: "official-guidance",
  src_hipaaba: "official-guidance",
  src_nistmfg2: "official-guidance",
};

function sourceNode({
  id,
  position,
  mobilePriority,
}: {
  id: keyof typeof sourceClassifications;
  position: AtlasNode["position"];
  mobilePriority: AtlasNode["mobile_priority"];
}): AtlasNode {
  const record = requiredRecord(resourceById, id, "source");
  const curation = resourceCurationById[id];
  if (!curation) throw new Error(`Living Atlas source ${id} is missing reviewed curation metadata.`);
  return {
    id: record.id,
    canonical_record_id: record.id,
    kind: "source",
    cluster: "primary-sources",
    label: record.title,
    short_label: record.title
      .replace("Internal Control: Integrated Framework", "COSO framework")
      .replace("FinBalance: A Multi-Document Accounting Reconciliation Benchmark", "FinBalance")
      .replace("AuditFlow: Executable Symbolic Environments for Structured Financial Reporting Verification", "AuditFlow")
      .replace("Fundamental Elements for Third-Party Cyber Risk Management in the Financial Sector", "Third-party risk")
      .replace("Artificial Intelligence", "AI"),
    summary: record.note,
    detail: curation.applicability_note,
    evidence_classification: sourceClassifications[id],
    industries: curation.applicability,
    temporal_role: curation.temporal_role,
    href: `/resources/${record.id}`,
    reviewed_at: curation.record_reviewed_at,
    review_status: curation.review_status,
    mobile_priority: mobilePriority,
    position,
    provenance: {
      source_file: record.id.startsWith("src_") && ["src_agenticaudit", "src_netsuite26ai", "src_osfi26agent", "src_hipaaba", "src_nistmfg2"].includes(record.id)
        ? "app/resources-reading-room-expansion.ts + app/resources-data.ts"
        : "app/resources-data.ts",
      source_record_id: record.id,
      derivation: "Source metadata and reviewed curation fields are projected without changing the publisher claim or transfer limit.",
    },
    source: {
      publisher: record.owner,
      published_or_status: record.date,
      source_type: record.kind,
      original_href: record.href,
      method: curation.method,
      transfer_limit: curation.transfer_limit,
      lifecycle: curation.lifecycle,
    },
    example: null,
    guide: null,
  };
}

function industryNode({
  id,
  position,
  mobilePriority,
}: {
  id: ResourceIndustry;
  position: AtlasNode["position"];
  mobilePriority: AtlasNode["mobile_priority"];
}): AtlasNode {
  const record = requiredRecord(industryById, id, "industry");
  return {
    id: `atlas-industry-${record.id}`,
    canonical_record_id: record.id,
    kind: "industry",
    cluster: "industries",
    label: record.label,
    short_label: record.label,
    summary: record.description,
    detail: "This lens filters reviewed applicability metadata. It does not infer that general material applies to a specific entity or industry.",
    evidence_classification: "editorial-recommendation",
    industries: [record.id],
    temporal_role: null,
    href: `/resources?industry=${record.id}`,
    reviewed_at: atlasPreparedAt,
    review_status: "maintainer-review-pending",
    mobile_priority: mobilePriority,
    position,
    provenance: {
      source_file: "app/resources-data.ts",
      source_record_id: record.id,
      derivation: "Label and description are projected from the canonical resource-industry facet.",
    },
    source: null,
    example: null,
    guide: null,
  };
}

const pathNodes: AtlasNode[] = [
  {
    ...workflowNode({
      id: "atlas-path-bank-reconciliation",
      canonicalId: bankReconciliation.id,
      shortLabel: "Bank reconciliation",
      position: { x: 90, y: 300 },
      mobilePriority: "core",
    }),
    guide: {
      prompt: "What must be true before matching begins?",
      questions: [
        "Can you reproduce both bank and book control totals?",
        "Are the account, entity, currency, and period unambiguous?",
        "Which missing evidence would make the run stop?",
      ],
      next_href: "/workflows/record-to-report/wf-r2r-bank-reconciliations",
      next_label: "Open the workflow brief",
    },
  },
  {
    id: "atlas-step-matching-evidence",
    canonical_record_id: bankReconciliation.id,
    kind: "learning-step",
    cluster: "accounting-work",
    label: "Matching evidence",
    short_label: "Matching evidence",
    summary: "Run exact and evidence-based matching while preserving the source identifiers behind every proposed match.",
    detail: bankReconciliation.deterministic_checks.find((check) => check.includes("Each match")) ?? bankReconciliation.deterministic_checks[0],
    evidence_classification: "implementation-pattern",
    industries: ["general"],
    temporal_role: null,
    href: "/tutorials/bank-reconciliation",
    reviewed_at: bankReconciliation.reviewed_at,
    review_status: bankReconciliation.review_status,
    mobile_priority: "core",
    position: { x: 350, y: 300 },
    provenance: {
      source_file: "app/workflows-data.ts",
      source_record_id: bankReconciliation.id,
      derivation: "The Atlas names one learning step from the canonical matching procedure and source-identifier check.",
    },
    source: null,
    example: null,
    guide: {
      prompt: "What makes a match reviewable rather than merely plausible?",
      questions: [
        "Do the identifiers, dates, amounts, and currency agree?",
        "Can another person reproduce the match from retained evidence?",
        "Does a probabilistic match remain visibly distinct from an exact match?",
      ],
      next_href: "/tutorials/bank-reconciliation",
      next_label: "Practice with the synthetic case",
    },
  },
  {
    id: "atlas-step-exception-handling",
    canonical_record_id: "ctrl-exception-routing",
    kind: "learning-step",
    cluster: "accounting-work",
    label: "Exception handling",
    short_label: "Exception handling",
    summary: "Keep unmatched, missing, contradictory, material, or unauthorized items visible; stop instead of guessing through them.",
    detail: "Classify and age the item, preserve the failed state and evidence, assign an accountable owner, and resume only after explicit resolution.",
    evidence_classification: "implementation-pattern",
    industries: ["general"],
    temporal_role: null,
    href: "/controls#ctrl-exception-routing",
    reviewed_at: bankReconciliation.reviewed_at,
    review_status: bankReconciliation.review_status,
    mobile_priority: "core",
    position: { x: 610, y: 300 },
    provenance: {
      source_file: "app/workflows-data.ts + app/governance-data.ts",
      source_record_id: "wf-r2r-bank-reconciliations + ctrl-exception-routing",
      derivation: "The learning step joins the canonical unmatched-item procedure, stop conditions, and exception-routing control.",
    },
    source: null,
    example: {
      title: "Book receipt without bank-side evidence",
      text: bankReconciliation.brief?.synthetic_example?.facts.join(" ")
        ?? "A fictional $850 receipt has no bank-side match in the approved evidence set and remains unresolved.",
      evidence_classification: "synthetic-example",
    },
    guide: {
      prompt: "What would you need before classifying the $850 item?",
      questions: [
        "Is later bank evidence inside the approved evidence set?",
        "Would calling it a timing item require an unsupported assumption?",
        "Who owns the evidence request and the eventual disposition?",
      ],
      next_href: "/tutorials/bank-reconciliation",
      next_label: "Work the complete synthetic case",
    },
  },
  {
    id: "atlas-step-reviewer-approval",
    canonical_record_id: reviewerDisposition.id,
    kind: "human-gate",
    cluster: "accounting-work",
    label: "Reviewer approval",
    short_label: "Reviewer approval",
    summary: reviewerDisposition.action,
    detail: `${reviewerDisposition.proceed_when} ${humanOnly.boundary}`,
    evidence_classification: "implementation-pattern",
    industries: ["general"],
    temporal_role: null,
    href: "/reviewer-guide",
    reviewed_at: accountingAgentReviewerGuide.prepared_at,
    review_status: "maintainer-review-pending",
    mobile_priority: "core",
    position: { x: 870, y: 300 },
    provenance: {
      source_file: "app/reviewer-guide.ts + app/domain-model.ts + app/workflows-data.ts",
      source_record_id: "review-step-disposition + human-only + wf-r2r-bank-reconciliations",
      derivation: "The gate uses the canonical reviewer disposition step and retains the human-only authority boundary.",
    },
    source: null,
    example: null,
    guide: {
      prompt: "What must the reviewer be able to challenge before approving?",
      questions: [
        "Are source totals, matches, exceptions, and proposed effects reproducible?",
        "Is every unresolved item visible with an owner and disposition?",
        "Is approval attributable and separate from preparation and posting?",
      ],
      next_href: "/reviewer-guide",
      next_label: "Open the reviewer field guide",
    },
  },
];

const contextNodes: AtlasNode[] = [
  workflowNode({ id: "atlas-work-balance-reconciliation", canonicalId: balanceReconciliation.id, shortLabel: "Reconcile accounts", position: { x: 120, y: 80 }, mobilePriority: "extended" }),
  workflowNode({ id: "atlas-work-journal-entry", canonicalId: journalEntry.id, shortLabel: "Post and document", position: { x: 320, y: 80 }, mobilePriority: "extended" }),
  controlNode({ id: "ctrl-input-completeness", position: { x: 480, y: 40 }, mobilePriority: "context" }),
  controlNode({ id: "ctrl-deterministic-validation", position: { x: 680, y: 40 }, mobilePriority: "context" }),
  controlNode({ id: "ctrl-exception-routing", position: { x: 520, y: 150 }, mobilePriority: "core" }),
  controlNode({ id: "ctrl-human-approval", position: { x: 820, y: 100 }, mobilePriority: "core" }),
  controlNode({ id: "ctrl-segregation-duties", position: { x: 990, y: 40 }, mobilePriority: "context" }),
  controlNode({ id: "ctrl-version-evidence", position: { x: 930, y: 190 }, mobilePriority: "context" }),
  {
    id: "atlas-capability-normalize-evidence",
    canonical_record_id: bankReconciliation.id,
    kind: "capability",
    cluster: "agent-capabilities",
    label: "Normalize evidence",
    short_label: "Normalize evidence",
    summary: "Prepare read-only bank and ledger records for controlled comparison without changing the source evidence.",
    detail: "This is an implementation pattern, not evidence that a model can do so accurately in a particular system.",
    evidence_classification: "implementation-pattern",
    industries: ["general"],
    temporal_role: null,
    href: "/architecture",
    reviewed_at: atlasPreparedAt,
    review_status: "maintainer-review-pending",
    mobile_priority: "context",
    position: { x: 100, y: 500 },
    provenance: { source_file: "app/workflows-data.ts", source_record_id: bankReconciliation.id, derivation: "Named from the workflow's read-only inputs, population checks, and preparation boundary." },
    source: null,
    example: null,
    guide: null,
  },
  {
    id: "atlas-capability-surface-anomalies",
    canonical_record_id: bankReconciliation.id,
    kind: "capability",
    cluster: "agent-capabilities",
    label: "Surface anomalies",
    short_label: "Surface anomalies",
    summary: "Flag unmatched and stale items for investigation while leaving classification and disposition visible for review.",
    detail: "A flag is a review prompt, not an accounting conclusion or evidence of model effectiveness.",
    evidence_classification: "implementation-pattern",
    industries: ["general"],
    temporal_role: null,
    href: "/evaluation",
    reviewed_at: atlasPreparedAt,
    review_status: "maintainer-review-pending",
    mobile_priority: "context",
    position: { x: 280, y: 540 },
    provenance: { source_file: "app/workflows-data.ts", source_record_id: bankReconciliation.id, derivation: "Named from the canonical unmatched-item procedure and stop conditions." },
    source: null,
    example: null,
    guide: null,
  },
  {
    id: "atlas-capability-draft-review-packet",
    canonical_record_id: bankReconciliation.id,
    kind: "capability",
    cluster: "agent-capabilities",
    label: "Draft reviewer packet",
    short_label: "Draft reviewer packet",
    summary: "Assemble the source totals, matches, exceptions, proposed effects, and open questions an accountable reviewer needs.",
    detail: "The packet remains preparer work until an authorized person reviews and dispositions it.",
    evidence_classification: "implementation-pattern",
    industries: ["general"],
    temporal_role: null,
    href: "/reviewer-guide",
    reviewed_at: atlasPreparedAt,
    review_status: "maintainer-review-pending",
    mobile_priority: "context",
    position: { x: 450, y: 500 },
    provenance: { source_file: "app/workflows-data.ts", source_record_id: bankReconciliation.id, derivation: "Named from the workflow's outputs, run record, and human-review boundary." },
    source: null,
    example: null,
    guide: null,
  },
  sourceNode({ id: "src_0vf7hhg", position: { x: 590, y: 500 }, mobilePriority: "core" }),
  sourceNode({ id: "src_1l45nk0", position: { x: 740, y: 520 }, mobilePriority: "context" }),
  sourceNode({ id: "src_075usnq", position: { x: 880, y: 500 }, mobilePriority: "context" }),
  sourceNode({ id: "src_1v1zwt5", position: { x: 1010, y: 470 }, mobilePriority: "context" }),
  sourceNode({ id: "src_agenticaudit", position: { x: 600, y: 650 }, mobilePriority: "extended" }),
  sourceNode({ id: "src_netsuite26ai", position: { x: 780, y: 650 }, mobilePriority: "extended" }),
  sourceNode({ id: "src_osfi26agent", position: { x: 980, y: 650 }, mobilePriority: "extended" }),
  sourceNode({ id: "src_hipaaba", position: { x: 1080, y: 600 }, mobilePriority: "extended" }),
  sourceNode({ id: "src_nistmfg2", position: { x: 1100, y: 700 }, mobilePriority: "extended" }),
  industryNode({ id: "general", position: { x: 1160, y: 300 }, mobilePriority: "core" }),
  industryNode({ id: "banking-credit-unions", position: { x: 1180, y: 420 }, mobilePriority: "context" }),
  industryNode({ id: "healthcare-life-sciences", position: { x: 1200, y: 540 }, mobilePriority: "extended" }),
  industryNode({ id: "manufacturing", position: { x: 1210, y: 660 }, mobilePriority: "extended" }),
];

function edge(
  id: string,
  source: string,
  target: string,
  relationship: string,
  label: string,
  pathEdge = false,
): AtlasEdge {
  return {
    id,
    source,
    target,
    relationship,
    label,
    evidence_classification: pathEdge ? "editorial-recommendation" : "implementation-pattern",
    path_edge: pathEdge,
  };
}

const edges: AtlasEdge[] = [
  edge("atlas-edge-path-1", "atlas-path-bank-reconciliation", "atlas-step-matching-evidence", "next-learning-step", "then", true),
  edge("atlas-edge-path-2", "atlas-step-matching-evidence", "atlas-step-exception-handling", "next-learning-step", "then", true),
  edge("atlas-edge-path-3", "atlas-step-exception-handling", "atlas-step-reviewer-approval", "next-learning-step", "then", true),
  edge("atlas-edge-balance-bank", "atlas-work-balance-reconciliation", "atlas-path-bank-reconciliation", "contains-specialized-workflow", "includes"),
  edge("atlas-edge-review-entry", "atlas-step-reviewer-approval", "atlas-work-journal-entry", "may-route-separately-approved-adjustment", "may route"),
  edge("atlas-edge-input-bank", "ctrl-input-completeness", "atlas-path-bank-reconciliation", "governs", "governs"),
  edge("atlas-edge-validation-match", "ctrl-deterministic-validation", "atlas-step-matching-evidence", "governs", "governs"),
  edge("atlas-edge-routing-exception", "ctrl-exception-routing", "atlas-step-exception-handling", "governs", "governs"),
  edge("atlas-edge-approval-review", "ctrl-human-approval", "atlas-step-reviewer-approval", "governs", "governs"),
  edge("atlas-edge-sod-review", "ctrl-segregation-duties", "atlas-step-reviewer-approval", "governs", "separates duties"),
  edge("atlas-edge-version-review", "ctrl-version-evidence", "atlas-step-reviewer-approval", "supports-reviewability", "supports"),
  edge("atlas-edge-cap-normalize", "atlas-capability-normalize-evidence", "atlas-path-bank-reconciliation", "enables-preparation", "enables"),
  edge("atlas-edge-cap-anomaly", "atlas-capability-surface-anomalies", "atlas-step-exception-handling", "enables-preparation", "enables"),
  edge("atlas-edge-cap-packet", "atlas-capability-draft-review-packet", "atlas-step-reviewer-approval", "prepares-for", "prepares for"),
  edge("atlas-edge-as1105-match", "src_0vf7hhg", "atlas-step-matching-evidence", "evidence-design-source", "evidence basis"),
  edge("atlas-edge-as1105-exception", "src_0vf7hhg", "atlas-step-exception-handling", "evidence-design-source", "evidence basis"),
  edge("atlas-edge-as1215-packet", "src_1l45nk0", "atlas-capability-draft-review-packet", "documentation-design-source", "documentation basis"),
  edge("atlas-edge-as2201-review", "src_075usnq", "atlas-step-reviewer-approval", "control-design-source", "control basis"),
  edge("atlas-edge-coso-controls", "src_1v1zwt5", "ctrl-human-approval", "framework-source", "framework basis"),
  edge("atlas-edge-agenticaudit-packet", "src_agenticaudit", "atlas-capability-draft-review-packet", "bounded-research-context", "research context"),
  edge("atlas-edge-netsuite-match", "src_netsuite26ai", "atlas-step-matching-evidence", "first-party-product-context", "product context"),
  edge("atlas-edge-industry-general", "atlas-industry-general", "atlas-path-bank-reconciliation", "industry-lens", "applies lens"),
  edge("atlas-edge-industry-banking", "atlas-industry-banking-credit-unions", "atlas-path-bank-reconciliation", "industry-lens", "adds context"),
  edge("atlas-edge-industry-healthcare", "atlas-industry-healthcare-life-sciences", "atlas-path-bank-reconciliation", "industry-lens", "adds context"),
  edge("atlas-edge-industry-manufacturing", "atlas-industry-manufacturing", "atlas-path-bank-reconciliation", "industry-lens", "adds context"),
  edge("atlas-edge-osfi-banking", "src_osfi26agent", "atlas-industry-banking-credit-unions", "reviewed-industry-applicability", "reviewed for"),
  edge("atlas-edge-hipaa-healthcare", "src_hipaaba", "atlas-industry-healthcare-life-sciences", "reviewed-industry-applicability", "reviewed for"),
  edge("atlas-edge-nist-manufacturing", "src_nistmfg2", "atlas-industry-manufacturing", "reviewed-industry-applicability", "reviewed for"),
];

export const atlasPathNodeIds = pathNodes.map((node) => node.id);
export const atlasDefaultNodeId = "atlas-step-exception-handling";
export const atlasIndustryIds = ["general", "banking-credit-unions", "healthcare-life-sciences", "manufacturing"] as const satisfies readonly ResourceIndustry[];

const nodes = [...pathNodes, ...contextNodes];

if (new Set(nodes.map((node) => node.id)).size !== nodes.length) {
  throw new Error("Living Atlas node IDs must be unique.");
}
if (new Set(edges.map((item) => item.id)).size !== edges.length) {
  throw new Error("Living Atlas edge IDs must be unique.");
}
const nodeIds = new Set(nodes.map((node) => node.id));
for (const item of edges) {
  if (!nodeIds.has(item.source) || !nodeIds.has(item.target)) {
    throw new Error(`Living Atlas edge ${item.id} has an unresolved endpoint.`);
  }
}
if (!nodeIds.has(atlasDefaultNodeId)) {
  throw new Error("Living Atlas default selection must resolve to a node.");
}

export const atlasTimeLayers = [
  { id: "all", label: "All time", description: "Show foundational, evergreen, and current-development source context." },
  { id: "foundational", label: "Foundational archive", description: "Show foundational and evergreen source records." },
  { id: "current-development", label: "Current developments", description: "Show records reviewed as current-development in the maintained catalog." },
] as const;

export const atlasIndustryLenses = atlasIndustryIds.map((id) => requiredRecord(industryById, id, "industry"));

export function getAtlasView({
  industry = "general",
  timeLayer = "all",
}: {
  industry?: ResourceIndustry;
  timeLayer?: AtlasTimeLayerId;
} = {}) {
  if (!atlasIndustryIds.includes(industry as (typeof atlasIndustryIds)[number])) {
    throw new Error(`Unknown Atlas industry lens ${industry}.`);
  }
  if (!atlasTimeLayerIds.includes(timeLayer)) {
    throw new Error(`Unknown Atlas time layer ${timeLayer}.`);
  }

  const filteredNodes = nodes.filter((node) => {
    if (node.kind === "industry") {
      return industry === "general"
        ? node.id === "atlas-industry-general"
        : node.id === `atlas-industry-${industry}` || node.id === "atlas-industry-general";
    }
    if (node.kind === "source") {
      const industryMatches = industry === "general"
        ? node.industries.includes("general")
        : node.industries.includes(industry);
      const timeMatches = timeLayer === "all"
        || (timeLayer === "foundational" && (node.temporal_role === "foundational" || node.temporal_role === "evergreen"))
        || (timeLayer === "current-development" && node.temporal_role === "current-development");
      return industryMatches && timeMatches;
    }
    return true;
  });
  const filteredIds = new Set(filteredNodes.map((node) => node.id));
  const filteredEdges = edges.filter((item) => filteredIds.has(item.source) && filteredIds.has(item.target));

  return {
    industry,
    time_layer: timeLayer,
    nodes: filteredNodes,
    edges: filteredEdges,
    counts: {
      nodes: filteredNodes.length,
      edges: filteredEdges.length,
      source_nodes: filteredNodes.filter((node) => node.kind === "source").length,
    },
  };
}

export const accountingAgentsAtlas = {
  id: atlasId,
  version: atlasVersion,
  title: "The Living Atlas",
  description: "Explore how accounting work, controls and risks, agent capabilities, primary sources, and industry context connect across time.",
  prepared_at: atlasPreparedAt,
  snapshot_as_of: "2026-08-27",
  review_status: "maintainer-review-pending",
  review_note: "Automated integrity checks and maintainer editorial review only; practitioner, independent, professional, audit, certification, or assurance review is not claimed.",
  primary_mode: "reference",
  evidence_classification: "editorial-recommendation",
  operating_rule: {
    text: "Agents may prepare accounting work; accountable people approve conclusions and sensitive external actions.",
    evidence_classification: "editorial-recommendation",
  },
  path: {
    id: "atlas-path-bank-reconciliation-review",
    label: "Bank reconciliation to reviewer approval",
    node_ids: atlasPathNodeIds,
    evidence_classification: "editorial-recommendation",
    reason: "A bounded reconciliation path makes the evidence, exception, control, and human-decision relationships concrete without implying autonomous approval.",
  },
  industry_lenses: atlasIndustryLenses,
  time_layers: atlasTimeLayers,
  default_state: {
    node_id: atlasDefaultNodeId,
    industry: "general" as ResourceIndustry,
    time_layer: "all" as AtlasTimeLayerId,
    view: "map" as "map" | "list",
  },
  full_graph: {
    nodes,
    edges,
    counts: {
      nodes: nodes.length,
      edges: edges.length,
      path_nodes: pathNodes.length,
      source_nodes: nodes.filter((node) => node.kind === "source").length,
      industries: atlasIndustryLenses.length,
    },
  },
  limitations: [
    "The Atlas is a curated projection over maintained repository records, not a complete map of accounting, AI, products, or professional practice.",
    "Node position, path order, and relationship selection are editorial navigation choices, not importance, effectiveness, adoption, authority, or prevalence rankings.",
    "Industry lenses preserve reviewed source applicability only; they do not establish that a source applies to a particular entity, transaction, jurisdiction, period, or control objective.",
    "Current developments are a dated maintained snapshot, not an automatic monitor or a representation that no later source exists.",
    "The synthetic example is fictional and must not be treated as employer, client, bank, engagement, taxpayer, or other real-world data.",
  ],
} as const;

function markdownLink(label: string, href: string | null, origin: string) {
  if (!href) return label;
  return `[${label}](${href.startsWith("http") ? href : `${origin}${href}`})`;
}

export function renderAtlasMarkdown(
  origin: string,
  options: { industry?: ResourceIndustry; timeLayer?: AtlasTimeLayerId } = {},
) {
  const view = getAtlasView(options);
  const lines = [
    `# ${accountingAgentsAtlas.title}`,
    "",
    accountingAgentsAtlas.description,
    "",
    `- Atlas ID: \`${accountingAgentsAtlas.id}\``,
    `- Version: ${accountingAgentsAtlas.version}`,
    `- Snapshot as of: ${accountingAgentsAtlas.snapshot_as_of}`,
    `- Primary mode: ${accountingAgentsAtlas.primary_mode}`,
    `- Evidence classification: ${accountingAgentsAtlas.evidence_classification}`,
    `- Review status: ${accountingAgentsAtlas.review_status}`,
    `- Industry lens: ${view.industry}`,
    `- Time layer: ${view.time_layer}`,
    "",
    `> ${accountingAgentsAtlas.operating_rule.text}`,
    "",
    "## Guided path",
    "",
    ...atlasPathNodeIds.map((id, index) => {
      const node = requiredRecord(new Map(nodes.map((item) => [item.id, item])), id, "Atlas node");
      return `${index + 1}. ${markdownLink(node.label, node.href, origin)} — ${node.summary} _${node.evidence_classification}_`;
    }),
    "",
    "## Nodes",
    "",
    ...atlasClusterIds.flatMap((cluster) => {
      const clusterNodes = view.nodes.filter((node) => node.cluster === cluster);
      return [
        `### ${cluster.replaceAll("-", " ")}`,
        "",
        ...clusterNodes.flatMap((node) => [
          `#### ${markdownLink(node.label, node.href, origin)}`,
          "",
          `- ID: \`${node.id}\``,
          `- Canonical record: ${node.canonical_record_id ? `\`${node.canonical_record_id}\`` : "none"}`,
          `- Kind: ${node.kind}`,
          `- Evidence classification: ${node.evidence_classification}`,
          `- Temporal role: ${node.temporal_role ?? "not applicable"}`,
          `- Reviewed at: ${node.reviewed_at}`,
          `- Summary: ${node.summary}`,
          `- Provenance: ${node.provenance.source_file}; ${node.provenance.derivation}`,
          ...(node.source ? [
            `- Method: ${node.source.method}`,
            `- Transfer limit: ${node.source.transfer_limit}`,
            `- Original source: ${markdownLink(node.source.publisher, node.source.original_href, origin)}`,
          ] : []),
          ...(node.example ? [
            `- Synthetic example: ${node.example.text}`,
            `- Example classification: ${node.example.evidence_classification}`,
          ] : []),
          "",
        ]),
      ];
    }),
    "## Relationships",
    "",
    ...view.edges.map((item) => `- \`${item.id}\`: \`${item.source}\` — **${item.label}** → \`${item.target}\` (${item.evidence_classification})`),
    "",
    "## Limitations",
    "",
    ...accountingAgentsAtlas.limitations.map((limitation) => `- ${limitation}`),
    "",
    accountingAgentsAtlas.review_note,
    "",
  ];
  return lines.join("\n");
}
