import {
  apiVersion,
  corsOptionsResponse,
  negotiatePublicFormat,
  problemResponse,
  publicResponse,
  rightsNotice,
  siteOrigin,
} from "../../../agent-interface";
import {
  accountingAgentsAtlas,
  atlasIndustryIds,
  atlasTimeLayerIds,
  getAtlasView,
  renderAtlasMarkdown,
  type AtlasTimeLayerId,
} from "../../../atlas-data";
import type { ResourceIndustry } from "../../../resources-data";

export function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedFormat = url.searchParams.get("format")?.trim().toLowerCase();
  if (requestedFormat && requestedFormat !== "json" && requestedFormat !== "markdown") {
    return problemResponse(request, 400, "Invalid format", "The format parameter must be json or markdown.", {
      allowed_values: ["json", "markdown"],
    });
  }

  const requestedIndustry = url.searchParams.get("industry")?.trim() ?? "general";
  if (!atlasIndustryIds.includes(requestedIndustry as (typeof atlasIndustryIds)[number])) {
    return problemResponse(request, 400, "Invalid industry", "The industry parameter must name a published Atlas lens.", {
      allowed_values: atlasIndustryIds,
    });
  }

  const requestedTimeLayer = url.searchParams.get("time_layer")?.trim() ?? "all";
  if (!atlasTimeLayerIds.includes(requestedTimeLayer as AtlasTimeLayerId)) {
    return problemResponse(request, 400, "Invalid time layer", "The time_layer parameter must be all, foundational, or current-development.", {
      allowed_values: atlasTimeLayerIds,
    });
  }

  const format = negotiatePublicFormat(request, requestedFormat);
  if (!format) {
    return problemResponse(request, 406, "Not acceptable", "Request application/json or text/markdown.", {
      available_types: ["application/json", "text/markdown"],
    });
  }

  const industry = requestedIndustry as ResourceIndustry;
  const timeLayer = requestedTimeLayer as AtlasTimeLayerId;
  if (format === "markdown") {
    return publicResponse(
      request,
      renderAtlasMarkdown(siteOrigin, { industry, timeLayer }),
      "text/markdown; charset=utf-8",
      { headers: { "Content-Language": "en" } },
    );
  }

  const view = getAtlasView({ industry, timeLayer });
  const query = new URLSearchParams({ industry, time_layer: timeLayer });
  return publicResponse(
    request,
    JSON.stringify({
      schema_version: apiVersion,
      collection: "accounting_agents_living_atlas",
      rights_notice: rightsNotice,
      links: {
        self: `${siteOrigin}/api/v1/atlas?${query}`,
        human: `${siteOrigin}/atlas?${query}`,
        markdown: `${siteOrigin}/atlas.md?${query}`,
        source_library: `${siteOrigin}/resources`,
        practice_observatory: `${siteOrigin}/observatory`,
      },
      item: {
        ...accountingAgentsAtlas,
        view,
      },
    }, null, 2),
    "application/json; charset=utf-8",
  );
}

export const HEAD = GET;
