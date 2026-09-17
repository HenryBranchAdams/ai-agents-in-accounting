# AA-I119 and AA-I125 integration receipt

Date: 2026-09-17

## Integration boundary

This integration starts from main commit `fee5cdbc81b2dfacbc43ff8b9356ee853ca11188`, whose tree was checked against accepted PR128 merge `99f69ec37dcec8480c6d8e018c333373102a69e4` and matched exactly. The one main CI inspection was workflow run `35258672776`, which completed successfully for that commit.

Accepted package inputs were:

- AA-I119, PR133 head `f777250e2baf400212d312ba4e9405bd5c358e3d`, reviewer receipt `46f4b50`, plan comment `5713907586`, reviewer comment `5717601025`.
- AA-I125, PR135 head `d78b04d1676495740c6e462c40472c044ab2285e`, reviewer receipt `51bf93b`, plan comment `5713940716`, reviewer comment `5717669758`.
- Shared coordination protocol comment `5713891954` and planning index comment `5714122707`.

Both accepted heads were based on older repository state. Their package-owned records, importer, generator, tests and evidence were reconciled by stable ID and explicit input ownership. Stale wholesale deletions from those branches were not carried forward. The current nonprofit records, outgoing release history and gzip compatibility behavior from main remain present.

## Resulting edition

The integration owns catalog and release metadata for `2026-09-17.2`:

- 1,095 canonical records across 13 record files, including 645 sources, 187 guides, 80 workflows, 23 controls and 11 examples.
- 191 named research questions.
- 96 subsector profiles and 5,952 applicability screenings, with the prior 1,012 individual industry exception reviews retained.
- Eight scoped assessments.
- 27 downloads and a 245-file source archive from the final build.
- Snapshot `2026-09-17.2` records 1,095 records and eight scoped assessments.

The source release is `data/releases/2026-09-17.2/`. The prior `data/releases/2026-09-17.1/` release was compared byte-for-byte with the base main tree and remains unchanged. The new release manifest records the corpus JSON, gzip, JSONL, change and record-history hashes.

## AA-I119 package coverage

The operating-transaction package adds six bounded US nongovernmental accrual-basis seller and buyer question families for revenue, project WIP, purchasing and payables, receivables and credit, cash and settlement, and inventory. It includes five new FASB source records, six canonical guides, seven workflows, seven controls, two synthetic ledger examples, three research fixtures and twelve named questions. The accepted explicit source scopes for NAICS guides 236, 237 and 238 are retained by the hardened coverage generator and mapping overrides.

The package tests cover retrieval, direct source pointers, synthetic ledger arithmetic, counterexamples, exclusions, source review scope and clean generator replay. The scope excludes bank lending, insurer contracts and governmental fund accounting. It does not claim current consolidated Codification review, professional sign-off, production population validation, operating effectiveness or empirical agent performance.

## AA-I125 package coverage

The management-accounting package adds bounded cost allocation, planning and performance guides, the importer-owned input packet, the source-linked registry and scoped assessments. Its synthetic example reconciles a 120,000 cost pool, 72,000 and 48,000 allocations, a 36,000 and 84,000 headcount sensitivity, and a 100,000 to 99,000 budget-to-actual revenue bridge with volume of negative 10,000 and price of positive 9,000. It includes direct retrieval fixtures, a 2 CFR and FAR counterexample, and explicit management-versus-external-reporting boundaries.

The importer keeps its strict default newer-state rejection. The explicit `--integrate-into-newer-corpus` mode was added only for this bounded integration and preserves newer main metadata and unrelated IDs while retaining nested package-owned date guards. Source rights, current consolidated guidance, professional review, production validation and empirical performance remain unresolved.

## Reconciliation and verification

- Canonical corpus IDs were checked globally for duplicates, and preserved nonprofit IDs were checked alongside both accepted packages.
- The corrected generator was replayed twice through the package test, including explicit construction source scopes and catalog-version metadata.
- The management importer was run against the integrated tree, and strict and integration-mode harness tests passed.
- `npm run check` passed: 100 tests, typecheck, corpus validation, UI lint and design lint. The first sandboxed run could not bind the local HTTP test socket; the escalated rerun passed the same full check.
- `git diff --check` passed.
- No merge, issue closure, deployment or PR133 or PR135 closure was performed. This receipt does not assert publisher rights, professional acceptance or production readiness.
