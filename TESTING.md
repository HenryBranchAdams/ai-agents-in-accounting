# Verification

Run `npm ci` and `npm run check` with Node.js 22.13 or later. The check typechecks the Worker and React TSX, validates canonical data, runs `@shadcn/lint` with zero warnings and its violation probes, generates the website and exports, and tests the external retrieval contract. CI runs this check on every pull request and main-branch push.

Data checks cover the public schema, unique IDs, valid references, required source URLs, rights boundaries, review provenance, and migrated examples. Retrieval tests cover search, filtering, pagination, record and bibliography parity, HTML and Markdown routes, read-only methods, retired routes, security headers, escaping, and downloads. Source packaging is checked against the actual working files, including new files before staging.

For visual changes, start the built server and inspect desktop and narrow mobile layouts. Verify navigation, search, filters, pagination, a source page, a workflow, a collection, keyboard focus, and download links. Check horizontal overflow, console errors, and failed requests. Keep screenshots and temporary browser scripts under ignored `outputs/` or a temporary directory.

These checks establish local content integrity and retrieval behavior. They do not reverify publishers, establish accounting correctness, run accounting agents, prove deployed behavior, or constitute a benchmark.

## Design-system checks

`npm run lint:ui` checks source TS/TSX. `npm run lint` adds type/schema validation and `scripts/verify-design-lint.mjs`. The probe suite requires eleven invalid examples to fail and valid semantic-token/variant examples to pass. It covers raw colors, arbitrary values, inline styles, unknown classes, component restyling, and leakage of narrowly permitted upstream classes. See [the design system](docs/design-system.md#enforcement-and-exceptions) for exact rule boundaries. A passing lint run does not inspect CSS declarations, SVG assets or dependency runtime styles.

Presentation tests exercise all canonical record pages, document titles, structured links, escaping, the hashed navigation module, asset routing, GET/HEAD behavior, stylesheet generation, downloads and source-archive alignment. The MCP HTTP integration test needs permission to listen on loopback; an environment denial is not a passing test.

For a release, inspect real content at desktop and mobile widths. Exercise combined search/filters, clearing filters, empty results, next/previous pages with query preservation, a source record, a brief, collections, coverage tables and publication views. Check visible focus and skip-to-content. Open the mobile Sheet using the keyboard, verify focus trapping, Escape and return to the trigger, then follow a navigation link. Disable JavaScript to verify the native navigation fallback and GET search still work, and restore it afterward. Check hydration warnings, runtime errors and document overflow; wide tables must scroll within their labeled keyboard-accessible region.

After publication, verify the live pages, navigation/CSS assets, API edition and download hashes against the exact approved build. Confirm hosted CI for the pushed commit separately from local checks and deployment success. Do not edit generated downloads or archives to repair mismatches; fix source and rebuild.
