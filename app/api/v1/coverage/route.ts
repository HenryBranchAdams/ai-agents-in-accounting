import { apiVersion, corsOptionsResponse, negotiatePublicFormat, problemResponse, publicResponse, rightsNotice, siteOrigin } from "../../../agent-interface";
import { accountingAgentsCoverageMap, renderCoverageMapMarkdown } from "../../../coverage-map";

export function OPTIONS() { return corsOptionsResponse(); }

export async function GET(request: Request) {
  const requestedFormat = new URL(request.url).searchParams.get("format")?.trim().toLowerCase();
  if (requestedFormat && requestedFormat !== "json" && requestedFormat !== "markdown") return problemResponse(request, 400, "Invalid format", "The format parameter must be json or markdown.", { allowed_values: ["json", "markdown"] });
  const format = negotiatePublicFormat(request, requestedFormat);
  if (!format) return problemResponse(request, 406, "Not acceptable", "Request application/json or text/markdown.", { available_types: ["application/json", "text/markdown"] });
  if (format === "markdown") return publicResponse(request, renderCoverageMapMarkdown(), "text/markdown; charset=utf-8", { headers: { "Content-Language": "en" } });
  return publicResponse(request, JSON.stringify({ schema_version: apiVersion, collection: "coverage_map", rights_notice: rightsNotice, links: { self: `${siteOrigin}/api/v1/coverage`, human: `${siteOrigin}/coverage`, markdown: `${siteOrigin}/coverage.md`, workflows: `${siteOrigin}/api/v1/workflows?limit=60` }, item: accountingAgentsCoverageMap }, null, 2), "application/json; charset=utf-8");
}

export const HEAD = GET;
