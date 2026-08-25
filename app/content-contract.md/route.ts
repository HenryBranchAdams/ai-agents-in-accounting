import { publicResponse } from "../agent-interface";
import { renderContentContractMarkdown } from "../content-contract";

export async function GET(request: Request) {
  return publicResponse(request, renderContentContractMarkdown(), "text/markdown; charset=utf-8", {
    headers: { "Content-Language": "en" },
  });
}

export const HEAD = GET;
