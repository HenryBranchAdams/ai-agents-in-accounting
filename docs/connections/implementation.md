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

The 1,533-record corpus projects to 6,148 canonical directed edges and 7,259 provenance/assertion items, with no self-reference edges and seven locator/reference diagnostics. The complete internal projection is approximately 6.9 MB uncompressed and must not be sent wholesale to browsers. Highest observed incident degrees are224 for the family-office collection and NAICS manual source, followed by169 for the US GAAP authority source. These are navigation counts, not quality scores.

Unit tests cover direction, parallel types, cycles, self-references, isolates, repeated references, ambiguous owners, missing endpoints, literal selector-like IDs, structured finding limitations and stable record-order normalization. Real-corpus tests retain the five issue173 qualification edges and their guide-owned pointers. Typecheck, validation and design lint pass. Bounded retrieval, shared URL state, Graph/List rendering, layout and browser/human acceptance remain to be implemented and measured.
