import { publicResponse } from "../agent-interface";
import { renderStartHereMarkdown } from "../start-here";

export async function GET(request: Request) {
  return publicResponse(request, renderStartHereMarkdown(), "text/markdown; charset=utf-8", {
    headers: { "Content-Language": "en" },
  });
}

export const HEAD = GET;
