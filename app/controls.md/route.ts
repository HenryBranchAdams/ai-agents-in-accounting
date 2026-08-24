import { publicResponse } from "../agent-interface";
import { renderControlsMarkdown } from "../domain-interface";
import { controlPatterns } from "../governance-data";

export async function GET(request: Request) {
  return publicResponse(request, renderControlsMarkdown(controlPatterns), "text/markdown; charset=utf-8", {
    headers: { "Content-Language": "en" },
  });
}

export const HEAD = GET;
