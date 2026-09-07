# Verification

Run `npm ci` and `npm run check` with Node.js 22.13 or later. The check typechecks the Worker, validates canonical data, generates the website and exports, and tests the external retrieval contract. CI runs this check on every pull request and main-branch push.

Data checks cover the public schema, unique IDs, valid references, required source URLs, rights boundaries, review provenance, and migrated examples. Retrieval tests cover search, filtering, pagination, record and bibliography parity, HTML and Markdown routes, read-only methods, retired routes, security headers, escaping, and downloads. Source packaging is checked against the actual working files, including new files before staging.

For visual changes, start the built server and inspect desktop and narrow mobile layouts. Verify navigation, search, filters, pagination, a source page, a workflow, a collection, keyboard focus, and download links. Check horizontal overflow, console errors, and failed requests. Keep screenshots and temporary browser scripts under ignored `outputs/` or a temporary directory.

These checks establish local content integrity and retrieval behavior. They do not reverify publishers, establish accounting correctness, run accounting agents, prove deployed behavior, or constitute a benchmark.
