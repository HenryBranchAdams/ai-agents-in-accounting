import { publicResponse } from "../../agent-interface";
import { ledgerBenchResultSchema } from "../../ledgerbench-data";

export async function GET(request: Request) {
  return publicResponse(
    request,
    JSON.stringify(ledgerBenchResultSchema, null, 2),
    "application/schema+json; charset=utf-8",
  );
}

export const HEAD = GET;
