import { publicResponse } from "../../agent-interface";
import { platformData } from "../../platform-data";

export async function GET(request: Request) {
  return publicResponse(request, JSON.stringify({
    schema_version: platformData.schema_version,
    release: platformData.release,
    pack_count: platformData.pack_count,
    packs: platformData.packs,
  }, null, 2), "application/json; charset=utf-8", {
    headers: { "Content-Disposition": 'attachment; filename="accounting-agent-packs.json"' },
  });
}

export const HEAD = GET;
