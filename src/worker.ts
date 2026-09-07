import {
  meta,
  records,
  taxonomy,
  search,
  getRecord,
  references,
  recordMarkdown,
  corpusMarkdown,
  QueryError,
} from "./corpus";
import {
  browse,
  recordPage,
  collectionsPage,
  aboutPage,
  usePage,
  errorPage,
  esc,
} from "./render";
import redirects from "../data/redirects.json";
import schema from "../schemas/record.schema.json";

// ASSETS uses Cloudflare's built-in Fetcher. Its generated binding shape is checked during package verification.
type Env = { ASSETS?: Fetcher };
const commonHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy":
    "default-src 'none'; style-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Accept, If-None-Match",
  "Access-Control-Expose-Headers":
    "ETag, X-Corpus-Version, X-Total-Count, X-Page-Count, Link",
  "X-Corpus-Version": meta.corpus_version,
  "Cache-Control": "public, max-age=300, must-revalidate",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2) + "\n", {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
const html = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
const plain = (body: string, type = "text/plain") =>
  new Response(body, { headers: { "Content-Type": `${type}; charset=utf-8` } });
const retired = [
  "/course",
  "/tutorials",
  "/atlas",
  "/bench",
  "/ledgerbench",
  "/observatory",
  "/content-contract",
];
const isRetired = (path: string) =>
  retired.some(
    (p) =>
      path === p ||
      path.startsWith(p + "/") ||
      path === p + ".md" ||
      path === "/api/v1" + p ||
      path.startsWith("/api/v1" + p + "/"),
  ) || path === "/api/v1/benchmark";
const recordJson = (record: NonNullable<ReturnType<typeof getRecord>>) => ({
  schema_version: meta.schema_version,
  corpus_version: meta.corpus_version,
  ...record,
});

function openapi() {
  const success = (schema: unknown) => ({
    description: "Successful read",
    content: { "application/json": { schema } },
  });
  const error = {
    description: "Invalid query or unknown record",
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["error"],
          properties: { error: { type: "string" } },
        },
      },
    },
  };
  const operation = (
    id: string,
    summary: string,
    response: unknown,
    parameters: unknown[] = [],
  ) => ({
    operationId: id,
    summary,
    parameters,
    responses: {
      "200": success(response),
      "400": error,
      "404": error,
      "405": { description: "Only GET, HEAD, and OPTIONS are supported" },
    },
  });
  const searchOperation = (...args: Parameters<typeof operation>) => {
    const op = operation(...args);
    return {
      ...op,
      responses: {
        ...op.responses,
        "200": {
          ...op.responses["200"],
          headers: {
            Link: {
              description: "Next page, when available",
              schema: { type: "string" },
            },
            "X-Total-Count": {
              description: "Total matching records",
              schema: { type: "integer" },
            },
            "X-Page-Count": {
              description: "Total result pages",
              schema: { type: "integer" },
            },
          },
          content: {
            ...op.responses["200"].content,
            "application/x-ndjson": { schema: { type: "string" } },
            "text/markdown": { schema: { type: "string" } },
          },
        },
      },
    };
  };
  const idParam = {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "string" },
    description: "Stable corpus record ID",
  };
  const filters = [
    "q",
    "kind",
    "topic",
    "source_type",
    "industry",
    "jurisdiction",
    "collection",
  ].map((name) => ({
    name,
    in: "query",
    schema: { type: "string" },
    description:
      name === "q"
        ? "All words must match. Maximum 240 characters."
        : "Exact value from /api/v1/taxonomy; kind also accepts context.",
  }));
  return {
    openapi: "3.1.0",
    info: {
      title: meta.title,
      version: meta.corpus_version,
      description: `${meta.mission} ${meta.rights_note}`,
    },
    servers: [{ url: meta.site_url }],
    paths: {
      "/api/v1/meta": {
        get: operation(
          "getCorpusMetadata",
          "Read corpus version, counts, scope, and rights",
          { type: "object" },
        ),
      },
      "/api/v1/taxonomy": {
        get: operation(
          "getTaxonomy",
          "Read available record kinds and filter values",
          { type: "object" },
        ),
      },
      "/api/v1/records": {
        get: searchOperation(
          "searchRecords",
          "Search and filter full records",
          {
            type: "object",
            required: [
              "records",
              "total",
              "page",
              "pages",
              "limit",
              "corpus_version",
            ],
            properties: {
              corpus_version: { type: "string" },
              query: { type: "string" },
              records: {
                type: "array",
                items: { $ref: "#/components/schemas/Record" },
              },
              total: { type: "integer" },
              page: { type: "integer" },
              pages: { type: "integer" },
              limit: { type: "integer" },
            },
          },
          [
            ...filters,
            {
              name: "page",
              in: "query",
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100000,
                default: 1,
              },
            },
            {
              name: "limit",
              in: "query",
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 20,
              },
            },
            {
              name: "format",
              in: "query",
              schema: {
                type: "string",
                enum: ["json", "jsonl", "markdown"],
                default: "json",
              },
            },
          ],
        ),
      },
      "/api/v1/records/{id}": {
        get: operation(
          "getRecord",
          "Retrieve one complete record",
          { $ref: "#/components/schemas/Record" },
          [idParam],
        ),
      },
      "/api/v1/collections/{id}": {
        get: operation(
          "getCollection",
          "Retrieve a collection with all its cited source records",
          {
            type: "object",
            properties: {
              corpus_version: { type: "string" },
              collection: { $ref: "#/components/schemas/Record" },
              records: {
                type: "array",
                items: { $ref: "#/components/schemas/Record" },
              },
            },
          },
          [idParam],
        ),
      },
      "/downloads/corpus.json": {
        get: operation(
          "downloadCorpus",
          "Download the entire corpus snapshot",
          {
            type: "object",
            properties: {
              records: {
                type: "array",
                items: { $ref: "#/components/schemas/Record" },
              },
            },
          },
        ),
      },
    },
    components: { schemas: { Record: schema } },
  };
}

async function route(request: Request, env: Env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method))
    return new Response("This corpus is read-only.\n", {
      status: 405,
      headers: {
        Allow: "GET, HEAD, OPTIONS",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  if (request.method === "OPTIONS")
    return new Response(null, {
      status: 204,
      headers: { Allow: "GET, HEAD, OPTIONS" },
    });
  if (isRetired(path))
    return path.startsWith("/api/")
      ? json(
          {
            error:
              "This experimental surface was retired. Use /api/v1/records for the research corpus.",
          },
          410,
        )
      : html(errorPage(410, "This experiment has been retired."), 410);
  const alias = (redirects as Record<string, string>)[path];
  if (alias)
    return new Response(null, { status: 308, headers: { Location: alias } });
  if (path === "/") return html(browse(url.searchParams));
  if (path === "/collections") return html(collectionsPage());
  if (path === "/about") return html(aboutPage());
  if (path === "/use") return html(usePage());
  if (path === "/api/v1/meta") return json(meta);
  if (path === "/api/v1/taxonomy") return json(taxonomy);
  if (path === "/openapi.json") return json(openapi());
  if (path === "/schemas/record.schema.json") return json(schema);
  if (
    path === "/api/v1/records" ||
    path === "/api/v1/search" ||
    path === "/api/v1/collections"
  ) {
    const params = new URLSearchParams(url.searchParams);
    if (path === "/api/v1/collections") params.set("kind", "collection");
    const found = search(params);
    const format = params.get("format") || "json";
    const next = found.page < found.pages ? new URL(request.url) : null;
    if (next) next.searchParams.set("page", String(found.page + 1));
    let response: Response;
    if (format === "markdown")
      response = plain(corpusMarkdown(found.records), "text/markdown");
    else if (format === "jsonl")
      response = plain(
        found.records.map((r) => JSON.stringify(recordJson(r))).join("\n") +
          (found.records.length ? "\n" : ""),
        "application/x-ndjson",
      );
    else if (format === "json")
      response = json({
        ...found,
        next: next ? next.pathname + next.search : null,
      });
    else throw new QueryError("format must be json, jsonl, or markdown.");
    response.headers.set("X-Total-Count", String(found.total));
    response.headers.set("X-Page-Count", String(found.pages));
    if (next)
      response.headers.set(
        "Link",
        `<${next.pathname}${next.search}>; rel="next"`,
      );
    return response;
  }
  const match = path.match(
    /^\/(api\/v1\/(records|collections)|records)\/([a-zA-Z0-9_-]+)(\.md|\.json)?$/,
  );
  if (match) {
    const r = getRecord(match[3]);
    if (!r)
      return path.startsWith("/api/")
        ? json({ error: "Record not found." }, 404)
        : html(errorPage(404, "We couldn’t find that record."), 404);
    if (match[2] === "collections")
      return r.kind === "collection"
        ? json({
            schema_version: meta.schema_version,
            corpus_version: meta.corpus_version,
            collection: r,
            records: references(r),
          })
        : json({ error: "Collection not found." }, 404);
    if (match[4] === ".md") return plain(recordMarkdown(r), "text/markdown");
    if (path.startsWith("/api/") || match[4] === ".json")
      return json(recordJson(r));
    return html(recordPage(r));
  }
  if (path === "/sitemap.xml")
    return plain(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${["/", "/collections", "/about", "/use", ...records.map((r) => `/records/${r.id}`)].map((p) => `<url><loc>${esc(meta.site_url + p)}</loc><lastmod>${meta.updated_at}</lastmod></url>`).join("")}</urlset>`,
      "application/xml",
    );
  if (path === "/robots.txt")
    return plain(
      `User-agent: *\nAllow: /\nSitemap: ${meta.site_url}/sitemap.xml\n`,
    );
  if (path === "/llms-full.txt" || path === "/llms-full.md")
    return plain(corpusMarkdown(), "text/markdown");
  if (path === "/llms.txt")
    return plain(
      `# ${meta.title}\n\n${meta.mission}\n\n${meta.coverage_note}\n\n${meta.review_note}\n\n${meta.rights_note}\n\n## Read the corpus\n\n- [Access guide](${meta.site_url}/use)\n- [All records JSON](${meta.site_url}/downloads/corpus.json)\n- [All records JSONL](${meta.site_url}/downloads/corpus.jsonl)\n- [All records Markdown](${meta.site_url}/downloads/corpus.md)\n- [Search API](${meta.site_url}/api/v1/records)\n- [Taxonomy](${meta.site_url}/api/v1/taxonomy)\n- [OpenAPI](${meta.site_url}/openapi.json)\n- [Consumer instructions](${meta.site_url}/AGENTS.md)\n- [Manifest](${meta.site_url}/downloads/manifest.json)\n`,
      "text/markdown",
    );
  if (
    env.ASSETS &&
    /^\/(downloads\/[^/]+|style\.css|favicon\.svg|AGENTS\.md)$/.test(path)
  )
    return env.ASSETS.fetch(new Request(request.url, { method: "GET" }));
  return path.startsWith("/api/")
    ? json({ error: "Route not found. See /openapi.json." }, 404)
    : html(errorPage(404, "We couldn’t find that record."), 404);
}

export default {
  async fetch(request: Request, env: Env = {}): Promise<Response> {
    let response: Response;
    try {
      response = await route(request, env);
    } catch (error) {
      if (!(error instanceof QueryError)) throw error;
      response = new URL(request.url).pathname.startsWith("/api/")
        ? json({ error: error.message }, 400)
        : html(errorPage(400, error.message), 400);
    }
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(commonHeaders))
      headers.set(key, value);
    if (response.status >= 400) headers.set("Cache-Control", "no-store");
    if (response.status === 200 && !headers.has("ETag")) {
      const digest = await crypto.subtle.digest(
        "SHA-256",
        await response.clone().arrayBuffer(),
      );
      const hash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      headers.set("ETag", `"${hash}"`);
    }
    if (
      response.status === 200 &&
      request.headers
        .get("If-None-Match")
        ?.split(",")
        .map((s) => s.trim())
        .includes(headers.get("ETag")!)
    )
      return new Response(null, { status: 304, headers });
    return new Response(request.method === "HEAD" ? null : response.body, {
      status: response.status,
      headers,
    });
  },
} satisfies ExportedHandler<Env>;
