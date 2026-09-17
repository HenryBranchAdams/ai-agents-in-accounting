# AA-R136 independent review

Review date: 2026-09-17

## Review identity

- Pull request: [#136](https://github.com/HenryBranchAdams/ai-agents-in-accounting/pull/136)
- Base: `main` at `fee5cdbc81b2dfacbc43ff8b9356ee853ca11188`
- Reviewed head: `0e3aef898d9ebc97978f82659ddf2600d83c1d8d`
- Review branch: `codex/aa-r136-review`
- Worktree: `/Users/henryadams/.codex/worktrees/74e8/ai-agents-in-accounting`
- Remote confirmation: `origin/main` resolved to `fee5cdbc81b2dfacbc43ff8b9356ee853ca11188`; `origin/codex/aa-int119125` resolved to `0e3aef898d9ebc97978f82659ddf2600d83c1d8d`.
- Accepted inputs: PR133 `f777250e2baf400212d312ba4e9405bd5c358e3d` with review receipt `46f4b50`, and PR135 `d78b04d1676495740c6e462c40472c044ab2285e` with review receipt `51bf93b`.

## Outcome

The integrated tree is internally valid and passes the full local check, but integration acceptance remains open because one accepted AA-I125 source record is not preserved byte-for-byte. The review made no canonical corpus or author-branch corrections. The only intended change on this branch is this receipt.

The review covers the integration criteria for [issue #119](https://github.com/HenryBranchAdams/ai-agents-in-accounting/issues/119) and [issue #125](https://github.com/HenryBranchAdams/ai-agents-in-accounting/issues/125), while retaining the component-review limits. It does not claim professional source verification, resolved reuse rights, production population validation, operating effectiveness, empirical agent performance, issue closure, or deployment.

## Finding

### [P1] Integration drops the accepted AA-I125 supplemental review for the new FAR source

The accepted PR135 source record `src_far_31203_indirect_costs` contains one `data.supplemental_reviews` entry for batch `AA-I125`. That entry preserves the reviewed Acquisition.gov URL, FAR 31.203(b)-(g) locator, FAC 2026-01 effective date, material-read check, limitations, and unresolved rights disposition.

The integrated PR136 copy of the same stable ID has no `data.supplemental_reviews` field. The new-source constructor at `scripts/integrate-management-accounting.mjs:198-287` builds `data.source_review` but does not carry the accepted supplemental review. The packet has the source facts needed to rebuild that entry, but does not include the supplemental-review object. The existing-source path at `scripts/integrate-management-accounting.mjs:169-195` does create the entry, so this loss is specific to the clean new-source integration path.

This is not a total loss of the source pointer: the integrated record retains an equivalent top-level source review, original URL, locator, effective period, limits, `full_text_stored: false`, and unresolved source rights. It is still a provenance and accepted-package data-loss defect because the batch-specific review history present in the accepted component is absent from the final canonical record and its 2026-09-17.2 exports.

Required disposition: make the new-source path carry the accepted supplemental review, either by making the packet authoritative for the complete source review object or by using one shared supplemental-review builder for both new and existing sources. Add a regression that compares package-owned records or otherwise asserts that a clean integration preserves this review. Then rerun the importer, rebuild all 2026-09-17.2 artifacts, and recheck the outgoing 2026-09-17.1 and older snapshot bytes. Authors own the correction.

Independent evidence:

- Exact component-record comparison covered 29 PR133 package records and seven PR135 package records. The only mismatch was `source:src_far_31203_indirect_costs` from PR135; its only differing field was `data.supplemental_reviews`.
- On a clean temporary copy of the PR136 integration inputs, `node scripts/integrate-management-accounting.mjs --integrate-into-newer-corpus` changed only `data/corpus/source.json` on the first run. A second run was byte-identical. After that replay, `src_far_31203_indirect_costs` matched the accepted PR135 record exactly.

## Acceptance matrix

| Criterion | Result | Evidence and limit |
| --- | --- | --- |
| Integrate both accepted packages without ID collisions or package loss | Partial | 1,095 canonical records have unique IDs; all checked PR133 records and six of seven PR135 package records match accepted heads. The FAR supplemental-review loss remains open. |
| Preserve nonprofit records and boundaries | Pass | No base record containing nonprofit text was missing. The expected changes are the AA-I125 supplemental review on `src_cfr200grants` and the intended NAICS 813 relation expansion; nonprofit source, guide and example IDs remain present. |
| Importer newer-state guards and safe replay | Partial | Strict and integration-mode guard tests pass, and a second replay is stable. A clean replay is not a no-op against the committed PR because it repairs the missing FAR supplemental review. |
| US operating and management package arithmetic, retrieval and negative cases | Pass within component scope | The 12 direct package tests pass, including arithmetic, retrieval exclusions, source pointers, counterexample boundaries, source scope and generator replay. This does not establish professional or production validation. |
| Source status, effective-period and rights boundaries | Pass within recorded evidence | No existing canonical `review_status` changed. New sources retain `source_status: unknown`, `full_text_stored: false`, and unresolved source rights. The missing supplemental review still weakens provenance completeness. |
| Snapshot collision provenance and historical preservation | Pass locally | Existing snapshot inputs and IDs remain unchanged; the collision/no-write test passes. Outgoing 2026-09-17.1 is byte-identical to base, and the new 2026-09-17.2 snapshot is additive. |
| Final 2026-09-17.2 catalog, release and source archive parity | Pass for the current tree | Manifest bytes and SHA-256 hashes match all five release files; the build reports 1,095 records, 27 downloads and a 245-file source archive. These artifacts must be regenerated after the author correction. |

## Integration versus issue completion

This review evaluates whether PR136 safely integrates the already reviewed component packages. It does not re-open or close the complete issue criteria. The component receipts and the current catalog continue to state partial coverage, unresolved rights, absent professional review, absent production validation and absent empirical performance. Those limits remain correct even after the integration defect is fixed.

## Verification performed

- `npm ci`: pass after the isolated worktree initially lacked dependencies.
- `npm run check`: pass, 100/100 tests, typecheck, corpus validation, UI lint, design lint, build, real MCP transports, release parity, snapshot immutability, nonprofit checks and package regressions. The first sandboxed attempt reached 99/100 and failed only because the local Streamable HTTP test could not bind `127.0.0.1` with `EPERM`; the same command passed with loopback permission.
- Direct package tests: 12/12 passed for `tests/aa-int119125-integration.test.mjs`, `tests/management-accounting.test.mjs` and `tests/us-operating-transactions.test.mjs`.
- Canonical audit: 13 corpus files, 1,095 records, 1,095 unique IDs, and no existing review-status transitions relative to base.
- `git diff --check`: pass.
- GitHub check inspection was unavailable during this review because the GitHub API connection failed. The PR body reports successful current CI; no independent CI rerun is claimed.
- No merge, deployment, issue closure, snapshot rewrite, or author-branch mutation was performed.

## Next action

The author or integration owner should preserve the accepted `AA-I125` supplemental review for `src_far_31203_indirect_costs`, add the clean-integration regression, rerun the importer and build, and provide a corrected head for re-review. No merge or release publication should be inferred from this receipt.
