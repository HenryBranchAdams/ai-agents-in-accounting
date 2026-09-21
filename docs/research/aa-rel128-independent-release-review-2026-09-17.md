# AA-REL128 independent release review receipt: 2026-09-17

- Reviewed PR: `#134`
- Reviewed head: `78ad5047842037a1e91a9a843e8aa165111308bd`
- Reviewed base: `c334a97c135025eea20e8af2b6dc6409d37f5b36`
- Original outgoing-release source: `75e819205c72d07fe096b84eb33629200830faa6`
- Reviewer receipt branch: `codex/aa-r128-review`

## Disposition

Hold readiness acceptance for default-branch integration at this exact head. The independent provenance and parity review passes locally, but the exact-head required CI run failed. Final acceptance requires a corrected exact commit and a successful verification path. This receipt does not authorize merge, deployment, issue closure, or publication. Issue `#117` remains open.

## Independent checks that passed

- Built the original PR128 tree in isolation. Its generated `2026-09-16.1` release matches the PR134 outgoing source release byte-for-byte across all six release artifacts.
- Confirmed the original `2026-09-14.3` six-file release is unchanged in PR134.
- Compared the original canonical corpus with PR134. Exactly five records changed, with no additions or removals:
  - `example-us-nonprofit-restricted-award-close` (`editorial-data`)
  - `guide-us-nonprofit-contributions-close` (`editorial-data`)
  - `src_nonprofit_fasb_2016_14` (`source-claims`)
  - `src_nonprofit_fasb_2018_08` (`provenance`, `source-claims`)
  - `src_nonprofit_irs_990_2025` (`provenance`, `source-claims`)
- Confirmed all 17 prior coverage snapshots are unchanged. The only new snapshot is `2026-09-17.1283`; its assessment, mapping, corpus, and 12 input hashes reconcile.
- Confirmed catalog, coverage mapping, release index, current release metadata, and canonical corpus agree on version `2026-09-17.1`.
- Confirmed current release and generated downloads reconcile at 1,072 records and 639 sources, including `corpus.json`, `corpus.jsonl`, manifests, and gzip output.
- Confirmed the exact source archive contains 232 entries, matching `sourceFiles()` and the download manifest.
- Focused publication and nonprofit tests pass: 8/8. The author reports 87/87 on the broader check set, but that does not override the failed exact-head CI run.

## Findings and gate

1. **Blocking gate:** exact-head GitHub Actions run [`35238675689`](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35238675689) failed on Linux with Node 22.23.2 during `npm run check`. The reported failure is an immutable artifact mismatch for `dist/client/releases/2026-09-17.1/corpus.json.gz` at `scripts/release-history.mjs:62`. The local macOS build matches the source and generated gzip, so the reported platform or runtime explanation remains unverified. The author’s correction must preserve historical bytes, semantic parity, and immutable-release safeguards.

2. **P2 documentation mismatch:** the integration receipt says the final source archive has 225 files. The exact PR134 build, ZIP entries, and `dist/client/downloads/manifest.json` independently report 232 files. Correct or explicitly reconcile that statement before acceptance.

## Limits and next action

Accepted source conclusions were not re-researched because the release delta did not change their scope. This review establishes release provenance and local parity only. Re-review the corrected exact commit, including the immutable-release check and relevant publication tests, then reassess readiness. Deployment remains unauthorized.
