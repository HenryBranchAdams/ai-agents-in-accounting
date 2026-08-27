import { publicResponse, siteOrigin } from "../agent-interface";
import { renderPracticeObservatoryMarkdown } from "../practice-observatory";

export async function GET(request: Request) {
  return publicResponse(
    request,
    renderPracticeObservatoryMarkdown(siteOrigin),
    "text/markdown; charset=utf-8",
    { headers: { "Content-Language": "en" } },
  );
}

export const HEAD = GET;
