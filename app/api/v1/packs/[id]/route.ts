import { problemResponse } from "../../../../agent-interface";
import { platformItemResponse, platformOptionsResponse } from "../../../../platform-api";
import { packById, renderPackMarkdown } from "../../../../platform-data";

export function OPTIONS() {
  return platformOptionsResponse();
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const pack = packById.get(id);
  if (!pack) return problemResponse(request, 404, "Pack not found", `No workflow pack exists with ID ${id}.`);
  return platformItemResponse({ request, collection: "packs", item: pack, renderMarkdown: renderPackMarkdown });
}

export const HEAD = GET;
