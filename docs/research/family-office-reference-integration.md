# Family-office source-first reference integration

The requested product is a navigable evidence library for people and agents, not a course or a second standalone application. This change integrates the previously delivered reference package into the existing canonical corpus and server-rendered record pages.

## Start here

Open `/records/collection-family-office-reference` through the existing library or collection search. Forty topic records (`guide-fo-reference-fo-01` through `guide-fo-reference-fo-40`) supply question-led reading sequences, original publisher entry points, source-specific limits and private-context checklists. Twelve context records identify facts needed before applying guidance. The original family-office guide, four-entity example, workflow and controls remain unchanged and linked.

The same canonical records are available through library search, record JSON and Markdown, collection retrieval, the agent API/CLI/MCP, and normal generated exports. No additional database, external API, browser-side corpus index, account system, execution tool or learner state is introduced. The standalone prototype is not deployed or duplicated in this repository.

## Identity and content accounting

Integration baseline: main `275433c2bdf5ce2c806b72c925214b2539577377`, edition `2026-09-21.3`, 1,328 records and 767 sources. The complete registry was recovered from the exact-head successful GitHub verification artifact because the connector could not read the large registry directly.

The 112 annotations resolve to 16 preserved source identities and 96 new source records. The integration also adds 40 topic guides, 12 context checklists, an ASC topic lookup guide, a research-gap guide and one collection. These 151 added records produce 1,479 records and 863 sources. These are discovery counts, not evidence of accounting sufficiency.

Explicit reconciliation decisions and baseline object hashes are in `data/research/family-office-reference-2026-09-21/reconciliation.json`. URL comparison preserves fragments and distinguishes document/topic identities. A publisher directory is not automatically the same source as every linked publication. Reused source objects are not overwritten; additional observations remain scoped to discovery annotations and reading paths.

All 112 original source annotations reconstruct losslessly from the two source files and package defaults. Their stable JSON SHA-256 is `446f6aad0d606e6cabf474c936f476dc72469d9ad5f35667093ed7b5f03261ac`. The 160 prompts remain explicitly unanswered, outside the supported-answer registry. Existing named answers and assessment rows are unchanged.

The package retains fifteen historical gap entries. G12's inability to compare the full registry is resolved for this pinned integration; no technical, source-currency, access or professional-review gap was closed by that comparison. Original portable-package status strings describe the earlier source snapshot, not the current integration disposition.

## Edition history

Edition `2026-09-21.4` first integrated the records. Full preflight identified two unsynchronized current metadata headers: `assessment_version` and `question_set_version`. Edition `2026-09-21.5` corrects those headers and regenerates the current mappings, coverage snapshot and release through the repository generators. The question and assessment row contents did not change.

Both .4 and .5 snapshots/releases are retained. The earlier .4 files are not overwritten or presented as a successful complete release verification. The .5 change history compares to .4 as its immediate predecessor. Every pre-existing release and historical snapshot is preserved. A passing build is not public deployment.

## Research boundaries

Integration is not fresh publisher verification. New records use `discovery-imported-not-reverified` and a null top-level review date. Original discovery dates, review extents, observed editions, access conditions and rights notes remain in each annotation. Navigation hints are not verified claim-level passages. Topic membership and reading order establish neither applicability nor authority rank nor completeness.

No publisher full text or private family data is included. Public access is not a redistribution or training permission. Context checklists do not authorize collecting or transmitting confidential documents. Current ASC paragraph access, paid references, later amendments and entity-specific conclusions remain open where recorded.

## Import and maintenance

`node scripts/integrate-family-office-reference.mjs` produces a read-only plan by default. `--apply` preflights identities, references, schemas, mappings and the expected edition before altering canonical records. It retains backups and a write receipt under ignored `outputs/`. Promotion is recoverable and per-file atomic, not a filesystem-wide transaction. Unexpected editions and conflicting objects fail rather than overwrite unrelated work. Replay against the integrated .5 edition is byte-stable.

For future amendments use the repository's current edition-preparation workflow and allocate a new edition after reconciling main. Do not blindly rerun a historical import against a newer corpus. Refresh explicit reuse hashes only after reviewing the changed source, not to bypass the conflict guard.

A temporary workflow restricted to the authorized PR branch decoded the verified JSON intake and performed canonical preparation in an environment with npm dependencies. The decoded research files are ordinary readable JSON. All transport chunks, the temporary branch-writing workflow and both one-shot preparation/correction helpers were removed from the final change. The guarded importer remains; normal repository CI performs verification. No permanent workflow or new dependency is added.

## Verification evidence and review

Six importer tests cover lossless annotations and counts, reference integrity, URL and object safety, read-only planning, preservation of existing source objects and named answers/assessment rows, edition headers, byte-stable replay and refusal of unexpected editions or late conflicts. They passed locally and in the hosted canonical-preparation step. Current corpus/schema validation and hosted lint, typecheck and design-rule probes passed during preparation of .5.

Four additional native reading tests cover the collection and topic/context links, FO-13/22/27 source entry points and limits, private-context and ASC boundaries, Markdown preservation and bounded agent retrieval with explicit omissions. Their built execution and the complete committed suite are reported in PR #181 and its CI runs. Do not infer a pass from the test file's presence.

The local environment could not install npm dependencies. Hosted build output is the basis for any native browser inspection; the earlier standalone prototype screenshots are not verification of these pages. Local focused tests, hosted preparation, final PR CI, browser review, professional accounting review, merge and deployment are separate statuses. Consult the latest PR verification comment for tested commit IDs and actual outcomes.

Review journeys: find the collection through library search; follow FO-13 private funds, FO-22 fiduciary income and FO-27 tax basis; inspect an original-source link and its scope/access note; open private context requirements; return through native links. Repeat at narrow widths and with JavaScript disabled. Check record JSON, Markdown, agent retrieval and omission reporting.

## Coordination

This builds on issue 163's family-office package and issue 170's answer-first reading architecture. Main advanced to `ba8be737bba6a4c71be508f7bd6eec8599de8e89` with release infrastructure while the PR was being prepared; that change did not allocate a different corpus edition. Final PR CI must test the integration with current main. Graph, evidence-preview and other research assignments remain separate. No unrelated issue is closed, no merge is performed and no deployment is authorized by this PR.


## Combined-release amendment

The active five-issue assignment now includes this PR by explicit maintainer instruction. Astra retains ownership of shared corpus editions and publication. Main `f9024592d158ddc4cd28f8c29959e2f710a4d1bb` was merged into this branch without conflicts. Its successful 404-test main run verifies that earlier source revision, not the larger family-office corpus or the eventual combined UI.

Review identified that a caller-supplied `--edition` could bypass the historical edition boundary. The importer is now pinned to its original `.5` target; later amendments must use the current edition-preparation path. Tests exercise refusal for both older and newer requested targets, and historical-import fixtures explicitly pin their own header so future corpus editions do not silently authorize import into production data.

Preserve both `.4` and `.5` historical bytes. The final research edition must follow `.5`. Recheck source identity conflicts, combined retrieval/exports, graph density, page and browser behavior, artifact sizes and release timings against the eventual combined corpus. Existing CI or review does not prove those future inputs. Native browser review and final publication remain pending.
