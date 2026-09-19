# Coverage metadata and analytics

Coverage belongs beside the canonical corpus as linked, versioned metadata. A record may concern several accounting questions and industries. The public site remains read-only; its existing corpus files remain the source of truth, with no separate mutable database required.

`data/coverage/topology.json` contains the NAICS-US 2022 hierarchy, question families and original research prompts. Industry codes retain their classification edition. Accounting question families are an editorial proposal and can evolve under a separate topology version.

Record mappings describe content associations. A suggested association is distinct from a reviewed mapping, and neither establishes adequate accounting coverage. Missing associations remain unassigned. General material is shared context and does not automatically count as specific coverage for every detailed industry.

Coverage assessments describe a specific question and scope, with supporting records, remaining gaps, review basis and source currency. Parent-industry associations and assessments remain visibly separate from evidence specific to a child industry. Professional review and empirical evidence remain independent dimensions.

Analytics report the complete industry denominator, mapping disposition, associated material, scoped assessments and unassessed areas separately. Coverage history begins with the first recorded snapshot; it must not imply that earlier unmeasured states were measured. Every snapshot records the corpus and topology versions and the mapping inputs used to calculate it.

The initial topology derives from the [research report](research/accounting-coverage-topology-2026-09-11.md) and [worklist](research/accounting-coverage-topology-worklist-2026-09-11.md). The public corpus's record-level rights and review statuses continue to apply.

## Fields and joins

`data/coverage/record-mappings.json` has one mapping for every canonical `record_id`. Join it to the corpus without rewriting historical records. `question_mappings` and `industry_mappings` contain a stable question ID or a string NAICS code, candidate/reviewed status, and JSON Pointer evidence for the association. `industry_scope` distinguishes specific associations, shared context and unassigned scope. The original snapshot used candidate associations. Later explicit reviews retain their disposition, basis and date separately from accounting adequacy. The topology also retains all 30 transaction archetypes and 96 subsector screening prompts for further applicability work.

`data/coverage/assessments.json` is independently versioned. Each assessment states an exact industry code, question family, scope, jurisdiction, framework, known effective period, evidence records, source currency, review basis, seven depth dimensions and remaining gaps. A partial assessment can support only its stated scope. The initial construction WIP assessment is a review of the corpus reference; it does not reverify external full text or claim professional review.

The public fields are available at `/api/v1/coverage/records/{id}` and on every record page. `/api/v1/coverage` accepts exact `industry` and `question` filters; `view=industries|questions`; `show=all|with-material|without-material|unassessed`; `mapping=all|question-unassigned|industry-unassigned|shared-context`; and bounded `page`/`limit` pagination. Industry filters select exact record associations. Broader context is returned separately. Unknown filters, codes, duplicated parameters and invalid page bounds return 400.

`/downloads/coverage.json` contains complete industry/question denominators, deduplicated metrics and sparse cells. An omitted cell has no directly associated material or scoped assessment; broader or shared context may still exist. `/downloads/coverage-cells.csv` expands all 5,952 subsector/question screening pairs with separate direct, narrower, broader and shared-context counts. A zero is an inventory observation, not evidence that the question applies or cannot be answered elsewhere. JSONL mapping exports include versions, and the mapping schema is `/schemas/coverage.schema.json`; assessment fields use its `$defs/assessment` definition.

## Updating the baseline

1. Revise the topology or canonical records as needed, preserving stable identifiers, editions, provenance and rights. Bump the topology version when its definitions change.
2. Review the explicit rules in `scripts/coverage-mappings.mjs` and editorial additions in `data/coverage/mapping-overrides.json`; bump the mapping version there, then run `npm run coverage:map`. Inspect proposed changes before treating any association as reviewed. Unknown records remain in the mapping work queue.
3. Add or revise scoped assessments with an evidence-based rationale; bump their assessment version. Do not infer adequate coverage from keyword matches, a parent code or a record count.
4. Capture a new measured baseline with `npm run coverage:snapshot -- YYYY-MM-DD.N`. It records the complete analytics and SHA-256 hashes of the mapping, topology and assessment inputs. Reusing an ID with different inputs is rejected; unchanged inputs are a no-op. Never backfill invented historical measurements.
5. Run `npm run check`. The build generates the site, JSON/JSONL/CSV, snapshot history, manifest and source archive together. Publish only with authorization.

Changes to the industry edition or question denominator make raw counts across snapshots non-comparable unless the consumer explicitly reconciles the versions. No percentage of accounting knowledge or composite completeness score is calculated.

## Metric design and review

`data/coverage/metrics.json` defines the decision, population, time basis, numerator, denominator, units, source files and caveats for each headline measure. The Data plug-in's KPI design and standard validation guidance informed these definitions: scoped assessments measure research review, breadth counts diagnose inventory, and the unassigned queue guides mapping work. The industry-disposition partition is an arithmetic guardrail. There is no inferred target or combined completeness score.

Headline totals always describe the complete corpus snapshot; filters narrow only the exploration tables, assessment list and record list. Entire-snapshot downloads explicitly retain the full population. History displays the mapping version beside each observation so mapping-method changes cannot silently imply new research. Snapshot hashes include metric definitions and the analytics implementation as well as data inputs.

Editorial overrides can add `question_ids`, remove `exclude_question_ids`, replace `industry_codes`, or explicitly set `industry_scope` to shared-context or unassigned with an empty industry-code list. `reviewed_question_ids` or `reviewed_industry_codes` require an existing association, a `basis_field`, `reviewed_at` and `review_note`. These review an association only; accounting adequacy belongs in a separate scoped assessment. Do not edit generated mappings directly because validation checks reproducibility.

## Versioned research assessment

The roadmap edition adds `data/coverage/research-questions.json`, with 178 named question IDs resolving by record ID and JSON Pointer to canonical answers. `research-criteria.json` separates six assessment axes, seven evidence dimensions, 62 explicit broader family questions and the complete declared denominator. Every named answer remains partial or an evidence gap.

`subsector-profiles.json` has 96 authored activity profiles. `subsector-screening.json` composes the reviewed 62 family rules with each profile into all 5,952 cells. Each records role conditions, rationale, evidence outcome, open question or exclusion, and reopening trigger. This is systematic applicability screening rather than 5,952 independent literature reviews. Shared foundations are recorded as an open industry-specific answer, never as automatic sufficiency. `industry-exception-reviews.json` retains an individual classification locator, activity distinction and exception outcome for each of 1,012 leaves. Census activity definitions support classification boundaries; accounting implications remain original research questions. The 616 additional leaf-question entries overlap the family and screening worklists and are not an additive completeness metric.

The four selected jurisdiction packages preserve local reporting/tax/payroll boundaries. `classification-relationships.json` records only the two evidenced, edition-specific relationships; identical codes or labels do not establish accounting equivalence or a complete crosswalk. All six files are exported with `/schemas/research.schema.json` in the same build as canonical downloads.

Authored research inputs live in `data/research/`; import with `scripts/import-research-packages.mjs`, then rebuild screening with `scripts/build-research-coverage.mjs` and mappings with `npm run coverage:map`. Manual construction questions remain in their canonical guides. Preserve stable IDs and bump affected contracts or assessment versions when their meaning changes. Read and review generated changes before creating a new immutable coverage snapshot. Existing snapshots are historical evidence, including intermediate local checkpoints, and must not be rewritten.

## Snapshot storage

`data/coverage/snapshots.json` is a checksum index. Each historical snapshot is stored intact in `data/coverage/snapshots/<edition>.json`; prior objects and file bytes are immutable. The index uses numeric edition order and records each file's size and SHA-256. `scripts/snapshot-history.mjs` reads the index, verifies every member and generates the static runtime imports. It also reads the older flat format when recovering a historical branch. New snapshots are appended through `npm run coverage:snapshot -- <new-edition>`, which rejects changed or missing historical objects before writing.

The public `/downloads/coverage-history.json` contract remains the combined schema1.0.0 object with its full `snapshots` array. All snapshot files and the index are included in the same-build source archive. Repository storage changed to avoid the growing single-file Git limit; this does not change coverage claims, record rights or the interpretation of historical measurements.
