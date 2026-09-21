# AA-R143 independent review receipt

Review date: 2026-09-19

This is an independent review of PR143 against [issue #124](https://github.com/HenryBranchAdams/ai-agents-in-accounting/issues/124). The review used an isolated checkout at source commit 137e04f795c05562207692097c8c034edd4af3d1, tree 19e4b1450f48d1e5dc74122dc4d52b2226dc6d9e, with base a38de707. The author checkout at /private/tmp/aa-i124-completion and branch codex/aa-i124-completion were not changed.

## Disposition

- Exact-source-head acceptance: PASS for the selected AA-I124 package scope at the supplied exact head.
- Current-main integration: ACTIONABLE DEPENDENCY. There is no current-main integration receipt for PR143.
- Issue closure: separate from this source acceptance and remains a coordinator or owner decision after conflict-aware integration and the issue criteria are considered.
- Coverage: all ten package questions remain explicitly partial. No professional signoff, production evidence, whole-family completeness claim, or current-main acceptance is asserted.
- Perfect evidence: optional follow-on evidence, not a condition of this scoped source acceptance.

The exact-head conclusion is bounded to the selected ten questions and to the canonical evidence present in PR143. It does not accept the old-base tree as a replacement for accepted education material now present on main.

## Issue scope and coverage

The review compared the package with the original issue criteria A1 through A5:

- A1: the packet inventories ten reusable US questions and declares the role, framework, period, and population for each.
- A2: the answers carry source IDs, original publisher URLs, locators, effective-period or access limits, review dates where known, and rights status. Source rights remain unknown and external full text is not stored.
- A3: each question has inputs, treatment or workflow, controls, and a labeled synthetic or illustrative boundary where applicable.
- A4: unresolved exceptions, professional-review limits, and empirical-support limits remain explicit. Every package assessment is partial, professional review is not performed, and empirical support is not established.
- A5: the retrieval and counterexample checks below exercised role-qualified searches. The package was rebuilt into downloads and the source archive, and local and CI checks were kept distinct from deployment evidence.

The selected questions are:

1. Nonprofit grants and contributions: nongovernmental nonprofit recipient or federal-award pass-through, FASB Topic 958 and 2 CFR 200, illustrative 2026.
2. Government funds: state or local general-government fund and government-wide activities, GASB 34 and GASB 103, fiscal years after 2025-06-15.
3. Federal sovereign reporting: US federal component, FASAB SFFAS 34 and 53, with net-cost to net-outlays reconciliation.
4. Insurer reporting: insurer reporting to a state regulator, NAIC SAP and state practices, with separate US GAAP treatment.
5. Credit intermediation: eligible domestic bank or savings association, FFIEC 051, December 2025 instructions.
6. Funds and custody: SEC-registered or required adviser with client funds or securities, custody-rule boundary, current eCFR read on 2026-09-19.
7. Rate regulation: FERC-jurisdictional electric utility or licensee, 18 CFR Part 101, Title 18 access through 2026-09-17.
8. Natural resources: SEC oil and gas resource owner, excluding a support contractor, 17 CFR 210.4-10 and the ASC 932 route.
9. Reimbursement: Medicare hospital or provider using CMS-2552-10, 42 CFR 413.24 and CMS instructions, with form-period and Transmittal 25 limits.
10. Licensed content: nongovernmental US GAAP IP licensor, original ASU 2014-09 and its May 2014 amendment.

The package does not claim the omitted branches are solved. They include current consolidated ASC and later amendments, state insurer adoption and individual SSAP application, lender CECL and servicing, fund NAV and broker-dealer reporting, digital-asset custody, actual FERC orders and recovery facts, current resource rules beyond the selected oil and gas route, mining and agriculture, actual CMS or MAC facts, legal IP rights and usage evidence, a 50-state survey, international coverage, professional signoff, or production operations.

The authority boundary was checked against the packet and the official references. FERC Part 101 is a current eCFR reference for the selected utility role; the SEC custody rule was read as a current eCFR reference on the review date; the NAIC SAP page records its 2026-06-23 update and explains state-law, prescribed, and permitted-practice differences; the oil and gas question uses the 2025 CFR text because current eCFR access failed for that check. These limits stay visible in the records rather than being converted into current or universal claims. References inspected include [FERC Part 101](https://www.ecfr.gov/current/title-18/chapter-I/subchapter-C/part-101), [the SEC custody rule](https://www.ecfr.gov/current/title-17/chapter-II/part-275/section-275.206%284%29-2), [the NAIC SAP overview](https://content.naic.org/insurance-topics/statutory-accounting-principles), and [2025 CFR 17 CFR 210.4-10](https://www.govinfo.gov/content/pkg/CFR-2025-title17-vol3/pdf/CFR-2025-title17-vol3-sec210-4-10.pdf).

## Independent checks

The exact-head checkout installed its dependencies independently and ran npm run check. The result was 145 tests passed and 0 failed, including the real Streamable HTTP MCP listener after the loopback permission needed by that test was available. The generated build reported 1,113 records, 29 downloads, and a 298-file multipart source export. A fresh GitHub verify run for the exact PR commit also succeeded: [run 35451379096](https://github.com/HenryBranchAdams/ai-agents-in-accounting/actions/runs/35451379096).

Actual retrieval checks used the built search path rather than only inspecting fixtures:

- GASB governmental fund returned the GASB source, the government-funds question, the package guide, and related reporting material.
- FASAB federal budget reconciliation returned the federal source, the federal-sovereign question, the package guide, and related reporting material.
- Provider Medicare cost report returned CMS sources and the reimbursement question without surfacing the insurer package as a false match.
- Provider Medicare insurer reserve accounting returned the package guide with the explicit insurer-exclusion context.
- Unregulated electricity sales rate regulated returned the rate-regulation package with its exception context.
- Custody ownership and client ledger searches returned the custody example and package guide.

Independent accounting probes exercised three separate 100,000 cases. A customer prepayment ended with 100,000 cash, 100,000 revenue after assumed performance, and no remaining liability. An unrestricted and unconditionally available contribution ended with 100,000 cash and contribution revenue, with no restriction-release entry. A 100,000 legislative appropriation produced budget authority only, with no cash or revenue entry. A separate 250,000 custody probe kept the owned investment asset at the entity level and the client amount in the client subledger without double counting. All ten questions contain nonempty inputs, workflow, and controls. The controls also require role and framework review, separate reconciliation of the independent cases, and no combination of budget authority with financial-statement revenue.

## Importer and history checks

Using a clean a38de707 base harness and the packet and importer copied from the exact head:

- Fresh integration completed and added the ten partial questions, package records, four new sources, the example, guide links, mappings, and assessments.
- Replay of the same importer completed with no byte changes after the first integration.
- A deliberate same-ID source-title conflict failed with Refuse overwrite of src_aa_i124_ferc101, and before and after hashes showed no partial write.
- The prior snapshot objects were compared independently and all 25 pre-existing snapshot objects remained byte-identical.
- The package importer is additive and preserves existing records and history. The general importer was not treated as evidence of this package acceptance.

## Release, source, and reconstruction checks

The final 2026-09-19.124 build was checked as one build output:

- The released corpus contained 1,113 records and its bytes matched dist/client/downloads/corpus.json.
- The final corpus hash was e7087f2b7ffc6feb68f897a0a070f56d5383c6da7bef2c46ba0c98ec50ecfa18.
- The source manifest recorded 299 source files, 298 included files, two ordered parts, and one release corpus file supplied by the release bundle.
- The reconstructed source archive was 39,383,842 bytes with SHA-256 be83d070cf9a14f1f869db8651441e3cf5fa8bb3dcdf429e93409447e03abcaa.
- Per-asset membership bytes and hashes, part offsets and limits, archive membership, and the omitted release corpus provider were independently checked.
- The actual reconstruction script produced the same archive hash, and unzip integrity and the 298-entry archive listing passed.
- The 2026-09-18.124 release also reconstructed and matched its own recorded corpus hash. Its 16-line record-history artifact and the final release's generated zero-line record-history artifact remained aligned with their release manifests.
- git diff --check passed.

The source archive and corpus checks are evidence of this generated build. They do not establish source rights beyond the unknown rights recorded in the source records, and they do not establish professional or production verification.

## Current-main integration dependency

The current-main target supplied for this update is commit fc78d465c6a3cfb7f42f0fc72f2f1fe8deea238e with tree ec1f4699cf4a87c923dfdde14e8f9e6a156c5b76 and corpus edition 2026-09-19.1114. Its corpus and test files are exactly the reviewed 5810c8c state. The only changes from that reviewed state are three coordination documents:

- docs/research/aa-audit-closure-2026-09-18.md added
- docs/research/orchestration-handoff-2026-09-17.md added
- docs/research/us-backlog-execution-2026-09-16.md modified

No corpus or test file changed in that comparison. The accepted education drafts and release history are therefore part of the current integration state and must be preserved.

The old-base PR head cannot be used as a current-main integration receipt:

- git merge-tree --write-tree fc78d465c6a3cfb7f42f0fc72f2f1fe8deea238e 137e04f795c05562207692097c8c034edd4af3d1 reports conflicts in data/catalog.json, the canonical data/corpus and data/coverage files, data/releases/index.json, and four test files.
- Running the AA-I124 importer against current main fails before writing because it refuses integration into a different edition. The before and after hashes of the canonical and accepted education files were identical.
- The old-base PR diff contains education release and history changes relative to current main. Treating that tree as a replacement would risk removing accepted education artifacts and current coordination documents.

The required follow-up is a conflict-aware additive integration on current main that preserves corpus edition 2026-09-19.1114, accepted education records, all education drafts and release history, and the three coordination documents. That follow-up must produce its own current-main integration receipt. This review did not rebase, mutate, merge, or close anything.

