import {
  agentResources,
  allowedIndustries,
  allowedKinds,
  allowedTimeRoles,
  allowedTopics,
  apiVersion,
  catalogReviewedAt,
  catalogVersion,
  corsOptionsResponse,
  negotiatePublicFormat,
  problemResponse,
  publicResponse,
  renderResourcesMarkdown,
  rightsNotice,
  searchAgentResources,
  siteOrigin,
} from "../../../agent-interface";

function parseInteger(value: string | null, fallback: number) {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;
  return Number(value);
}

export function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() || undefined;
  const topic = url.searchParams.get("topic")?.trim() || undefined;
  const kind = url.searchParams.get("kind")?.trim() || undefined;
  const industry = url.searchParams.get("industry")?.trim() || undefined;
  const timeRole = url.searchParams.get("time_role")?.trim() || undefined;
  const requestedFormat = url.searchParams.get("format")?.trim().toLowerCase();
  const limit = parseInteger(url.searchParams.get("limit"), 50);
  const cursor = url.searchParams.get("cursor")?.trim() || undefined;

  if (query && query.length > 200) {
    return problemResponse(request, 400, "Query too long", "The q parameter must contain 200 characters or fewer.");
  }

  if (topic && !allowedTopics.includes(topic as (typeof allowedTopics)[number])) {
    return problemResponse(request, 400, "Invalid topic", "Use one of the published topic values.", {
      allowed_values: allowedTopics,
    });
  }

  if (kind && !allowedKinds.includes(kind as (typeof allowedKinds)[number])) {
    return problemResponse(request, 400, "Invalid source type", "Use one of the published kind values.", {
      allowed_values: allowedKinds,
    });
  }

  if (industry && !allowedIndustries.includes(industry as (typeof allowedIndustries)[number])) {
    return problemResponse(request, 400, "Invalid industry", "Use one of the published industry values.", {
      allowed_values: allowedIndustries,
    });
  }

  if (timeRole && !allowedTimeRoles.includes(timeRole as (typeof allowedTimeRoles)[number])) {
    return problemResponse(request, 400, "Invalid time role", "Use one of the published time_role values.", {
      allowed_values: allowedTimeRoles,
    });
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

  const matches = searchAgentResources({ query, topic, kind, industry, timeRole });
  const cursorIndex = cursor
    ? matches.findIndex((resource) => resource.id === cursor)
    : -1;

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
  const canonicalRequest = new URL(`${url.pathname}${url.search}`, siteOrigin);
  const nextCursor = start + items.length < matches.length
    ? items.at(-1)?.id ?? null
    : null;
  const nextUrl = nextCursor ? new URL(canonicalRequest) : null;

  if (nextUrl && nextCursor) nextUrl.searchParams.set("cursor", nextCursor);

  if (format === "markdown") {
    const body = renderResourcesMarkdown(items, {
      summary: `${items.length} returned records from ${matches.length} matches in a ${agentResources.length}-source catalog. Limit ${limit}; reviewed ${catalogReviewedAt}.`,
    });

    return publicResponse(request, body, "text/markdown; charset=utf-8", {
      headers: {
        "Content-Language": "en",
        ...(nextUrl ? { "X-Next-Page": nextUrl.toString() } : {}),
      },
    });
  }

  const body = JSON.stringify({
    schema_version: apiVersion,
    catalog_version: catalogVersion,
    catalog_reviewed_at: catalogReviewedAt,
    rights_notice: rightsNotice,
    total_catalog_records: agentResources.length,
    total_matching_records: matches.length,
    returned_records: items.length,
    limit,
    cursor: cursor ?? null,
    next_cursor: nextCursor,
    filters: {
      q: query ?? null,
      topic: topic ?? null,
      kind: kind ?? null,
      industry: industry ?? null,
      time_role: timeRole ?? null,
    },
    links: {
      self: canonicalRequest.toString(),
      next: nextUrl?.toString() ?? null,
      documentation: `${siteOrigin}/machine-access`,
      openapi: `${siteOrigin}/openapi.json`,
      taxonomy: `${siteOrigin}/api/v1/taxonomy`,
      metadata: `${siteOrigin}/api/v1/meta`,
      markdown_catalog: `${siteOrigin}/resources.md`,
    },
    items,
  }, null, 2);

  return publicResponse(request, body, "application/json; charset=utf-8", {
    headers: nextUrl ? { "X-Next-Page": nextUrl.toString() } : undefined,
  });
}

export const HEAD = GET;
