# AA-R118 independent implementation re-review

Date: 2026-09-17

Repository: `https://github.com/HenryBranchAdams/ai-agents-in-accounting`

Review worktree: `/Users/henryadams/.codex/worktrees/247d/ai-agents-in-accounting`

Review branch: `codex/aa-r118-rereview-final-2`

Reviewed head: `7b262d2e10483b00079d891b0cbd7a30509e7f4f`

Reviewed parent: `d6d991fdf841ad1bfb2629daa148da65be01406d`

Base: `refs/remotes/origin/main` at `afd2aced307628843f8a26677c3a6fb37fa733e3`

Earlier reviewed head: `8d7c018050212a440443c5194e65ff7ad2733a16`

Earlier review receipt: `24b44bd` on `codex/aa-r118-review`

Disposition: **Acceptable only as a bounded partial research package. Not closure of the original Issue 118 implementation and not final integration or release approval.**

## Review scope

This re-review used the original Issue 118 acceptance criteria and the exact supplied PR132 head. It checked the incremental PR133 import, the inventory and research dispositions, the synthetic fixture, retrieval, the applicator, generated coverage, snapshot history, and the current local and CI evidence. The review branch adds this receipt only. It does not edit the author corpus.

The incremental `d6d991f..7b262d2` delta is limited to:

- a guide-level package-field guard and a no-write divergence test;
- two new FASB source records for ASU 2020-10 and ASU 2025-11;
- supplemental reuse evidence for SEC Staff Accounting Bulletin 99;
- future effective-period metadata and evidence-gap follow-up pointers;
- assessment, mapping and package-version updates;
- the new snapshot `2026-09-17.1184` and its updated corpus counts.

The earlier generator hunk in PR132 was already verified equivalent to the PR133 hunk: comparing `0d447e6033bdc10ecd3ab9a2f5855ae73644807d..f777250e2baf400212d312ba4e9405bd5c358e3d` and `d3a844f0ca321f7f445928cabdbde3df0aaea308..d6d991fdf841ad1bfb2629daa148da65be01406d` produced the same `scripts/build-research-coverage.mjs` changes. The current final delta does not duplicate that generator investigation. No unrelated AA-I119 corpus change was imported in this delta.

## Original acceptance criteria

| Criterion | Assessment | Evidence and limit |
| --- | --- | --- |
| 1. Inventory existing records and questions with explicit roles, frameworks, periods and populations. | Pass for the selected slice only. | The durable inventory records 12 reused sources, eight deepened guides, 16 retained existing questions, eight new questions, six new sources and eight unresolved populations. It explicitly says that it is not an inventory of every record or family in the full corpus. |
| 2. Add original US authority-linked answers with publisher URLs, locators, effective or access metadata and rights state. | Partial, not signable as complete. | The new ASU 2020-10, ASU 2025-11 and SAB 99 evidence is bounded and correctly scoped, but four selected US questions remain `evidence-gap` research leads because current topic text was not accessed. The other four have bounded historical or routing answers, but their current consolidated topics and entity facts remain open. URLs, locators, review levels, effective dates and unresolved rights are recorded. |
| 3. Supply inputs, accounting workflows, controls and worked material. | Pass for the stated synthetic scope. | The fixture includes the January 2026 private nongovernmental entity, opening and adjusted trial balances, six proposed balanced journals, event identity, approvals, dated FX inputs, statement mapping, controls and review-only actions. It is not live ERP, posting, payment, filing or professional evidence. |
| 4. Record canonical exceptions and professional or empirical limits. | Pass as bounded material. | All eight new assessments are partial. Professional review is not performed, empirical support is not established, rights remain source-specific, and government, SEC, nonprofit, industry, live-close and current-authority boundaries remain explicit. |
| 5. Verify representative retrieval, scope counterexamples and same-build exports or checks. | Partial pending release history resolution. | Local retrieval, arithmetic, export, coverage, clean-generator and 91-test checks pass. Snapshot `2026-09-17.1` still collides with PR131. The guide divergence guard passes, but first application from the declared base remains blocked. |

## Resolved from the earlier review

- The durable selected-slice inventory now exists. It distinguishes reuse, deepen, new and unresolved dispositions and preserves the original five acceptance criteria. This resolves the earlier missing-inventory finding for the selected slice, not for the entire corpus.
- The generated profile and screening headers now use catalog corpus version `2026-09-14.3`.
- The ASU 2014-15 effective-period text now states: “Effective for the annual period ending after December 15, 2016, and for annual periods and interim periods thereafter; early application is permitted.”
- The FX fixture now states `CAD/USD`, `1 CAD = rate USD`, `USD amount = CAD amount * rate`, the inverse formula, and `USD per CAD` on every rate row. The CAD events link to their exact rate IDs.
- The three construction guides retain their intended 16-source scope and their mapping overrides match that scope. The three previously unrelated construction sources are absent from all three scopes.
- The package adds bounded substantive-excerpt evidence for ASU 2020-10 and ASU 2025-11, with future effective dates, explicit nonauthoritative or pending treatment and unresolved publisher rights. It reuses SAB 99 only as SEC-registrant staff guidance.
- The applicator now fails closed for changed matching source records, question records, example records, registry rows, assessment rows and package-owned guide fields. The guide-summary divergence test fails before writes and preserves unrelated summary, provenance and data fields. Exact reapplication of the selected package is byte-identical.
- The PR132 branch preserves snapshots `2026-09-17.1182` and `2026-09-17.1183` and adds unique snapshot `2026-09-17.1184`; the existing `2026-09-17.1` record was not rewritten.

## Research implementation assessment

The four materially unanswered original selected questions are:

| Family | Current status | Material unanswered part |
| --- | --- | --- |
| `q-ledger-close` | `evidence-gap` | Current topic-specific US GAAP requirements for the close population were not accessed. The controls and journals are original synthetic material and editorial proposals. |
| `q-estimates` | `evidence-gap` | Current ASC 250 text, later amendments, entity-specific materiality and the estimate-versus-error conclusion were not reviewed. |
| `q-presentation` | `evidence-gap` | Current FASB presentation requirements and SEC form-specific rules, taxonomy and comparative population were not accessed. |
| `q-policy-changes-errors` | `evidence-gap` | Current ASC 250 treatment, transition, materiality, comparatives and issued-period correction requirements were not reviewed. |

The honest `evidence-gap` labels are a correction and satisfy the transparency requirement. They do not, by themselves, satisfy the original request for authority-linked implementation. The other four families are also not full current-authority conclusions:

- `q-reporting-basis` supplies a bounded framework-routing matrix, while current consolidated framework text, nonprofit Topic 958 and the actual entity mandate remain open.
- `q-foreign-currency` supplies bounded FAS 52 and ASU 2013-05 mechanics, while current ASC 830, functional currency, hedging and live-rate facts remain open.
- `q-events-going-concern` supplies bounded ASU 2010-09 and ASU 2014-15 date logic, while current Topics 855 and 205-40, entity class and live issuance facts remain open.
- `q-consolidation` supplies bounded ASU 2015-02 control-model routing, while current Topic 810, the legal-entity population, VIE evidence and eliminations remain open.

This is therefore an acceptable partial research package with correctly disclosed limits, not a completed eight-family authority implementation. No exhaustive-family sufficiency criterion is inferred or added.

Professional review and empirical support are recorded here as original criterion-4 limitations. They are not being invented as a universal professional-review gate for this package.

## Accessible routes versus genuine dependencies

The artifact identifies these routes for the next research pass:

- FASB ASC Basic View and standards index: `https://asc.fasb.org/`. The package records `src_1os761s` as landing-level evidence. This is an access route, not proof that the current Topic 250, 810, 830, 855 or 205-40 text was read or may be redistributed.
- Official FASB amendment PDFs for bounded historical checks: [FAS 52](https://storage.fasb.org/aop_fas52.pdf), [ASU 2010-09](https://storage.fasb.org/ASU2010-09.pdf), [ASU 2014-15](https://storage.fasb.org/ASU%202014-15.pdf), [ASU 2013-05](https://storage.fasb.org/ASU2013-05.pdf), [ASU 2015-02](https://storage.fasb.org/ASU%202015-02.pdf), [ASU 2020-10](https://storage.fasb.org/ASU%202020-10.pdf), and [ASU 2025-11](https://storage.fasb.org/ASU%202025-11.pdf). These routes support bounded mechanics and history, not a substitute for current consolidated text.
- The new ASU 2020-10 and ASU 2025-11 records are substantive excerpts only. Both official ASU covers state that an Accounting Standards Update is not authoritative; it communicates amendments to the authoritative Codification. ASU 2025-11 is pending future interim content, not current January 2026 authority.
- SEC SAB 99: `https://www.sec.gov/interps/account/sab99.htm`. The existing source is reused only for SEC-registrant staff materiality context, not private-company authority. A fresh SEC fetch from this environment returned HTTP 403, so the recorded 2026-09-11 source review, scope and unresolved rights were not upgraded.
- SEC Corporation Finance rules and regulations: `https://www.sec.gov/about/divisions-offices/division-corporation-finance/rules-regulations-schedules`. This is an accessible route for a selected registrant, form, Regulation S-X and XBRL analysis, but the package has not selected or reviewed the form-specific population.
- Existing GASB, FASAB, IFRS and editorial control records remain usable within their recorded jurisdiction, framework, period and rights boundaries. Reuse does not grant authority or source-text rights.

The following are genuine dependencies rather than gaps that public browsing alone can close: authorized access to current consolidated text and publisher terms, source-specific reuse permissions, actual entity and reporting-basis facts, legal-entity and VIE populations, live ERP completeness, bank and invoice populations, current market rates and issuance or availability dates. Professional review remains a recorded limitation under the original criteria, not an added universal gate.

## Residual findings and gates

### P1: Snapshot `2026-09-17.1` still collides with PR131

PR132 at the reviewed head retains `2026-09-17.1` with 1,074 records, 1,015 question-mapped records, 12 scoped assessments and assessment hash `c050a4ac...`. PR131 head `f294a687ce48d5400d0aaa5d7a56bb90f6029cff` also retains `2026-09-17.1`, but with 1,069 records, 1,011 question-mapped records, four scoped assessments and assessment hash `af427312...`.

PR132's added `1182`, `1183` and `1184` records are unique within its branch, but adding later IDs does not make the duplicate `2026-09-17.1` identity safe in a combined release. This remains the final-edition and orchestrator history gate. The release owner must preserve both measured histories and assign a unique final identity for the selected combined inputs. Neither existing snapshot should be rewritten merely to remove the collision.

### Original research acceptance remains partial

The four `evidence-gap` families above remain materially unanswered for current authority-linked implementation. Their labels should remain downgraded until the current text and required entity or period facts are actually reviewed. The bounded answers for the other four should not be counted as complete current-topic coverage.

### P2: Guide divergence is protected, but first application from base is blocked

The new guide guard correctly rejects a changed matching `summary` before writes. An independent temporary probe added newer unrelated summary, provenance and data fields to `guide-q-estimates`; the applicator exited nonzero, preserved all three fields and left every copied input byte-identical. The existing example and question tests cover the same fail-closed behavior for those record types.

The opposite path remains a defect: applying the package files to the declared base `afd2ace` fails at `guide-q-reporting-basis: package-owned guide field summary differs; refusing overwrite`, because the guard treats an absent package field or pre-package guide summary as a conflict. The next implementation should permit an absent package-owned field during first application, while failing when an already-applied package field diverges, and should add a clean-base application test. This does not create a new professional-review gate.

### AA-R119 generator gate

The PR133 generator correction is independently accepted by AA-R119 at `f777250e2baf400212d312ba4e9405bd5c358e3d`, with receipt `46f4b50` and evidence at [PR133 review comment](https://github.com/HenryBranchAdams/ai-agents-in-accounting/pull/133#issuecomment-5717601025). The independent evidence reports byte-identical first and second runs for all five outputs, valid 16-source boundaries, malformed-input pre-write failures, 86/86 local tests and CI run `35244204127`.

PR132 now records `AA-R119 accepted` and receipt `46f4b50`. No generator gate remains open from this review; the final combined edition still requires the snapshot-history reconciliation above.

## Independent evidence

### Fixture arithmetic and direction

Independent recalculation of `data/research/reporting-foundations-example.json` found:

- Opening trial balance debits and credits both equal 200,000.
- All six proposed journals balance, use unique existing event IDs and remain `proposed-not-posted`.
- January net expense is 15,000 wages minus 3,000 reversal plus 7,400 service expense plus 100 January FX loss plus 12,000 earned-but-unrecorded expense, or 31,500.
- The adjusted trial balance debits and credits both equal 185,000.
- Closing retained earnings is 85,000 opening retained earnings less 31,500 January net expense, or 53,500.
- CAD 10,000 converts to USD 7,400 at 0.74 and USD 7,500 at 0.75. The February settlement is USD 7,600 at 0.76 against the USD 7,500 January carrying amount, leaving a separate USD 100 February effect.
- Assets equal liabilities plus equity at 185,000, and the statement mapping agrees with the 31,500 net expense. No actions were executed.

### Retrieval and source scope

Using the built current-head agent, each of the eight named family queries returned its target guide in the first five results. The four evidence-gap statuses, source pointers, retained IFRS material and sector-54 non-propagation boundaries remained visible. The three construction guides each retained 16 explicit source IDs, matched their override, and excluded the three unrelated construction-only source IDs.

### New source evidence

- `src_fasb_202010` is a substantive excerpt with an official URL, effective-period metadata, paragraph locators, a material-read check, `full_text_stored: false`, `source_status: unknown` and unresolved rights. Its recorded summary and limitation treat the ASU as a bounded amendment reference, not authoritative Codification text.
- `src_fasb_202511` is a substantive excerpt with an official URL, pending Topic 250 and Topic 270 locators, future effective dates, a material-read check, `full_text_stored: false`, `source_status: unknown` and unresolved rights. The official PDF fetch confirmed the ASU nonauthoritative disclaimer and the public-entity and other-entity dates beginning after December 15, 2027 and December 15, 2028, respectively.
- `src_secsab0099` is substantive-excerpt evidence limited to United States SEC registrants. It remains staff guidance, not private-company authority, with `full_text_stored: false` and unresolved rights. Its recorded original-page check is retained; the fresh SEC fetch returned HTTP 403 and did not upgrade the record.

The new source evidence improves the four evidence-gap packages without promoting them to complete current-authority answers. The two new source records and one reused source record contain bounded summaries, locators and review evidence, not copied publisher full text.

## Checks and external state

- Exact-head CI was inspected once. PR132 points to `7b262d2e10483b00079d891b0cbd7a30509e7f4f`; verify run [35250037260](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35250037260), job [105299861453](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35250037260/job/105299861453), completed successfully.
- Sandboxed `npm run check` reached 90 of 91 tests; the only failure was localhost bind `EPERM` in the Streamable HTTP test.
- Escalated `npm run check` passed: typecheck, validation, UI and design lint, build, exports, source archive, coverage checks and 91 of 91 tests passed.
- The current build reports 1,076 records, 644 sources, 27 downloads and a 216-file source archive.
- `git diff --check afd2aced307628843f8a26677c3a6fb37fa733e3..HEAD` passed.
- Exact applicator reapplication in a temporary copy passed byte-for-byte on both runs. The guide-summary divergence probe failed before writes and preserved unrelated fields. A clean-base first-application probe failed on the absent or pre-package guide summary, as described above.
- Official FASB PDF fetches confirmed the new ASU effective dates and authority disclaimers. A fresh SEC SAB 99 fetch returned HTTP 403; the recorded source review was not upgraded.
- No deployment, hosted acceptance, live ERP or market-rate validation, merge, author-branch update or release publication was performed. Professional review remains an original criterion-4 limitation, not a new universal gate.

## Conclusion and next actions

The reporting-foundations slice is now internally coherent as a bounded, read-only research package. The inventory, explicit limitations, FX direction, source metadata, arithmetic, retrieval, construction generator import and test evidence are materially improved. The four downgraded families remain real research gaps, not completed answers.

Before closure or final integration, the release owner should:

1. Resolve the `2026-09-17.1` collision in the combined snapshot edition while preserving measured history.
2. Correct the applicator's first-application behavior so absent package fields are added while already-applied divergent fields fail closed.
3. Pursue the four current-authority research routes and capture exact current locators, effective scope, access limits and rights state, or retain the evidence-gap dispositions.
4. Keep professional and empirical limits explicit under the original acceptance criteria without converting them into a universal gate.

No merge, closure, deployment or author edit is approved by this receipt.
