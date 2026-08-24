import { publicResponse } from "../agent-interface";
import { renderAuthorityLevelsMarkdown } from "../domain-interface";
import { authorityLevels } from "../domain-model";

export async function GET(request: Request) {
  return publicResponse(request, renderAuthorityLevelsMarkdown(authorityLevels), "text/markdown; charset=utf-8", {
    headers: { "Content-Language": "en" },
  });
}

export const HEAD = GET;
