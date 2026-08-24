import { publicResponse } from "../../agent-interface";
import { ledgerBenchProgramSchema } from "../../ledgerbench-data";

export async function GET(request: Request) {
  return publicResponse(
    request,
    JSON.stringify(ledgerBenchProgramSchema, null, 2),
    "application/schema+json; charset=utf-8",
  );
}

export const HEAD = GET;
