import {
  agentResources,
  apiVersion,
  catalogReviewedAt,
  catalogVersion,
  publicResponse,
  rightsNotice,
} from "../../agent-interface";

export async function GET(request: Request) {
  const body = JSON.stringify({
    schema_version: apiVersion,
    catalog_version: catalogVersion,
    catalog_reviewed_at: catalogReviewedAt,
    rights_notice: rightsNotice,
    total_records: agentResources.length,
    items: agentResources,
  }, null, 2);

  return publicResponse(request, body, "application/json; charset=utf-8", {
    headers: {
      "Content-Disposition": "inline; filename=accounting-agents-resources.json",
      "Content-Language": "en",
    },
  });
}

export const HEAD = GET;
