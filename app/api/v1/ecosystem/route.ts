import { ecosystemLayers, renderEcosystemMarkdown } from "../../../ecosystem-data";
import { problemResponse, siteOrigin } from "../../../agent-interface";
import { platformCollectionResponse, platformOptionsResponse } from "../../../platform-api";

export function OPTIONS() {
  return platformOptionsResponse();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (query.length > 200) {
    return problemResponse(request, 400, "Invalid query", "The q parameter may contain at most 200 characters.");
  }
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = ecosystemLayers.filter((item) => {
    const searchable = [
      item.id,
      item.name,
      item.role,
      item.posture,
      item.use_here,
      item.boundary,
      ...item.source_ids,
    ].join(" ").toLowerCase();
    return terms.every((term) => searchable.includes(term));
  });

  return platformCollectionResponse({
    request,
    collection: "ecosystem_layers",
    allRecords: ecosystemLayers,
    matches,
    renderMarkdown: (records) => renderEcosystemMarkdown(siteOrigin, records),
    filters: { q: query || null },
  });
}

export const HEAD = GET;
