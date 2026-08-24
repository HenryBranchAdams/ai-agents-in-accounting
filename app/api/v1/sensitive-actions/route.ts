import { domainCollectionResponse, domainOptionsResponse } from "../../../domain-api";
import { renderSensitiveActionsMarkdown, searchRecords } from "../../../domain-interface";
import { sensitiveActions } from "../../../governance-data";

export function OPTIONS() {
  return domainOptionsResponse();
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() || undefined;
  return domainCollectionResponse({
    request,
    allRecords: sensitiveActions,
    matches: searchRecords({ records: sensitiveActions, query }),
    renderMarkdown: renderSensitiveActionsMarkdown,
    collection: "sensitive-actions",
    filters: { q: query ?? null },
    markdownPath: "/sensitive-actions.md",
  });
}

export const HEAD = GET;
