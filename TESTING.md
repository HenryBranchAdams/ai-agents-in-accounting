# Verification

Run `npm ci` and, after committing the intended source, `npm run check` with Node.js 22.13 or later. Use `npm run check:working` for an isolated nonpublishable capture of uncommitted work. The check typechecks the Worker and React TSX, validates canonical data, runs `@shadcn/lint` with zero warnings and its violation probes, generates the website and exports, and tests the external retrieval contract. CI runs this check on every pull request and main-branch push.

Data checks cover the public schema, unique IDs, valid references, required source URLs, rights boundaries, review provenance, and migrated examples. Retrieval tests cover search, filtering, pagination, record and bibliography parity, HTML and Markdown routes, read-only methods, retired routes, security headers, escaping, and downloads. Source packaging is checked against the actual working files, including new files before staging. The source export intentionally omits exactly `data/releases/<current-corpus-version>/corpus.json.gz`, because the release bundle publishes that current gzip separately; every prior release gzip remains included byte-for-byte. If the ZIP exceeds the host limit, deterministic raw parts remain below the 24 MiB part ceiling. Tests reconstruct the ZIP in a clean temporary directory, verify every part and archive hash, compare complete source membership, preserve release bytes, and reject missing or corrupted parts. This is an archive-size accommodation, not a loss of current corpus data.

For visual changes, start the built server and inspect desktop and narrow mobile layouts. Verify navigation, search, filters, pagination, a source page, a workflow, a collection, keyboard focus, and download links. Check horizontal overflow, console errors, and failed requests. Keep screenshots and temporary browser scripts under ignored `outputs/` or a temporary directory.

These checks establish local content integrity and retrieval behavior. They do not reverify publishers, establish accounting correctness, run accounting agents, prove deployed behavior, or constitute a benchmark.

## Design-system checks

`npm run lint:ui` checks source TS/TSX. `npm run lint` adds type/schema validation and `scripts/verify-design-lint.mjs`. The probe suite requires eleven invalid examples to fail and valid semantic-token/variant examples to pass. It covers raw colors, arbitrary values, inline styles, unknown classes, component restyling, and leakage of narrowly permitted upstream classes. See [the design system](docs/design-system.md#enforcement-and-exceptions) for exact rule boundaries. A passing lint run does not inspect CSS declarations, SVG assets or dependency runtime styles.

Presentation tests exercise all canonical record pages, document titles, structured links, escaping, the hashed navigation module, asset routing, GET/HEAD behavior, stylesheet generation, downloads and source-archive alignment. The MCP HTTP integration test needs permission to listen on loopback; an environment denial is not a passing test.

For a release, inspect real content at desktop and mobile widths. Exercise combined search/filters, clearing filters, empty results, next/previous pages with query preservation, a source record, a brief, collections, coverage tables and publication views. Check visible focus and skip-to-content. Open the mobile Sheet using the keyboard, verify focus trapping, Escape and return to the trigger, then follow a navigation link. Disable JavaScript to verify the native navigation fallback and GET search still work, and restore it afterward. Check hydration warnings, runtime errors and document overflow; wide tables must scroll within their labeled keyboard-accessible region.

After publication, verify the live pages, navigation/CSS assets, API edition and download hashes against the exact approved build. Confirm hosted CI for the pushed commit separately from local checks and deployment success. Do not edit generated downloads or archives to repair mismatches; fix source and rebuild.

Oversized generated downloads are stored as gzip assets below the host’s 25 MiB per-file limit. The source export uses a single ZIP when it fits, or a manifest and deterministic ordered raw ZIP parts otherwise. The Worker streams oversized logical downloads at their public URLs, using manifest hashes as ETags. HEAD and conditional requests avoid reading the body. Downloads and the source export still come from one build.

`src/entry.ts` is a small Worker entrypoint that loads the immutable application module on the first request. The build keeps its static module chunk beside `dist/server/index.js`; deploy the whole server directory. This avoids corpus/index initialization during the host’s startup budget. The first request in a fresh isolate still pays initialization cost; later requests reuse the module. No request-specific mutable state is stored globally.

## Editorial reading regression coverage

`tests/editorial-reading.test.mjs` covers the homepage/library split, legacy queries, combined filters and pagination state, answer/limitation ordering, complete-record fallback, canonical synthetic arithmetic, HTML/Markdown parity, optional schema validation, changed/unchanged dependency hashes, rights/provenance preservation and public read-only methods. The ordinary API/CLI/MCP and source-export suites remain required. Inspect both pilots at 1440×1000, 390×844 and 320px; confirm useful first-viewport text and scrollable tables. Follow the human review script in `docs/issue-170-implementation.md` separately from automated checks.

## CI phase and fixture commands

`npm test` builds once and runs every `tests/*.test.mjs` file. `npm run test:only`
executes that same discovery without a build, and therefore requires a current
primary build. `npm run check` remains the complete lint, build, test and release
qualification path. CI exposes these gates separately in the existing `verify`
job; a failure stops later verification gates while failure artifacts remain
available. Only superseded runs for the same PR are canceled. Every main push
uses its own concurrency key.

Archive unit tests use an isolated source root and deliberately small part/host
limits through the production archive implementation. Production defaults remain
24 MiB parts, a 25 MiB host limit, and level-nine deterministic compression. The
primary-build integration still reconstructs the actual complete source export,
checks membership and historical bytes, and rejects missing/corrupted parts.

Applied nonprofit/education tests retain disposable detached historical clones,
real application, validators, source-preservation/conflict checks, and retrieval
against the applied data. Their retrieval-only build uses the same history-summary
plugin as production, without generating unrelated website/export artifacts or
removing a historical release. The nonprofit historical lint remains required.
These fixtures cannot reuse the main agent bundle because their inputs differ.

For comparable timings, freeze the checkout and use the same machine/runtime,
lockfile and concurrency. Record separate lint, build, test-only and qualification
wall times, retain TAP test durations, and keep raw logs outside source inputs.
Do not edit a checkout while its source-preservation or archive tests are running.
See `docs/ci-performance.md` for measurement status and assertion mapping.

## Isolated previews and early verification

`npm run dev` (also `npm run preview`) checks loopback access and binds an owned
available port before building. It captures working source, builds a draft without
source archives, immutable release exports or storage generation, and serves only
a ready build. Source edits trigger a fresh capture. A failed rebuild preserves
the last good preview. The page has a draft notice; release download/history and
import endpoints are unavailable. `PORT=<number>` requests an explicit port and
fails if another process owns it. Stopping the preview terminates only its own
children. Never kill an unrelated listener or bypass a denied listener capability.

Preview captures omit historical snapshot payloads and versioned release bytes,
which the draft does not serve. Full verification always includes those inputs.
Preview caches include the relevant source digest, source revision, toolchain and build
mode and recheck generated file hashes. They cannot qualify for publication.
`outputs/previews/` contains captured inputs, receipts and failed-attempt evidence.
This directory is outside source/export inventory. A crash may leave a cache lock;
inspect its recorded PID and active preview before removing only that stale lock.

`npm run preflight` reports revision, tracked/new source, installed lockfile
versions, synchronized edition headers, writable output and loopback capability
before expensive gates. `npm run check` pins HEAD and runs the full required
phases. CI invokes the same runner one named phase at a time. Every phase verifies
source identity; tests and qualification verify the exact generated build digest.
Missing, failed or stale predecessor phases refuse continuation. Run a fresh full
check after changing inputs. A receipt is local evidence, never publishing authority.

`npm run check:working` checks capabilities first, then captures all promised source
including new files and full Git history in `outputs/candidates/`. It installs locked
dependencies independently from the local npm cache and runs lint, build and all
tests there. It deliberately omits committed-release qualification and remains
nonpublishable. If offline installation fails, populate the cache using `npm ci`
and retry a fresh capture. Draft edition preparation and finalization are separate
from this input capture; changing a capture does not revise an immutable edition.

`tests/preview.test.mjs` exercises cache corruption, revision changes, actual owned
servers, occupied ports, watched edits and failed rebuild recovery. Its socket test
requires loopback alongside the existing MCP integration test. Fixture-only tests
can diagnose logic in a restricted environment, but a complete hosted pass is required.

| Changed input | Preview invalidation | Full verification |
| --- | --- | --- |
| TSX, CSS, canonical records, current metadata | New isolated app capture/build | Entire input-bound check |
| Generator, schema, lockfile or Node | New cache identity and build | Entire input-bound check |
| Historical release/snapshot payload | Unavailable in preview; no payload read | Full inventory, history validation and export reconstruction |
| Source documentation | New source identity; conservative app rebuild | New source export and full verification |
| Screenshot/receipt under outputs | No source invalidation | No source invalidation |
