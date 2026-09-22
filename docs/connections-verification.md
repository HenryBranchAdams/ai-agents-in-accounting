# Integrated exploration verification

This is a review map, not a closure or publication receipt. PR184 combines PR183 reading controls, PR182 research edition 2026-09-22.2 and PR181. The accepted earlier reading implementation from PR172 remains in its ancestry. Exact final head, main CI, artifact and deployment identities must be recorded after integration; an earlier green run cannot establish them.

## Acceptance map

| Criterion | Implementation and evidence | Remaining acceptance |
| --- | --- | --- |
| D01–D02 integration and entry | Existing answer-first pilots remain server-rendered; native Explore connections links preserve record IDs; connections search uses canonical records. Production browser journeys cover both pilots. | Final combined main and live journeys |
| D03–D04 projection and semantics | Explicit extraction allowlist; 1,533 nodes, 6,148 directed edges, 7,259 provenance items, seven diagnostics. Model/integrity tests cover actual qualification edges, owner pointers, citation normalization and synthetic hostile/missing/duplicate references. | Final index identity |
| D05–D07 graph, inspector and exploration | Deterministic positions; separate focus/selection; native List; full lazy assertions; filters, expansion ownership, collapse, history, recenter and panel resize. `connections-browser.test.mjs` exercises desktop/mobile pilots. | Latest corrected screenshots and human comprehension |
| D08–D10 omissions, state and fallback | Counts separate filters/caps; hidden material edges remain inspectable; bounded typed URLs; native List before JavaScript; stale version, missing selection, failed chunk/request and delayed response cases in `connections-recovery-browser.test.mjs`. | Latest hosted recovery run |
| D11 inclusive interaction | Keyboard List and resize, touch selection, mobile Sheet, native non-drag controls, preserved positions at responsive remount. `reading-reflow-browser.test.mjs` adds 320 CSS-pixel and reduced-motion coverage. | Human feedback; physical mobile keyboard and WebKit unavailable in this environment |
| D12–D13 delivery/security | Ordinary records do not load the graph index or renderer. Generated asset allowlist, same-origin requests, escaped React output, bounds, read-only methods and corrupt-index rejection remain tested. Renderer destroys listeners/observer/instance on unmount. | Final production assets and live headers |
| D14 performance | All default JSON neighborhoods measured, largest 64,272 bytes. Graph incremental preview approximately 167 KiB gzip. Fresh worker measurement separates cold index import from cached requests and reports process memory. Browser performance suite records real 25/80-record neighborhoods, cold/warm assets and selection through paint opportunity. | Final production measurement, target review for any miss and production runtime limits |
| D15–D16 verification and packaging | Normal full CI includes every existing test, new contracts/browser suites, lint failure probes, source reconstruction and immutable history checks. Index derives from normal build; no history mutation. | Exact final PR/main checks and authoritative release artifact |
| D17 real examples | Bank and construction pilots, actual shared NAICS citations, actual isolates when present and clearly labeled adverse network fixtures. Research qualifications remain unchanged. | Final combined journey evidence |
| D18 review packet | Architecture note, this map, reproducible tests and hosted browser artifacts retain input-bound receipts and screenshots. | Final reviewed revision and human acceptance |

Run `npm run check` for the complete verification contract. Hosted CI uses pinned Playwright Chromium against the production output because Browser is unavailable and local browser/listener startup is denied. Tests are never counted as passing merely because they are written. Receipts under the ignored `outputs/browser` directory bind screenshots to source revision, server hash, lockfile, corpus version, Node and browser. Operational outputs are excluded from source/export inputs.

## Performance reproduction

After a production build, run `node scripts/measure-reading-assets.mjs` and `node scripts/measure-connections.mjs`. These report asset closures without double-counting shared chunks, exact hashes and build identity. The latter uses filesystem-backed ASSETS in a fresh Node process and is not a measurement of hosted Worker memory or storage latency. Browser tests report loopback network conditions and hardware; synchronous layout-effect timings are distinguished from navigation-to-ready and local selection-to-paint-opportunity measurements. None establishes human-perceived quality by itself.

## Human review script

1. Open the bank-reconciliation brief, identify its answer and limitation, then inspect a finding's source and return.
2. Open its connections, select a citation and explain its meaning from the inspector. Compare the same edge in List.
3. Open the construction pilot and inspect an explicit qualification. Confirm that its scope and synthetic-case limitations remain visible.
4. Focus the shared NAICS source and find another citing record. Repeated citations must not look like independent confirmations.
5. Filter a relationship type, inspect the omission notice, restore the filter and return using Back.
6. Repeat the essential traversal in List without JavaScript. Assess whether Graph adds useful insight beyond List.
7. Use Search with an alias and a phrase, open a result, return, and remove one library filter while retaining the query.

Record real feedback and fixes. Agent review, automated checks and merge permission do not constitute this acceptance. Issue173 catalogue acceptance is also separate. The final release must include PR181 and all five issues in one successful main-CI artifact, followed by native deployment success, credential cleanup and live checks.
