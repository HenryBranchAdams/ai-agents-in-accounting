# Connections implementation and acceptance

## Integration base and ownership

Implementation starts from reading branch revision 2cf7f4ef781097b37f472f976b4e54bccfd322d4, including research edition 2026-09-22.2 and PR181. PR172 is merged at e1e4d1719b5efc6858ffc1a29bd9d9aa5cb8dba2; live issue170 is closed. This work does not claim or alter that separate acceptance. The live issue171 body was compared with the captured specification: only the local `COMMENTS` separator differs, with no new GitHub comments or material scope update.

Astra owns the shared schema/projection, corpus edition and release decisions. Graph work is isolated from the reading revision undergoing CI. No corpus records or historical editions are changed by this projection.

## Canonical projection

One node represents each canonical record, including isolates and duplicate-title records. Stable edge identity uses only the original directed endpoint IDs and canonical type. Canonical citations are projected once from their owner, never from an inverse `cited_by` view. Parallel relationship types, mutual references and self-references remain explicit. Multiple distinct assertion/locator items share one connector without losing their reasons or qualifications.

The extraction allowlist is:

| Field | Meaning |
| --- | --- |
| `/source_ids` | Citation, not support or permission |
| `/related_ids` | Recorded navigational reference |
| `/data/workflow_ids`, `/data/relationship_profile/workflow_ids` | Legacy navigational references |
| `/supersedes`, `/data/supersedes`, `/data/relationship_profile/supersedes` | Explicit supersession under recorded scope |
| `/data/editorial_brief/findings/*/source_ids`, `/data/editorial_brief/disagreements/*/source_ids` | Finding citation retaining its claim, qualification and finding-level locator |
| `/data/editorial_brief/reading_order`, `/data/editorial_brief/reading_notes/*/record_id` | Suggested reading; the latter retains its recorded reason |
| `/data/editorial_brief/reading/example/record_id`, `/data/worked_record_id` | Worked reference, not observed effectiveness |
| `data/relationships.json#/edges/*` | Exact editorial type, direction and reason |

No arbitrary prose, URL or metadata co-occurrence is mined for connections. Owner/JSON-Pointer tuples are retained for each structured reference. Explicit annotation source-ID and pointer arrays are preserved; each pointer is resolved against its declared possible owners. Only a unique resolving owner receives a tuple. Ambiguous or unresolved ownership remains diagnosed with the original annotation's file location. A finding-level locator is labeled as such, never automatically promoted to a publisher passage for each cited source.

Missing canonical-reference endpoints are excluded with diagnostics. Malformed explicit annotations and absent explicit endpoints fail projection. Existing unresolved locators retain the assertion and its limitation. A projection/index digest binds normalized record revisions, provenance, diagnostic state, schema and corpus edition; edge IDs do not depend on reason text, layout or timestamps.

## Initial real-corpus evidence

The 1,533-record corpus projects to 6,148 canonical directed edges and 7,259 provenance/assertion items, with no self-reference edges and seven locator/reference diagnostics. The complete internal projection is approximately 6.9 MB uncompressed and must not be sent wholesale to browsers. Highest observed incident degrees are 224 for the family-office collection and NAICS manual source, followed by 169 for the US GAAP authority source. These are navigation counts, not quality scores.

Unit tests cover direction, parallel types, cycles, self-references, isolates, repeated references, ambiguous owners, missing endpoints, literal selector-like IDs, structured finding limitations and stable record-order normalization. Real-corpus tests retain the five issue173 qualification edges and their guide-owned pointers. Typecheck, validation and design lint pass. Bounded retrieval, shared URL state, Graph/List rendering, layout and browser/human acceptance remain to be implemented and measured.

## Portable bounded state

The typed URL parser rejects unknown/repeated parameters, unsupported types and kinds, malformed selections, control characters, excess URL length and oversized or duplicate expansions before corpus resolution. Explicit empty filters remain empty. Expansion tuples encode literal IDs safely and preserve action order; filter lists serialize in stable order. Corpus/index mismatches stop retrieval rather than mixing editions.

A snapshot owns incoming/outgoing adjacency maps. Each request visits only the focus and accepted expansion roots. The initial node budget defaults to 25; each recorded expansion step adds 10, capped at 80 nodes and 160 edges. Material contradiction, qualification and supersession edges sort before ordinary citations. This is a presentation order, not an evidence quality ranking. Selection does not change visible graph inputs. Collapse recomputes ownership from remaining roots, retaining shared neighbors. Filter and budget omission counts partition considered canonical edges; assertion counts remain separate. Hidden material relationships retain identifiers for direct inspection.

Five additional tests exercise portable state, malformed queries, high-degree cap behavior, direction, empty filters, overlapping expansions/collapse, cycles, isolates, unchanged selection inputs, stale snapshots and independently capped dense edge sets. These are synthetic software fixtures, not accounting evidence. Local typecheck, full data validation and all eleven design-lint failure probes pass. SSR List, generated-index delivery, Graph rendering and final browser/performance acceptance remain pending.

## Generated delivery and native List

The build emits a separate compressed immutable connection snapshot and its byte length, SHA-256 and projection identity. It is outside ordinary runtime-data initialization. The server loads it only for focused connection requests, verifies the uncompressed bytes and identity, then retains only the immutable index. Failed initialization remains retryable and returns 503. Missing assets, invalid gzip, short data and same-size corruption are tested. No request, environment, credential or in-flight promise is shared.

`/connections` offers canonical search and the two accepted pilot starting points. Focused pages render their complete visible List and native GET actions before JavaScript. Selection, refocus, expansion, branch collapse, undo, filters and reset have shareable URLs. `/api/v1/connections` exposes the same selection. Full assertions have an explicit `/api/v1/connections/edge` endpoint and a server-rendered `/connections/edge` inspection page, including material relationships hidden by filters. Evidence requests bind to the current index; stale requests return 409. Unknown records/edges, malformed state, HEAD, ETags and read-only methods are tested.

The first all-corpus payload measurement found the NAICS manual default neighborhood at 227,372 bytes with inline full provenance. Delivery now separates overview edge identity/direction/counts from lazy exact evidence. All 1,533 default neighborhoods are checked against 150KiB without discarding any assertion. The largest current overview is 64,272 bytes for the Xero completeness guide. These are actual response serialization sizes on edition 2026-09-22.2, not transfer timing or browser layout measurements. The generated index remains 6,861,641 bytes internally; its server loading and memory cost still require final measurement. Graph JavaScript, desktop/mobile visual rendering and human acceptance remain pending.

Preview-built route tests confirm ordinary reading and unfocused connection search never fetch graph data. Focused Graph mode currently retains its usable List fallback while the renderer is implemented. The native record action adds no graph preload. Full production checks, source-export reconstruction and hosted browser checks must be renewed after the final renderer integration.

## Visual renderer candidate

The renderer uses pinned Cytoscape 3.34.3 with deterministic occupied ring slots and separate internal node/edge namespaces. Literal ID lookup avoids selector interpolation. Existing coordinates survive selection, expansion, branch restoration and responsive remount; a deliberate refocus starts a new centered arrangement. Recenter, readable-limit Fit and panel-width reset are separate actions. Canvas shapes, explicit kind labels, relationship labels and arrowheads supplement color. Size does not encode degree, evidence strength or authority.

The same bounded explorer component renders the initial HTML and client Graph/List surface. Graph mode alone initializes it. State changes use canonical URLs with Back/Forward support, same-origin read-only requests and abortable response handling. Selection of loaded data does not fetch another neighborhood or run layout. Exact edge evidence is fetched separately and checked against corpus/index identity. Malformed/foreign responses retain the last valid view. Desktop uses the inspected shadcn Resizable v4 API with explicit units; mobile uses the existing Sheet, retaining selection when closed. Native List fallback remains complete without JavaScript.

Candidate preview output measures 166,434 gzip bytes of graph-specific JavaScript beyond the static navigation closure, below the 300KiB target. The navigation static closure is 118,931 gzip bytes and contains no connection or Cytoscape modules. This is a pre-final preview measurement, not final production timing or live evidence. Hosted Graph browser tests have been added for real canvas selection, keyboard List inspection, exact evidence retrieval, expansion/collapse, history, responsive resizing and copied URLs, plus desktop/mobile no-JavaScript paths. Their first exact-revision production run is pending. Required stress/performance measurements and genuine human comprehension acceptance remain outstanding.

## Review follow-up and measurement scope

A full initial-HTML measurement found that repeated default filter values in native links displaced bytes into the server-rendered page. Canonical links now omit documented defaults while retaining explicit non-default filters, empty filters, expansion order, selection and edition/index identity. The first all-record pass after that change measured every 1,533 initial Graph pages below 150KiB; the largest was 150,730 bytes before the subsequent focus-inspector recovery improvement. The later Xero page measured 153,382 bytes. Final production measurement must be renewed; JSON overview and HTML are reported separately.

`scripts/measure-connections.mjs` records build metadata, lockfile/server hashes, graph index, static/lazy chunk sizes, actual asset reads, response sizes and process memory for a fresh local worker. It distinguishes the first index read/decompression/hash from cached requests and excludes network/storage latency and browser rendering. One preview run measured about 48ms for the cold graph request and 1.6ms for cached requests. The cold graph request increased Node RSS by about 39MB and heap usage by about 26MB before collection; these are local process observations, not a claim about production Worker memory headroom. Final hosted and live evidence remain required.

Review also added incident-edge highlighting, focus details after clearing selection, explicit zoom and button-based pan controls, native fragment navigation, and intentional current-edition reload links for stale state. Repeated IDs in one canonical reference array now contribute one provenance item with all original locators, rather than multiple apparent assertions. The current real-corpus projection remains unchanged. Index decompression now stops at the declared byte bound before hashing; an oversized compressed object is rejected in tests.

## First hosted renderer evidence and visual findings

CI run 35689631801 passed for PR head eaab1f6be238ef3e98eb65e55a2e307cd22c96f2, tested merge 6459e11dccc13081d33deb8ca17b3ce69e3a2a53. Browser artifact 10678393462 contains the actual production-built desktop/mobile Graph, inspector and no-JavaScript journeys. Its receipt records Chromium 153.0.8010.12, Node 22.23.2, the lockfile/server hashes and edition 2026-09-22.2. Browser was unavailable in this session; supported Playwright ran in hosted CI because local browser/listener execution is denied.

Visual inspection found overlapping construction node labels despite passing interaction assertions. Follow-up increases deterministic ring spacing, puts short labels inside consistently sized node boxes, hides routine line-label repetition until inspection, and preserves full titles in the inspector. An 80-node fixture checks that the declared node boxes do not overlap. The mobile inspector screenshot had captured its entry animation; future captures await that animation and frame the actual inspector/graph rather than the page's incidental scroll position. These changes require renewed hosted screenshots and do not establish human usability acceptance.
