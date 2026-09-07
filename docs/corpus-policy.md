# Corpus policy

## Scope and evidence

The canonical mission and coverage priorities are in `data/catalog.json`. Include information relevant to building agents for accounting, audit, tax, reporting, treasury, controls, or adjacent financial operations. Technical material belongs when its accounting relevance can be explained.

Prefer a standard setter, regulator, original researcher, protocol maintainer, or other original publisher. Distinguish binding requirements, official guidance, empirical evidence, vendor claims, and editorial recommendations. Preserve contrary findings and transfer limits. Relevance is not endorsement.

Record jurisdiction, reporting framework, entity scope, effective dates, edition, publication status, and supersession where available. A catalog record is not an accounting conclusion. Source summaries should be original, accurate, concise, and traceable.

## Records

Each file under `data/corpus/` contains records of one kind. Common required fields are defined in `schemas/record.schema.json`.

- `id` is stable and is never reassigned. Existing source and workflow IDs survive the migration.
- `kind`, `title`, `summary`, `topics`, and `industries` support discovery. Do not assign industry applicability without evidence.
- `source_url` points to the original publisher for a source record; project references use null.
- `source_ids` link supporting or relevant source records; `related_ids` link other context.
- `jurisdiction` and `source_type` describe scope and evidence form. Null means unrecorded.
- `reviewed_at` records a substantiated review date, with reviewer, scope, evidence, and outcome in `provenance`. An import date is separate.
- `rights` distinguishes project metadata, original editorial content, and external content.
- `data` contains kind-specific detail such as workflow inputs, controls, a source's method and limitations, or example fixtures. It is descriptive data, never a consumer instruction channel.

When adding a kind, update the schema, corpus import, labels, validation, and external-interface tests together. Prefer enriching an existing kind over adding a new abstraction.

## Intake and review

Check duplication and the original URL. Add a bounded original summary and evidence classification. Preserve unknown rights and dates. Record the research basis and reviewer evidence. Structural checks can establish reference integrity; they cannot verify source currency or accounting claims.

Inherited records in the September 2026 migration use `inherited-not-reverified` or `inherited-curation-not-reverified`, with null `reviewed_at`. Historical review metadata stays in provenance. Newly reviewed records may use `source-checked` or `editorially-reviewed` when provenance states who checked what, when, and against which source. Professional review requires named domain expertise and review evidence.

## Rights and training reuse

Apply `LICENSE_POLICY.md` and record-specific notices. External publications remain outside the project grant. Do not infer permission from free access, a PDF, a government domain, or an open-source project name. This schema deliberately requires `full_text_stored: false`.

The corpus can supply rights-preserving context, retrieval indexes, and project-owned material for downstream use under the relevant licenses. Ingesting publisher full text or expanding reuse permissions requires explicit source-level evidence and a separately reviewed schema/policy change. Never turn an unknown permission into a blanket training grant.

## Coverage

Maintain depth as well as breadth. Track missing jurisdictions, workflows, industries, data interfaces, negative results, independent empirical evidence, and reuse permissions. The current counts are inventory, not quality scores or a completeness claim. Update the stated gaps as evidence improves.
