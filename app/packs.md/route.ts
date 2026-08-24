import { publicResponse } from "../agent-interface";
import { renderPacksMarkdown } from "../platform-data";

export async function GET(request: Request) {
  return publicResponse(request, renderPacksMarkdown(), "text/markdown; charset=utf-8", {
    headers: { "Content-Language": "en" },
  });
}

export const HEAD = GET;
