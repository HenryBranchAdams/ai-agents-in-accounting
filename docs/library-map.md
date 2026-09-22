# Whole-library map

The public `/map` opens without a workflow focus. `/connections` without a focus
redirects to it; existing focused connection and evidence links remain supported.
Navigation, the research library and each record link to the map.

## Meaning and scope

Every canonical record appears exactly once, including records with no recorded
connections. Exact topic strings become stable SHA-256-derived topic IDs, with no
synonym merging or inferred hierarchy. Membership links are used for layout only;
they never enter the recorded evidence-edge inventory. A record can belong to
multiple topics, and counts are unique within each topic. Collections retain the
canonical `source_ids` reading order and remain distinct from topics.

The initial view suppresses relationship lines and colliding labels, not records.
Topic selection displays membership lines without arrows. Record selection reveals
all recorded incident edges, keeping citation, related-reference and explicit
support/qualification types separate. Their direction and full original provenance
remain available through the existing evidence projection. Sharing a source and
being close on the map are not support claims. Node size and placement are not
confidence or authority scores.

## Delivery and identity

`scripts/library-map.mjs` runs a sorted, seeded fCoSE layout at build time. It binds
positions to the projection inputs, algorithm/options and lockfile hash. Runtime
browsers load the map island and Cytoscape together only in Map mode; they run no force simulation.
Selection and filtering preserve positions. Only user dragging moves a node, and
Whole library restores the prepared overview. Browser history and session storage
preserve the map camera for a return from reading; unavailable storage degrades to
the prepared layout.

The map is a verified immutable logical `/_runtime/library-map/` object, carried by
the complete storage manifest. It is not a directly public static file. The Worker
checks length, hash and schema before retaining immutable parsed data. The public
`GET /api/v1/library-map?map=<version>` returns the full public projection. The
browser verifies the content-derived map identity before rendering. Stale versions
return 409 and an explicit reload path.

`GET /api/v1/library-map/record?record=<id>&map=<version>&edge=<optional-id>` supplies
record context and optional exact relationship assertions. Endpoints must belong
to the selected record. Loading a graph never grants authority to execute anything.
All routes retain GET/HEAD/OPTIONS and existing security headers.

## Navigation and accessibility

Native GET state includes `q`, `topic`, `kind`, `collection`, `record`, `edge`,
`mode`, `page` and `map`. Global search clears prior scope filters. The complete
List is paginated by 30 records, without the legacy neighborhood cap. List mode
works without JavaScript and does not initially fetch map renderer code. Canvas
failure leaves native controls and the List readable. Mobile controls remain
outside the canvas, with explicit zoom buttons and an inline selection inspector.
Desktop wheel scrolling is left to the page; touch devices support canvas gestures.
No animation is required. Record text is rendered as text, not tooltip HTML.

## Verification

Model tests compare membership and edge inventories against the complete canonical
corpus, cover disconnected records and ordered collections, and probe malformed
state and deterministic layouts. Browser journeys exercise desktop/mobile
selection, global search outside a previous topic, evidence, reading and return,
Map/List switching, history, resizing and failed loading. Screenshots and measured
inputs belong in excluded operational output directories, not immutable editions.
