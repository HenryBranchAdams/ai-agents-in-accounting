# AA-R126 independent review

Date: 2026-09-17

Issue: #126, US category gap: Assurance and controls

Implementation head reviewed: `06eb804c17e3bdfde4476275dbaa317c5b40f503`

Compared with: `afd2aced307628843f8a26677c3a6fb37fa733e3`

Review branch: `codex/aa-r126-independent-review`

Review worktree: `/private/tmp/aa-r126-independent-review`

Scoped disposition: ACCEPTED PARTIAL CONTRIBUTION, NOT ISSUE-COMPLETE

## Review scope

This is an independent review of the assurance implementation. The author package was not changed. The review covered the original issue criteria, root and public consumer instructions, `docs/corpus-policy.md`, the AA-I126 diagnostic and delivery notes, the four foundation families, imported guides and mappings, the synthetic evidence packet, the citation-budget fix, and the same-build verification output.

The prior AA-R127 receipt `dd61c675260abe35d76408ad2d6d5cfa5312877b` was preserved and not modified.

## A1-A5 assessment

### A1. Inventory, authority, locators, periods, rights, and status

PARTIAL PASS. The package expands the four existing assurance families with eight named questions, source-linked answers, bounded source locators, source checks, declared entity roles, frameworks, periods, access limits, and record-level rights. The family packages and assessments keep the work explicitly partial and retain unresolved rights and professional-review limits.

The source and date metadata findings below prevent treating this as a fully reconciled authority package.

### A2. PCAOB, AICPA nonissuer, and conditional federal-award scope

PASS WITH LIMITS. The package keeps PCAOB issuer and ICFR work, AICPA AU-C nonissuer work, and federal-award compliance or control work as separate contexts. Federal-award routing is conditional on award, role, period, program requirements, and audit trigger. Nacha material remains network-specific. No cross-framework sufficiency conclusion was found.

Evidence: `docs/research/assurance-controls-delivery-2026-09-17.md:7-20`; the context assertions in `tests/assurance-foundation.test.mjs:38-60`.

### A3. Synthetic assertions, contradictions, controls, and limits

PASS. `example-assurance-evidence-packet` is explicitly fictional and uses integer-cent arithmetic, independent populations, duplicate and omission events, backdated and contradictory evidence, stable open exception IDs, separate control design, execution, operating-effectiveness, and local software-test states, and human-only escalation boundaries. It does not post, pay, file, sign, certify, approve remediation, or issue an assurance conclusion.

Evidence: `tests/assurance-foundation.test.mjs:12-60`; packet data in `data/corpus/example.json`.

### A4. Discovery, negative retrieval, and scope counterexample

PASS MANUALLY, WITH A REGRESSION-TEST GAP. Positive search found the packet and the four scoped guide records. A negative search for `PCAOB` within `q-compliance-assurance` returned zero results, which is a useful scope counterexample. Mapping overrides remain shared-context discovery associations and do not grant detailed-industry adequacy.

The committed assurance test covers positive retrieval and source pointers but does not assert the negative family-filter case directly. Keep the manual result as release evidence or add a deterministic regression assertion during integration.

### A5. Preservation, bounded citations, same-build archive, and checks

PASS LOCALLY. The source corpus was preserved; the build produced 1,068 records, 27 downloads, and a 213-file source archive from the same inputs. `npm run check` passed with 84/84 tests, including the three assurance tests. `git diff --check` passed. At `max_chars: 12000`, the context packet used 11,957 UTF-16 code units, retained one citable linked source with zero passages, and reported five omitted linked candidates. This confirms the `b5b85b6` citation-preservation behavior under the exercised budget.

These are local checks only. They do not establish CI, deployment parity, live model calls, external rights clearance, professional review, or production control effectiveness.

## Findings requiring correction or explicit integration treatment

### P1 release metadata regression

`data/catalog.json:3` declares corpus version `2026-09-14.3`, while `data/coverage/research-questions.json:3-5` declares question set `2026-09-11.1`, corpus version `2026-09-11.2`, and review date `2026-09-11`. The compared base carried the newer `2026-09-14.2` research-question metadata, so this head regresses the public research package version. The built `/downloads/research-questions.json` repeats the stale values, while the main agent envelope and other downloads use `2026-09-14.3`.

The importer hard-codes the stale values at `scripts/import-research-packages.mjs:6,61,95`, so a clean replay can reproduce the regression. Reconcile the research-package version with the release/catalog policy, or document and test an intentionally independent version scheme, before release integration.

### P2 package source-index omissions

The top-level `source_ids` for `guide-q-controls-fraud` includes `src_0vf7hhg`, but its package-level `data.source_ids` does not. The top-level `source_ids` for `guide-q-professional-governance` includes `src_cfr200grants`, but its package-level `data.source_ids` does not. The individual question citations do reference these sources. Current record-page navigation uses the top-level list, so the omission did not break the exercised runtime citation path, but package consumers that use the family data index can miss cited sources. Add a consistency check and reconcile the imported indexes.

### P2 canonical source-review and effective-period mismatch

The canonical source records used by the new packages retain top-level `reviewed_at: 2026-09-11`, generic or abstract-level `data.source_review` evidence, and structured `effective_period: null`, while the family packages carry 2026-09-17 checks and more precise locators. `src_1rr48dm` also retains canonical status `Through Apr 2026`, while the new package describes the AICPA currently-effective page as current through August 2026. The package does preserve the effective-period notes in its bounded family locators and does not claim rights or professional verification, but the canonical and package-level currency records are not reconciled.

Resolve the source-specific date/status conflict and either update the canonical structured effective periods or preserve an explicit unknown/conditional explanation that downstream consumers can see at record level.

## Remaining gates

- Reconcile the stale research-question corpus version and importer-owned dates before release.
- Reconcile the two package source indexes and canonical source-review/effective-period metadata.
- Integrate the eight named questions, four partial assessments, mappings, catalog counts, and the next coverage snapshot in the orchestrator-owned release history. The delivery note correctly leaves this outside the worker branch.
- Preserve the explicit partial status, shared-context routing, unresolved rights, human review boundaries, and synthetic-only evidence limits in the final catalog and public exports.
- Keep deployment, CI, external source rights, and professional acceptance separately verified.

No merge, push, PR, GitHub comment, issue closure, deployment, catalog edit, or snapshot edit was performed. This file is the only change on the independent review branch.
