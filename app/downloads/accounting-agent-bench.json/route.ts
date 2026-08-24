import { publicResponse } from "../../agent-interface";
import { benchmark } from "../../platform-data";

export async function GET(request: Request) {
  return publicResponse(request, JSON.stringify(benchmark, null, 2), "application/json; charset=utf-8", {
    headers: { "Content-Disposition": 'attachment; filename="accounting-agent-bench.json"' },
  });
}

export const HEAD = GET;
