import { domainCollectionResponse, domainOptionsResponse } from "../../../domain-api";
import { renderGlossaryMarkdown, searchRecords } from "../../../domain-interface";
import { glossary } from "../../../reference-data";

export function OPTIONS() {
  return domainOptionsResponse();
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() || undefined;
  return domainCollectionResponse({
    request,
    allRecords: glossary,
    matches: searchRecords({ records: glossary, query }),
    renderMarkdown: renderGlossaryMarkdown,
    collection: "glossary",
    filters: { q: query ?? null },
    markdownPath: "/glossary.md",
  });
}

export const HEAD = GET;
