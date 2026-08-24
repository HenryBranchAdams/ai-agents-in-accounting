import {
  corsOptionsResponse,
  negotiatePublicFormat,
  problemResponse,
  publicResponse,
  siteOrigin,
} from "./agent-interface";
import { platformRelease } from "./platform-data";

type Identified = { id: string };

function parseLimit(value: string | null) {
  if (value === null) return 50;
  if (!/^\d+$/.test(value)) return null;
  return Number(value);
}

export function platformOptionsResponse() {
  return corsOptionsResponse();
}

export async function platformCollectionResponse<T extends Identified>({
  request,
  collection,
  allRecords,
  matches,
  renderMarkdown,
  filters,
}: {
  request: Request;
  collection: string;
  allRecords: readonly T[];
  matches: readonly T[];
  renderMarkdown: (records: readonly T[]) => string;
  filters: Record<string, string | null>;
}) {
  const url = new URL(request.url);
  const requestedFormat = url.searchParams.get("format")?.trim().toLowerCase();
  const limit = parseLimit(url.searchParams.get("limit"));
  const cursor = url.searchParams.get("cursor")?.trim() || null;

  if (requestedFormat && requestedFormat !== "json" && requestedFormat !== "markdown") {
    return problemResponse(request, 400, "Invalid format", "The format parameter must be json or markdown.");
  }
  const format = negotiatePublicFormat(request, requestedFormat);
  if (!format) {
    return problemResponse(request, 406, "Not acceptable", "Request application/json or text/markdown.");
  }
  if (limit === null || limit < 1 || limit > 200) {
    return problemResponse(request, 400, "Invalid limit", "The limit parameter must be an integer from 1 through 200.");
  }

  const cursorIndex = cursor ? matches.findIndex((record) => record.id === cursor) : -1;
  if (cursor && cursorIndex === -1) {
    return problemResponse(request, 400, "Invalid cursor", "Use the ID of a record in the current filtered set.");
  }
  const start = cursorIndex + 1;
  const items = matches.slice(start, start + limit);
  const nextCursor = start + items.length < matches.length ? items.at(-1)?.id ?? null : null;
  const self = new URL(`${url.pathname}${url.search}`, siteOrigin);
  const next = nextCursor ? new URL(self) : null;
  if (next && nextCursor) next.searchParams.set("cursor", nextCursor);

  if (format === "markdown") {
    return publicResponse(request, renderMarkdown(items), "text/markdown; charset=utf-8", {
      headers: next ? { "X-Next-Page": next.toString(), "Content-Language": "en" } : { "Content-Language": "en" },
    });
  }

  return publicResponse(request, JSON.stringify({
    schema_version: "1.0",
    release_version: platformRelease.id,
    collection,
    license: collection === "benchmark_cases" ? "CC0-1.0" : platformRelease.licenses,
    total_records: allRecords.length,
    total_catalog_records: allRecords.length,
    total_matching_records: matches.length,
    returned_records: items.length,
    limit,
    cursor,
    next_cursor: nextCursor,
    filters,
    links: {
      self: self.toString(),
      next: next?.toString() ?? null,
      documentation: `${siteOrigin}/machine-access`,
      specification: `${siteOrigin}/spec`,
      release_manifest: `${siteOrigin}/releases/current/manifest.json`,
    },
    items,
  }, null, 2), "application/json; charset=utf-8", {
    headers: next ? { "X-Next-Page": next.toString() } : undefined,
  });
}

export function platformItemResponse<T extends Identified>({
  request,
  collection,
  item,
  renderMarkdown,
}: {
  request: Request;
  collection: string;
  item: T;
  renderMarkdown: (item: T) => string;
}) {
  const url = new URL(request.url);
  const requestedFormat = url.searchParams.get("format")?.trim().toLowerCase();
  if (requestedFormat && requestedFormat !== "json" && requestedFormat !== "markdown") {
    return problemResponse(request, 400, "Invalid format", "The format parameter must be json or markdown.");
  }
  const format = negotiatePublicFormat(request, requestedFormat);
  if (!format) return problemResponse(request, 406, "Not acceptable", "Request application/json or text/markdown.");
  if (format === "markdown") {
    return publicResponse(request, renderMarkdown(item), "text/markdown; charset=utf-8", {
      headers: { "Content-Language": "en" },
    });
  }
  return publicResponse(request, JSON.stringify({
    schema_version: "1.0",
    release_version: platformRelease.id,
    collection,
    item,
  }, null, 2), "application/json; charset=utf-8");
}
