# AA-REL128 final independent release review receipt: 2026-09-17

- Reviewed PR: `#134`
- Accepted head: `7ff1a4ade87e5f5dfc69d18bef7bbf0d5fc0360e`
- Previously held head: `78ad5047842037a1e91a9a843e8aa165111308bd`
- Base: `c334a97c135025eea20e8af2b6dc6409d37f5b36`
- Root-cause correction: `35c51a02d549637211d3468c50c825ea76a80e07`
- Reviewer branch: `codex/aa-r128-review`

## Disposition

Accept release readiness for default-branch integration at the corrected exact head. This is a release-review acceptance only. It does not authorize merge, deployment, publication, or issue closure. Issue `#117` remains open.

## Corrected delta reviewed

The actual delta from the held head is limited to four files:

- `scripts/release-history.mjs`: if an existing gzip representation differs, preserve it only when its decompressed bytes exactly equal the canonical `corpus.json`; the existing preflight still rejects every other artifact mismatch, including manifest byte and hash mismatches.
- `tests/maintenance.test.mjs`: covers equivalent gzip preservation and changed decompressed-payload rejection.
- `docs/maintenance.md`: documents the narrow cross-runtime rule.
- `docs/research/aa-rel128-release-integration-2026-09-17.md`: corrects the archive count from 225 to 232 and records the follow-up.

The canonical corpus and accepted historical provenance delta are unchanged from the prior review.

## Verification

- Hosted run [`35249595398`](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35249595398) verified head `7ff1a4ade87e5f5dfc69d18bef7bbf0d5fc0360e` on Ubuntu 24.04 with Node `22.23.2`. Checkout, exact-source preservation, dependency installation, `npm run check`, and artifact upload all succeeded.
- Hosted check log reports 88 tests passed, 0 failed. Build output reports 1,072 records, 639 sources, 27 downloads, and a 232-file source archive.
- Local build of the corrected exact tree passed with the same 1,072, 639, 27, and 232 counts.
- Local focused maintenance, publication, and nonprofit tests passed 16/16.
- Direct negative checks passed: stale gzip manifest hash rejected, changed gzip decompressed payload rejected, stale raw-content manifest hash rejected, and equivalent alternate gzip bytes preserved.
- All nine release versions have byte-identical `corpus.json.gz` files between `data/releases` and generated `dist/client/releases`.

## Remaining limits

The source conclusions were not re-researched because this correction changes only cross-runtime artifact handling and receipt wording. Deployment, merge, publication, and issue-state changes remain outside this review.
