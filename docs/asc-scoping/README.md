# ASC scoping checklist design

A design reference for an adaptive U.S. GAAP scoping checklist grounded in a versioned, authorized FASB ASC inventory. The proposed result is a reviewable scope register: applicable requirements, explained exclusions, unresolved facts, elections, effective versions, and coverage gaps.

Start with the [product and accounting design](ASC-scoping-design.md), then the [133-question starter interview](starter-question-bank.md).

## Status and repository boundary

This contribution integrates the September 22, 2026 design package. It does not implement a live questionnaire, an ASC evaluator, customer accounts, or a validated full-Codification ruleset. No operative ASC paragraph inventory is included, and zero production accounting rules have been verified.

The repository remains a public, read-only research corpus. This package is repository documentation, not a new published corpus edition or a change to the deployed site. It does not change canonical records, existing review statuses, coverage denominators, or API contracts. A working assessment application with private customer facts would require a separate approved implementation boundary. Do not place client contracts, tax data, or financial statements in this public repository.

The specification describes the proposed product, not capabilities of the current site. Its implementation phases are not an implicit instruction to reinstate retired execution tools or change the corpus mission.

## Package map

| File | Purpose |
| --- | --- |
| [ASC-scoping-design.md](ASC-scoping-design.md) | Product flow, accounting semantics, rule architecture, coverage, versioning, rights, and phased implementation. |
| [starter-question-bank.md](starter-question-bank.md) | All 133 original questions across 13 modules, with draft research-routing hints. |
| [question-bank.metadata.json](question-bank.metadata.json) | Original bank metadata, module IDs, answer types, and shared question guardrails. |
| [rule-authoring.schema.json](rule-authoring.schema.json) | Structural authoring contract; not a published ruleset or accounting validation gate. |
| [acceptance-scenarios.json](acceptance-scenarios.json) | 28 proposed behavioral scenarios for a future engine; not executed accounting tests. |
| [source-register.json](source-register.json) | 14 official source records and the limits recorded during the original design exercise. |
| [original-package.manifest.json](original-package.manifest.json) | Original byte counts and SHA-256 values for verifying the supplied package. |
| [original-package-readme.md](original-package-readme.md) | Unchanged historical README from the supplied package; statements about no repository changes describe that original delivery. |

The source register preserves the original review date. This integration does not claim a fresh source-currency check, full-text review, permission to redistribute FASB material, or professional accounting verification. Candidate ASC locators are routing hints until checked against the operative authoritative paragraphs.

## Validate and export

Run from the repository root with Node.js 22.13 or later. These commands use only Node built-ins and need no dependency installation:

```sh
node scripts/asc-scoping-package.mjs --check
node --test tests/asc-scoping-package.test.mjs
node scripts/asc-scoping-package.mjs --export
```

The exporter recreates all eight original package files in `dist/asc-scoping-design/`, including the full `starter-question-bank.json` and the original manifest. Generated output is not committed. The Markdown bank holds the questions once; metadata supplies the original common fields. The expanded JSON must match the original artifact's SHA-256 exactly. No question, routing hint, answer state, or guardrail is omitted by this storage arrangement.

The parser is strict: changed modules, duplicate IDs, unknown answer types, malformed hints, unparsed question content, and missing questions fail validation. Package checks detect altered original content. Passing these checks establishes artifact integrity only, not accounting correctness or completeness. The new test file is also picked up by the existing `npm run test:only` test glob.

The export is a reconstruction of the original handoff, so its README retains historical delivery statements. Use this repository README for the current integration status.

## Next implementation handoff

Read the [repository instructions](../../AGENTS.md) and [corpus policy](../corpus-policy.md) before further integration.

1. Reconcile the source register to existing canonical source IDs by original publisher URL. Preserve stable IDs and unknown rights; do not duplicate references or raise review statuses merely because this package cites them.
2. Obtain authorized, versioned ASC access and account for the full source inventory. Questions and retrieval results are not the completeness denominator.
3. Define and review fact, rule, decision, election, temporal-version, and coverage contracts. Unknown, not assessed, conflicting evidence, and missing implementation must remain visible.
4. Build an independently reviewed vertical slice around reporting context, leases, and receivables before expanding. Keep requirement-level exceptions and surviving disclosure obligations separate from Topic-level scope.
5. Select an approved application boundary for private assessments. Any future corpus record or source expansion follows normal schema, provenance, rights, edition, and publication controls. A documentation-only merge does not deploy an interactive checklist.

The [design's definition of done](ASC-scoping-design.md#18-definition-of-done) and proposed acceptance scenarios govern the future engine. The twelve package regression tests govern only this integration's content preservation and export behavior.

## Rights

Original editorial material follows [LICENSE-CONTENT.md](../../LICENSE-CONTENT.md), metadata follows [LICENSE-DATA.md](../../LICENSE-DATA.md), and the package utility follows [LICENSE](../../LICENSE). External FASB publications and ASC content remain outside the project license. No publisher full text is included. See [LICENSE_POLICY.md](../../LICENSE_POLICY.md).
