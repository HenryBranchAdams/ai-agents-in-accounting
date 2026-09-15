# September 11 construction research checkpoint

Historical checkpoint: implementation and publication statements below describe this checkpoint date. For current interface requirements, read [the design system](design-system.md); see [release guidance](../RELEASES.md) for later changes.

This is the latest local content checkpoint. The [September 10 checkpoint](checkpoint-2026-09-10.md) remains the historical implementation checkpoint for corpus `2026-09-07.4`.

## Current content

Corpus `2026-09-11.1` contains 838 records: 577 sources, 73 workflows, 35 collections, 17 guides and 136 other references. The construction pass adds 37 sources, 13 workflow maps, five collections and four briefs. One inherited AICPA guide landing page was rechecked with its old provenance retained. All other baseline records are unchanged.

The [construction coverage report](research/construction-accounting-coverage-2026-09-11.md) maps 23 accounting areas and explains findings, a simple original WIP illustration, source conflicts and remaining gaps. The [coverage manifest](research/construction-coverage-manifest-2026-09-11.json) lists exact record IDs and counts.

Use these reading paths in the local preview:

- `/records/guide-construction-coverage`: lifecycle and gap overview.
- `/records/guide-construction-wip`: WIP, estimates, revenue, billing and retainage.
- `/records/guide-construction-tax-transitions`: federal transition and source conflict.
- `/records/guide-construction-multistate`: selected state comparisons and boundaries.

The report uses Butler-Cohen only as a public service-profile example. No internal company facts, accounting practices, size or tax methods are inferred. New material is general US contractor research, with conditional public-works and entity-structure branches.

## Evidence limits

Reviews are AI-assisted, with source-specific scope. Some references are original amendments, older interpretations, historical models, commercial documentation or indexed text. There is no professional accounting/legal review, complete current-GAAP certification, 50-state survey, real job-cost dataset or tested construction ERP integration.

The report records the apparent Form 8697/statute transition inconsistency, an expired printed OMB date on the checked SBA form, the inaccessible current Florida general guide and the DOL page’s indexed-text-only review. These limits remain attached to the relevant records.

## Retrieval and release maintenance

Search vocabulary now recognizes WIP/work-in-progress and retention-money terminology. Four construction retrieval cases supplement the existing questions. The record-to-report close fixture now applies the `Record to report` topic already specified by its natural-language question; its expected close and accrual records are unchanged. This prevents new, legitimately titled construction-close records from making an unrelated broad one-word query stand in for that scoped question. No ranking weights were changed.

The outgoing `2026-09-07.4` snapshot was preserved before content changes. Builds now select the newest preserved predecessor and show all preserved versions. Current JSON, JSONL, Markdown, agent exports, release artifacts and source ZIP are generated together; none were manually patched. Release tests verify 59 additions, exactly one modified baseline record and preservation of the other records.

## Local validation and publication boundary

`npm run check` passed: TypeScript checks and all 46 tests, including real MCP clients, HTTP behavior, 24 retrieval fixtures, canonical records, record-page links, exports and source-package integrity. Local HTTP tests required access outside the restrictive sandbox; they passed with that access. These checks do not verify accounting or legal conclusions. See the coverage manifest for the scope. Browser inspection has confirmed WIP search, the WIP brief at desktop and 390-pixel mobile width without horizontal overflow, keyboard activation of the mobile menu, and source evidence/rights presentation.

The implementation base is local `main` at `fb769f5`. This construction pass is uncommitted local work. No push, deployment or hosted CI run was performed. The local preview is served at `http://127.0.0.1:5177`; production URLs in generated citations are stable intended identifiers, not evidence these new records are deployed.

## Accounting coverage topology research

The subsequent [topology report](research/accounting-coverage-topology-2026-09-11.md) recommends NAICS United States 2022 as the US activity inventory, with separate accounting-question, business-arrangement, entity/framework, jurisdiction/period and evidence dimensions. SIC remains useful for SEC discovery; international ISIC and NACE bridges are proposed but not imported or verified.

The [worklist](research/accounting-coverage-topology-worklist-2026-09-11.md) and [JSON map](research/accounting-coverage-topology-2026-09-11.json) contain all 2,125 NAICS hierarchy nodes: 20 sectors, 96 subsectors, 308 industry groups, 689 five-digit industries and 1,012 detailed US industries. Original editorial additions include 62 question families, 30 nonexclusive business-model archetypes, prompts for all 96 subsectors and candidate links for the 23 earlier construction areas. Applicability, detailed-industry exception review and overall accounting coverage remain unassessed under the proposed method. Enumeration is complete for this classification edition; accounting evidence coverage is not claimed complete.

An independent workbook reader matched every extracted code and title. Checks also verified the current corpus snapshot hashes, candidate record references, report footnotes and local links, and inclusion of the research artifacts in the generated source archive. The full repository check passed all 46 tests after enabling local loopback access for the HTTP test. No canonical records, industry tags or review statuses were changed by this topology work. Corpus version remains `2026-09-11.1` with 838 records. These research files remain local, uncommitted and unpublished.
