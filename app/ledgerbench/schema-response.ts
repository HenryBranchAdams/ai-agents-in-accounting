import { publicResponse } from "../agent-interface";

export function ledgerBenchSchemaResponse(request: Request, schema: object) {
  return publicResponse(
    request,
    JSON.stringify(schema, null, 2),
    "application/schema+json; charset=utf-8",
  );
}
