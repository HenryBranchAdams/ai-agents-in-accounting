import {
  apiVersion,
  corsOptionsResponse,
  negotiatePublicFormat,
  problemResponse,
  publicResponse,
  rightsNotice,
} from "./agent-interface";

type KnowledgeHubRouteOptions<Item> = {
  collection: string;
  item: Item;
  links: Readonly<Record<string, string>>;
  renderMarkdown: () => string;
};

type KnowledgeHubRoute = {
  GET: (request: Request) => Promise<Response>;
  HEAD: (request: Request) => Promise<Response>;
  OPTIONS: () => Response;
};

/**
 * Build the shared protocol for a static, editorial knowledge-hub resource.
 *
 * The route-specific seam is deliberately small: callers provide the stable
 * identity, links, data item, and Markdown renderer; this module owns format
 * negotiation, problem details, response metadata, and method parity.
 */
export function createKnowledgeHubRoute<Item>({
  collection,
  item,
  links,
  renderMarkdown,
}: KnowledgeHubRouteOptions<Item>): KnowledgeHubRoute {
  const GET = async (request: Request) => {
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
      return publicResponse(request, renderMarkdown(), "text/markdown; charset=utf-8", {
        headers: { "Content-Language": "en" },
      });
    }

    return publicResponse(
      request,
      JSON.stringify({
        schema_version: apiVersion,
        collection,
        rights_notice: rightsNotice,
        links,
        item,
      }, null, 2),
      "application/json; charset=utf-8",
    );
  };

  return {
    GET,
    HEAD: GET,
    OPTIONS: () => corsOptionsResponse(),
  };
}
