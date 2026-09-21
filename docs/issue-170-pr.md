# PR title

Make accounting explanations the homepage and preserve the full research library

# PR body

Reference #170.

The homepage now starts with two accounting questions and useful answer previews. `/library` provides the full corpus. Existing root search/filter/pagination URLs retain library behavior, including an empty `q` parameter. All existing briefs remain discoverable.

The bank-reconciliation workflow explains a synthetic $35 missing fee, a duplicate-entry exception and the separation between a proposed entry, review and posting permission. The construction guide explains the existing estimate revision from $900,000 to $1,000,000 and its $36,000 revenue adjustment. Its late-invoice exception and all four #100 dependencies remain unresolved and visible.

Both pages use optional canonical brief fields shared by server-rendered HTML, Markdown and exports. Worked explanations precede administrative metadata. Complete records remain available in native disclosures. Dependency hashes produce a build/download report when supporting records change; they do not refresh conclusions or approval status.

Review `src/pages/home.tsx`, `src/components/brief-reading.tsx`, `src/pages/record.tsx`, `src/editorial.ts` and `tests/editorial-reading.test.mjs` first. Then review the two changed records in `data/corpus/workflow.json` and `data/corpus/guide.json`. Generated coverage/release files preserve editions and were produced through repository scripts. Corpus edition `2026-09-21.3` is distinct from schema 2.0.0 and any deployment version. The unpublished `.1` and `.2` drafts remain retained.

Compatibility risks are routing of the unfiltered root, brief ordering and optional data rendering. Regression tests cover legacy query state, fallback records, anchors, evidence links, arithmetic, dependency changes and preservation of all other records and rights. The existing API, CLI, MCP, read-only, export and release qualification suite remains required. No source review status or publisher rights changed. The navigation island remains the only hydrated content.

See `docs/issue-170-implementation.md` for baseline failures and reruns, final terminal/browser evidence, source-access limitations, screenshots and the human review script. New site copy was checked against the requested unslop guidance. Browser verification uses Playwright because the Browser plugin is unavailable in this task.

Human acceptance is pending. Local implementation does not establish hosted CI, merge or deployment. Do not close #170 before those acceptance requirements are met, and do not close #100. This document prepares the PR; no remote submission is authorized by the current request.
