import { publicResponse } from "../agent-interface";
import { renderReviewerGuideMarkdown } from "../reviewer-guide";

export async function GET(request: Request) {
  return publicResponse(request, renderReviewerGuideMarkdown(), "text/markdown; charset=utf-8", {
    headers: { "Content-Language": "en" },
  });
}

export const HEAD = GET;
