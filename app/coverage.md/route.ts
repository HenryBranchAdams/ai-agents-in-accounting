import { publicResponse } from "../agent-interface";
import { renderCoverageMapMarkdown } from "../coverage-map";

export async function GET(request: Request) {
  return publicResponse(request, renderCoverageMapMarkdown(), "text/markdown; charset=utf-8", { headers: { "Content-Language": "en" } });
}

export const HEAD = GET;
