import { publicResponse } from "../agent-interface";
import { renderControlModelMarkdown } from "../control-model";

export async function GET(request: Request) {
  return publicResponse(request, renderControlModelMarkdown(), "text/markdown; charset=utf-8", {
    headers: { "Content-Language": "en" },
  });
}

export const HEAD = GET;
