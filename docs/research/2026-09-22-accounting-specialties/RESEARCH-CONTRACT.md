# Research contract

Research only, US first. Read repository AGENTS.md and docs/corpus-policy.md. No canonical corpus, application, remote, or publication changes. No contacts, purchases, license acceptance, access bypass, or full-text copying. Preserve unrelated work. Research dated September 22, 2026 America/Chicago (UTC tools may report September 23).

Use baseline.json to select your assigned areas and inspect relevant original records in data/corpus and data/coverage. Baseline matching is an intentionally inclusive screening set, not proof of coverage. Distinguish substantive treatment, adjacent guidance, classification-only profiles, and missing coverage. Name stable existing IDs. Research major baseline questions across each assigned area, not just those already indexed. Do not spawn agents.

Use web tools to search and OPEN original publisher material. Search snippets are discovery only. Keep access scope explicit. Prefer primary authorities and original professional/industry sources; use technical accounting-firm manuals to interpret restricted GAAP. No bare landing page can substantiate paragraph-level accounting. Dated amendments are not current consolidated authority. Distinguish financial accounting, tax, regulatory, and management bases, and owner/entity roles. Include current applicability and supersession limits. State unknown rights as unknown. Provide original summaries only.

Write only your assigned group folder. Deliver one Markdown brief per assigned numbered area, sources.json, and areas.json. Each brief needs baseline with existing IDs, major questions and source-backed findings with source IDs/URLs and locators, recommended source/guide additions, and clearly scoped unresolved gaps. Explain enough accounting substance to guide future authoring; a bibliography is insufficient. Include every enumerated scope item as a researched finding or explicit unresolved question. No source-count quotas or filler. Findings are bounded research, not professional conclusions.

sources.json is an array. Each source object MUST have:
- source_key: unique group-prefixed key
- title, publisher, url: original source identity
- publication_date_or_edition: string or null
- jurisdictions: array
- entity_roles: array
- accounting_bases: array (financial GAAP, tax, regulatory, management, etc.)
- source_classification: precise authority/interpretive/historical/practical category
- areas: assigned area numbers supported
- questions: array of concrete accounting questions supported
- inspected_summary: original summary of material actually read
- locators: array of section/paragraph/page/headings actually inspected
- verification_status: substantive-read | partial-read | discovery-only | restricted-access
- access_limits: string
- effective_dates_and_supersession: string, preserve unknowns
- rights: string, do not infer permission
- corpus_disposition: reuse | enrich | add | discovery-only
- existing_record_ids: array (verify against actual corpus; [] when none)
- retrieved_at: actual date
- evidence: array of {url, method, observed} describing actual browser/web evidence, with tool reference if available. Do not paste long source quotes.

areas.json is an array, one object per assigned area:
- number, title, brief (relative filename in group folder)
- baseline_status, existing_record_ids, baseline_summary
- questions: array of {question, status: supported | partial | unresolved, source_keys: [], finding, remaining_gap}
- recommended_additions: array
- unresolved_gaps: array
- priority_rationale: string

Keep shared references in your package for coordinator deduplication; don't edit shared inventory. Match exact URLs to corpus, then check equivalent titles/editions so new URLs don't create duplicate recommendations. Rights and restricted sources can remain unresolved, but attempt permitted alternatives.

Finish with files written, source/area counts, substantive gaps, and material limitations. Send completion or genuine-blocker callback, no routine progress polling. Do not run repository build/check from worker; coordinator owns checks and integration.
