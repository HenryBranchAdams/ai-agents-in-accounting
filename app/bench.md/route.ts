import { publicResponse } from "../agent-interface";
import { renderBenchmarkMarkdown } from "../platform-data";

export async function GET(request: Request) {
  return publicResponse(request, renderBenchmarkMarkdown(), "text/markdown; charset=utf-8", {
    headers: { "Content-Language": "en" },
  });
}

export const HEAD = GET;
