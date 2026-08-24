import { publicResponse } from "../agent-interface";
import { renderTemplatesMarkdown } from "../domain-interface";
import { templates } from "../reference-data";

export async function GET(request: Request) {
  return publicResponse(request, renderTemplatesMarkdown(templates), "text/markdown; charset=utf-8", {
    headers: { "Content-Language": "en" },
  });
}

export const HEAD = GET;
