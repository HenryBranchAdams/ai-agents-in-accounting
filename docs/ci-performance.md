# CI optimization verification

Issue #174 starts from `e1e4d1719b5efc6858ffc1a29bd9d9aa5cb8dba2`, including
#170 via PR #172. This change does not alter canonical content or historical
release bytes. Measurement and acceptance remain pending until the equivalent
workload runs and hosted checks are complete.

## Preserved assertions

| Change | Retained contract |
| --- | --- |
| Small isolated archive fixture | Production compression, deterministic repeated/cross-directory bytes, stale-part cleanup, unrelated-file preservation, single/multipart modes, selected-root edition and omission |
| New archive boundary cases | Invalid limits, exact single-file boundary, ordered offsets and hashes, traversal/corruption rejection, nested/root-file symlink refusal |
| Existing primary export tests | Real clean-directory reconstruction, full promised working-file membership, current-gzip omission, historical bytes, missing/corrupt full-build parts |
| Applied retrieval build | Detached base, actual applied data, validators, nonprofit lint, retrieval/passages/bounds, conflicts, source preservation; shared production history-summary projection |
| Named workflow phases | Same local full contract, one primary build, all test files, final qualification, useful failure artifacts, read-only permissions and existing verify job |
| Concurrency | Same-PR replacement only; different PRs, workflows and every main run have distinct groups |
| Failure injection | Each failed local verification phase returns nonzero and prevents later phases |

## Hosted evidence

Two existing baseline runs use the same source tree, corpus (1,328 records,
`2026-09-21.3`), lockfile, Ubuntu hosted runner class and Node 22 workflow:
[PR baseline 35638581931](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35638581931)
and [main baseline 35639816162](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35639816162).
Their source revisions differ because one is the PR verification merge and one
is main; the PR implementation tree matches main `e1e4d17` exactly. Both passed
376 tests. Verify durations were 658 and 659 seconds (median 658.5 seconds).
These are two samples, not a three-run distribution or a controlled runner-load
experiment. Existing npm caching and artifact retention remain unchanged.

[Implementation run 35651608868](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35651608868)
for head `07f61644098c0870aa569a43d872cf115d33a8b5` passed 380 tests and
qualification in 420 seconds. The single measured after run is 36.2% faster than
the baseline median, exceeding the 30% target. The required real archive
reconstruction and all prior tests remain, with four new boundary/gate tests.
Later source changes require their own passing CI; this run does not certify
those later revisions.

| Phase | Main baseline seconds | First implementation seconds |
| --- | ---: | ---: |
| Exact repository-source ZIP | 22 | 19 |
| Dependency installation | 5 | 3 |
| Lint/typecheck/validation/probes | Within 607-second full check | 20 |
| Primary build | Within full check | 87 |
| Tests | About 476 | 268 |
| Qualification | Less than 1 | Less than 1 |
| Artifact upload | 7 | 7 |
| Entire verify job | 659 | 420 |

The entire-job figure includes setup, checkout, source preservation, dependency
installation and artifact transfer. Job topology remains one runner, so measured
runner time is also 659 versus 420 seconds, not a displacement to extra runners.
Cancellation saves superseded work; it is not counted as individual-run speedup.

| Targeted test | Main baseline seconds | First implementation seconds |
| --- | ---: | ---: |
| Archive determinism/cleanup/modes | 133.906 | 0.031 |
| Applied nonprofit validation | 123.791 | 61.921 |
| Applied education validation | 66.840 | 5.611 |

These individual timings overlap under concurrency two and must not be added as
elapsed savings. The nonprofit fixture retains historical lint/type checking;
cloning historical data and running real validators remain necessary. The two
historical full website/export builds are replaced by applied-data agent builds,
using the same production history summary. The primary full build remains once.

## Local evidence and limits

On macOS arm64 / Node 22.23.1, locked installation and lint pass. A frozen targeted
run passed all 17 applied-package and gate tests. Full baseline execution passed
375/376 and the first implementation passed 379/380; the only failure in each
was the sandbox-denied MCP loopback listener (`EPERM`). This is a local limitation,
not a waived check: all 380 checks passed on the hosted supported environment.
Standalone qualification of the first implementation passed; it alone is not
release approval. Clean-directory reconstruction follow-up passed four targeted
checks, including missing/corrupt real parts and the small fixture.

Initial exploratory runs overlapped other work, and one applied smoke correctly
failed source-preservation assertions because its source checkout was edited.
Those runs are retained outside source and excluded from comparative claims.
Operational receipts and screenshots do not enter source/export inventory.

Concurrency two is retained. The bounded alternative-concurrency experiment and
additional final-revision evidence are tracked in the PR before acceptance.
Performance acceptance, merge, successful main CI and publication remain separate.
