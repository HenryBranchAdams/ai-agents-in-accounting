# AA-R125 independent review

This receipt records the initial review of PR135 at exact head `757f0f19623199c7f5da508ba09f729482dc4f2f`, the re-review at `db421927ea0f2b7767a46b7f444deff8f7b4f3df`, and the final residual check at `d78b04d1676495740c6e462c40472c044ab2285e`, compared with `main` at `afd2aced307628843f8a26677c3a6fb37fa733e3`. It was performed on branch `codex/aa-r125-review` in an isolated worktree. The final residual check found no remaining findings in the reviewed delta. This receipt does not merge, deploy, or close the issue.

## Re-review of PR135 at `db421927ea0f2b7767a46b7f444deff8f7b4f3df`

The three initial findings are resolved as originally scoped: the top-level importer guard now rejects newer versions and review dates, the Unit A margin inputs and formula checks are present, and the baseline inventory and coordination receipt are now auditable. One related importer preservation defect remains open.

### [P1] Nested review dates remain unguarded

The guard at `scripts/integrate-management-accounting.mjs:15-34` checks only top-level metadata. The importer still overwrites per-record dates at `scripts/integrate-management-accounting.mjs:391-440` and per-assessment dates at `457-465`.

I independently copied the author-head inputs to temporary directories, set `mapping-overrides.json.records[guide-q-cost-allocation].reviewed_at` to `2026-09-18` while leaving its top-level date unchanged, and ran the importer. It completed and rewrote the nested date to `2026-09-17`. The same test against `coverage-management-accounting-cost-allocation-2026-09-17.reviewed_at` in `assessments.json` also completed and rewrote the newer date. Add nested-date checks for every object the importer mutates, and fail before writes while preserving all copied input bytes.

### Re-review evidence

- Top-level version guard: a temporary `2026-09-17.1253` state was rejected before writes; all nine copied inputs remained byte-identical.
- Top-level review-date guard: a temporary `2026-09-18` state was rejected before writes; all nine copied inputs remained byte-identical.
- Successful temporary import: unrelated example, retrieval-fixture, and research-family IDs were preserved.
- Margin and profit reproduction: Unit A `-$32,000` and `-$27,000`, gross margin `$40,000` and `$45,000`, and entity operating profit `-$80,000` and `-$75,000` all recomputed from dated Unit A, Unit B, and entity inputs. The declared input references resolve.
- Baseline reproduction: the packet's 51 disposition IDs matched the 51 baseline mapping IDs exactly, with no missing, extra, or duplicate IDs. The seven named question dispositions include unresolved `rq-mfg-cost`; coordination issues #101, #109, and #117 remain explicitly open with no completion claim.
- Snapshot reproduction: prior snapshot `2026-09-17.125` is unchanged, and new snapshot `2026-09-17.1252` has no input-hash mismatches.
- Direct target tests: the four AA-I125 tests pass. The npm test wrapper could not rebuild the target worktree because its generated `dist` directory rejected an unlink with `EPERM`; the direct tests ran against the existing target build.

## Final residual check of PR135 at `d78b04d1676495740c6e462c40472c044ab2285e`

The nested review-date finding from the prior re-review is resolved. The importer now guards every relevant date field it mutates across selected mapping overrides, assessments, guides, source records, source-review attempts, source review records, supplemental reviews, and example editorial review metadata.

- Independent guard harness: 12 relevant top-level and nested cases all rejected before writes, and all nine copied input files remained byte-identical in every case.
- Independent clean replay: import succeeded and preserved unrelated example, research-family, mapping, and retrieval-fixture content exactly.
- Direct target tests: all five AA-I125 tests passed.
- Delta scope: only `scripts/integrate-management-accounting.mjs` and `tests/management-accounting.test.mjs` changed from the prior reviewed head. No corpus, snapshot, catalog, edition, or history file changed in this final delta.
- The author reports 86/86 full checks. One CI inspection for the exact author head found `verify` SUCCESS; no deployment or final catalog/history integration is implied.

## Initial review acceptance criteria at `757f0f19623199c7f5da508ba09f729482dc4f2f`

- Baseline inventory and reuse: partial. The selected role, framework, period, population, and six packet question rows are stated. I could not find an auditable inventory of the baseline 51 records, seven named questions, or dispositions for the existing manufacturing-conversion and professional-services guides. The receipt also does not link the coordination records requested in the plan, including #101, #109, and #117.
- Source-linked answers: partial. The changed guides and sources include original URLs, locators, scope boundaries, effective dates where known, rights status, and review limits. I independently read Acquisition.gov FAR 31.203 and SEC SAB 99. The repository records an eCFR check, but the eCFR endpoint was bot-gated in this environment and was not independently reopened here.
- Inputs, accounting workflow, controls, and worked example: partial. The support-pool allocation, driver sensitivity, budget-to-actual bridge, restatement replacement, cash bridge, and external applicability branches are deterministic and tie arithmetically. The Unit A operating-margin outputs are not reproducible from the fixture because Unit A revenue and direct-cost amounts are not recorded as inputs.
- Exceptions and professional or empirical limits: pass. The guides, example, assessments, and receipt state synthetic status, unresolved rights, professional-review limits, empirical limits, and federal-award or contract applicability boundaries.
- Retrieval, scope counterexample, exports, and checks: pass with the importer caveat below. Retrieval fixtures find the intended records and exclude the tested out-of-scope record. The build produced the declared corpus and downloads. The importer does not safely preserve newer top-level canonical state.

## Findings

### [P1] Importer silently downgrades newer canonical version metadata

`scripts/integrate-management-accounting.mjs:294-297`, `337-340`, `360-362`, and `427-429` unconditionally replace the foundations, question registry, mapping, and assessment version or review metadata with packet version `2026-09-17.125`. The only collision guard is for an example with the same ID.

I verified this with an isolated temporary copy of the touched inputs. After setting unrelated existing records and top-level versions to `2026-09-18.1`, running the importer preserved the unrelated record IDs but changed the top-level versions back to `2026-09-17.125`. That violates the review protocol requirement to preserve newer canonical additions and avoid backdating or historical rewriting. Add a version or input-hash guard that fails safely when the current canonical state is newer than the packet, and add a regression test for the newer-state case.

### [P2] Unit A operating margin cannot be independently reproduced

`data/corpus/example.json:3600-3606` defines the Unit A operating-margin formula and reports `-32000` and `-27000`, but the example and packet do not provide Unit A revenue or Unit A direct-cost amounts. The test at `tests/management-accounting.test.mjs:77` checks only that the allocated support amount is `$72,000`, not the stated margin formula. Add the missing unit-level inputs and formula assertions, or present the Unit A values as unresolved narrative rather than numeric results.

### [P2] Baseline inventory and coordination evidence are not auditable

The implementation receipt lists the selected guides and six synchronized question rows, but it does not show the required baseline inventory, seven-question disposition, supported reuse decisions, or links to the related issue records named in the plan. This makes it difficult to verify that the new work deepens the baseline rather than silently replacing or duplicating it. Add a compact inventory table to the packet or receipt with every baseline question, record reuse or replacement disposition, and the linked coordination issue IDs.

## Independent arithmetic and scope checks

- Support pool: `$90,000 + $20,000 + $10,000 = $120,000`.
- Hour-driver allocation: `600/1,000 = $72,000` for Unit A and `400/1,000 = $48,000` for Unit B.
- Headcount sensitivity: `30/100 = $36,000` and `70/100 = $84,000`.
- Revenue bridge: budget `$100,000`, actual `$99,000`, volume `-$10,000`, price `+$9,000`, total `-$1,000`.
- Restated actual replaces v1 rather than adding another period; the cash bridge ties at `$224,000` closing cash.
- The federal-award and covered-contract branches remain applicability counterexamples, not general US management-accounting authority. The synthetic fixture does not establish professional, operational, or external-reporting conclusions.

## Checks and limits

- `npm ci`: pass.
- `npm run check`: pass, 84/84 tests, after rerunning with loopback permission. The first sandboxed run reached 83/84 and failed only because the Streamable HTTP test could not bind `127.0.0.1` with `EPERM`.
- `npm run coverage:snapshot -- 2026-09-17.125`: pass; recorded input hashes matched.
- `git diff --check`: pass.
- Build output: 1,069 records, 27 downloads, and a 214-file source archive. These are local build results, not deployment or cross-account acceptance.
- The work remains synthetic and read-only. No CI rerun for the author branch, deployment, professional review, real ledger validation, federal award, federal contract, SEC filing, or production forecast was performed by this review.
