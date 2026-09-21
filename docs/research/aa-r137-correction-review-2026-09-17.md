# AA-R137 correction re-review receipt

Date: 2026-09-17

Scope: [issue #127](https://github.com/HenryBranchAdams/ai-agents-in-accounting/issues/127), corrected PR137 exact head `0de6d4d29c81ac902974cefbd08a02247b7a4744`, reviewed against prior PR137 head `af883bbf01c86ad3a83e3c582682889cdacd9dd1` and verified main `8c04b83db09099c7bbfdb545b4ce9d2107f90bc3`. The prior independent review receipt `f87ba32c092d69b20c7e35e317e3c7defdba4069` and accepted PR136 receipt `39ad3b2` remain preserved. The accepted issue-package evidence and receipt `dd61c675260abe35d76408ad2d6d5cfa5312877b` remain unchanged.

## Verdict

PASS. Both prior P2 findings are closed by the correction, and no new actionable finding was identified in the targeted re-review.

## Replay and integration boundary

- `scripts/integrate-management-accounting.mjs` now preserves an existing guide when its declared `data.version` is at least the packet version, and skips dependent family rewrites when that guard holds. Existing newer-state date/version checks remain present.
- The clean fixture still removes `src_far_31203_indirect_costs` before the first run. An independent replay matched all ten accepted integration files after the first run, restored both FAR supplemental batches (`AA-I125` and `foundations`), and produced byte-stable output on the second run.
- The mutation-sensitive probes detected both regressions: removing the new-source supplemental review failed the accepted-state invariant, and bypassing the newer-guide guard changed the accepted guide state.
- The focused regression now asserts first-run accepted-state parity, missing-source behavior, both supplemental reviews, second-run stability, and mutation sensitivity in `tests/aa-int119125-integration.test.mjs:22-163`.

## Archive boundary

- The exact source archive is `25,611,935` bytes (`24.43 MiB`), with SHA-256 `a0451441e1858b06bced773578b118e6205df8cc5adaf6a612f0391a8cd529f1`.
- It contains 252 entries and omits exactly `data/releases/2026-09-17.3/corpus.json.gz`.
- The included current `corpus.json` reconstructs the omitted gzip payload; the current release manifest hash and byte count match the omitted gzip.
- All 10 prior release gzip files remain in the archive byte-for-byte. Archive bytes and the download manifest agree, and the archive remains below the 25 MiB host limit.
- `scripts/source-archive.mjs:26-50`, `tests/corpus.test.mjs:332-369`, and `TESTING.md:5` now make the current-only generated-gzip exception explicit and test its exact boundary.

## Historical and package preservation

- The correction delta changes only `TESTING.md`, the integration/archive scripts, and their tests. It changes no canonical corpus, catalog, release, or coverage snapshot files.
- Historical release and snapshot paths are unchanged from the prior reviewed head. Existing current-release/download parity, historical-release byte checks, and the accepted AA-I127 package evidence remain valid.

## Verification

- `npm ci`: passed in the isolated worktree with approved local network execution. The initial sandbox attempt failed on registry DNS resolution before checks ran.
- `npm run check` on exact head: passed, 116/116 tests, including typecheck, validation, lint, build, replay, archive, release, snapshot, retrieval, and coverage checks.
- Independent fixture replay: first-run all-file parity passed; FAR batches were `AA-I125` and `foundations`; second-run bytes were stable; both source-review and newer-guide mutations were detected.
- Independent archive probe: exact current-only omission, included-source reconstruction, 10 prior gzip byte matches, manifest/hash/size parity, and 25 MiB limit all passed.
- Hosted CI: [verify run 35289199734](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35289199734) completed successfully for exact head `0de6d4d29c81ac902974cefbd08a02247b7a4744`.

No merge, issue closure, deployment, author-branch edit, professional review, live-site acceptance, or rights clearance was performed.
