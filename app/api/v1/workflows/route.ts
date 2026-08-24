import { domainCollectionResponse, domainOptionsResponse } from "../../../domain-api";
import {
  allowedAuthorityLevels,
  allowedFamilies,
  renderWorkflowsMarkdown,
  searchWorkflows,
} from "../../../domain-interface";
import { problemResponse } from "../../../agent-interface";
import type { AuthorityLevelId, ProcessFamilyId } from "../../../domain-model";
import { workflowRecords } from "../../../workflows-data";

export function OPTIONS() {
  return domainOptionsResponse();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() || undefined;
  const family = url.searchParams.get("family")?.trim() || undefined;
  const authority = url.searchParams.get("authority")?.trim() || undefined;

  if (family && !allowedFamilies.includes(family as ProcessFamilyId)) {
    return problemResponse(request, 400, "Invalid workflow family", "Use one of the published family values.", {
      allowed_values: allowedFamilies,
    });
  }
  if (authority && !allowedAuthorityLevels.includes(authority as AuthorityLevelId)) {
    return problemResponse(request, 400, "Invalid authority level", "Use one of the published authority values.", {
      allowed_values: allowedAuthorityLevels,
    });
  }

  const matches = searchWorkflows({ query, family, authority });
  return domainCollectionResponse({
    request,
    allRecords: workflowRecords,
    matches,
    renderMarkdown: renderWorkflowsMarkdown,
    collection: "workflows",
    filters: {
      q: query ?? null,
      family: family ?? null,
      authority: authority ?? null,
    },
    markdownPath: "/workflows.md",
  });
}

export const HEAD = GET;
