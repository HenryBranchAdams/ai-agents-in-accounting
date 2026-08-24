import {
  apiVersion,
  catalogModifiedAt,
  catalogVersion,
  publicResponse,
  rightsNotice,
  siteOrigin,
  toAgentResource,
} from "../../agent-interface";
import {
  readingRoomKindCounts,
  readingRoomResources,
  readingRoomReviewedAt,
  readingRoomSections,
} from "../../reading-room-data";

export async function GET(request: Request) {
  const body = JSON.stringify({
    schema_version: apiVersion,
    catalog_version: catalogVersion,
    reviewed_at: readingRoomReviewedAt,
    modified_at: catalogModifiedAt,
    title: "Accounting Agents reading room",
    description: "A curated path through research papers, practitioner essays, professional reports, and disclosed practice examples on AI and agents in accounting.",
    total_records: readingRoomResources.length,
    source_type_counts: readingRoomKindCounts,
    rights: rightsNotice,
    links: {
      human: `${siteOrigin}/reading-room`,
      markdown: `${siteOrigin}/reading-room.md`,
      complete_catalog: `${siteOrigin}/api/v1/resources`,
    },
    sections: readingRoomSections.map((section) => ({
      id: section.id,
      title: section.title,
      introduction: section.introduction,
      source_ids: section.sourceIds,
      items: section.resources.map(toAgentResource),
    })),
  }, null, 2);

  return publicResponse(request, body, "application/json; charset=utf-8");
}

export const HEAD = GET;
