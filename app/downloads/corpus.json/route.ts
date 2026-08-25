import { agentResources, publicResponse, rightsNotice } from "../../agent-interface";
import { authorityLevels, corpusReviewedAt, corpusVersion, domainSchemaVersion } from "../../domain-model";
import { controlPatterns, sensitiveActions } from "../../governance-data";
import { ecosystemLayers } from "../../ecosystem-data";
import { domainRightsNotice, normalizeDomainRecord } from "../../domain-interface";
import { glossary, templates } from "../../reference-data";
import { processFamilies, workflowRecords } from "../../workflows-data";
import { benchmark, benchmarkCases, packs, platformRelease, releaseNotes } from "../../platform-data";
import { educationalContentContract } from "../../content-contract";

export async function GET(request: Request) {
  const body = JSON.stringify({
    schema_version: domainSchemaVersion,
    corpus_version: corpusVersion,
    corpus_reviewed_at: corpusReviewedAt,
    title: "Accounting Agents canonical public corpus",
    scope_note: "Complete educational coverage does not grant execution authority. Human-owned approvals, legal attestations, fiduciary authority, and certifications remain human-owned.",
    rights_notice: `${domainRightsNotice} ${rightsNotice}`,
    counts: {
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
    },
    process_families: processFamilies.map((record) => normalizeDomainRecord(record, "process-family")),
    workflows: workflowRecords.map((record) => normalizeDomainRecord(record, "workflow")),
    authority_levels: authorityLevels.map((record) => normalizeDomainRecord(record, "authority-level")),
    sensitive_actions: sensitiveActions.map((record) => normalizeDomainRecord(record, "sensitive-action")),
    control_patterns: controlPatterns.map((record) => normalizeDomainRecord(record, "control-pattern")),
    templates: templates.map((record) => normalizeDomainRecord(record, "template")),
    glossary: glossary.map((record) => normalizeDomainRecord(record, "glossary")),
    sources: agentResources,
    platform_release: platformRelease,
    workflow_packs: packs,
    benchmark,
    ecosystem_layers: ecosystemLayers,
    release_notes: releaseNotes,
    content_contract: educationalContentContract,
  }, null, 2);

  return publicResponse(request, body, "application/json; charset=utf-8", {
    headers: {
      "Content-Disposition": "inline; filename=accounting-agents-corpus.json",
      "Content-Language": "en",
    },
  });
}

export const HEAD = GET;
