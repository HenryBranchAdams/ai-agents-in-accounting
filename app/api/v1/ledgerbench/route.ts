import { corsOptionsResponse, publicResponse } from "../../../agent-interface";
import { ledgerBenchApiRecord } from "../../../ledgerbench-data";

export function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: Request) {
  return publicResponse(
    request,
    JSON.stringify(ledgerBenchApiRecord, null, 2),
    "application/json; charset=utf-8",
  );
}

export const HEAD = GET;
