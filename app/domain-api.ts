import {
  apiVersion,
  corsOptionsResponse,
  negotiatePublicFormat,
  problemResponse,
  publicResponse,
  siteOrigin,
} from "./agent-interface";
import { corpusReviewedAt, corpusVersion } from "./domain-model";
import { domainRightsNotice, normalizeDomainRecord } from "./domain-interface";

type IdentifiedRecord = { id: string };

function parseInteger(value: string | null, fallback: number) {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;
  return Number(value);
}

export function domainOptionsResponse() {
  return corsOptionsResponse();
}

export async function domainCollectionResponse<T extends IdentifiedRecord>({
  request,
  allRecords,
  matches,
  renderMarkdown,
  collection,
  filters,
  markdownPath,
}: {
  request: Request;
  allRecords: T[];
  matches: T[];
  renderMarkdown: (records: T[]) => string;
  collection: string;
  filters: Record<string, string | null>;
  markdownPath: string;
}) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() || undefined;
  const requestedFormat = url.searchParams.get("format")?.trim().toLowerCase();
  const limit = parseInteger(url.searchParams.get("limit"), 50);
  const cursor = url.searchParams.get("cursor")?.trim() || undefined;

  if (query && query.length > 200) {
    return problemResponse(request, 400, "Query too long", "The q parameter must contain 200 characters or fewer.");
  }
  if (requestedFormat && requestedFormat !== "json" && requestedFormat !== "markdown") {
    return problemResponse(request, 400, "Invalid format", "The format parameter must be json or markdown.", {
      allowed_values: ["json", "markdown"],
    });
  }
  const format = negotiatePublicFormat(request, requestedFormat);
  if (!format) {
    return problemResponse(request, 406, "Not acceptable", "Request application/json or text/markdown.", {
      available_types: ["application/json", "text/markdown"],
    });
  }
  if (limit === null || limit < 1 || limit > 200) {
    return problemResponse(request, 400, "Invalid limit", "The limit parameter must be an integer from 1 through 200.");
  }

  const cursorIndex = cursor ? matches.findIndex((record) => record.id === cursor) : -1;
  if (cursor && cursorIndex === -1) {
    return problemResponse(
      request,
      400,
      "Invalid cursor",
      "The cursor must be the ID of a record in the current filtered result set.",
    );
  }

  const start = cursorIndex + 1;
  const items = matches.slice(start, start + limit);
  const nextCursor = start + items.length < matches.length ? items.at(-1)?.id ?? null : null;
  const canonicalRequest = new URL(`${url.pathname}${url.search}`, siteOrigin);
  const nextUrl = nextCursor ? new URL(canonicalRequest) : null;
  if (nextUrl && nextCursor) nextUrl.searchParams.set("cursor", nextCursor);

  if (format === "markdown") {
    return publicResponse(request, renderMarkdown(items), "text/markdown; charset=utf-8", {
      headers: {
        "Content-Language": "en",
        ...(nextUrl ? { "X-Next-Page": nextUrl.toString() } : {}),
      },
    });
  }

  const body = JSON.stringify({
    schema_version: apiVersion,
    corpus_version: corpusVersion,
    corpus_reviewed_at: corpusReviewedAt,
    collection,
    rights_notice: domainRightsNotice,
    total_catalog_records: allRecords.length,
    total_matching_records: matches.length,
    returned_records: items.length,
    limit,
    cursor: cursor ?? null,
    next_cursor: nextCursor,
    filters,
    links: {
      self: canonicalRequest.toString(),
      next: nextUrl?.toString() ?? null,
      documentation: `${siteOrigin}/machine-access`,
      openapi: `${siteOrigin}/openapi.json`,
      markdown_snapshot: `${siteOrigin}${markdownPath}`,
    },
    items: items.map((item) => normalizeDomainRecord(item, collection)),
  }, null, 2);

  return publicResponse(request, body, "application/json; charset=utf-8", {
    headers: nextUrl ? { "X-Next-Page": nextUrl.toString() } : undefined,
  });
}

export function domainItemResponse<T extends IdentifiedRecord>({
  request,
  item,
  collection,
  renderMarkdown,
}: {
  request: Request;
  item: T;
  collection: string;
  renderMarkdown: (records: T[]) => string;
}) {
  const url = new URL(request.url);
  const requestedFormat = url.searchParams.get("format")?.trim().toLowerCase();

  if (requestedFormat && requestedFormat !== "json" && requestedFormat !== "markdown") {
    return problemResponse(request, 400, "Invalid format", "The format parameter must be json or markdown.", {
      allowed_values: ["json", "markdown"],
    });
  }
  const format = negotiatePublicFormat(request, requestedFormat);
  if (!format) {
    return problemResponse(request, 406, "Not acceptable", "Request application/json or text/markdown.", {
      available_types: ["application/json", "text/markdown"],
    });
  }
  if (format === "markdown") {
    return publicResponse(request, renderMarkdown([item]), "text/markdown; charset=utf-8", {
      headers: { "Content-Language": "en" },
    });
  }

  return publicResponse(
    request,
    JSON.stringify({
      schema_version: apiVersion,
      corpus_version: corpusVersion,
      collection,
      item: normalizeDomainRecord(item, collection),
    }, null, 2),
    "application/json; charset=utf-8",
  );
}
