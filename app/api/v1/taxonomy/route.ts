import {
  agentResources,
  allowedKinds,
  allowedTopics,
  apiVersion,
  catalogVersion,
  corsOptionsResponse,
  kindDescriptions,
  publicResponse,
  topicDescriptions,
} from "../../../agent-interface";
import { authorityLevels } from "../../../domain-model";
import { ecosystemLayers } from "../../../ecosystem-data";
import { processFamilies, workflowRecords } from "../../../workflows-data";
import { benchmarkCases, packs } from "../../../platform-data";
import { searchRecordTypes } from "../../../search-index";

export function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: Request) {
  const body = JSON.stringify({
    schema_version: apiVersion,
    catalog_version: catalogVersion,
    process_families: processFamilies.map((family) => ({
      value: family.id,
      label: family.name,
      description: family.summary,
      record_count: workflowRecords.filter((workflow) => workflow.family === family.id).length,
    })),
    authority_levels: authorityLevels.map((level) => ({
      value: level.id,
      label: level.label,
      description: level.agent_role,
      workflow_count: workflowRecords.filter((workflow) => workflow.authority_level === level.id).length,
    })),
    workflows: workflowRecords.map((workflow) => ({
      value: workflow.id,
      label: workflow.name,
      family: workflow.family,
      authority_level: workflow.authority_level,
      authority_semantics: "Controlling workflow boundary; inspect the record's actions for preparation, recommendation, execution, and human-only levels.",
      record_url: `/api/v1/workflows/${workflow.id}`,
      human_url: `/workflows/${workflow.family}/${workflow.id}`,
    })),
    topics: allowedTopics.map((value) => ({
      value,
      description: topicDescriptions[value],
      record_count: agentResources.filter((resource) => resource.topic === value).length,
    })),
    source_types: allowedKinds.map((value) => ({
      value,
      description: kindDescriptions[value],
      record_count: agentResources.filter((resource) => resource.source_type === value).length,
    })),
    workflow_packs: packs.map((pack) => ({
      value: pack.id,
      label: pack.title,
      family: pack.process_family,
      authority_level: pack.authority_level,
      case_count: benchmarkCases.filter((item) => item.pack_id === pack.id).length,
    })),
    benchmark_case_types: [...new Set(benchmarkCases.map((item) => item.case_type))],
    ecosystem_layers: ecosystemLayers.map((item) => ({
      value: item.id,
      label: item.name,
      posture: item.posture,
      source_ids: item.source_ids,
    })),
    search_record_types: searchRecordTypes,
  }, null, 2);

  return publicResponse(request, body, "application/json; charset=utf-8");
}

export const HEAD = GET;
