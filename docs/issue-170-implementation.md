# Issue 170 implementation and verification

## Baseline and route plan

Starting checkout: clean `main`, `120e658abb74faa41ed3ac9a321973009853e551`. Node 22.23.1. Canonical edition and observed public `/api/v1/meta` edition: `2026-09-19.12427`, 1,328 records. Public source revision is not inferred from edition parity. Issue 170 body/comments and issue 100 body/two comments refreshed September 21, 2026.

`npm ci` passed. Baseline terminal outcomes are recorded below. Other local listeners (including 5177 and 4187) remain untouched; this task uses port 4170.

Browser plugin not available. Playwright Chromium captured and inspected the public homepage, `src_0vf7hhg`, and `guide-construction-connected-close` at 1440×1000 and 390×844. Evidence: `/tmp/issue170-evidence/before-live-*.png`. The mobile construction viewport contains summary and administration but no worked answer. The desktop homepage defaults to records. No document overflow appeared in those six captures. These are live baseline observations, not final local verification.

Plan: unfiltered `/` becomes editorial; any root query state retains library semantics, including empty `q`. `/library` explicitly browses everything. Search/filter/pagination remain native GET URLs. Existing record IDs and anchors remain. Add optional reading fields inside `data.editorial_brief`; keep question/answer/findings/unknowns/reading order and all existing construction questions. Main explanation precedes administration; complete details close by default. Source restrictions remain at publisher and export actions. HTML and Markdown use the same canonical explanation. A build report compares explicitly declared SHA-256 dependencies without changing conclusions or source review status.

The two pilots are `wf-r2r-bank-reconciliations` and `guide-construction-connected-close`, using the existing `example-construction-contract-ledger` estimate-only branch. All IDs confirmed. The latter keeps the July base and independent branches separate. All four issue 100 gaps remain open.

Official shadcn inventory, registry search, component docs (Table/Card/Alert/Field), dry run and diff inspected. Retain installed components: the registry overwrite would remove the labeled keyboard-focusable Table container. No primitive replacement or license change is needed. Preserve server-rendered content and the existing navigation-only hydration boundary, applying the relevant React serialization guidance without a framework change.

## Baseline terminal outcomes

Initial baseline: 367/370 tests passed. One MCP HTTP test hit `listen EPERM`; two source-archive tests were invalidated by this task adding/removing its draft files during the run. This was a coordination error, not a pre-existing repository defect. Restored the clean tree: the archive membership check passed, then both the MCP HTTP test (with loopback permission) and deterministic source-export test passed. Baseline lint/build had passed; `npm run qualify` passed separately. The initial full command is recorded as failed, not retroactively labeled green. Final checks will run against a frozen source tree.

The outgoing 2026-09-19.12427 canonical records exactly match the existing retained release snapshot. Preserve those bytes. The first local editorial draft is 2026-09-21.1; record schema remains 2.0.0 because the existing open kind-specific data contract permits optional additive fields. A corpus edition is not a schema or deployment version.

Selected sources inspected September 21: PCAOB AS 1105 .06/.08/.29 and AS 1215 .04/.06/.06A; original ASU 2014-09 Section A, ASC 606-10-25-35 and 45-1–45-4; KPMG December 2025 section 13.4.20. EY's September 2026 PDF could not be reopened through the browser fetch. Retained claims identify the prior September 14 selected review and its exact locators, rather than claiming a fresh verification. No canonical source review status, rights or full-text holdings changed.

Bank opening: approximately 62 words; main explanation: approximately 390 words before tables/evidence. The small shortfall from the approximate 400-word target is intentional: adding generic control prose would weaken this narrow example. Construction opening: approximately 70 words; main explanation: approximately 410 words. Tables provide the numerical bridge and concrete responsibility boundaries separately.

## Acceptance evidence

Final candidate: corpus `2026-09-21.3`. The generated, unpublished `.1` and `.2` drafts is retained as immutable predecessors. No local draft edition has been published. No records were added or removed. Only the two pilot records changed; their rights, provenance, publisher URLs and review status remain unchanged.

| Acceptance criterion | Implementation and evidence |
| --- | --- |
| Editorial entrance and complete library | `/`, `/library`, `/briefs`; `src/pages/home.tsx`; route and query tests in `tests/editorial-reading.test.mjs`; home/library/results screenshots |
| Three reading depths | `src/components/brief-reading.tsx`, existing `renderBrief()` in `src/pages/record.tsx`; answer, limitation, worked example and responsibilities precede administration; order assertions and pilot screenshots |
| Two substantive pilots | `wf-r2r-bank-reconciliations`, `guide-construction-connected-close`; arithmetic tests compare the existing `example-construction-contract-ledger`; duplicate fee and late invoice exceptions remain visible |
| Evidence distinctions and local restrictions | Claim classifications, canonical source links, passage locators, visible synthetic/proposed labels, source access text; no review-status upgrades; issue 100 remains unresolved |
| Complete records and compatible retrieval | Existing anchors and closed complete-record disclosures; native GET search; legacy root query tests; complete suite covers HTML, Markdown, JSON, API, CLI, MCP, rights, provenance and read-only methods |
| Additive model and dependency maintenance | Optional `editorial_brief.reading` schema/type; declared SHA-256 dependencies; unchanged, changed and missing dependency tests; build output and `/downloads/maintenance.json` report editorial status |
| Required checks | Node 22.23.1, `npm ci`; unchanged lint and violation probes; final full check log in the attached local evidence directory records the terminal result |
| Browser verification | Playwright fallback because Browser tools/skill were unavailable; actual Chromium interactions at 1440×1000, 390×844 and 320×844; screenshots and `qa.json`; baseline captures are public, final captures local |
| Review package | This note, source/tests/canonical records, generated historical snapshots and release files, contributor/design/release guidance, and `docs/issue-170-pr.md` |
| Human acceptance and resolution | Pending genuine human feedback. Hosted CI, remote PR, merge and deployment have not been performed. No issue was closed. |

The browser inspection covers the home, library/results, both pilots, ordinary source, unedited workflow, collection, coverage, changes, maintenance and use pages. It checks skip navigation, focus, mobile dialog containment, Escape and focus restoration, disclosures, GET filtering/pagination, empty-state recovery, no-JavaScript navigation/search, downloads, failed requests and console output. The two pilots show substantive answers in their first mobile viewport. An overflowing source-type badge and the empty-results recovery destination were corrected after inspection. The responsibility table now wraps text and retains keyboard scrolling at narrow widths.

The [unslop writing gate](https://github.com/cursor/plugins/blob/main/pstack/skills/unslop/SKILL.md) was applied to new homepage and pilot copy. The pass removed the generic homepage slogan, simplified prose, used straight quotation marks and preserved accounting distinctions and source-access qualifications. Historical source records and quoted source material were not rewritten for style.

## Human review script

1. From the homepage, find a relevant explanation without knowing a record type or classification code.
2. After about a minute on a pilot page, explain what the agent would do, where its authority stops, and what the evidence does not establish.
3. Find support for a material claim and identify its relevant limitation.
4. Reach the complete library and narrow it to a specific task or source.

Human acceptance is pending. Agent inspection and automated checks do not substitute for this review. Issue 170 requires merge, recorded checks/browser evidence and maintainer acceptance before resolution. Issue 100 remains open.

The first final-check attempt exposed stale edition references in coverage registry headers. Corrected them and regenerated the two derived subsector files with the existing generator. Their assessments, questions, mappings and review dates are unchanged. Edition `.3` preserves the earlier `.1` and `.2` snapshots; final checks were rerun without changing existing assertions.

Local evidence directory: `/Users/henryadams/.codex/visualizations/2026/09/21/01a0c4fe-48f1-7201-9d72-bc3b50b2b382/issue-170/`. Open `verification.md` for terminal results and screenshot links. The completed `.2` check had 369/376 passing tests; all seven failures concerned the edition metadata corrected in `.3`. No existing test was weakened.

The corrected pre-commit run passed all 376 tests and all lint checks. Release qualification then stopped at its required clean-commit assertion. The implementation is therefore committed on a local review branch and the full check is run again against that exact source revision. This local commit does not authorize or perform remote publication. Final terminal status is recorded in the evidence directory's `verification.md` and complete check log.
