import { publicResponse } from "../../agent-interface";
import { benchmarkCaseSchema } from "../../platform-data";

export async function GET(request: Request) {
  return publicResponse(request, JSON.stringify(benchmarkCaseSchema, null, 2), "application/schema+json; charset=utf-8");
}

export const HEAD = GET;
