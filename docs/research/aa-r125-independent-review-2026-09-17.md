# AA-R125 independent review

This review covers PR135 at exact head `757f0f19623199c7f5da508ba09f729482dc4f2f`, compared with `main` at `afd2aced307628843f8a26677c3a6fb37fa733e3`. It was performed on branch `codex/aa-r125-review` in an isolated worktree. The review disposition is changes requested. This receipt does not merge, deploy, or close the issue.

## Acceptance criteria review

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
