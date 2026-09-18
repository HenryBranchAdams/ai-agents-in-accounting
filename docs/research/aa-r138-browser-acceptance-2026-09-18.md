# AA-R138 browser acceptance addendum

Date: 2026-09-18

Repository: `https://github.com/HenryBranchAdams/ai-agents-in-accounting`

Reviewed head: `e18b10930dd9a2a96a816875e4d147e4c2e2639c`

Reviewed tree: `7f1849ac86a8063dc0550683d3430969801840cd`

Prior receipt: `f0d8b5c`

Disposition: **Browser acceptance PASS.** The final browser gate for the original multipart `src/pages/information.tsx` surface is satisfied. No merge, closure, deployment, or publication approval is given by this receipt.

## Environment

The flow under test was: `/use` -> source-export manifest and raw-part downloads -> desktop and narrow-mobile navigation, search, filters, records, keyboard Sheet behavior, and no-JavaScript fallback.

- URL: `http://127.0.0.1:5201`, exact-head built output;
- desktop viewport: 1440 x 1000;
- narrow mobile viewport: 390 x 844 with touch emulation;
- Browser plugin: unavailable, so regular Playwright fallback was used as permitted by the frontend-testing skill;
- Playwright runtime: `/Users/henryadams/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`;
- executable: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`;
- isolated temporary browser profiles and temporary outputs under `/private/tmp/aa-r138-browser-acceptance`.

## Acceptance checks

- `/use` rendered the expected title and complete snapshot cards at desktop and mobile sizes with no horizontal document overflow;
- the desktop Skip to content link became visibly focused on the first Tab and moved focus to `#main`;
- the manifest download completed in the browser at 54,316 bytes with SHA-256 `0b1dada6ca956968234ab4c6be931f80e43c1a017d30fd77ad8760825aa8a4c4`;
- the first raw source part completed in the browser at 25,165,824 bytes with SHA-256 `fc69bf58fbd30b555de93b30ae94170f122e409e5a51a04790c8f14d18a49bb9`, matching the source manifest;
- desktop navigation reached Collections; search submitted `bank reconciliation` through the GET form; the topic filter applied `Accounting and reporting` and exposed the active-filter navigation;
- source record `src_fasb_201009`, workflow record `wf-r2r-bank-reconciliations`, and collection record `collection-foundations` rendered with visible headings;
- the mobile Sheet opened, kept all eight sampled Tab transitions inside the dialog, kept Shift+Tab inside, closed on Escape, and restored focus to the Menu trigger;
- the mobile Sheet Collections link closed the dialog and navigated to `/collections`;
- JavaScript-disabled mobile navigation remained available through the native details fallback, and the GET search returned results;
- console errors and warnings: none; page errors: none; failed requests: none; document overflow: none.

## Visual evidence

The rendered screenshots show the desktop source-export card, the narrow mobile layout, the mobile source-export card after scrolling, and the open mobile Sheet. No screenshot, trace, or temporary script was written into the repository.

- `/private/tmp/aa-r138-browser-acceptance/desktop-use.png`;
- `/private/tmp/aa-r138-browser-acceptance/mobile-use.png`;
- `/private/tmp/aa-r138-browser-acceptance/mobile-use-downloads.png`;
- `/private/tmp/aa-r138-browser-acceptance/mobile-menu-open.png`;
- `/private/tmp/aa-r138-browser-acceptance/report.json` contains the complete focused run.

The original multipart UI is unchanged in the MIME correction head. This addendum records browser validation only; no author edits were made and the settled accounting, mapping, release, portable-source, and MIME checks were not rerun.
