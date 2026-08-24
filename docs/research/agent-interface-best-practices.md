# Making Accounting Agents Accessible to Software Agents

Research date: 2026-08-23  
Scope: public, read-only access to the site's curated accounting-and-AI knowledge base. Sources below are limited to specifications, standards bodies, protocol authors, and first-party crawler documentation.

## Executive recommendation

Build the machine interface as a thin, generated layer over the same records that power the human site:

1. Keep every important record available as server-rendered, semantic HTML at a permanent URL.
2. Generate compact JSON and Markdown representations from the same source of truth. Do not maintain separate hand-edited corpora.
3. Publish a small, versioned read API, an OpenAPI description, and the standardized `/.well-known/api-catalog` discovery document.
4. Publish `/robots.txt`, `/sitemap.xml`, and a concise `/llms.txt`, while recognizing that they solve different problems.
5. Attach stable identifiers, source provenance, verification dates, and explicit licensing fields to every record.
6. Treat MCP as a second-stage adapter for evaluated agent workflows, not as the site's primary data interface.

The current repository has 189 useful source records, but its public record shape does not yet include a stable ID, verification date, record update date, source license, or provenance object. Those are the highest-value data-model additions.

## Recommended public surface

| URL | Representation and purpose |
|---|---|
| `/resources/{id}` | Canonical, server-rendered HTML record page |
| `/resources/{id}.md` | Clean Markdown alternate for the same record |
| `/api/v1/resources` | JSON list, search, filtering, and cursor pagination |
| `/api/v1/resources/{id}` | JSON record by permanent ID |
| `/api/v1/taxonomy` | Controlled values and definitions |
| `/api/v1/meta` | Dataset version, generation time, counts, license, and changelog link |
| `/downloads/resources.json` | Complete machine-readable snapshot |
| `/downloads/resources.md` | Complete human/LLM-readable snapshot; a site convenience, not an `llms.txt` standard |
| `/openapi.json` | OpenAPI description of the HTTP API |
| `/.well-known/api-catalog` | Standards-based API discovery document |
| `/llms.txt` | Curated orientation and links to the most useful Markdown/API resources |
| `/sitemap.xml` | Canonical HTML URL inventory for crawlers |
| `/robots.txt` | Crawler access policy and sitemap location |

Use explicit representation URLs rather than making clients depend on content negotiation. Still advertise alternates through HTTP `Link` headers and/or HTML `<link>` elements. For example:

```http
Link: </resources/frc-ai-audit-2026.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"
```

The `alternate` and `describedby` relations are registered in the [IANA Link Relations registry](https://www.iana.org/assignments/link-relations), and HTTP Web Linking is standardized in [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288.html).

## 1. Discovery and crawlability

### `robots.txt` and sitemaps are the standards-based foundation

[RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html) standardizes the Robots Exclusion Protocol. Serve UTF-8 `text/plain` at the origin-root `/robots.txt`. Robots rules express crawler preferences; they are not authentication or a security boundary. A `Sitemap:` line is a widely supported extension rather than part of the core robots protocol.

Publish a UTF-8 XML sitemap following the [Sitemaps protocol](https://www.sitemaps.org/protocol.html). Include canonical public HTML URLs and use `<lastmod>` only when the underlying page or record materially changed. Announce it in `robots.txt` and submit it through the search engine's supported tooling. Google states that sitemap submission is a hint rather than an indexing guarantee in its [current sitemap documentation](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

Do not implement the older unauthenticated sitemap “ping” pattern. Google [deprecated its sitemap ping endpoint](https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping) in 2023, even though the general sitemaps protocol page still describes ping URLs.

### Separate search discovery from model-training policy

OpenAI's [first-party crawler documentation](https://developers.openai.com/api/docs/bots) distinguishes:

- `OAI-SearchBot` for surfacing sites in ChatGPT search;
- `GPTBot` for potential model training;
- `ChatGPT-User` for user-initiated retrieval, for which robots rules may not apply.

Anthropic likewise distinguishes `Claude-SearchBot`, `ClaudeBot`, and user-directed `Claude-User` in its [crawler documentation](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler). Allowing search/retrieval bots does not require allowing training bots. Make that an explicit publisher decision. Also ensure the CDN/WAF permits the documented crawler IP ranges; permissive robots rules cannot overcome a network block.

A suitable discoverability-first file is:

```text
User-agent: *
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

Sitemap: https://accounting-agents.madebyhenry.chatgpt.site/sitemap.xml
```

`Crawl-delay` is not part of RFC 9309. Anthropic supports it, but explicitly describes it as a non-standard extension. Prefer normal HTTP throttling and documented `429`/`Retry-After` behavior when rate control is needed.

## 2. Semantic and accessible HTML

Machine accessibility starts with accessible HTML, not a parallel “AI page.” Use real links, meaningful text, and document structure that survives without client-side JavaScript:

- one descriptive page title and H1;
- logical, non-skipped heading levels;
- `nav`, `main`, `article`, `section`, lists, and tables for their intended semantics;
- a declared document language;
- labeled form controls, visible keyboard focus, keyboard-operable filters, and text alternatives;
- source title, publisher, date, jurisdiction, access status, and citation visible in the HTML rather than available only after interaction.

These patterns are defined in the [WHATWG HTML sections specification](https://html.spec.whatwg.org/dev/sections.html), supported by the W3C WAI [Page Structure Tutorial](https://www.w3.org/WAI/tutorials/page-structure/), and required more generally by [WCAG 2.2](https://www.w3.org/TR/WCAG22/), especially Success Criterion 1.3.1 on programmatically determinable information and relationships.

Add JSON-LD as a supplement to visible content. [JSON-LD 1.1](https://www.w3.org/TR/json-ld11/) is a W3C Recommendation. A reasonable Schema.org mapping is:

- the overall collection as [`DataCatalog`](https://schema.org/DataCatalog) containing a [`Dataset`](https://schema.org/Dataset);
- JSON and Markdown exports as [`DataDownload`](https://schema.org/DataDownload) distributions;
- each indexed source as a [`CreativeWork`](https://schema.org/CreativeWork) with `identifier`, `name`, `publisher`, `datePublished`/`dateModified`, `url`, `citation`, `license`, and `isBasedOn` where applicable.

Schema.org is a shared vocabulary, not a guarantee that every agent will consume every property. Keep the HTML and API complete on their own.

## 3. `llms.txt`: useful, but an emerging convention

[`llms.txt` v2](https://llmstxt.org/) describes itself as a proposal, not an IETF or W3C standard. It is useful as a small, curated orientation file:

- place it at `/llms.txt`;
- include the required H1, a concise blockquote summary, short explanatory text, then H2 sections of Markdown links with helpful one-line notes;
- link to clean Markdown pages, the API documentation, the taxonomy, methodology, and licensing information;
- keep it short enough to fit in context; agents should fetch detailed resources only when needed;
- use `rel="alternate"; type="text/markdown"` for Markdown representations and `rel="describedby"` for the applicable `llms.txt`, as the v2 proposal recommends.

It is not a crawler policy, exhaustive URL inventory, API contract, or replacement for a sitemap. The earlier `llms-full.txt` pattern is not part of the current v2 proposal. If the site offers a full Markdown export, name and document it as a site-specific download such as `/downloads/resources.md`.

Serve Markdown with the registered media type `text/markdown; charset=UTF-8`, defined by [RFC 7763](https://www.rfc-editor.org/rfc/rfc7763.html).

## 4. JSON, Markdown, OpenAPI, and API discovery

### Read API

Keep the API public, read-only, and narrow. Recommended list parameters are `q`, `topic`, `kind`, `jurisdiction`, `updated_since`, `limit`, and `cursor`. Use deterministic ordering and cursor pagination so insertions do not cause unstable pages. A collection response should include:

```json
{
  "schema_version": "1",
  "generated_at": "2026-08-23T00:00:00Z",
  "total": 189,
  "next_cursor": null,
  "items": []
}
```

Each item should expose at least:

- permanent `id` and canonical record URL;
- source URL and canonical source URL when known;
- title, publisher/owner, source type, topic, jurisdiction, and access status;
- source issue/publication date, source-updated date, record-updated date, and `verified_at`;
- concise site-authored summary, source license and license URL, citation/provenance, and record status;
- `record_version` for material metadata changes.

Return JSON errors as `application/problem+json` following [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html).

### Contract and standardized discovery

Publish `/openapi.json` using the [OpenAPI Specification](https://spec.openapis.org/oas/v3.2.0.html). OpenAPI 3.2.0 is the current formal industry specification as of this research date, not an IETF/W3C standard. Validate the document against every intended consumer; if a target agent platform supports only an earlier OpenAPI version, produce a compatible representation rather than relying on untested features.

Also publish `/.well-known/api-catalog`. [RFC 9727](https://www.rfc-editor.org/rfc/rfc9727.html) standardizes both the `api-catalog` link relation and that well-known URI. The catalog must support `application/linkset+json` as defined by [RFC 9264](https://www.rfc-editor.org/rfc/rfc9264.html), and can point to the API, OpenAPI description, and human documentation with registered relations such as `service-desc` and `service-doc`.

Do not invent `/.well-known/openapi`. [RFC 8615](https://www.rfc-editor.org/rfc/rfc8615.html) requires well-known names to be registered; `api-catalog` is the registered mechanism for this use case.

## 5. Stable identity, versions, caching, and CORS

### Identity and change management

Follow the W3C's durable-URI guidance, [“Cool URIs don't change”](https://www.w3.org/Provider/Style/URI):

- assign each record a permanent ID that does not depend on its current title, topic, or navigation position;
- never reuse an ID;
- keep taxonomy in fields rather than encoding it into paths;
- redirect former human-facing slugs to the canonical record URL;
- publish breaking API contracts under a new major path such as `/api/v2`; make additive changes within v1;
- version the export schema separately from the content records and publish a changelog.

There is no universal REST versioning standard. The documented OpenAPI contract, stable identifiers, and tested compatibility policy are the operative guarantees.

### HTTP freshness

[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html) defines validators and conditional requests; [RFC 9111](https://www.rfc-editor.org/rfc/rfc9111.html) defines HTTP caching. Send `ETag` and `Last-Modified`, honor conditional GETs, and return `304 Not Modified` when appropriate. Reasonable initial policies are:

- query and “latest” endpoints: `Cache-Control: public, max-age=300` plus validators;
- content-addressed or versioned snapshots: `Cache-Control: public, max-age=31536000, immutable`;
- deterministic `Link: ...; rel="next"` pagination links where another page exists.

If one URL varies by `Accept`, send `Vary: Accept`; separate JSON and Markdown URLs are simpler for less capable clients.

### Browser access

The [WHATWG Fetch Standard](https://fetch.spec.whatwg.org/) defines CORS. Public, credential-free GET/HEAD endpoints and exports can return:

```http
Access-Control-Allow-Origin: *
```

Do not combine a wildcard origin with credentials. The public knowledge API should not need cookies or authorization. If origins are echoed instead, send `Vary: Origin`.

## 6. Provenance and licensing

Model the collection as a catalog, not as ownership of the linked works. [DCAT 3](https://www.w3.org/TR/vocab-dcat-3/) provides a W3C vocabulary for catalogs, datasets, distributions, identifiers, versions, issue/modified dates, media types, checksums, and licenses. [PROV-O](https://www.w3.org/TR/prov-o/) provides `Entity`, `Activity`, and `Agent` relationships such as derivation and attribution.

At minimum:

- identify the original publisher, source URL, issue/publication date, retrieval/verification date, and any transformation or editorial annotation;
- distinguish the site's compilation/annotation license from each linked source's license;
- use `unknown`, not an inferred license, when a source has no explicit grant;
- link standardized license identifiers to the [SPDX License List](https://spdx.org/licenses/) where they apply;
- state explicitly that the site's license does not relicense third-party linked works;
- publish the editorial method, inclusion criteria, correction process, and machine-readable changelog;
- if snapshots are lawfully stored, include retrieval time and a checksum.

Only publish a Creative Commons license after choosing terms the publisher is entitled to grant. The first-party [Creative Commons chooser](https://creativecommons.org/chooser/) explains the available licenses; the exact [CC BY 4.0 terms](https://creativecommons.org/licenses/by/4.0/) are authoritative if that license is selected. Avoid copying third-party full text into exports unless its license or permission permits redistribution.

## 7. When MCP is justified

MCP is an open protocol specification, not an IETF or W3C standard. The current [2026-07-28 MCP specification](https://modelcontextprotocol.io/specification/2026-07-28) uses stateless, self-contained JSON-RPC requests with per-request capability negotiation. Its [Resources specification](https://modelcontextprotocol.io/specification/2026-07-28/server/resources) supports list/read/template patterns for contextual data; its [Tools specification](https://modelcontextprotocol.io/specification/2026-07-28/server/tools) covers model-invoked functions.

For this public, mostly static corpus, HTML + Markdown + JSON + OpenAPI should come first. They are directly cacheable, inspectable, linkable, and usable without an MCP host. Add MCP only when a tested client workflow needs one or more of:

- model-controlled search and filtering across many records;
- dynamic relevance ranking or “as of” freshness checks;
- access to private/authenticated extensions of the corpus;
- a small, typed operation that cannot be expressed adequately as direct resource retrieval.

A minimal MCP adapter would expose read-only catalog and record Resources plus one constrained `search_resources` tool returning structured results. Do not create a generic HTTP proxy tool or grant mutation capabilities merely because MCP supports tools. Keep the HTTP API as the underlying source of truth.

For a new remote server, use the current [Streamable HTTP transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http). The MCP [deprecated-features registry](https://modelcontextprotocol.io/specification/2026-07-28/deprecated) says new implementations should not adopt the old HTTP+SSE transport. Earlier connection-scoped `initialize` sessions are also a backward-compatibility mode, not the current request model.

Do not publish `/.well-known/agent-card.json` unless the site actually exposes an autonomous [A2A agent](https://a2a-protocol.org/latest/specification/). A read-only knowledge catalog is not, by itself, an A2A agent.

## Status matrix: what to use and what not to overclaim

| Pattern | Status | Recommendation |
|---|---|---|
| `robots.txt` | IETF Standards Track, RFC 9309 | Implement |
| XML sitemap | Published industry protocol, widely supported | Implement |
| WCAG 2.2, semantic HTML, JSON-LD | W3C/WHATWG standards | Implement |
| HTTP validators, caching, Web Linking, CORS | IETF/WHATWG standards | Implement |
| OpenAPI 3.2.0 | Formal industry specification | Implement and test against target clients |
| `/.well-known/api-catalog` | IETF Standards Track, RFC 9727 | Implement |
| `llms.txt` v2 and page-level `.md` | Emerging proposal/convention | Implement as a complement |
| MCP 2026-07-28 | Open protocol specification | Add only after a concrete client/evaluation justifies it |
| `Crawl-delay` | Non-standard extension | Avoid as the primary throttling mechanism |
| Google sitemap ping | Deprecated by Google | Do not implement |
| `llms-full.txt` | Not in current `llms.txt` v2 proposal | Use a clearly named site-specific export instead |
| `/.well-known/openapi` | Unregistered/invented pattern | Do not use; publish the RFC 9727 API catalog |
| MCP HTTP+SSE | Deprecated MCP transport | Do not use for new work |
| A2A agent card for a static catalog | Semantically inappropriate | Do not publish unless an actual A2A agent exists |

## Suggested implementation sequence

1. Add permanent IDs, provenance, verification, licensing, and record-version fields to the canonical data model.
2. Give every record a canonical server-rendered HTML page and Markdown alternate.
3. Generate JSON/Markdown snapshots, sitemap, JSON-LD, and `llms.txt` from the same build data.
4. Add `/api/v1`, `openapi.json`, `/.well-known/api-catalog`, caching validators, CORS, and contract tests.
5. Run accessibility, link-integrity, schema, crawler/WAF, API, and representative agent-retrieval evaluations.
6. Add an MCP adapter only if those evaluations reveal a real integration gap.
