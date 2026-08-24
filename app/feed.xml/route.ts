import { publicResponse, siteOrigin } from "../agent-interface";
import { releaseNotes } from "../platform-data";

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET(request: Request) {
  const entries = releaseNotes.map((item) => `
  <entry>
    <id>${escapeXml(`${siteOrigin}/changes#release-${item.id}`)}</id>
    <title>${escapeXml(item.title)}</title>
    <link href="${escapeXml(`${siteOrigin}/changes#release-${item.id}`)}"/>
    <updated>${item.date}T00:00:00.000Z</updated>
    <summary>${escapeXml(item.summary)}</summary>
    <content type="text">${escapeXml(item.changes.join("\n"))}</content>
  </entry>`).join("");
  const body = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${siteOrigin}/changes</id>
  <title>Accounting Agents changes</title>
  <link href="${siteOrigin}/feed.xml" rel="self"/>
  <link href="${siteOrigin}/changes"/>
  <updated>${releaseNotes[0].date}T00:00:00.000Z</updated>${entries}
</feed>\n`;
  return publicResponse(request, body, "application/atom+xml; charset=utf-8");
}

export const HEAD = GET;
