# AA-R118 independent implementation re-review

Date: 2026-09-17

Repository: `https://github.com/HenryBranchAdams/ai-agents-in-accounting`

Review worktree: `/Users/henryadams/.codex/worktrees/247d/ai-agents-in-accounting`

Review branch: `codex/aa-r118-rereview-final`

Reviewed head: `d6d991fdf841ad1bfb2629daa148da65be01406d`

Reviewed parent: `d3a844f0ca321f7f445928cabdbde3df0aaea308`

Base: `refs/remotes/origin/main` at `afd2aced307628843f8a26677c3a6fb37fa733e3`

Earlier reviewed head: `8d7c018050212a440443c5194e65ff7ad2733a16`

Earlier review receipt: `24b44bd` on `codex/aa-r118-review`

Disposition: **Acceptable only as a bounded partial research package. Not closure of the original Issue 118 implementation and not final integration or release approval.**

## Review scope

This re-review used the original Issue 118 acceptance criteria and the exact supplied PR132 head. It checked the incremental PR133 import, the inventory and research dispositions, the synthetic fixture, retrieval, the applicator, generated coverage, snapshot history, and the current local and CI evidence. The review branch adds this receipt only. It does not edit the author corpus.

The incremental `d3a844f..d6d991f` delta is limited to:

- explicit `source_ids` overrides for construction guides 236, 237 and 238;
- generator validation and preservation of those overrides;
- a clean first-run and second-run construction-artifact test;
- the new snapshot `2026-09-17.1183` and its mapping hash;
- inventory dependency metadata and the corresponding test updates.

The generator hunk in PR132 is equivalent to the PR133 hunk: comparing `0d447e6033bdc10ecd3ab9a2f5855ae73644807d..f777250e2baf400212d312ba4e9405bd5c358e3d` and `d3a844f0ca321f7f445928cabdbde3df0aaea308..d6d991fdf841ad1bfb2629daa148da65be01406d` produced the same `scripts/build-research-coverage.mjs` changes. The current generator validates an override array, rejects unknown source IDs, deduplicates the explicit scope, uses it for the generated guide, and preserves the other override fields. No unrelated AA-I119 corpus change was imported in this delta.

## Original acceptance criteria

| Criterion | Assessment | Evidence and limit |
| --- | --- | --- |
| 1. Inventory existing records and questions with explicit roles, frameworks, periods and populations. | Pass for the selected slice only. | The durable inventory records 12 reused sources, eight deepened guides, 16 retained existing questions, eight new questions, six new sources and eight unresolved populations. It explicitly says that it is not an inventory of every record or family in the full corpus. |
| 2. Add original US authority-linked answers with publisher URLs, locators, effective or access metadata and rights state. | Partial, not signable as complete. | Four selected US questions remain `evidence-gap` research leads because current topic text was not accessed. The other four have bounded historical or routing answers, but their current consolidated topics, entity facts or professional review remain open. URLs, locators, review levels and unresolved rights are recorded. |
| 3. Supply inputs, accounting workflows, controls and worked material. | Pass for the stated synthetic scope. | The fixture includes the January 2026 private nongovernmental entity, opening and adjusted trial balances, six proposed balanced journals, event identity, approvals, dated FX inputs, statement mapping, controls and review-only actions. It is not live ERP, posting, payment, filing or professional evidence. |
| 4. Record canonical exceptions and professional or empirical limits. | Pass as bounded material. | All eight new assessments are partial. Professional review is not performed, empirical support is not established, rights remain source-specific, and government, SEC, nonprofit, industry, live-close and current-authority boundaries remain explicit. |
| 5. Verify representative retrieval, scope counterexamples and same-build exports or checks. | Partial pending release history resolution. | Local retrieval, arithmetic, export, coverage, clean-generator and 91-test checks pass. Snapshot `2026-09-17.1` still collides with PR131, and a guide-field preservation gap remains in the applicator. |

## Resolved from the earlier review

- The durable selected-slice inventory now exists. It distinguishes reuse, deepen, new and unresolved dispositions and preserves the original five acceptance criteria. This resolves the earlier missing-inventory finding for the selected slice, not for the entire corpus.
- The generated profile and screening headers now use catalog corpus version `2026-09-14.3`.
- The ASU 2014-15 effective-period text now states: “Effective for the annual period ending after December 15, 2016, and for annual periods and interim periods thereafter; early application is permitted.”
- The FX fixture now states `CAD/USD`, `1 CAD = rate USD`, `USD amount = CAD amount * rate`, the inverse formula, and `USD per CAD` on every rate row. The CAD events link to their exact rate IDs.
- The three construction guides retain their intended 16-source scope and their mapping overrides match that scope. The three previously unrelated construction sources are absent from all three scopes.
- The applicator now fails closed for changed matching source records, question records, example records, registry rows and assessment rows. Exact reapplication of the selected package is byte-identical.
- The PR132 branch preserves snapshot `2026-09-17.1182` and adds unique snapshot `2026-09-17.1183`; the existing `2026-09-17.1` record was not rewritten.

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

## Accessible routes versus genuine dependencies

The artifact identifies these routes for the next research pass:

- FASB ASC Basic View and standards index: `https://asc.fasb.org/`. The package records `src_1os761s` as landing-level evidence. This is an access route, not proof that the current Topic 250, 810, 830, 855 or 205-40 text was read or may be redistributed.
- Official FASB amendment PDFs for bounded historical checks: [FAS 52](https://storage.fasb.org/aop_fas52.pdf), [ASU 2010-09](https://storage.fasb.org/ASU2010-09.pdf), [ASU 2014-15](https://storage.fasb.org/ASU%202014-15.pdf), [ASU 2013-05](https://storage.fasb.org/ASU2013-05.pdf), and [ASU 2015-02](https://storage.fasb.org/ASU%202015-02.pdf). These routes support bounded mechanics and history, not a substitute for current consolidated text.
- SEC Corporation Finance rules and regulations: `https://www.sec.gov/about/divisions-offices/division-corporation-finance/rules-regulations-schedules`. This is an accessible route for a selected registrant, form, Regulation S-X and XBRL analysis, but the package has not selected or reviewed the form-specific population.
- Existing GASB, FASAB, IFRS and editorial control records remain usable within their recorded jurisdiction, framework, period and rights boundaries. Reuse does not grant authority or source-text rights.

The following are genuine dependencies rather than gaps that public browsing alone can close: authorized access to current consolidated text and publisher terms, source-specific reuse permissions, actual entity and reporting-basis facts, legal-entity and VIE populations, live ERP completeness, bank and invoice populations, current market rates, issuance or availability dates, and accountable controller, CPA or auditor review.

## Residual findings and gates

### P1: Snapshot `2026-09-17.1` still collides with PR131

PR132 at the reviewed head retains `2026-09-17.1` with 1,074 records, 1,015 question-mapped records, 12 scoped assessments and assessment hash `c050a4ac...`. PR131 head `f294a687ce48d5400d0aaa5d7a56bb90f6029cff` also retains `2026-09-17.1`, but with 1,069 records, 1,011 question-mapped records, four scoped assessments and assessment hash `af427312...`.

PR132's added `1182` and `1183` records are unique within its branch, but adding later IDs does not make the duplicate `2026-09-17.1` identity safe in a combined release. This remains the final-edition and orchestrator history gate. The release owner must preserve both measured histories and assign a unique final identity for the selected combined inputs. Neither existing snapshot should be rewritten merely to remove the collision.

### Original research acceptance remains partial

The four `evidence-gap` families above remain materially unanswered for current authority-linked implementation. Their labels should remain downgraded until the current text and required entity or period facts are actually reviewed. The bounded answers for the other four should not be counted as complete current-topic coverage.

### P2: Applicator preservation is incomplete for package-owned guide fields

The new guards correctly reject changed matching source, question, example, registry and assessment rows, and the new tests cover changed example and question state. However, the applicator still assigns package-owned fields on an existing target guide, including `title`, `summary`, `jurisdiction`, `reviewed_at`, selected provenance fields and multiple `data` fields. An independent temporary probe added a newer unrelated suffix to `guide-q-estimates.summary`; the applicator exited successfully and removed that suffix.

This is narrower than the resolved matching-record guards, but it is still a reapplication risk when later canonical guide edits are expected. The next implementation should either fail on any non-package-owned difference or define and test an explicit package-owned merge boundary for existing guides.

### AA-R119 generator gate

The PR133 generator correction is independently accepted by AA-R119 at `f777250e2baf400212d312ba4e9405bd5c358e3d`, with receipt `46f4b50` and evidence at [PR133 review comment](https://github.com/HenryBranchAdams/ai-agents-in-accounting/pull/133#issuecomment-5717601025). The independent evidence reports byte-identical first and second runs for all five outputs, valid 16-source boundaries, malformed-input pre-write failures, 86/86 local tests and CI run `35244204127`.

The current PR132 inventory was written before that acceptance and still says `AA-R119 independent verification pending`. That is stale package annotation, not a reason to duplicate the generator investigation. The final combined edition should reconcile the annotation with the accepted receipt while retaining the snapshot-history gate above.

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

## Checks and external state

- Exact-head CI was inspected once. PR132 points to `d6d991fdf841ad1bfb2629daa148da65be01406d`; verify run [35245095841](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35245095841), job [105283149743](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35245095841/job/105283149743), completed successfully.
- Sandboxed `npm run check` reached 90 of 91 tests; the only failure was localhost bind `EPERM` in the Streamable HTTP test.
- Escalated `npm run check` passed: typecheck, validation, UI and design lint, build, exports, source archive, coverage checks and 91 of 91 tests passed.
- The current build reports 1,074 records, 642 sources, 27 downloads and a 216-file source archive.
- `git diff --check afd2aced307628843f8a26677c3a6fb37fa733e3..HEAD` passed.
- Exact applicator reapplication in a temporary copy passed byte-for-byte on both runs. The intentional guide-field probe above reproduced the residual overwrite behavior.
- No deployment, hosted acceptance, live ERP or market-rate validation, professional accounting review, merge, author-branch update or release publication was performed.

## Conclusion and next actions

The reporting-foundations slice is now internally coherent as a bounded, read-only research package. The inventory, explicit limitations, FX direction, source metadata, arithmetic, retrieval, construction generator import and test evidence are materially improved. The four downgraded families remain real research gaps, not completed answers.

Before closure or final integration, the release owner should:

1. Resolve the `2026-09-17.1` collision in the combined snapshot edition while preserving measured history.
2. Reconcile the stale AA-R119 pending annotation with the accepted receipt.
3. Pursue the four current-authority research routes and capture exact current locators, effective scope, access limits and rights state, or retain the evidence-gap dispositions.
4. Add a guide-level preservation boundary to the applicator if later canonical guide edits must survive package reapplication.

No merge, closure, deployment or author edit is approved by this receipt.
