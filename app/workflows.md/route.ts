import { publicResponse } from "../agent-interface";
import { renderWorkflowsMarkdown } from "../domain-interface";
import { workflowRecords } from "../workflows-data";

export async function GET(request: Request) {
  return publicResponse(request, renderWorkflowsMarkdown(workflowRecords), "text/markdown; charset=utf-8", {
    headers: { "Content-Language": "en" },
  });
}

export const HEAD = GET;
