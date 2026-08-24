import { publicResponse } from "../agent-interface";
import { renderLedgerBenchMarkdown } from "../ledgerbench-data";

export async function GET(request: Request) {
  return publicResponse(request, renderLedgerBenchMarkdown(), "text/markdown; charset=utf-8", {
    headers: { "Content-Language": "en" },
  });
}

export const HEAD = GET;
