import { publicResponse } from "../agent-interface";
import { renderGlossaryMarkdown } from "../domain-interface";
import { glossary } from "../reference-data";

export async function GET(request: Request) {
  return publicResponse(request, renderGlossaryMarkdown(glossary), "text/markdown; charset=utf-8", {
    headers: { "Content-Language": "en" },
  });
}

export const HEAD = GET;
