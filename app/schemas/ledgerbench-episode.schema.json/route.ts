import { publicResponse } from "../../agent-interface";
import { ledgerBenchEpisodeSchema } from "../../ledgerbench-data";

export async function GET(request: Request) {
  return publicResponse(
    request,
    JSON.stringify(ledgerBenchEpisodeSchema, null, 2),
    "application/schema+json; charset=utf-8",
  );
}

export const HEAD = GET;
