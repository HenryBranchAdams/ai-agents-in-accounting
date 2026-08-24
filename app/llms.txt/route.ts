import { buildLlmsText, publicResponse } from "../agent-interface";

export async function GET(request: Request) {
  return publicResponse(request, buildLlmsText(), "text/plain; charset=utf-8", {
    headers: { "Content-Language": "en" },
  });
}

export const HEAD = GET;
