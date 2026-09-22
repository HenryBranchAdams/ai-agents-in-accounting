# Reading interface integration

Issue #175 is being integrated against the nine research packages from #173 and the answer-first reading changes from PR #181. Graph mounting and exploration remain owned by #171.

## Compact search contract

`GET /api/v1/search-suggestions?q=...` projects the canonical whole-corpus search into at most 12 results, preserving its order, aliases and quoted-phrase behavior. Only one `q` parameter is accepted, with the existing 240-character limit. Empty input returns no records. The response carries `corpus_version`, normalized `query`, true `total`, and `items` containing only `id`, `kind`, `title`, `summary`, `has_brief`, and the canonical `href`.

Summaries are canonical text shortened to at most 280 characters. The brief flag identifies an actual edited reading brief, rather than all guides. This endpoint does not inherit library filters. Use `/library?q=...` for all matches and the existing full-record API for complete records. ETag, conditional reads, HEAD, OPTIONS and rejected writes use the existing worker contract. Invalid parameters and malformed queries return readable 400 errors with no-store caching. OpenAPI documents the projection.

The browser contract lives separately from server retrieval so client code cannot accidentally import the corpus. Client implementation must reject an edition mismatch, preserve server order, cancel superseded requests and retain native navigation if enhancement fails.

## Browser entry identity

The build selects navigation by esbuild's exact `entryPoint` metadata. Shared or lazy chunks may appear first in the output map; output order cannot identify a page entry. Missing, duplicate and out-of-directory entries fail the build. Regression tests reorder outputs and exercise those failures before additional islands are introduced.

## Verification status

PR183 head `3f6d17bdbf2cf0720a155a63f1bdfca7ff40d1a5` passed hosted CI run35687892060 at merge-test revision `f8c903d40a4a5e30415696da42f89f499be3047d`. Browser artifact10677311828 and verification artifact10677416649 retain the production-built evidence. Graph integration is in PR184; the final combined revision, human acceptance and publication remain pending. See `docs/connections-verification.md` for the combined acceptance map.

## Palette implementation

The palette is loaded on deliberate Search/Cmd+K/Ctrl+K intent. Native modifier-click follows the real Search or result anchor. Existing dialogs and editable fields prevent shortcut interception. Requests debounce for 180ms, abort on replacement or closure, and ignore late responses. Escape also cancels a pending lazy-module intent; its later completion cannot reopen the dialog or redirect the reader. A newer dialog prevents a delayed search opening. Empty input shows real destinations without requesting records. Results retain canonical order through `shouldFilter={false}`. Invalid-query, zero-result, network-failure and edition-mismatch states are distinct; the full library remains the recovery route.

A production-browser suite now covers desktop/mobile opening, canonical result order, aliases, quoted phrases, keyboard activation, Escape/focus restoration, Back, native no-JavaScript Search, and injected network/edition failures. The PR183 hosted run passed these journeys using Playwright Chromium. Browser is unavailable and local browser/listener startup is denied. This evidence does not establish human usability or WebKit behavior.

A local esbuild preview measurement with the installed Node/lockfile compared the previous navigation asset (104,682 gzip bytes) with the palette implementation: navigation plus its shared eager chunk totals 105,922 gzip bytes, an increase of 1,240 bytes; the lazy palette adds 7,139 gzip bytes. The full final interface and production corpus need renewed measurement. No graph code or corpus index is bundled into these client assets.

## Finding previews and section navigation

The server's pure `buildEvidencePreview` adapter resolves only explicit finding source IDs, preserving order, qualification and finding-level locator scope. It sends displayed metadata, current review/access fields, rights and source limitations to a separate browser-safe contract. Source summaries and source-review locators are labeled separately from a finding-specific support reason. Invalid original URLs are not linked; missing records and unknown permissions remain explicit. Canonical links and qualifications stay server-rendered. One small page controller renders button/Popover portals into empty enhancement slots, with one preview open at a time. No publisher requests or remote preview assets are made.

`recordSectionLinks` supplies both native outlines from actual conditional sections. Edited briefs include explanation, exception and suggested-reading anchors; construction links only describe available fields. The mobile disclosure follows the answer and limitation, or the introduction on ordinary pages. The desktop rail puts administrative links in a secondary native disclosure. IntersectionObserver limits the visible target set, ResizeObserver handles changed content geometry, and scroll updates only `aria-current`; no history replacement occurs. Hash navigation opens enclosing native details only when needed. Reinitialization and page-hide cleanup disconnect observers and listeners.

Four new local tests pass against built preview output for malformed metadata/URLs, source order and scope, source/brief/collection/construction anchor integrity, unique IDs and exact finding payloads with native fallback links. Added browser journeys cover real keyboard/touch popovers, source return paths, no-JavaScript evidence, fragments, Back/Forward and resize; the PR183 hosted run passed these journeys.

## Filter clarity and hosted delivery correction

Active chips name their field and value. A compact native disclosure contains the complete existing type/facet controls; selected restrictions, the query, clear action and total/page counts remain beside the results. Global type counts are explicitly labeled as unfiltered. Changing a type preserves collection and other restrictions, removing one chip resets only pagination and that field, and clearing filters keeps the query/page-size setting. Selected values absent from a facet list remain available in the form so a native submission does not silently discard them.

The build derives an exact asset allowlist from esbuild outputs, serving shared and lazy chunks without opening arbitrary asset paths. Regression tests read every emitted JavaScript asset through the actual built worker, compare bytes, check HEAD and reject unbuilt/internal paths. This corrected a real failure found in the first hosted run; failed receipts are retained in operational evidence.

## Combined loading measurement

The integrated preview measured navigation at118,932 gzip bytes and the outline at832 incremental bytes. Together they add15,082 bytes over the recorded104,682-byte navigation baseline, within the15KiB bootstrap/outline target. Evidence preview adds1,747 bytes beyond navigation, and search adds7,213 bytes beyond navigation. These increments are not additive estimates of every scenario: `scripts/measure-reading-assets.mjs` reports each complete deduplicated closure, shared files and hashes. Ordinary reading contains no graph renderer or graph index. Final production output must renew this measurement; preview sizes do not establish transfer latency.

`reading-reflow-browser.test.mjs` adds320 CSS-pixel reflow, reduced motion, ordinary source/collection active outlines, focus trapping and a reduced-height palette. A reduced viewport models available layout space; it does not claim a physical mobile keyboard or browser zoom was tested. The final receipt must report actual execution. Search requests remain absent before intent; network/debounce time is separate from already-loaded control response.
