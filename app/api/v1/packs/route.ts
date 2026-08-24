import { platformCollectionResponse, platformOptionsResponse } from "../../../platform-api";
import { packs, renderPacksMarkdown } from "../../../platform-data";
import { problemResponse } from "../../../agent-interface";
import { allowedFamilies } from "../../../domain-interface";

export function OPTIONS() {
  return platformOptionsResponse();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim().toLowerCase() || "";
  const family = url.searchParams.get("family")?.trim() || "";
  if (query.length > 200) {
    return problemResponse(request, 400, "Query too long", "The q parameter must contain 200 characters or fewer.");
  }
  if (family && !allowedFamilies.includes(family as (typeof allowedFamilies)[number])) {
    return problemResponse(request, 400, "Invalid process family", "Use one of the published process-family values.", { allowed_values: allowedFamilies });
  }
  const matches = packs.filter((pack) => {
    if (family && pack.process_family !== family) return false;
    if (!query) return true;
    return JSON.stringify(pack).toLowerCase().includes(query);
  });
  return platformCollectionResponse({
    request,
    collection: "packs",
    allRecords: packs,
    matches,
    renderMarkdown: renderPacksMarkdown,
    filters: { q: query || null, family: family || null },
  });
}

export const HEAD = GET;
