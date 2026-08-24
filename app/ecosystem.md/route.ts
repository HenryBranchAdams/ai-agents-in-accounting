import { publicResponse, siteOrigin } from "../agent-interface";
import { renderEcosystemMarkdown } from "../ecosystem-data";

export async function GET(request: Request) {
  return publicResponse(request, renderEcosystemMarkdown(siteOrigin), "text/markdown; charset=utf-8", {
    headers: { "Content-Language": "en" },
  });
}

export const HEAD = GET;
