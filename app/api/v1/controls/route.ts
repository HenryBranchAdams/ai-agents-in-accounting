import { domainCollectionResponse, domainOptionsResponse } from "../../../domain-api";
import { renderControlsMarkdown, searchRecords } from "../../../domain-interface";
import { controlPatterns } from "../../../governance-data";

export function OPTIONS() {
  return domainOptionsResponse();
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() || undefined;
  return domainCollectionResponse({
    request,
    allRecords: controlPatterns,
    matches: searchRecords({ records: controlPatterns, query }),
    renderMarkdown: renderControlsMarkdown,
    collection: "controls",
    filters: { q: query ?? null },
    markdownPath: "/controls.md",
  });
}

export const HEAD = GET;
