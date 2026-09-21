# AA-R126 final targeted review

Date: 2026-09-17

Issue: AA-R126

Exact author head: `256aaad056d6abd620cf8cfea7aab4268f15b585`

Successor correction: `77ad06e9188a633421728e266b2d16e6689729b4`

Prior isolated acceptance: `7754ec0e356bb7235b5e333124d8bc3065cbd37d`, receipt commit `b29da0990d9f04805cddae4bc4d692a0a7e09bb5`

Review worktree: `/private/tmp/aa-r126-independent-rereview-final`

Current origin main checked for history: `7ecd9e31d7035f7a4d38bae6e0bd1fba46343144`

## Disposition

`PASS` for the two successor corrections at the exact author head, with the previously identified integration gates still open.

This receipt does not accept issue 126 closure or release integration. The source-review wording correction and additive local snapshot are internally consistent and pass the requested checks. The historical snapshot collision and preservation of the accepted conflict-aware importer remain integration gates.

## Source-review consistency

PASS. The three affected family guides and their corresponding research-foundation families agree on the six explicitly inherited checks:

- Controls and fraud: `src_1wj6irw`, `src_nachafm`
- Compliance assurance: `src_0ww9s76`, `src_1ky30oj`
- Professional governance: `src_06tnkx2`, `src_0xkvmih`

For each check, both package copies retain no `checked_at`, `evidence_ref: existing-corpus-source-review`, and an outcome stating that inherited source-review evidence was retained without a dated check. The package review bases now state that those records were not newly reverified and require source-specific currency review.

The canonical source file is unchanged from `7754ec0`. The six affected source records remain `source-checked`, retain `rights.source_status: unknown`, and retain `data.source_review.effective_period: null`. No source rights, review-status, effective-period, or fabricated dated-recheck upgrade was introduced. The controls, compliance, and governance package source indexes still equal their top-level source indexes.

The wording is appropriately scoped. A current supplemental review on the shared AS 2401 source from another package does not turn the controls-family inherited check into a dated controls-family recheck. The package text preserves that distinction.

The new regression test is meaningful: it checks the three family bases, all six inherited check records, undated status, inherited evidence references and outcomes, unknown rights status, and null effective periods. The full audit also confirmed guide/foundation check equality.

## Snapshot verification

PASS for the additive local snapshot.

- `data/coverage/snapshots.json` now has 17 entries, with no duplicate IDs.
- The prior 16 entries are byte-identical to the `7754ec0` history.
- New ID: `2026-09-17.126`.
- All 12 recorded input SHA-256 values match the exact-head files, including mapping hash `aa7430356ca27a2a1a54e337c23405a58913049086c27d93aea79d3717378ed0`.
- Provenance names branch `codex/aa-r126-correction`, source commit `77ad06e9188a633421728e266b2d16e6689729b4`, and explicitly states local correction and not release integration.
- `npm run coverage:snapshot -- 2026-09-17.126` confirms the ID already records the exact inputs.

The tooling recorded `recorded_at: 2026-09-18` because it uses the UTC ISO date, while the manually supplied local snapshot ID remains `2026-09-17.126`. This is a timestamp convention, not a hash or provenance mismatch.

`origin/main` has no `.126`. It does contain a different `2026-09-17.2`: origin main records corpus `2026-09-17.2`, mapping `2026-09-17.1252`, assessment `2026-09-17.1302`, and 1,095 records, while this local history records corpus `2026-09-14.3`, mapping `2026-09-14.1`, assessment `2026-09-14.3`, and 1,068 records. The new `.126` therefore does not resolve the historical `.2` collision.

## Remaining integration gates

1. **P1, preserve the accepted conflict-aware importer.** Accepted importer head `724f8970f231a6f6c87d5a92b308a70949fdecef` and current `origin/main` retain conflict collection, edition and date preservation, question-object merging, reviewed-mapping merging, duplicate-URL and alias checks, supplemental-date protection, and registry conflict reporting. The AA-R126 correction branch still carries the replacement importer identified in the prior receipt. Port the metadata and source-preservation fixes into the conflict-aware implementation. Do not integrate the replacement wholesale.

2. **P1, reconcile historical snapshot identity.** The exact author head preserves its 16 prior entries and adds unique `.126`, but the `.2` ID already has different content in current origin main. Select the authoritative lineage or rename and regenerate the relevant snapshot before release acceptance. Do not treat `.126` as proof that the older `.2` collision is resolved.

3. **Release gate, rerun integrated verification.** After the importer and snapshot histories are reconciled, rerun the full check, snapshot hash validation, source archive build, and catalog/release consistency checks on the integrated tree. This local review does not assess CI, deployment, Site parity, publication, or issue closure.

## Verification evidence

- Focused successor suite: `node --test tests/import-research-packages.test.mjs tests/assurance-foundation.test.mjs`, PASS 6/6.
- `npm run check`, PASS 87/87 with permitted local loopback access. The initial sandboxed run had only the known test-12 loopback `EPERM`; the rerun passed all 87.
- Build: PASS, 1,068 records, 636 sources, 27 downloads, and a 214-file source archive.
- `npm run coverage:snapshot -- 2026-09-17.126`: PASS, exact existing inputs confirmed.
- Full source-basis audit: PASS for three guides, three research families, six inherited checks, unchanged canonical source bytes, and preserved status, rights, and effective-period boundaries.
- `git diff --check 7754ec0e356bb7235b5e333124d8bc3065cbd37d 256aaad056d6abd620cf8cfea7aab4268f15b585`: PASS.

## Local-only boundary

No author files, remote branches, pull requests, comments, issue state, merge, deployment, publication, or callback was changed. This receipt is the only tracked artifact added by this re-review.
