import {
  agentResources,
  apiVersion,
  catalogVersion,
  corsOptionsResponse,
  negotiatePublicFormat,
  problemResponse,
  publicResponse,
  renderResourcesMarkdown,
  rightsNotice,
} from "../../../../agent-interface";

export function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const item = agentResources.find((resource) => resource.id === id);

  if (!item) {
    return problemResponse(request, 404, "Resource not found", `No source record exists with ID ${id}.`);
  }

  const url = new URL(request.url);
  const requestedFormat = url.searchParams.get("format")?.trim().toLowerCase();

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
    return publicResponse(
      request,
      renderResourcesMarkdown([item], { summary: `One source record from the Accounting Agents catalog.` }),
      "text/markdown; charset=utf-8",
      { headers: { "Content-Language": "en" } },
    );
  }

  const body = JSON.stringify({
    schema_version: apiVersion,
    catalog_version: catalogVersion,
    rights_notice: rightsNotice,
    item,
  }, null, 2);

  return publicResponse(request, body, "application/json; charset=utf-8");
}

export const HEAD = GET;
