# Assurance and controls delivery note

This note records the AA-I126 implementation surface for assurance and controls research. The canonical content is in the foundation packages, imported guide records, synthetic example, coverage assessment, and tests. This note is a navigation and limits record, not a standalone accounting memo.

## Scope and context routing

The package keeps three US contexts separate:

- PCAOB-governed issuer audit and ICFR work.
- AICPA AU-C nonissuer audit work, with SAS 142 and SAS 145 effective-period limits retained.
- Federal-award compliance and internal-control work only when the award, entity role, period, program requirements, and audit trigger require it. The current eCFR and Yellow Book are not generalized to every grant or entity.

The four importer-owned families are linked to the same synthetic packet but retain distinct questions and limits:

| Family | Canonical package | Added coverage |
| --- | --- | --- |
| Audit assertions | `q-audit-assertions` | Assertion-to-evidence matrix, recorded versus omitted testing, system-generated evidence, contradiction preservation |
| Controls and fraud | `q-controls-fraud` | Design versus execution versus operating effectiveness versus local software test, override and contradiction routing |
| Compliance assurance | `q-compliance-assurance` | SOC versus federal-award scope gate, 2 CFR trigger boundaries, exception and scope-limitation preservation |
| Professional governance | `q-professional-governance` | PCAOB/AICPA/government routing, named human decisions, SQMS No. 1 versus QC 1000 effective dates |

## Canonical pointers

- Importer input: `data/research/foundations.json`, family records near the four named `family_id` values.
- Imported reading records: `data/corpus/guide.json`, `guide-q-audit-assertions`, `guide-q-controls-fraud`, `guide-q-compliance-assurance`, and `guide-q-professional-governance`.
- Shared worked material: `data/corpus/example.json`, `example-assurance-evidence-packet`.
- Discovery associations: `data/coverage/mapping-overrides.json`, `example-assurance-evidence-packet` and the four guide IDs.
- Scoped assessments: `data/coverage/assessments.json`, IDs beginning `coverage-assurance-`.
- Retrieval and counterexample checks: `tests/assurance-foundation.test.mjs`.

## Evidence, rights, and human boundaries

The source records preserve official PCAOB, AICPA, GAO, and eCFR publisher URLs, source IDs, effective-period notes, and bounded locators. Full licensed standards text is not stored. Source status, reuse permission, and professional applicability remain source-specific and are not inferred from an open publisher page.

The synthetic packet uses integer cents and stable event IDs for duplicate, omitted, backdated, and contradictory evidence. Its control records state `design_status`, `execution_evidence`, `operating_effectiveness`, and local `software_test` separately. A passing fixture is not live evidence. No packet action posts, pays, files, signs, certifies, approves remediation, or issues an assurance conclusion.

The assessments are partial, shared-context routing anchors. They do not establish industry-wide coverage, sample adequacy, source reliability, professional sufficiency, control operation, federal-award applicability, or empirical model performance. The industry codes are used as explicit coverage anchors and must not be read as descendant-industry claims.

## Local verification

The intended local sequence is:

1. `node scripts/import-research-packages.mjs`
2. `npm run coverage:map`
3. `npm run check`

The importer owns the generated guide, source, mapping, and research-question files. Build output and the source archive must be produced from the same canonical inputs. A passing local check proves the repository checks exercised here only. It does not prove CI, deployment, a live model call, an engagement review, or external professional acceptance.

The release/catalog version and final snapshot reconciliation remain orchestrator-owned. This worker branch does not publish, merge, close the issue, or claim deployment.
