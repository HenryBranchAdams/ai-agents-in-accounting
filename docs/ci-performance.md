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

## Measurement status

Initial fixture smoke on macOS arm64 / Node 22.23.1: deterministic cleanup/mode
case 39.7 ms; boundary/security case 171.5 ms. These are focused local smoke
measurements, not full-suite or hosted speedup evidence.

Raw measurements, interrupted attempts and receipts are kept outside source.
The first applied smoke collided with implementation edits and correctly failed
source-preservation assertions; its timings are not accepted comparative evidence.
Subsequent verification must use frozen inputs. No performance target or human
acceptance is claimed from the initial smoke.
