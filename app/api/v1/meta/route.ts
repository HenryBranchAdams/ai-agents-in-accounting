import {
  agentResources,
  apiVersion,
  catalogModifiedAt,
  catalogReviewedAt,
  catalogVersion,
  corsOptionsResponse,
  publicResponse,
  rightsNotice,
  siteOrigin,
} from "../../../agent-interface";
import { authorityLevels, corpusModifiedAt, corpusReviewedAt, corpusVersion } from "../../../domain-model";
import { ecosystemLayers } from "../../../ecosystem-data";
import { controlPatterns, sensitiveActions } from "../../../governance-data";
import { glossary, templates } from "../../../reference-data";
import { processFamilies, workflowRecords } from "../../../workflows-data";
import { benchmarkCases, packs, platformRelease } from "../../../platform-data";
import { educationalContentContract } from "../../../content-contract";

export function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: Request) {
  const body = JSON.stringify({
    schema_version: apiVersion,
    catalog_version: catalogVersion,
    catalog_reviewed_at: catalogReviewedAt,
    catalog_modified_at: catalogModifiedAt,
    corpus_version: corpusVersion,
    corpus_reviewed_at: corpusReviewedAt,
    corpus_modified_at: corpusModifiedAt,
    content_contract_version: educationalContentContract.version,
    content_contract_review_status: educationalContentContract.review_status,
    title: "Accounting Agents public corpus",
    description: "Canonical workflows, authority boundaries, controls, templates, terminology, and curated sources for governed AI-agent work across the accounting lifecycle.",
    language: "en",
    total_records: agentResources.length,
    record_counts: {
      process_families: processFamilies.length,
      workflows: workflowRecords.length,
      authority_levels: authorityLevels.length,
      sensitive_actions: sensitiveActions.length,
      control_patterns: controlPatterns.length,
      templates: templates.length,
      glossary_terms: glossary.length,
      source_records: agentResources.length,
      workflow_packs: packs.length,
      benchmark_cases: benchmarkCases.length,
      ecosystem_layers: ecosystemLayers.length,
      content_modes: educationalContentContract.modes.length,
      evidence_classifications: educationalContentContract.evidence_classifications.length,
      content_page_assignments: educationalContentContract.page_assignments.length,
    },
    access: {
      authentication: "none",
      mode: "public read-only",
      cors: "*",
      formats: ["application/json", "text/markdown"],
    },
    rights: {
      notice: rightsNotice,
      software: { license_id: "MIT", applies_to: "application code, schemas, clients, CLI, validators, and benchmark harness" },
      editorial_content: { license_id: "CC-BY-4.0", applies_to: "original guides, annotations, workflow prose, and rubrics" },
      factual_metadata_and_synthetic_fixtures: { license_id: "CC0-1.0", applies_to: "project-created metadata, identifiers, synthetic fixtures, and reference values" },
      external_sources: { license_id: null, status: "record-specific; unknown unless a publisher grant is recorded", full_text_stored: false },
      policy: `${siteOrigin}/open-source#rights`,
    },
    links: {
      documentation: `${siteOrigin}/machine-access`,
      api_catalog: `${siteOrigin}/.well-known/api-catalog`,
      openapi: `${siteOrigin}/openapi.json`,
      taxonomy: `${siteOrigin}/api/v1/taxonomy`,
      workflows: `${siteOrigin}/api/v1/workflows`,
      authority_levels: `${siteOrigin}/api/v1/authority-levels`,
      sensitive_actions: `${siteOrigin}/api/v1/sensitive-actions`,
      controls: `${siteOrigin}/api/v1/controls`,
      templates: `${siteOrigin}/api/v1/templates`,
      glossary: `${siteOrigin}/api/v1/glossary`,
      search: `${siteOrigin}/api/v1/search`,
      packs: `${siteOrigin}/api/v1/packs`,
      benchmark: `${siteOrigin}/api/v1/benchmark`,
      ecosystem: `${siteOrigin}/api/v1/ecosystem`,
      ecosystem_markdown: `${siteOrigin}/ecosystem.md`,
      release_manifest: `${siteOrigin}/releases/current/manifest.json`,
      specification: `${siteOrigin}/spec`,
      changes: `${siteOrigin}/changes`,
      json_feed: `${siteOrigin}/feed.json`,
      atom_feed: `${siteOrigin}/feed.xml`,
      source_archive: `${siteOrigin}/downloads/accounting-agents-source.zip`,
      resources: `${siteOrigin}/api/v1/resources`,
      reading_room: `${siteOrigin}/reading-room`,
      reading_room_markdown: `${siteOrigin}/reading-room.md`,
      reading_room_json: `${siteOrigin}/downloads/reading-room.json`,
      corpus_snapshot: `${siteOrigin}/downloads/corpus.json`,
      json_snapshot: `${siteOrigin}/downloads/resources.json`,
      markdown_snapshot: `${siteOrigin}/resources.md`,
      compact_context: `${siteOrigin}/agent-context.md`,
      public_agent_instructions: `${siteOrigin}/AGENTS.md`,
      context_bundle: `${siteOrigin}/downloads/context-bundle.md`,
      content_contract: `${siteOrigin}/content-contract`,
      content_contract_markdown: `${siteOrigin}/content-contract.md`,
      content_contract_api: `${siteOrigin}/api/v1/content-contract`,
    },
    platform_release: platformRelease,
  }, null, 2);

  return publicResponse(request, body, "application/json; charset=utf-8");
}

export const HEAD = GET;
