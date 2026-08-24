import { ledgerBenchEpisodeSchema } from "../../ledgerbench-data";
import { ledgerBenchSchemaResponse } from "../../ledgerbench/schema-response";

export async function GET(request: Request) {
  return ledgerBenchSchemaResponse(request, ledgerBenchEpisodeSchema);
}

export const HEAD = GET;
