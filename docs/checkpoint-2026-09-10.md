# Local checkpoint — September 10, 2026

Historical checkpoint: implementation and publication statements below describe this checkpoint date. For current interface requirements, read [the design system](design-system.md); see [release guidance](../RELEASES.md) for later changes.

This checkpoint consolidates the read-only research corpus, agent access, evidence-aware retrieval, research expansion, and reading-interface improvements on local `main`. It is a local handoff, not a public release announcement. Recheck Git status before resuming; this dated document does not guarantee future branch or deployment state.

## Current product and source of truth

- Mission and coverage: `data/catalog.json`; corpus version `2026-09-07.4`, with 779 records including 540 sources and 30 collections.
- Canonical records: `data/corpus/`; record schema 2.0.0. Preserve stable IDs, publisher URLs, rights, uncertainty, and review provenance.
- Agent access: shared API, CLI, and read-only MCP retrieval; additive agent schema 1.1.0. See [agent access](agent-access.md).
- Research: two rounds added 51 sources and nine collections; three briefs synthesize evidence across sources. Source checks remain scoped and AI-assisted, not professional verification.
- Retrieval: source evidence, applicability filters, typed relationships, release history, maintenance observations, and portable exports. See [research questions](research-questions.md) and [maintenance](maintenance.md).
- Reading surface: compact homepage with three starting paths; search-preserving removable filters; source review strip and section navigation; narrower prose and clearer labels; mobile menu and research brief cards.

The interface and documentation checkpoint does not change canonical corpus content or its version. Build downloads and the source archive together; generated `dist/` files remain untracked.

## Verification and limits

`npm run check` is the local acceptance command: typechecking, corpus validation, build and source packaging, and 46 automated tests. The checkpoint reruns this command; consult its completion result rather than treating this document as a test runner.

The interface was inspected on September 8 at desktop 1280 × 720 and mobile 390 × 844. Observed flows included homepage, search, source-type selection and removal, a source page, citation navigation by keyboard, mobile menu activation by keyboard, and research brief cards. No browser warnings or errors were observed; mobile homepage and brief listing had no horizontal overflow. This is sampled browser evidence, not a comprehensive accessibility audit. No interface code changed after those checks.

Hosted CI and deployment have not been established for this checkpoint. On September 10, GitHub `main` still resolved to `08361865d9017dd375d1a0ecddb80582ba69a266`. Remote publication requires a separate authorized action. The public site must not be assumed to match local `main`.

## Resume without reviving retired work

Start with this document, [README](../README.md), repository [AGENTS.md](../AGENTS.md), and `data/catalog.json`. Run `git status --short --branch` and inspect recent commits before editing. Use `npm run dev` for the local preview at `http://127.0.0.1:5177`; rebuild after source or data changes.

Courses, labs, learning state, benchmark programs, Atlas, and earlier product experiments remain retired. [Migration](migration.md) describes historical decisions and inventories, not current feature requests. Ignored `outputs/` recovery bundles and older artifacts are retained for recovery, not as active implementation guidance. The `codex/research-corpus` branch is retained as a history pointer; local `main` is the checkpoint entry point.

Outstanding evidence limits remain visible in the corpus: inherited records were not reverified, unknown rights remain unknown, and source reachability does not prove accounting accuracy or currency. Future maintenance should follow these recorded gaps rather than old product backlogs.
