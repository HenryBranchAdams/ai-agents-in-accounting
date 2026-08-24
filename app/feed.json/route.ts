import { publicResponse, siteOrigin } from "../agent-interface";
import { releaseNotes } from "../platform-data";

export async function GET(request: Request) {
  const body = {
    version: "https://jsonfeed.org/version/1.1",
    title: "Accounting Agents changes",
    home_page_url: `${siteOrigin}/changes`,
    feed_url: `${siteOrigin}/feed.json`,
    description: "Versioned releases and material corpus changes.",
    language: "en",
    items: releaseNotes.map((item) => ({
      id: item.id,
      url: `${siteOrigin}/changes#release-${item.id}`,
      title: item.title,
      content_text: `${item.summary}\n\n${item.changes.map((change) => `- ${change}`).join("\n")}`,
      date_published: `${item.date}T00:00:00.000Z`,
      tags: ["project-release", "accounting-agents"],
    })),
  };
  return publicResponse(request, JSON.stringify(body, null, 2), "application/feed+json; charset=utf-8");
}

export const HEAD = GET;
