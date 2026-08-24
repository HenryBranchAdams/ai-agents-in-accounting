import { domainCollectionResponse, domainOptionsResponse } from "../../../domain-api";
import { renderTemplatesMarkdown, searchRecords } from "../../../domain-interface";
import { templates } from "../../../reference-data";

export function OPTIONS() {
  return domainOptionsResponse();
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() || undefined;
  return domainCollectionResponse({
    request,
    allRecords: templates,
    matches: searchRecords({ records: templates, query }),
    renderMarkdown: renderTemplatesMarkdown,
    collection: "templates",
    filters: { q: query ?? null },
    markdownPath: "/templates.md",
  });
}

export const HEAD = GET;
