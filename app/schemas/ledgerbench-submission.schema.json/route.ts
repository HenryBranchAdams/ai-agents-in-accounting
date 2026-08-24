import { ledgerBenchSubmissionSchema } from "../../ledgerbench-data";
import { ledgerBenchSchemaResponse } from "../../ledgerbench/schema-response";

export async function GET(request: Request) {
  return ledgerBenchSchemaResponse(request, ledgerBenchSubmissionSchema);
}

export const HEAD = GET;
