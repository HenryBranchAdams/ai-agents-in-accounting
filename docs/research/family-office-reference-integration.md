# Family-office source-first reference integration

The requested product is a navigable evidence library for people and agents, not a new course or a second standalone application. This change imports the previously delivered reference package into the existing canonical corpus and server-rendered record pages.

## Reading entry

Start at `/records/collection-family-office-reference`. Forty topic records (`guide-fo-reference-fo-01` through `guide-fo-reference-fo-40`) give a question-led reading sequence, original publisher entry points, source-specific limits and private-context checklists. Twelve context records identify the facts needed before applying guidance. The existing family-office guide, four-entity example, workflow and controls remain intact and linked.

The same canonical records are available through library search, record JSON and Markdown, collection retrieval, the agent API/CLI/MCP, and normal generated exports. No additional database, external API, browser-side corpus index, account system, execution tool or learner state is introduced.

## Identity and content accounting

Baseline: main `275433c2bdf5ce2c806b72c925214b2539577377`, edition `2026-09-21.3`, 1,328 records and 767 sources. The complete source registry was recovered from the exact-head successful GitHub verification artifact because the connector could not read the large registry directly.

The intake has 112 annotated references: 16 resolve to preserved source records and 96 are additions. The import also adds 40 topic guides, 12 context checklists, an ASC topic lookup guide, a research-gap guide and one entry collection. The resulting 151 added records produce 1,479 records and 863 sources in proposed edition `2026-09-21.4`.

Explicit decisions and baseline record hashes are in `data/research/family-office-reference-2026-09-21/reconciliation.json`. URL comparison preserves fragments, distinguishes document and topic identities, and does not treat a publisher's directory as the same source as every document it links. Reused objects are not overwritten; additional discovery observations remain scoped to the reading paths.

All 112 original source annotations reconstruct losslessly from the two source files and package defaults. Their stable JSON SHA-256 is `446f6aad0d606e6cabf474c936f476dc72469d9ad5f35667093ed7b5f03261ac`. The 160 questions are explicitly unanswered discovery prompts, not new supported answers in the research-question registry. Existing named answers and assessment rows are unchanged.

Fifteen historical gap entries are retained. The G12 inability to compare against the full registry is resolved for this pinned integration; this does not resolve its other technical, source-currency, access or professional-review limitations.

## Research boundaries

This integration is not fresh publisher verification. New records use `discovery-imported-not-reverified` and a null top-level review date. Each original discovery date, review extent, observed edition, access condition and rights note remains in the source annotation. Navigation hints are not claim-level verified passages. Topic membership and reading order do not establish applicability, authority rank or completeness.

No external publisher full text or private family data is included. Public access is not a redistribution or model-training permission. The context checklists do not authorize collecting or transmitting confidential documents. Current ASC paragraph access, paid references, later amendments and entity-specific conclusions remain open where recorded.

## Preparation and verification

`node scripts/integrate-family-office-reference.mjs` is a read-only plan by default. `--apply` preflights all identities, references, schema checks, mappings and expected edition before changing canonical records. It retains backups and a write receipt under ignored `outputs/`. Promotion is recoverable and per-file atomic, not a filesystem-wide transaction. Replay is byte-stable; unexpected editions or conflicting objects fail rather than overwrite unrelated work.

The preparation helper uses the existing coverage mapping, snapshot and release generators. It checks that old records, named answers, assessment bytes and prior release/snapshot files are preserved. It wires the small native record renderer into the existing page. A temporary branch-only workflow is used to prepare the edition where npm dependencies are available; it must be removed before merge. It cannot push to main, merge a PR or deploy.

Local execution passed six importer tests and current schema/coverage validation. Local full build, lint, browser verification and committed `npm run check` were not established because project dependencies were unavailable. GitHub job results and the PR description record hosted verification separately. Software checks do not establish professional accounting review or source accuracy.

Required review journeys: enter the collection from library search; follow private-fund activity (FO-13), fiduciary income (FO-22) and tax basis (FO-27); inspect original-source limits; open context requirements; return via native links; repeat at a narrow viewport and without JavaScript. Check API/Markdown/agent retrieval and omitted-context behavior. Do not publish the standalone prototype or treat the previous prototype screenshots as verification of these native pages.

## Coordination

This builds on the accepted source package from issue 163 and the answer-first reading architecture from issue 170. It does not close other research gaps or change the graph, release or evidence-preview assignments. PR 179's edition-preparation work was still separate at the inspected baseline; reconcile version allocation if another content edition merges first. Preserve all immutable releases. No merge or deployment is authorized by this PR.
