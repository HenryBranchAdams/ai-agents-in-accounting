import { ledgerBenchResultSchema } from "../../ledgerbench-data";
import { ledgerBenchSchemaResponse } from "../../ledgerbench/schema-response";

export async function GET(request: Request) {
  return ledgerBenchSchemaResponse(request, ledgerBenchResultSchema);
}

export const HEAD = GET;
