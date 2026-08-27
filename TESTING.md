# Testing

The test suite treats the built Worker as the public product. It sends requests through the same `fetch` interface used in production and checks both human-facing and agent-facing surfaces.

## Coverage matrix

| Surface | Coverage |
| --- | --- |
| Canonical pages | Every sitemap URL returns semantic HTML with one heading, a main landmark, a title, and no framework error output. |
| Navigation | Internal links from primary documentation pages resolve; fragment targets exist on the destination page. |
| Media | Every local image referenced by a canonical page exists in the published asset tree and has alternative text. |
| Accessibility | Language, skip link, landmarks, heading structure, table captions, search labels, keyboard shortcuts, and editorial-image alternatives. |
| Mobile layout | Phone viewport metadata, mobile-navigation parity, active-page state, touch-target sizing, safe-area spacing, dynamic viewport units, responsive search, and overflow containment. |
| Public API | GET, HEAD, OPTIONS, CORS, content negotiation, pagination, filters, cache validators, and problem-detail errors. |
| Machine access | OpenAPI, API catalog, `llms.txt`, `AGENTS.md`, Markdown, JSON snapshots, feeds, schemas, and release manifests. |
| Corpus integrity | Unique identifiers and valid references across workflows, sources, controls, templates, packs, benchmark cases, reading-room shelves, and ecosystem layers. |
| Content quality | Required metadata, valid HTTPS source URLs, rights boundaries, source provenance, and prohibited placeholder or promotional language. |
| Accounting safety | Benchmark hard gates, empty executed-action sets, approval boundaries, evidence links, and deterministic calculations. |

## Commands

```sh
# Complete release gate: production build plus every test
npm test

# Existing rendered/API contract suite against an already-built Worker
npm run test:contracts

# Site-wide crawl and integrity suite against an already-built Worker
npm run test:quality

# Mobile semantics and compiled responsive-style contracts
npm run test:mobile

# Static analysis and generated-platform validation
npm run lint
npm run validate:platform

# Deterministic accounting-agent benchmark
npm run benchmark:sample
```

The production build uses a Node-based deadline runner on macOS and Linux. Override its defaults with `SITES_BUILD_TIMEOUT` and `SITES_BUILD_KILL_AFTER` using duration values such as `90s` or `3m`.

Run `npm run generate:platform` before the release gate when canonical pack, benchmark, or release data changes.
