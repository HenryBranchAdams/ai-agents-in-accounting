import {
  apiVersion,
  corsOptionsResponse,
  negotiatePublicFormat,
  problemResponse,
  publicResponse,
  rightsNotice,
  siteOrigin,
} from "../../../agent-interface";
import { accountingAgentsStartHere, renderStartHereMarkdown } from "../../../start-here";

export function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: Request) {
  const requestedFormat = new URL(request.url).searchParams.get("format")?.trim().toLowerCase();
  if (requestedFormat && requestedFormat !== "json" && requestedFormat !== "markdown") {
    return problemResponse(request, 400, "Invalid format", "The format parameter must be json or markdown.", {
      allowed_values: ["json", "markdown"],
    });
  }
  const format = negotiatePublicFormat(request, requestedFormat);
  if (!format) {
    return problemResponse(request, 406, "Not acceptable", "Request application/json or text/markdown.", {
      available_types: ["application/json", "text/markdown"],
    });
  }
  if (format === "markdown") {
    return publicResponse(request, renderStartHereMarkdown(), "text/markdown; charset=utf-8", {
      headers: { "Content-Language": "en" },
    });
  }

  return publicResponse(
    request,
    JSON.stringify({
      schema_version: apiVersion,
      collection: "start_here_orientation",
      rights_notice: rightsNotice,
      links: {
        self: `${siteOrigin}/api/v1/start-here`,
        human: `${siteOrigin}/start-here`,
        markdown: `${siteOrigin}/start-here.md`,
        next_case: `${siteOrigin}/packs/bank-reconciliation`,
      },
      item: accountingAgentsStartHere,
    }, null, 2),
    "application/json; charset=utf-8",
  );
}

export const HEAD = GET;
