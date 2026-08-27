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
| Educational tutorials | Start here definition, pattern comparison, evidence-to-decision chain, clean-room synthetic exception, knowledge check, completion boundary, role paths, and human/Markdown/JSON parity. |
| Authority reference | Action-level decision tree, A3/A4/human-only distinctions, mixed-level synthetic workflow, common misclassifications, segregation-of-duties comparisons, sensitive-action links, and human/Markdown/JSON parity. |
| Reviewer field guide | Ordered evidence challenge, four dispositions, minimum packet, automation-bias traps, synthetic good/failure/conflict examples, cross-domain calibration, visible review states, and human/Markdown/JSON parity. |
| Workflow brief pilot | Bank-reconciliation fit, prerequisites, authority, top check and failure, artifact, synthetic stop example, source applicability, related material, and human/Markdown/JSON/OpenAPI parity. |
| Authoritative source core | Six high-use authority profiles, current or amended status, future effective dates, jurisdiction and transfer limits, stable claim and relationship IDs, source links, and human/Markdown/JSON/search parity. |
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
