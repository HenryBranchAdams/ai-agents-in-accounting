import { publicResponse } from "../../agent-interface";
import { ledgerBenchSubmissionSchema } from "../../ledgerbench-data";

export async function GET(request: Request) {
  return publicResponse(
    request,
    JSON.stringify(ledgerBenchSubmissionSchema, null, 2),
    "application/schema+json; charset=utf-8",
  );
}

export const HEAD = GET;
