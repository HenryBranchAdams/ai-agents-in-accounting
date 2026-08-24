import {
  evidenceChain,
  layers,
  modes,
  pilotSteps,
  workLoop,
} from "./content";
import {
  resourceKinds,
  resources,
  resourceTopics,
  type Resource,
} from "./resources-data";
import { authorityLevels } from "./domain-model";
import { controlPatterns, sensitiveActions } from "./governance-data";
import { glossary, templates } from "./reference-data";
import { processFamilies, workflowRecords } from "./workflows-data";
import { renderDomainCorpusMarkdown, shiftMarkdownHeadings } from "./domain-interface";

export const siteOrigin = "https://accounting-agents.madebyhenry.chatgpt.site";
export const catalogReviewedAt = "2026-08-23";
export const catalogModifiedAt = "2026-08-23T00:00:00.000Z";
export const catalogVersion = "2026-08-23.7";
export const apiVersion = "1.0";
export const rightsNotice =
  "Project-created factual metadata is CC0 1.0 and original editorial summaries are CC BY 4.0. External source content remains subject to each publisher's terms.";

type PublicFormat = "json" | "markdown";

function representationQuality(accept: string, type: string, subtype: string) {
  const matches = accept.split(",").flatMap((part, index) => {
    const [mediaRange, ...parameters] = part.trim().toLowerCase().split(";");
    const [rangeType, rangeSubtype] = mediaRange.split("/");
    if (!rangeType || !rangeSubtype) return [];

    const matchesType = rangeType === "*" || rangeType === type;
    const matchesSubtype = rangeSubtype === "*" || rangeSubtype === subtype;
    if (!matchesType || !matchesSubtype) return [];

    const qualityParameter = parameters
      .map((parameter) => parameter.trim())
      .find((parameter) => parameter.startsWith("q="));
    const parsedQuality = qualityParameter ? Number(qualityParameter.slice(2)) : 1;
    const quality = Number.isFinite(parsedQuality) && parsedQuality >= 0 && parsedQuality <= 1
      ? parsedQuality
      : 0;
    const specificity = rangeType === "*" ? 0 : rangeSubtype === "*" ? 1 : 2;

    return [{ index, quality, specificity }];
  });

  if (!matches.length) return 0;
  matches.sort((left, right) => right.specificity - left.specificity || left.index - right.index);
  return matches[0].quality;
}

export function negotiatePublicFormat(
  request: Request,
  requestedFormat?: string,
): PublicFormat | null {
  if (requestedFormat === "json" || requestedFormat === "markdown") return requestedFormat;

  const accept = request.headers.get("accept")?.trim();
  if (!accept) return "json";

  const jsonQuality = representationQuality(accept, "application", "json");
  const markdownQuality = representationQuality(accept, "text", "markdown");
  const htmlQuality = representationQuality(accept, "text", "html");
  if (jsonQuality === 0 && markdownQuality === 0) return htmlQuality > 0 ? "json" : null;
  return markdownQuality > jsonQuality ? "markdown" : "json";
}

export type AgentResourceRecord = {
  id: string;
  record_version: string;
  record_updated_at: string;
  topic: Resource["topic"];
  source_type: Resource["kind"];
  owner: string;
  title: string;
  published_or_status: string;
  jurisdiction: string;
  access: string;
  summary: string;
  reviewed_at: string;
  verified_at: string;
  source_license: "unknown";
  source_license_url: null;
  source_rights: {
    status: "unknown";
    license_id: null;
    license_url: null;
    full_text_stored: false;
    permission_scope: null;
    notes: string;
  };
  metadata_rights: {
    license_id: "CC0-1.0";
    license_url: "https://creativecommons.org/publicdomain/zero/1.0/";
    applies_to: string;
  };
  annotation_rights: {
    creator: "Accounting Agents contributors";
    license_id: "CC-BY-4.0";
    license_url: "https://creativecommons.org/licenses/by/4.0/";
    applies_to: string;
  };
  canonical_source_url: string;
  catalog_url: string;
  record_url: string;
  provenance: {
    source_owner: string;
    source_url: string;
    annotation_by: "Accounting Agents";
    annotation_type: "original editorial summary";
  };
};

function fnv1a(value: string) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(36).padStart(7, "0");
}

export function resourceId(resource: Resource) {
  return resource.id;
}

export function toAgentResource(resource: Resource): AgentResourceRecord {
  const id = resourceId(resource);

  return {
    id,
    record_version: "1",
    record_updated_at: catalogReviewedAt,
    topic: resource.topic,
    source_type: resource.kind,
    owner: resource.owner,
    title: resource.title,
    published_or_status: resource.date,
    jurisdiction: resource.jurisdiction,
    access: resource.access,
    summary: resource.note,
    reviewed_at: catalogReviewedAt,
    verified_at: catalogReviewedAt,
    source_license: "unknown",
    source_license_url: null,
    source_rights: {
      status: "unknown",
      license_id: null,
      license_url: null,
      full_text_stored: false,
      permission_scope: null,
      notes: "Check the publisher's current terms. Access status does not establish reuse permission.",
    },
    metadata_rights: {
      license_id: "CC0-1.0",
      license_url: "https://creativecommons.org/publicdomain/zero/1.0/",
      applies_to: "project-created factual catalog metadata",
    },
    annotation_rights: {
      creator: "Accounting Agents contributors",
      license_id: "CC-BY-4.0",
      license_url: "https://creativecommons.org/licenses/by/4.0/",
      applies_to: "original editorial summary and annotation",
    },
    canonical_source_url: resource.href,
    catalog_url: `${siteOrigin}/resources/${id}`,
    record_url: `${siteOrigin}/api/v1/resources/${id}`,
    provenance: {
      source_owner: resource.owner,
      source_url: resource.href,
      annotation_by: "Accounting Agents",
      annotation_type: "original editorial summary",
    },
  };
}

export const agentResources = resources.map(toAgentResource);

export function searchAgentResources({
  query,
  topic,
  kind,
}: {
  query?: string;
  topic?: string;
  kind?: string;
}) {
  const terms = query?.trim().toLowerCase().split(/\s+/).filter(Boolean) ?? [];

  return agentResources.filter((resource) => {
    if (topic && resource.topic !== topic) return false;
    if (kind && resource.source_type !== kind) return false;

    const searchable = [
      resource.id,
      resource.topic,
      resource.source_type,
      resource.owner,
      resource.title,
      resource.published_or_status,
      resource.jurisdiction,
      resource.access,
      resource.summary,
    ].join(" ").toLowerCase();

    return terms.every((term) => searchable.includes(term));
  });
}

function escapeMarkdown(value: string) {
  return value.replace(/([\[\]\\])/g, "\\$1");
}

export function renderResourcesMarkdown(
  records: AgentResourceRecord[],
  options: {
    title?: string;
    summary?: string;
    headingLevel?: 1 | 2;
  } = {},
) {
  const level = options.headingLevel ?? 1;
  const heading = "#".repeat(level);
  const childHeading = "#".repeat(level + 1);
  const recordHeading = "#".repeat(level + 2);
  const title = options.title ?? "Accounting Agents source library";
  const lines = [
    `${heading} ${title}`,
    "",
    `> ${options.summary ?? `${records.length} records from a ${agentResources.length}-source catalog, reviewed ${catalogReviewedAt}.`}`,
    "",
    rightsNotice,
    "",
  ];

  for (const topic of resourceTopics) {
    const topicRecords = records.filter((record) => record.topic === topic);
    if (!topicRecords.length) continue;

    lines.push(`${childHeading} ${topic}`, "");

    for (const record of topicRecords) {
      lines.push(
        `${recordHeading} [${escapeMarkdown(record.title)}](${record.canonical_source_url})`,
        "",
        `- ID: \`${record.id}\``,
        `- Record version: ${record.record_version}; updated ${record.record_updated_at}`,
        `- Source type: ${record.source_type}`,
        `- Owner: ${record.owner}`,
        `- Date or status: ${record.published_or_status}`,
        `- Jurisdiction: ${record.jurisdiction}`,
        `- Access: ${record.access}`,
        `- Source license: ${record.source_license}; check the publisher's terms`,
        `- Verified: ${record.verified_at}`,
        `- Catalog page: ${record.catalog_url}`,
        `- API record: ${record.record_url}`,
        "",
        record.summary,
        "",
      );
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}

function markdownTable(headers: string[], rows: readonly (readonly string[])[]) {
  const escapeCell = (value: string) => value.replace(/\|/g, "\\|").replace(/\n/g, " ");
  return [
    `| ${headers.map(escapeCell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`),
  ].join("\n");
}

export function buildAgentContextMarkdown() {
  const workflowSections = processFamilies.flatMap((family) => [
    `### ${family.name}`,
    "",
    family.summary,
    "",
    `- Canonical workflows: ${workflowRecords.filter((workflow) => workflow.family === family.id).length}`,
    `- Accountable owner: ${family.accountable_owner}`,
    `- Human guide: ${siteOrigin}/workflows/${family.id}`,
    `- API filter: ${siteOrigin}/api/v1/workflows?family=${family.id}`,
    "",
  ]);

  return [
    "# Accounting Agents context",
    "",
    "> A compact, agent-readable field guide to supervised AI-agent work in accounting, audit, controllership, and finance operations.",
    "",
    `Reviewed: ${catalogReviewedAt}`,
    "",
    "This material is educational. Confirm the entity, transaction, period, jurisdiction, and current accounting, audit, legal, and regulatory requirements before relying on it.",
    "",
    "## Core operating rule",
    "",
    "The corpus covers the complete accounting lifecycle. Coverage does not grant execution authority: accountable people retain decisions, final approvals, legal attestations, fiduciary authority, and certifications.",
    "",
    "Agents may prepare accounting work. Accountable people approve conclusions and sensitive external actions.",
    "",
    "Use the A0–A4 authority model to distinguish explanation, preparation, recommendation, approved execution, and reversible policy-bound execution. Keep journal posting, payments, filings, write-offs, master-data changes, deletion, final approval, ICFR certification, and communications in the company's name behind deterministic authorization and attributable human ownership.",
    "",
    "## What counts as an accounting agent",
    "",
    "An accounting agent pursues a defined accounting objective, selects steps, uses approved tools and evidence, inspects results, and continues until it reaches a completion or stop condition. Define the objective, tools, accepted evidence, and operating limits. A product label does not establish authority.",
    "",
    markdownTable(
      ["Pattern", "Next step controlled by", "Behavior", "Accounting example"],
      modes.map((mode) => [mode.name, mode.controller, mode.action, mode.example]),
    ),
    "",
    "## Work loop",
    "",
    ...workLoop.flatMap(([name, detail], index) => [`${index + 1}. **${name}.** ${detail}`]),
    "",
    "A governed run record includes the objective, source set, procedures, tool calls, calculations, exceptions, contradictory evidence, configuration, approvals, conclusion, preparer, reviewer, and timestamps. A technical trace diagnoses the system; a workpaper explains the accounting work.",
    "",
    "## Workflow selection",
    "",
    "Prefer stable inputs, repeatable procedures, testable outputs, source control totals, deterministic calculations, routable exceptions, an established output format, and a named reviewer. Start with read-only or draft-only access.",
    "",
    ...workflowSections,
    `The canonical workflow corpus contains ${workflowRecords.length} records. Retrieve /workflows.md for the complete Markdown representation or query /api/v1/workflows with q, family, authority, limit, and cursor parameters.`,
    "",
    "## Cash reconciliation baseline",
    "",
    "1. Confirm the entity, account, period, file versions, and permissions.",
    "2. Reproduce source control totals and record differences.",
    "3. Normalize dates, amounts, descriptions, and identifiers.",
    "4. Run exact matching before probabilistic classification.",
    "5. Investigate unmatched items with approved evidence.",
    "6. Separate timing items, errors, missing records, and unresolved items.",
    "7. Link each proposed reconciling item to support and calculation.",
    "8. Stop on missing or contradictory evidence, policy questions, or threshold breaches.",
    "",
    "The reviewer packet should include a source register, procedure record, reconciliation and tie-out, exception list, proposed effects, and review decision.",
    "",
    "## Evidence and authority",
    "",
    markdownTable(["Reasoning type", "Example"], evidenceChain),
    "",
    "An authoritative source may still be inapplicable to the entity, transaction, period, jurisdiction, or question. Record the basis for applying it.",
    "",
    "Write the agent's boundary before the run and enforce it outside the prompt. Specify scope, approved evidence, tool permissions, thresholds, allowed and prohibited actions, stop conditions, required records, and retention.",
    "",
    markdownTable(
      ["Level", "Role", "Execution rule"],
      authorityLevels.map((level) => [level.id, level.agent_role, level.execution_rule]),
    ),
    "",
    "A control that relies on an agent needs an owner, objective, population, procedure, precision, evidence requirement, exception path, and review standard. Separate control performance from the final assessment of whether the control operated effectively.",
    "",
    "## System architecture",
    "",
    markdownTable(["Layer", "Purpose", "Example"], layers),
    "",
    "Keep work state, evidence, policies, approvals, and history outside the model. Use deterministic code for calculations, tie-outs, schema checks, and permissions. Add specialist agents only when a single instruction set becomes difficult to evaluate or separate context materially improves results.",
    "",
    "Treat MCP and other tool protocols as interfaces. They do not establish data completeness, authorization, segregation of duties, or ICFR readiness. Validate inputs and outputs, separate read and write tools, require approval for sensitive actions, and log each request and result.",
    "",
    "Direct HTTPS, Markdown, JSON, and OpenAPI are the adopted public access layer. AGENTS.md supplies project-specific instructions. MCP remains an optional adapter, and A2A is deferred because this knowledge service does not accept delegated agent tasks. See /ecosystem.md for the role-based map.",
    "",
    "## Pilot sequence",
    "",
    ...pilotSteps.flatMap(([name, detail], index) => [`${index + 1}. **${name}.** ${detail}`]),
    "",
    "Measure coverage, calculation and classification accuracy, exception quality, traceability, reviewer rework, end-to-end cycle time, and reviewer overrides. Stop when populations do not tie, sources or tools are unauthorized, material results lack support, prohibited actions are attempted, override rates worsen after a change, or the run cannot be reproduced.",
    "",
    "## Human-readable guide",
    "",
    `- [Overview](${siteOrigin}/)` ,
    `- [Agent fundamentals](${siteOrigin}/fundamentals)`,
    `- [Accounting lifecycle](${siteOrigin}/lifecycle)`,
    `- [Authority levels](${siteOrigin}/authority)`,
    `- [Workflow library](${siteOrigin}/workflows)`,
    `- [Controls and authority](${siteOrigin}/controls)`,
    `- [Sensitive actions](${siteOrigin}/sensitive-actions)`,
    `- [Evidence and assurance](${siteOrigin}/evidence-assurance)`,
    `- [Security and identity](${siteOrigin}/security-identity)`,
    `- [System architecture](${siteOrigin}/architecture)`,
    `- [Open agent ecosystem](${siteOrigin}/ecosystem)`,
    `- [Evaluation](${siteOrigin}/evaluation)`,
    `- [Pilot checklist](${siteOrigin}/pilot)`,
    `- [Operations](${siteOrigin}/operations)`,
    `- [Templates](${siteOrigin}/templates)`,
    `- [Glossary](${siteOrigin}/glossary)`,
    `- [Source library](${siteOrigin}/resources)`,
    `- [Reading room](${siteOrigin}/reading-room)`,
    `- [Agent access](${siteOrigin}/machine-access)`,
    "",
  ].join("\n");
}

export function buildLlmsText() {
  return [
    "# Accounting Agents",
    "",
    "> A public field guide and source catalog for supervised AI-agent work in accounting, audit, controllership, and finance operations.",
    "",
    "Use the compact context first. Retrieve the source catalog only when a task needs standards, guidance, research, or implementation evidence. Source records distinguish rules, official guidance, research papers, technical references, empirical evidence, thought pieces, and first-party practice examples.",
    "",
    "## Context",
    "",
    `- [Compact accounting-agent context](${siteOrigin}/agent-context.md): Core definitions, workflows, controls, architecture, and pilot guidance in Markdown.`,
    `- [Public agent instructions](${siteOrigin}/AGENTS.md): Routing, reliance, source-use, and protocol guidance for agents consuming this corpus.`,
    `- [Full context bundle](${siteOrigin}/downloads/context-bundle.md): Complete domain corpus plus all ${agentResources.length} source records in Markdown.`,
    `- [Canonical JSON corpus](${siteOrigin}/downloads/corpus.json): All ${workflowRecords.length} workflows, ${authorityLevels.length} authority levels, ${sensitiveActions.length} sensitive-action boundaries, ${controlPatterns.length} controls, ${templates.length} templates, ${glossary.length} glossary terms, and source records.`,
    `- [Workflow corpus](${siteOrigin}/workflows.md): All ${workflowRecords.length} workflow specifications in Markdown.`,
    `- [Authority model](${siteOrigin}/authority-levels.md): The A0–A4 and human-only authority levels in Markdown.`,
    `- [Sensitive actions](${siteOrigin}/sensitive-actions.md): Approval, execution, rollback, and evidence boundaries.`,
    `- [Control patterns](${siteOrigin}/controls.md): Reusable control designs.`,
    `- [Templates](${siteOrigin}/templates.md): Practical implementation templates.`,
    `- [Glossary](${siteOrigin}/glossary.md): Controlled accounting-agent terms.`,
    `- [Source catalog in Markdown](${siteOrigin}/resources.md): Complete source metadata, summaries, status, jurisdiction, and access notes.`,
    `- [Curated reading room](${siteOrigin}/reading-room.md): A smaller path through research papers, practitioner essays, professional reports, and disclosed practice examples.`,
    `- [Reading-room JSON](${siteOrigin}/downloads/reading-room.json): The same curated shelves and complete source records as structured JSON.`,
    `- [Workflow packs](${siteOrigin}/packs.md): Six portable specifications with synthetic fixtures and reference outputs.`,
    `- [Accounting Agent Bench](${siteOrigin}/bench.md): Thirty public conformance cases and hard authority gates.`,
    `- [LedgerBench program](${siteOrigin}/ledgerbench.md): Measurement claim, products, tracks, divisions, task admission, governance, and release plan.`,
    `- [Open ecosystem map](${siteOrigin}/ecosystem.md): Role-based guidance for direct web access, AGENTS.md, MCP, A2A, and accounting-domain contracts.`,
    `- [Current release manifest](${siteOrigin}/releases/current/manifest.json): Versions, counts, rights, assets, and corpus digest.`,
    "",
    "## API",
    "",
    `- [Resource API](${siteOrigin}/api/v1/resources): Versioned JSON search and filtering endpoint; request text/markdown for Markdown output.`,
    `- [Workflow API](${siteOrigin}/api/v1/workflows): Search and filter canonical workflows by family and authority.`,
    `- [Authority API](${siteOrigin}/api/v1/authority-levels): Retrieve the authority model.`,
    `- [Sensitive-action API](${siteOrigin}/api/v1/sensitive-actions): Retrieve high-impact action boundaries.`,
    `- [Control API](${siteOrigin}/api/v1/controls): Retrieve reusable control patterns.`,
    `- [Template API](${siteOrigin}/api/v1/templates): Retrieve implementation templates.`,
    `- [Glossary API](${siteOrigin}/api/v1/glossary): Retrieve controlled definitions.`,
    `- [Unified search API](${siteOrigin}/api/v1/search?q=reconciliation): Deterministic search across pages, workflows, sources, packs, cases, and changes.`,
    `- [Workflow-pack API](${siteOrigin}/api/v1/packs): Retrieve portable pack manifests and fixtures.`,
    `- [Benchmark API](${siteOrigin}/api/v1/benchmark): Retrieve the public conformance cases.`,
    `- [LedgerBench API](${siteOrigin}/api/v1/ledgerbench): Retrieve the canonical benchmark-program record and schema links.`,
    `- [LedgerBench program schema](${siteOrigin}/schemas/ledgerbench-program.schema.json): Validate program records.`,
    `- [LedgerBench episode schema](${siteOrigin}/schemas/ledgerbench-episode.schema.json): Validate evaluation episodes.`,
    `- [LedgerBench result schema](${siteOrigin}/schemas/ledgerbench-result.schema.json): Validate result records.`,
    `- [LedgerBench submission schema](${siteOrigin}/schemas/ledgerbench-submission.schema.json): Validate official submission manifests.`,
    `- [Open ecosystem API](${siteOrigin}/api/v1/ecosystem): Retrieve the role, posture, local use, and boundary for each interface layer.`,
    `- [OpenAPI description](${siteOrigin}/openapi.json): Machine-readable API contract.`,
    `- [Standard API catalog](${siteOrigin}/.well-known/api-catalog): RFC 9727 discovery document in Linkset JSON.`,
    `- [Agent access guide](${siteOrigin}/machine-access): Endpoint documentation and examples for people integrating agents.`,
    "",
    "## Human-readable guide",
    "",
    `- [Overview](${siteOrigin}/): Purpose, operating rule, and scope.`,
    `- [Agent fundamentals](${siteOrigin}/fundamentals): Agent definition, operating patterns, work loop, and run record.`,
    `- [Accounting lifecycle](${siteOrigin}/lifecycle): Eight process families covering the complete accounting lifecycle.`,
    `- [Authority levels](${siteOrigin}/authority): A0–A4 and human-only boundaries.`,
    `- [Workflow library](${siteOrigin}/workflows): All ${workflowRecords.length} canonical workflow specifications.`,
    `- [Controls and authority](${siteOrigin}/controls): Evidence, authority, control design, and assessment.`,
    `- [Sensitive actions](${siteOrigin}/sensitive-actions): Guardrails for high-impact acts.`,
    `- [Evidence and assurance](${siteOrigin}/evidence-assurance): Workpapers, traces, review, and assurance boundaries.`,
    `- [Security and identity](${siteOrigin}/security-identity): Identity, least privilege, data, and tool controls.`,
    `- [System architecture](${siteOrigin}/architecture): Layers, durable records, orchestration, and tool interfaces.`,
    `- [Open agent ecosystem](${siteOrigin}/ecosystem): Where open interfaces fit and where accounting-specific contracts begin.`,
    `- [Evaluation](${siteOrigin}/evaluation): Release evaluation, known-answer cases, and quality measures.`,
    `- [Pilot checklist](${siteOrigin}/pilot): Supervised deployment stages, measures, and stop conditions.`,
    `- [Operations](${siteOrigin}/operations): Monitoring, change, incident response, and recovery.`,
    `- [Templates](${siteOrigin}/templates): Fourteen practical implementation templates.`,
    `- [Glossary](${siteOrigin}/glossary): Controlled terms.`,
    `- [Source library](${siteOrigin}/resources): Searchable human interface to the source catalog.`,
    `- [Reading room](${siteOrigin}/reading-room): Curated papers and perspectives with source status and limitations beside each item.`,
    `- [Workflow packs](${siteOrigin}/packs): Synthetic, portable workflow specimens.`,
    `- [Accounting Agent Bench](${siteOrigin}/bench): Deterministic and expert-review evaluation method.`,
    `- [LedgerBench](${siteOrigin}/ledgerbench): Preview benchmark program for consequential accounting-agent work.`,
    `- [Public specification](${siteOrigin}/spec): Identifiers, contracts, rights, versioning, and conformance.`,
    `- [Open source](${siteOrigin}/open-source): Licenses, archive, contribution rules, and governance.`,
    "",
    "## Optional",
    "",
    `- [Sitemap](${siteOrigin}/sitemap.xml): Canonical human-readable pages.`,
    `- [Robots policy](${siteOrigin}/robots.txt): Public crawler access policy.`,
    "",
  ].join("\n");
}

export function buildContextBundleMarkdown() {
  return [
    "# Accounting Agents full context bundle",
    "",
    "> Canonical educational guidance, domain records, and the complete source catalog for AI agents in accounting.",
    "",
    "## Compact guide",
    "",
    shiftMarkdownHeadings(buildAgentContextMarkdown(), 2).trimEnd(),
    "",
    "## Canonical accounting-agent domain corpus",
    "",
    renderDomainCorpusMarkdown(2).trimEnd(),
    "",
    renderResourcesMarkdown(agentResources, {
      title: "Complete source library",
      headingLevel: 2,
    }).trimEnd(),
    "",
  ].join("\n");
}

export function etagFor(body: string) {
  return `W/\"${fnv1a(body)}-${body.length.toString(36)}\"`;
}

export function publicResponse(
  request: Request,
  body: string,
  contentType: string,
  options: {
    status?: number;
    cache?: string;
    headers?: Record<string, string>;
    conditional?: boolean;
  } = {},
) {
  const etag = etagFor(body);
  const lastModified = new Date(catalogModifiedAt);
  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Expose-Headers": "ETag, Last-Modified, Link, X-Next-Page",
    "Cache-Control": options.cache ?? "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    "Content-Type": contentType,
    ETag: etag,
    "Last-Modified": lastModified.toUTCString(),
    Link: `</.well-known/api-catalog>; rel=\"api-catalog\", </llms.txt>; rel=\"describedby\", </openapi.json>; rel=\"service-desc\"; type=\"application/vnd.oai.openapi+json;version=3.1\"`,
    Vary: "Accept",
    "X-Content-Type-Options": "nosniff",
    ...options.headers,
  });

  if (options.conditional !== false) {
    const ifNoneMatch = request.headers.get("if-none-match");
    const etagMatches = ifNoneMatch
      ?.split(",")
      .map((value) => value.trim())
      .some((value) => value === "*" || value === etag);

    if (etagMatches) {
      return new Response(null, { status: 304, headers });
    }

    if (!ifNoneMatch) {
      const ifModifiedSince = request.headers.get("if-modified-since");
      const since = ifModifiedSince ? new Date(ifModifiedSince) : null;

      if (since && !Number.isNaN(since.getTime()) && lastModified <= since) {
        return new Response(null, { status: 304, headers });
      }
    }
  }

  return new Response(body, { status: options.status ?? 200, headers });
}

export function problemResponse(
  request: Request,
  status: number,
  title: string,
  detail: string,
  extensions: Record<string, unknown> = {},
) {
  const body = JSON.stringify({
    type: `${siteOrigin}/machine-access#errors`,
    title,
    status,
    detail,
    ...extensions,
  }, null, 2);

  return publicResponse(request, body, "application/problem+json; charset=utf-8", {
    status,
    cache: "no-store",
    conditional: false,
  });
}

export function corsOptionsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Headers": "Accept, Content-Type, If-Modified-Since, If-None-Match",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Max-Age": "86400",
      Allow: "GET, HEAD, OPTIONS",
    },
  });
}

export const allowedTopics = [...resourceTopics];
export const allowedKinds = [...resourceKinds];

export const topicDescriptions: Record<(typeof resourceTopics)[number], string> = {
  "Accounting and reporting": "Recognition, measurement, presentation, disclosure, reporting systems, and professional judgment.",
  "Audit and assurance": "Audit standards, evidence, technology-assisted procedures, supervision, and assurance implications.",
  "Controls and governance": "Internal control, accountability, risk management, oversight, and human authorization.",
  "Agent engineering": "Agent architecture, tools, orchestration, context, state, and interoperable interfaces.",
  "Security and identity": "Authorization, identity, least privilege, data security, and tool boundaries.",
  "Evaluation and evidence": "Testing, measurement, reproducibility, incident learning, and empirical research.",
  "Law and policy": "AI laws, regulatory frameworks, public-sector guidance, and policy obligations.",
  "Practice examples": "First-party product, firm, and implementation examples; useful as patterns rather than neutral evidence.",
};

export const kindDescriptions: Record<(typeof resourceKinds)[number], string> = {
  "Rule or standard": "Authoritative or binding requirements within the stated scope and jurisdiction.",
  "Official guidance": "Interpretation, implementation, or risk guidance from a public body or professional institution.",
  "Research paper": "A peer-reviewed article or working paper whose publication status and transfer limits remain explicit.",
  "Technical reference": "Specifications, protocols, documentation, or technical frameworks.",
  Evidence: "A benchmark, survey, report, evaluation, or other empirical finding with an identifiable method and publisher.",
  "Thought piece": "Reasoned analysis or practitioner interpretation; useful framing, not neutral authority or outcome evidence.",
  "Practice example": "A documented implementation or first-party product pattern; not proof of general effectiveness.",
};
