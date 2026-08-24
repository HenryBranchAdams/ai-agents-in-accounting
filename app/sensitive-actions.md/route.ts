import { publicResponse } from "../agent-interface";
import { renderSensitiveActionsMarkdown } from "../domain-interface";
import { sensitiveActions } from "../governance-data";

export async function GET(request: Request) {
  return publicResponse(request, renderSensitiveActionsMarkdown(sensitiveActions), "text/markdown; charset=utf-8", {
    headers: { "Content-Language": "en" },
  });
}

export const HEAD = GET;
