# AA-INT126 independent local integration review

Date: 2026-09-18

Disposition: PASS for the scoped local integration review. This receipt does not close AA-INT126 or authorize release, publication, merge, push, or deployment.

## Reviewed state

- Review branch: `codex/aa-int126-independent-integration-review`
- Review worktree: `/private/tmp/aa-int126-independent-integration-review`
- Reviewed commit: `56f0072bdbb3ffeb1a45a75a34a5f2bed776d8d0`
- Parent and verified current-main base: `92bfc034183adf7857ed291158a7ba64f50fb8a1`
- Integrated corpus edition and snapshot: `2026-09-18.1`
- Integrated corpus: 1,107 records, 653 sources, 29 downloads, 282 multipart source files
- Accepted local source line retained in provenance: source head `256aaad056d6abd620cf8cfea7aab4268f15b585`, correction `77ad06e9188a633421728e266b2d16e6689729b4`, prior review receipt `52cb3fa`

## Integration findings

The actual delta is a bounded integration of four assurance families: audit assertions, controls and fraud, compliance assurance, and professional governance. It adds eight new named questions, corrects eight named questions, adds the assurance packet and four partial assessments, and updates the associated coverage and release metadata. The four target guides changed; unrelated guide records remained unchanged. The canonical source file was not changed by this integration.

The importer retains the current conflict-aware behavior. The assurance package uses an explicit eight-question replacement allowlist. Only those question IDs can receive the substantive replacement path. Unrelated substantive divergence still records a conflict and preserves the current value. Nested guide, mapping, registry, source-locator, assessment, newer-date, and newer-edition behavior remains covered by the existing importer tests. Clean application, replay, conflict rejection, duplicate URL and alias rejection, and absent-source/index invariants all pass.

The assurance boundaries remain intact. The four assessments are partial, with unknown effective periods and explicit limits. Inherited source checks remain undated where the package did not newly verify them. Rights remain unknown where unresolved. Retrieval and citation stay bounded to the intended family contexts, and negative family-scope cases do not inherit unrelated standards. Existing reporting, management, evidence, and nonprofit data remains present and covered by the integration and full-suite tests.

## Lineage and preservation

- The historical main `2026-09-17.2` corpus, mapping, assessment, and release bytes remain preserved.
- The alternate local `2026-09-17.126` lineage is represented as provenance, not substituted for the historical main identity.
- The base contained 24 snapshots. The reviewed tree contains those same 24 snapshots byte-for-byte plus the unique `2026-09-18.1` snapshot.
- The new snapshot records the AA-INT126 integration ID, the verified base commit and tree, the accepted local source lineage, the historical collision, and the resolution that preserves existing IDs and bytes.
- All 12 new snapshot input hashes independently match their current input files.
- The release diff contains only the new `data/releases/2026-09-18.1` artifacts and the release index update. No prior release directory was modified.

## Artifact verification

The same build produced the canonical release and downloads. Independent checks verified the release manifest's file sizes and SHA-256 values, the coherent `2026-09-18.1` catalog, release, mapping, assessment, registry, snapshot, and download metadata, and the multipart source inventory.

- Source archive: 33,804,402 bytes
- Source archive SHA-256: `fcb2cc7de45cb2147c78d413d9b581155c2486e8e07f05b954ad0d17a31b0691`
- Multipart parts: 2, with manifest offsets, sizes, and hashes matching
- Independent reconstruction: passed with the same size and SHA-256
- Release `corpus.json`: 10,216,114 bytes, SHA-256 `c95abe98c15bb4629337a527b7976b0939f7543b54ac3020fe36cf6432d449d8`

## Verification performed

- Targeted integration, assurance, evidence, reporting, management, and nonprofit suites: 41/41 passed.
- `npm run check` with loopback permission: 140/140 passed.
- The initial sandboxed check had one environment-only `listen EPERM` failure in the real HTTP connector test; the permissioned rerun passed that test.
- `npm run build`: passed, producing 1,107 records, 29 downloads, and the 282-file multipart source export.
- `node scripts/reconstruct-source-archive.mjs dist/client/downloads/accounting-agents-source.manifest.json dist/client/downloads/reconstructed-accounting-agents-source.zip`: passed.
- `git diff --check`: passed.

## Scope boundary

This was a local, isolated integration review only. No PR, push, comment, merge, deploy, publication, issue closure, or callback retry was performed. The result accepts the reviewed integration tree for this scoped local review; it is not a release or a determination that AA-INT126 is closed.
