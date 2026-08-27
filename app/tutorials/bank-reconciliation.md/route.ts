import { renderBankReconciliationTutorialMarkdown } from "../../bank-reconciliation-tutorial";
import { publicResponse } from "../../agent-interface";

export async function GET(request: Request) {
  return publicResponse(request, renderBankReconciliationTutorialMarkdown(), "text/markdown; charset=utf-8", {
    headers: { "Content-Language": "en" },
  });
}

export const HEAD = GET;
