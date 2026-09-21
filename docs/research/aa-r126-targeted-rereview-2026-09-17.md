# AA-R126 targeted re-review

Date: 2026-09-17

Issue: AA-R126

Corrected author head: `7754ec0e356bb7235b5e333124d8bc3065cbd37d`

Review base: `06eb804c17e3bdfde4476275dbaa317c5b40f503`

Review branch: `codex/aa-r126-independent-rereview`

Review worktree: `/private/tmp/aa-r126-independent-rereview`

Prior receipt preserved at `/private/tmp/aa-r126-independent-review/docs/research/aa-r126-independent-review-2026-09-17.md`, commit `eec845ab5b1a15b857cd1c74cd3e30432d925e1e`.

## Disposition

`PASS WITH ACTIONABLE INTEGRATION GATES` for the corrected AA-R126 behavior in isolation.

This is not acceptance of issue 126 closure. The local correction fixes the prior registry, package source-index, AICPA currency, and replay defects, but integration still needs explicit reconciliation with the accepted PR133 importer semantics, local snapshot history, and source-specific evidence limits.

## Rechecked prior findings

### Canonical registry and importer metadata

PASS. `scripts/import-research-packages.mjs` now reads the canonical `data/coverage/research-questions.json` registry and preserves its `question_set_version`, `corpus_version`, and `reviewed_at` instead of hard-coding package values. The corrected checkout retains the canonical registry values `2026-09-14.2` and `2026-09-14`; the catalog remains `2026-09-14.3` as a separate corpus release value.

The importer also preserves existing guide data, provenance, rights, package fields, and mapping review dates. A full-corpus apply and replay left all five importer-owned outputs unchanged: `source.json`, `guide.json`, `mapping-overrides.json`, `research-questions.json`, and `source-aliases.json`.

### Package source indexes

PASS. All four target family packages now have `data.source_ids` equal to their top-level `source_ids`, including controls-fraud and professional-governance. The committed focused test covers this equality and the unrelated-guide preservation case.

### AICPA currently-effective source

PASS with explicit limits. The corrected AICPA source records the page as current through August 2026 and dated September 2, 2026, while retaining the prior `Through Apr 2026` value as correction provenance. `effective_period` remains null, with an explicit limitation that the reviewed publisher material does not state an individual effective period for the cited scope. The official page supports the stated scope and currency: [AICPA SASs currently effective](https://www.aicpa-cima.com/resources/download/aicpa-statements-on-auditing-standards-currently-effective).

The source remains `source-checked`; rights, license fields, full-text storage status, and source-status uncertainty remain unchanged. The new supplemental checks do not upgrade blanket review status, professional sufficiency, or reuse rights.

### Supplemental source checks and retrieval scope

PASS for the correction's intended narrow behavior. Nine non-AICPA source records receive dated 2026-09-17 supplemental checks. The new negative retrieval assertion confirms PCAOB-only material is not returned for the compliance-assurance family. The build still reports 1,068 records, 636 sources, 27 downloads, and a 214-file source archive.

A remaining evidence-date limitation is recorded below for source-specific branches that still inherit the prior undated `existing-corpus-source-review` checks.

## Actionable integration gates

1. **P1, preserve accepted PR133 importer semantics.** The correction's importer is a replacement of the conflict-aware PR133 importer path. A read-only comparison with accepted PR133 head `724f8970f231a6f6c87d5a92b308a70949fdecef` shows that the correction omits its conflict collection, edition/date preservation, question-object merge, reviewed-mapping merge, duplicate-URL and alias checks, and registry-change reporting. Do not integrate the correction importer wholesale. Port the AA-R126 metadata and source-preservation fixes into the accepted conflict-aware implementation, then rerun both suites and a full-corpus replay.

2. **P1, reconcile the snapshot ID collision.** The correction adds snapshot `2026-09-17.2`, with corpus `2026-09-14.3`, mapping `2026-09-14.1`, assessment `2026-09-14.3`, and 1,068 records. Current main history has no `.2`, and the prior AA-R126 history has `.1`, but local integration history at `af883bbf01c86ad3a83e3c582682889cdacd9dd1` already contains a different `2026-09-17.2` with corpus `2026-09-17.2`, mapping `2026-09-17.1252`, assessment `2026-09-17.1302`, and 1,095 records. The ID is therefore not globally unique across available local history. Choose the authoritative lineage or rename and regenerate the snapshot before release acceptance.

3. **P2, align non-AICPA source evidence with review-basis language.** The controls family still has inherited source checks for Nacha (`src_nachafm`) without a dated `checked_at`. The compliance family still has inherited checks for SOC 2 Description Criteria (`src_0ww9s76`) and Trust Services Criteria (`src_1ky30oj`), and professional-governance still has inherited checks for SQMS No. 1 (`src_06tnkx2`) and QC 1000 (`src_0xkvmih`). Several other governance citations also lack a new supplemental check. Their family review-basis text says official pages and existing records were reviewed on 2026-09-17, while these checks still expose the older undated evidence reference. Either add exact dated checks for the cited source scopes or revise the review basis and limitations to describe inherited evidence. Do not upgrade status or rights as part of that repair.

4. **Release gate, preserve explicit unknowns and reconcile final catalog history.** Null source-level effective periods must remain null unless an authoritative, scope-specific period is verified. Text in a locator is not enough to populate the structured field. The orchestrator must also reconcile the catalog, question registry, assessment, mapping, and snapshot lineage before treating the package as a final public release. This review does not assess CI, deployment, Site parity, or publication.

## Verification evidence

- `node --test tests/import-research-packages.test.mjs tests/assurance-foundation.test.mjs`: PASS, 5/5.
- `npm run check`: PASS after the initial sandboxed run's single local-loopback `EPERM` was rerun with permitted loopback access; final TAP result 86/86, 0 failures.
- `npm run build`: PASS. Output validated 1,068 records, 636 sources, corpus version `2026-09-14.3`, 27 downloads, and a 214-file source archive.
- `git diff --check 06eb804c17e3bdfde4476275dbaa317c5b40f503 7754ec0e356bb7235b5e333124d8bc3065cbd37d`: PASS.
- Full-corpus importer apply and replay: PASS, all five importer-owned outputs unchanged.
- Read-only snapshot-history comparison: PASS for current-main and prior-AA-R126 non-collision checks; actionable collision found in existing local integration history.
- Read-only comparison with accepted PR133 history: actionable importer semantic and file-level integration conflicts found; no integration was performed.

## Local-only boundary

No author files, remote branches, pull requests, issue state, deployment, or publication were changed. This receipt is the only review artifact added by this re-review.
