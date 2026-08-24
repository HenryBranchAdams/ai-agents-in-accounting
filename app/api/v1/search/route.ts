import { corsOptionsResponse, problemResponse, publicResponse, siteOrigin } from "../../../agent-interface";
import { searchCatalog, searchRecordTypes } from "../../../search-index";

export function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() || "";
  const rawLimit = url.searchParams.get("limit") ?? "25";
  const limit = /^\d+$/.test(rawLimit) ? Number(rawLimit) : 0;
  const cursor = url.searchParams.get("cursor")?.trim() || null;
  if (!query) return problemResponse(request, 400, "Query required", "Provide a non-empty q parameter.");
  if (query.length > 200) return problemResponse(request, 400, "Query too long", "The q parameter must contain 200 characters or fewer.");
  if (limit < 1 || limit > 100) return problemResponse(request, 400, "Invalid limit", "The limit must be an integer from 1 through 100.");

  const types = url.searchParams.getAll("type").flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
  const invalidTypes = types.filter((value) => !searchRecordTypes.includes(value as (typeof searchRecordTypes)[number]));
  if (invalidTypes.length) return problemResponse(request, 400, "Invalid record type", "Use one or more published search record types.", { invalid_values: invalidTypes, allowed_values: searchRecordTypes });
  const filters = {
    query,
    types: types.length ? types : undefined,
    family: url.searchParams.get("family")?.trim() || undefined,
    authority: url.searchParams.get("authority")?.trim() || undefined,
    topic: url.searchParams.get("topic")?.trim() || undefined,
    kind: url.searchParams.get("kind")?.trim() || undefined,
  };
  const results = searchCatalog(filters);
  const cursorIndex = cursor
    ? results.findIndex((item) => `${item.record_type}:${item.id}` === cursor)
    : -1;
  if (cursor && cursorIndex === -1) return problemResponse(request, 400, "Invalid cursor", "Use the record_type:id cursor from the same filtered result set.");
  const start = cursorIndex + 1;
  const items = results.slice(start, start + limit);
  const nextCursor = start + items.length < results.length && items.length
    ? `${items.at(-1)?.record_type}:${items.at(-1)?.id}`
    : null;
  const self = new URL(`${url.pathname}${url.search}`, siteOrigin);
  const next = nextCursor ? new URL(self) : null;
  if (next && nextCursor) next.searchParams.set("cursor", nextCursor);
  return publicResponse(request, JSON.stringify({
    schema_version: "1.0",
    query,
    total_matching_records: results.length,
    returned_records: items.length,
    ranking: ["exact ID or title", "ID or title prefix", "all terms in title", "all terms in summary or keywords", "stable lexical tie-break"],
    filters: { ...filters, types: filters.types ?? null },
    cursor,
    next_cursor: nextCursor,
    links: { self: self.toString(), next: next?.toString() ?? null, documentation: `${siteOrigin}/machine-access` },
    items,
  }, null, 2), "application/json; charset=utf-8");
}

export const HEAD = GET;
