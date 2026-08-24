import {
  agentResources,
  publicResponse,
  renderResourcesMarkdown,
} from "../agent-interface";

export async function GET(request: Request) {
  return publicResponse(
    request,
    renderResourcesMarkdown(agentResources),
    "text/markdown; charset=utf-8",
    { headers: { "Content-Language": "en" } },
  );
}

export const HEAD = GET;
