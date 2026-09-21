# AA-R137 independent integration review

Date: 2026-09-17

Scope: [issue #127](https://github.com/HenryBranchAdams/ai-agents-in-accounting/issues/127), PR137 exact head `af883bbf01c86ad3a83e3c582682889cdacd9dd1`, reviewed against verified main `8c04b83db09099c7bbfdb545b4ce9d2107f90bc3`. The accepted PR136 review receipt `39ad3b2` was preserved. The accepted issue-package head was `724f8970f231a6f6c87d5a92b308a70949fdecef`, with independent receipt `dd61c675260abe35d76408ad2d6d5cfa5312877b`.

## Verdict

ACTIONABLE FINDINGS. The exact head builds and passes the local gate, and the release/archive output is internally consistent. I am not issuing a clean acceptance receipt because two P2 integration guardrails need attention.

## Findings

### P2: Clean AA-I125 replay no longer proves first-run all-file preservation

Location: `tests/aa-int119125-integration.test.mjs:83-120`, with the integration rewrite in `scripts/integrate-management-accounting.mjs:302-363`.

The regression still starts with `src_far_31203_indirect_costs` genuinely absent and still checks that the FAR source is re-added with the expected AA-I125 supplemental review. However, PR137 removes the first-run comparison of all ten `integrationFiles` against the accepted canonical state. The remaining byte-stability assertion starts only after that first run, so it proves idempotence of whatever the first run produced, not preservation of unrelated accepted state.

An exact-head clean-harness replay that removed only the FAR source changed `guide-q-cost-allocation`, `guide-q-planning`, and `guide-q-performance` on the first run. The changed fields include each guide's summary, jurisdiction, provenance, and data. This is explained by `applyFamily`, which rewrites those fields from the older AA-I125 packet. Because those guides were updated by the newer integrated package, rerunning the older integration can silently discard newer guide content while the revised regression passes.

Restore an all-file invariant with an explicit allowlist or expected fixture for the intended AA-I125 changes, or make the integrator preserve newer packet-owned guide fields and assert that all non-target state remains unchanged on the first run. Keep the existing source-absent mutation and second-run stability checks.

### P2: The generated-gzip source-archive exception lacks a direct boundary test and contract statement

Location: `scripts/source-archive.mjs:26-46`, `tests/corpus.test.mjs:309-335`, and `TESTING.md:5`.

The current-release `corpus.json.gz` omission is justified by actual build evidence. The source ZIP is 25,610,347 bytes versus the 25 MiB host limit of 26,214,400 bytes; adding the compressed current-release gzip would produce about 26,451,478 bytes. The current release's uncompressed `corpus.json` is included, prior release gzip files remain included, and a deterministic rebuild from the included JSON reconstructs the omitted gzip payload.

The guardrail is incomplete, though. The archive test compares its entries to `sourceFiles()` at line 328, so the production exclusion list also defines the test's expected list. It does not assert that the omitted path is exactly `data/releases/<catalog.corpus_version>/corpus.json.gz`, that the current JSON can reconstruct it, or that prior release gzip files remain present. A broadened exclusion or a wrong current-version selection could therefore pass while the test name and `TESTING.md:5` continue to describe packaging against the actual working files.

Add explicit assertions for exactly this one generated duplicate, current JSON and gzip-payload reconstruction, prior-release gzip retention, and manifest/build parity. Document the exception in the portable-source contract so consumers understand that the source package is complete for reconstruction, not a byte-for-byte copy of every generated release artifact.

## Verification

- `npm ci`: passed in the isolated review worktree.
- `npm run check` on the exact head: passed, 115/115 tests, including typecheck, canonical/schema validation, lint and violation probes, build, retrieval, coverage, integration, release, and archive checks.
- Build output: 1,097 records, 27 downloads, 252 source-archive entries. `unzip -tq` passed. The archive was rebuilt twice and matched byte-for-byte; included current `corpus.json` and omitted gzip payloads matched, and prior release gzip files were retained.
- Release preservation: no pre-existing release artifact changed; only the new `2026-09-17.3` artifacts and release index update were added. Prior release JSON/gzip decompression parity passed.
- Coverage history: existing snapshots were semantically unchanged; snapshots `2026-09-17.4` and `.5` are additive and `.5` matches current coverage inputs.
- Canonical review: no pre-existing record IDs, identity fields, rights fields, or top-level provenance keys were removed; no canonical records were removed.
- Hosted CI inspection at return: PR137 `verify` run `35285914173` completed successfully for exact head `af883bbf01c86ad3a83e3c582682889cdacd9dd1`.

No merge, issue closure, deployment, author-branch edit, professional review, live-site acceptance, or rights clearance was performed.
