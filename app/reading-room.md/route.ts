import { publicResponse, siteOrigin } from "../agent-interface";
import { renderReadingRoomMarkdown } from "../reading-room-data";

export async function GET(request: Request) {
  return publicResponse(
    request,
    renderReadingRoomMarkdown(siteOrigin),
    "text/markdown; charset=utf-8",
  );
}

export const HEAD = GET;
