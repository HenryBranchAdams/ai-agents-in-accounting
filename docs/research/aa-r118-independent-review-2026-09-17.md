# AA-R118 independent implementation re-review

Date: 2026-09-17

Repository: `https://github.com/HenryBranchAdams/ai-agents-in-accounting`

Review worktree: `/Users/henryadams/.codex/worktrees/7f6d/ai-agents-in-accounting`

Review branch: `codex/aa-r118-rereview-final-3`

Reviewed head: `0de408bf3f00928f41ac90d2c0b5ccde338b58e1`

Reviewed parent: `7b262d2e10483b00079d891b0cbd7a30509e7f4f`

Base: `refs/remotes/origin/main` at `afd2aced307628843f8a26677c3a6fb37fa733e3`

Earlier review receipt: `5d29ef6417c65d5d600a43965a20d2905e4729ba` on `codex/aa-r118-rereview-final-2`

Disposition: **Acceptable only as a bounded partial research package. Not closure of Issue 118 and not final integration or release approval.**

## Review scope

This re-review used the original Issue 118 completion criteria and the PR132 acceptance criteria against the exact supplied head. The review branch adds this receipt only. It does not edit the author corpus, snapshots, deployment configuration or release history.

The final `7b262d2..0de408b` delta contains:

- full Git history in the corpus workflow checkout so the clean-base applicator test can read the declared base;
- a guide-package marker guard that permits first application to an unmarked guide and fails closed once package markers exist;
- a regression test for clean-base application, eight absent marker fields, shared-input preservation, byte-identical replay and guide divergence preservation.

The substantive reporting research and the shared construction-generator correction were reviewed in the earlier receipt. AA-R119's generator correction remains accepted at `f777250e2baf400212d312ba4e9405bd5c358e3d`, receipt `46f4b50`; no duplicate generator investigation is claimed here.

## Original Issue 118 criteria

| Criterion | Assessment | Evidence and limit |
| --- | --- | --- |
| 1. Inventory existing records and linked questions with roles, frameworks, periods and populations. | Partial, pass for the selected slice only. | The durable inventory records 12 reused sources, eight deepened guides, 16 retained existing questions, eight new questions, six new sources and eight unresolved populations. It explicitly limits itself to the selected eight-family population and does not claim an exhaustive corpus inventory. |
| 2. Add original US authority-linked answers with locators, effective or access metadata and rights state. | Partial, not signable as complete. | The package has bounded source-linked material, exact locators, effective-period notes, review levels and unresolved source rights. Four questions remain `evidence-gap` because current consolidated authority was not accessed. The other four are bounded historical or routing answers, not complete current-topic conclusions. |
| 3. Connect inputs, treatment, workflow, controls and an original worked example. | Pass for the stated synthetic scope. | The January 2026 private nongovernmental US GAAP fixture has opening and adjusted trial balances, six balanced proposed journals, event identity, approvals, dated FX inputs, statement mapping, controls and review-only actions. It is not live ERP, posting, payment, filing or professional evidence. |
| 4. Record exceptions, unresolved questions, professional-review status and empirical limits. | Pass as bounded material. | All eight selected canonical assessments are `partial`; professional review is not performed, empirical support is not established, and source rights remain source-specific and unresolved. No adequacy or production conclusion is claimed. |
| 5. Verify retrieval, a scope counterexample and same-build exports or checks. | Partial pending release-history reconciliation. | Retrieval, arithmetic, scope counterexamples, generated headers, source archive and local checks pass. The immutable snapshot identity `2026-09-17.1` still collides with a different PR131 input history, so the combined release is not ready for integration. |

## Research disposition

All eight package assessments remain `partial`. Four named questions remain materially unanswered current-authority research gaps:

| Question | Status | Remaining material gap |
| --- | --- | --- |
| `q-ledger-close` | `evidence-gap` | Current Topic 250 text and a complete US close interpretation were not accessed. ASU 2020-10 supplies only a bounded error-correction and disclosure reference; the close controls and journals are original synthetic material. |
| `q-estimates` | `evidence-gap` | Current consolidated Topic 250 text, later amendments, entity-specific materiality and the estimate-versus-error conclusion remain open. ASU 2025-11 and SAB 99 are bounded context only. |
| `q-presentation` | `evidence-gap` | Current presentation requirements, Regulation S-X article, form instructions, taxonomy and comparative population were not fully reviewed. The fixture is a statement-mapping example, not filing evidence. |
| `q-policy-changes-errors` | `evidence-gap` | Current Topic 250 treatment, transition, materiality, comparatives and issued-period correction requirements remain open. The branch intentionally does not force a retrospective conclusion. |
| `q-reporting-basis` | `sourced-answer-bounded` | The framework-routing matrix is bounded. Current consolidated framework text, nonprofit Topic 958, specialized bases and the actual entity mandate remain open. |
| `q-foreign-currency` | `sourced-answer-bounded` | FAS 52 and ASU 2013-05 support bounded mechanics. Current ASC 830, functional currency, hedging and live-rate facts remain open. |
| `q-events-going-concern` | `sourced-answer-bounded` | ASU 2010-09 and ASU 2014-15 support bounded date logic. Current Topics 855 and 205-40, entity class and live issuance facts remain open. |
| `q-consolidation` | `sourced-answer-bounded` | ASU 2015-02 supports bounded control-model routing. Current Topic 810, the legal-entity population, VIE evidence and eliminations remain open. |

The new ASU 2020-10, ASU 2025-11 and SEC SAB 99 material remains bounded to excerpts, locators and metadata. The ASU records keep `full_text_stored: false`; publisher rights remain unresolved. SAB 99 is scoped to United States SEC registrants and is not private-company authority. ASU 2025-11 is future or pending content, not current January 2026 authority.

## Final delta assessment

The previous P2 first-application defect is resolved for the tested package boundary. `assertGuidePackageFields` now checks package-owned guide fields only when at least one of eight package marker fields is present. An unmarked guide may receive the package fields on first application. After application, a changed package-owned field fails before any canonical file is written. The implementation continues to merge unrelated fields only after that conflict check, preserving later unrelated provenance and data fields when package-owned fields match.

The new exact-head test covers:

- first application from clean base `afd2aced307628843f8a26677c3a6fb37fa733e3`;
- all eight package markers absent before first application;
- preservation of existing `shared_inputs`;
- byte-identical second application;
- a changed guide summary plus unrelated provenance and data fields;
- nonzero divergence failure before writes and preservation of every mutated field.

The current branch contains snapshots `2026-09-17.1182`, `2026-09-17.1183` and `2026-09-17.1184`. The final delta does not rewrite prior snapshot records.

## Remaining integration gate

### P1: Snapshot `2026-09-17.1` collides with PR131

PR132 at the reviewed head retains `2026-09-17.1` with 1,074 records, 1,015 question-mapped records and 12 scoped assessments. PR131 at head `f294a687ce48d5400daaa5d7a56bb90f6029cff` also retains `2026-09-17.1`, but with 1,069 records, 1,011 question-mapped records and four scoped assessments. Their input hashes differ, including assessment hashes `c050a4ac...` and `af427312...`.

This is an immutable-history collision, not a cosmetic version difference. The release owner must preserve both measured histories and assign a unique final identity for the combined inputs. Neither existing snapshot should be rewritten merely to remove the collision.

The generated profile and screening headers now match catalog version `2026-09-14.3`. The earlier header regression is resolved. The reporting inventory still contains the historical note that AA-R119 verification was pending; the final combined edition should reconcile that annotation with accepted receipt `46f4b50`.

## Independent evidence

### Exact-head checks

- The exact-head reporting-foundations suite was run directly in `/private/tmp/aa-r118-pr132-0de-review`: 11 tests passed, including the new clean-base applicator test.
- The recovered exact-head `npm run check` completed with exit code 0 after the temporary tree had its existing dependency directory available and the localhost bind permission was granted. It covered typecheck, corpus validation, UI and design lint, build, exports, source archive, coverage checks and the 92-test suite. The build reported 1,076 records, 644 sources, 27 downloads and a 216-file source archive.
- The first sandboxed full-check attempt failed only because the existing Streamable HTTP test could not bind localhost with `EPERM`; the earlier dependency lookup failure was `tsc: command not found` in an uninstalled temporary tree. Neither was a repository assertion failure.
- `git diff --check afd2aced307628843f8a26677c3a6fb37fa733e3..0de408bf3f00928f41ac90d2c0b5ccde338b58e1` passed.

### Corrected independent applicator probe

The prior worker's first probe had a temporary JSON writer bug that emitted a literal backslash-n. That made the temporary mutated file invalid JSON and did not test the implementation. The writer was corrected before the result below was accepted:

```text
clean_base_absent_marker_count: 8
clean_base_apply_succeeded: true
shared_inputs_preserved: true
replay_byte_identical: true
divergence_failed_closed: true
divergence_no_files_written: true
unrelated_provenance_preserved: true
unrelated_data_preserved: true
error_includes_summary_guard: true
```

### Bounded corpus evidence

- The eight target family queries returned their guides in the first five results, with direct question pointers and source locators intact.
- Existing IFRS material remained preserved, and sector-54 assessments did not propagate to descendants 541 or 541110.
- The synthetic fixture independently ties six proposed journals, January net expense of 31,500, adjusted trial balance totals of 185,000, closing retained earnings of 53,500 and the separate February FX effect of 100. No action is executed.
- The three construction guides retain their intended 16-source scopes and exclude the three unrelated construction-only sources. The shared generator correction was already accepted by AA-R119 and is not reopened here.

## Current external state

- Current GitHub inspection confirms PR132 is `OPEN`, with head `0de408bf3f00928f41ac90d2c0b5ccde338b58e1` and base `afd2aced307628843f8a26677c3a6fb37fa733e3`.
- `gh run list --commit 0de408bf3f00928f41ac90d2c0b5ccde338b58e1` returned an empty list. No current GitHub Actions result exists for this exact head, so no CI pass is claimed in this receipt.
- No deployment, hosted acceptance, live ERP or market-rate validation, professional accounting review, merge, issue closure, author-branch change or release publication was performed.

## Conclusion and next actions

PR132 is internally coherent as a bounded, read-only reporting-foundations research package. The clean-base applicator gate is resolved and independently evidenced. The original research criterion remains partial because four questions are honestly marked `evidence-gap`, while the other four remain bounded rather than complete current-authority coverage.

Before closure or final integration, the release owner should:

1. Preserve both PR132 and PR131 measured histories and assign a unique combined snapshot identity.
2. Pursue the four current-authority research gaps with exact locators, effective scope, access limits and rights state, or retain their explicit gap dispositions.
3. Reconcile the stale AA-R119 pending annotation in the final combined edition.

No merge, closure, deployment or author edit is approved by this receipt.
