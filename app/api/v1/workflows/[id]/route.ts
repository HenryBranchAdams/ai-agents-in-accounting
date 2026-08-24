import { problemResponse } from "../../../../agent-interface";
import { domainItemResponse, domainOptionsResponse } from "../../../../domain-api";
import { renderWorkflowsMarkdown } from "../../../../domain-interface";
import { workflowById } from "../../../../workflows-data";

export function OPTIONS() {
  return domainOptionsResponse();
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const item = workflowById.get(id);
  if (!item) {
    return problemResponse(request, 404, "Workflow not found", `No workflow record exists with ID ${id}.`);
  }
  return domainItemResponse({
    request,
    item,
    collection: "workflows",
    renderMarkdown: renderWorkflowsMarkdown,
  });
}

export const HEAD = GET;
