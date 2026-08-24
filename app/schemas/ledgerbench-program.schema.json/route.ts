import { ledgerBenchProgramSchema } from "../../ledgerbench-data";
import { ledgerBenchSchemaResponse } from "../../ledgerbench/schema-response";

export async function GET(request: Request) {
  return ledgerBenchSchemaResponse(request, ledgerBenchProgramSchema);
}

export const HEAD = GET;
