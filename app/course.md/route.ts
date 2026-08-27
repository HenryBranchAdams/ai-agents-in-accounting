import { publicResponse } from "../agent-interface";
import { renderCoreCourseMarkdown } from "../core-course";

export async function GET(request: Request) {
  return publicResponse(request, renderCoreCourseMarkdown(), "text/markdown; charset=utf-8", {
    headers: { "Content-Language": "en" },
  });
}

export const HEAD = GET;
