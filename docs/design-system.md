# Public interface design system

Accounting Agents uses actual shadcn/ui registry source, the selected Slate palette, and server-rendered React. Canonical corpus data, retrieval interfaces and publisher rights are independent of the presentation system.

## Registry origin and selection

Installed with shadcn CLI 4.21.0 from the official `@shadcn` registry, `new-york` style, Radix base and Lucide icons:

- Button, Badge, Card, Input, NativeSelect
- Field and its Label dependency
- Table, Pagination, Breadcrumb
- Alert, Empty, Separator
- NavigationMenu and Sheet

`components.json` and `npx shadcn@latest info --json` describe the actual inventory. Components live in `src/components/ui/`; their MIT notice is in `LICENSES/shadcn-ui.txt`. The CLI supplies components as editable source, not an opaque shadcn runtime package. React, Radix, Lucide, `cn`, CVA and animation dependencies are locked in `package-lock.json`.

Before installation we ran `info`, registry searches, `docs`, `view`, `add --dry-run` and `add --diff`. We fetched the returned component documentation and reviewed the three custom primitives before replacing them. Generated source was inspected after installation.

We also inspected `@bundui/category-filters` through registry search and `view`. It is a shadcn-compatible registry item, but its source assumes Next.js storefront routes/images and client-side product filters. It imports Select without declaring that registry dependency and offers no benefit over native GET filters here. It was not adopted; its licensing and maintenance were not qualified for redistribution because it was rejected at the compatibility stage. No third-party registry components were installed.

## Theme contract

`public/style.css` defines the standard shadcn variables under `:root` and maps them to Tailwind v4 utilities through `@theme inline`:

- `background` / `foreground`, `card` / `card-foreground`, `popover` / `popover-foreground`
- `primary` / `primary-foreground`, `secondary` / `secondary-foreground`, `muted` / `muted-foreground`, `accent` / `accent-foreground`
- `destructive`, `border`, `input`, `ring`, `radius`
- Standard sidebar and chart tokens, reserved for future appropriate uses

Slate 50 supplies the page background, white supplies cards/popovers, Slate 900 supplies primary text/actions, Slate 100/200 supply secondary/accent surfaces, Slate 600 supplies muted text/focus rings, and Slate 300 supplies borders. Destructive red is reserved for actual errors, never authority or review status. The site deliberately has one light theme; no theme switch or dark-mode support is claimed.

Application extensions are explicit: `overlay` for the modal scrim, `destructive-foreground`, and platform `Canvas` / `CanvasText` colors for native select options. The favicon repeats Slate values because standalone SVG does not inherit the page theme.

Typography and layout are application decisions, not shadcn defaults: system sans text, Georgia editorial headings, system monospace, Tailwind's quarter-rem spacing scale, `library` (84rem) and `reading` (52rem) content widths. The radius scale derives from the standard `--radius`. Components own their built-in appearance; callers use variants/sizes and layout classes.

## Composition and delivery

- `src/render.ts` preserves stable route-facing rendering exports.
- `src/pages/` and coverage/research/publication views compose the registry primitives into public pages.
- `RecordRow`, `ReadingCard`, `CorpusMetric`, `NoResults`, `ResultsPagination`, and `corpus-fields.tsx` retain application-specific labels, rights distinctions, GET parameters, and record relationships. They do not replace the underlying UI primitives.
- `src/components/shell.tsx` renders complete crawlable HTML with React's edge-compatible server renderer. Document titles are single strings. Corpus prose is escaped TSX.
- `SiteNavigation` is the only hydrated island. `src/client/navigation.tsx` hydrates it with the same ID prefix as the server. It has no corpus data dependency. NavigationMenu receives live keyboard behavior; the mobile Sheet handles focus trapping, Escape, focus restoration, and scroll locking.
- Mobile navigation initially uses native details/links. It upgrades after hydration and remains usable if JavaScript is disabled or fails to load.
- Search, combined filters, pagination, downloads and records remain normal GET links/forms. NativeSelect and Input need no hydration. Route switches retain link semantics rather than becoming client-only tabs.
- Native headings, paragraphs, citations, definition lists, lists and details remain appropriate for recursively structured corpus prose. The small semantic CSS layer styles this document structure. It excludes component heading/paragraph slots and lists, and does not replace component controls or tables.

## Reviewed registry adaptations

The installed source remains recognizable and follows upstream composition and APIs. Local changes are limited to:

- Imports use the configured `@/lib/utils` alias, re-exporting the registry-supplied `cn` merger.
- Raw white/black and native option colors use semantic tokens. Exact Tailwind scale equivalents replace arbitrary pixel offsets, rings, and z-index values. Radix viewport dimensions use CSS variable shorthand.
- `origin-top-center`, which Tailwind rejected, is corrected to `origin-top`.
- NativeSelect uses base-size text on mobile to avoid tiny native controls; Field has `min-w-0` for responsive grids.
- Table's actual horizontal scroll container is a labeled, keyboard-focusable region.
- Navigation links explicitly expose the active data value expected by the generated style.

## Enforcement and exceptions

`npm run lint:ui` checks all source TS/TSX with `@shadcn/lint`. `npm run lint` and `npm run check` include it, type/schema checks and the in-memory negative probes. Invalid colors/tokens, arbitrary values, inline styles, unknown classes, component restyling and unreadable component classes fail as errors.

The probes verify eleven rejected cases, including Card restyling and two checks that upstream exceptions cannot leak into page code or permit arbitrary primitive spacing. Valid component variants/sizes and the specifically allowed upstream Card layout pass.

Narrow exceptions in `eslint.config.mjs`:

- Inside `src/components/ui/` only, `no-restyle` and `require-static-classes` are disabled so primitives can implement appearance, variants and forwarded props. All color, inline-style and class-validity rules remain active.
- Exact `transition-[color,box-shadow]` is allowed only in Badge, Input, NativeSelect and NavigationMenu.
- Exact upstream Card grid row/action layouts and Alert icon/text column layouts are allowed only in their respective files. There is no general arbitrary-value allowance.
- Application Button callers may set full width and vertical margins. Other consumers permit layout changes only.

The linter does not inspect CSS declarations, SVG assets or runtime styles inside dependencies. Radix emits positioning and scroll-lock styles, so the page policy permits inline styles while keeping scripts restricted to the same origin, without inline scripts or eval. Application-authored inline styles remain prohibited by lint. The trusted server-rendered navigation fragment is the only `dangerouslySetInnerHTML` boundary.

## Build and preservation

One `npm run build` compiles Tailwind, builds the content-hashed navigation asset, generates all corpus downloads and their hashes, packages the current source ZIP or deterministic multipart source export, and bundles the worker. CSS URLs have a content hash. The worker and local server serve the same navigation asset; routes remain GET/HEAD/OPTIONS only. Never patch generated downloads manually.

`npm run check` verifies every canonical record, internal links, escaping, titles, hydration-asset serving, GET behavior, exports and exact source-archive bytes. Browser inspection covers mobile/desktop layout and interactive behavior separately. Local verification does not establish deployment, professional review of corpus sources, or exhaustive assistive-technology compatibility.

References: [shadcn theming](https://ui.shadcn.com/docs/theming), [Slate palette](https://ui.shadcn.com/colors#colors), [component documentation](https://ui.shadcn.com/docs/components), [lint rules](https://github.com/shadcn-ui/lint/blob/main/docs/rules.md), [React hydration](https://react.dev/reference/react-dom/client/hydrateRoot).

## Maintaining this system

Follow [the interface contribution workflow](../CONTRIBUTING.md#interface-changes) for registry selection, documentation lookup, dry runs, diffs, composition and verification. Keep this guide synchronized with `components.json`, installed UI source, `public/style.css`, `eslint.config.mjs` and the lint probes whenever those contracts change. Read [TESTING.md](../TESTING.md) for release acceptance and [RELEASES.md](../RELEASES.md) for the distinction between source/deployment revisions and corpus versions.

Oversized generated downloads are stored as gzip assets below the host’s 25 MiB per-file limit. The source export uses the existing ZIP when it fits; otherwise it publishes a source-export manifest and deterministic raw ZIP parts, each below a 24 MiB part ceiling, with ordered sizes and SHA-256 hashes. `scripts/reconstruct-source-archive.mjs` verifies parts, the reconstructed archive, and complete ZIP membership before use. The current release gzip remains separately published and is the only source path omitted from the ZIP because the release bundle provides it. The Worker streams oversized logical downloads at their public URLs, using manifest hashes as ETags. HEAD and conditional requests avoid reading the body. Downloads and the source export still come from one build.

`src/entry.ts` is a small Worker entrypoint that loads the immutable application module on the first request. The build keeps its static module chunk beside `dist/server/index.js`; deploy the whole server directory. This avoids corpus/index initialization during the host’s startup budget. The first request in a fresh isolate still pays initialization cost; later requests reuse the module. No request-specific mutable state is stored globally.

## Answer-first reading (issue 170)

The unfiltered homepage composes an editorial preview from each pilot's canonical `editorial_brief`. `/library` is the explicit browse-all route; root URLs with query parameters retain library semantics. GET search, filter removal and pagination use `/library` and preserve the relevant query state. The logo returns to the editorial entrance.

`BriefReading` remains server-rendered. It shows question, answer, specific limitation, scope, explanation, synthetic table and responsibility boundary before evidence and administration. Native disclosures retain complete records and old anchors; the browser's fragment navigation opens an enclosing disclosure. No new client state or corpus hydration was added.

Tables retain the existing labeled focusable scroll container. Narrative responsibility cells wrap within native spans, so desktop readers can see all three columns; narrow screens scroll the region. Long source-type labels wrap inside Badge rather than clipping the page. Registry source and licenses are unchanged. Generic details start closed; source access/reuse limits stay beside source-opening and export actions. Existing source findings, construction questions and branch anchors remain available.
