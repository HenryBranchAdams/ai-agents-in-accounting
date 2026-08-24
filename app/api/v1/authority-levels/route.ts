import { domainCollectionResponse, domainOptionsResponse } from "../../../domain-api";
import { renderAuthorityLevelsMarkdown, searchRecords } from "../../../domain-interface";
import { authorityLevels } from "../../../domain-model";

export function OPTIONS() {
  return domainOptionsResponse();
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() || undefined;
  return domainCollectionResponse({
    request,
    allRecords: authorityLevels,
    matches: searchRecords({ records: authorityLevels, query }),
    renderMarkdown: renderAuthorityLevelsMarkdown,
    collection: "authority-levels",
    filters: { q: query ?? null },
    markdownPath: "/authority-levels.md",
  });
}

export const HEAD = GET;
