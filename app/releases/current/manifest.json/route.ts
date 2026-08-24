import { publicResponse } from "../../../agent-interface";
import { createReleaseManifest } from "../../../platform-data";

export async function GET(request: Request) {
  return publicResponse(request, JSON.stringify(await createReleaseManifest(), null, 2), "application/json; charset=utf-8");
}

export const HEAD = GET;
