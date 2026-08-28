import { publicResponse, siteOrigin } from "../agent-interface";
import {
  atlasIndustryIds,
  atlasTimeLayerIds,
  renderAtlasMarkdown,
  type AtlasTimeLayerId,
} from "../atlas-data";
import type { ResourceIndustry } from "../resources-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedIndustry = url.searchParams.get("industry")?.trim() ?? "general";
  const requestedTimeLayer = url.searchParams.get("time_layer")?.trim() ?? "all";
  const industry = atlasIndustryIds.includes(requestedIndustry as (typeof atlasIndustryIds)[number])
    ? requestedIndustry as ResourceIndustry
    : "general";
  const timeLayer = atlasTimeLayerIds.includes(requestedTimeLayer as AtlasTimeLayerId)
    ? requestedTimeLayer as AtlasTimeLayerId
    : "all";

  return publicResponse(
    request,
    renderAtlasMarkdown(siteOrigin, { industry, timeLayer }),
    "text/markdown; charset=utf-8",
    { headers: { "Content-Language": "en" } },
  );
}

export const HEAD = GET;
