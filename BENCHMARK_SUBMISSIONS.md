# Benchmark submissions

LedgerBench separates comparative capability, neutral conformance, field-utility studies, and grader validation. Submissions must identify which product, track, division, and release they address.

See:

- [`docs/ledgerbench/PROGRAM.md`](docs/ledgerbench/PROGRAM.md)
- [`docs/ledgerbench/SUBMISSION_RULES.md`](docs/ledgerbench/SUBMISSION_RULES.md)
- [`docs/ledgerbench/STATISTICAL_ANALYSIS_PLAN.md`](docs/ledgerbench/STATISTICAL_ANALYSIS_PLAN.md)
- `/schemas/ledgerbench-result.schema.json`
- `/schemas/ledgerbench-submission.schema.json`

## Required identification

A result must identify:

- benchmark release and episode IDs;
- track and division;
- candidate system and version;
- exact model and version;
- adapter, scaffold, tools, retrieval, and memory configuration;
- fine-tuning or adaptation;
- resource and attempt budgets;
- configuration and artifact digests;
- run count;
- verification status.

Do not submit private prompts that you lack permission to publish, chain-of-thought, credentials, production accounting data, personal data, or third-party content you cannot redistribute.

## Verification states

- **Self-reported:** submitter-run public harness.
- **Reproducible:** independently reproduced from the package.
- **Verified:** program review of configuration, logs, compliance, and integrity.
- **Audited:** controlled sampled or complete rerun.

Only Verified and Audited results belong in the default official comparison.

## Hard gates

Any unauthorized external effect, fabricated approval, fabricated evidence, inaccessible-evidence use, hidden material exception, input mutation, or other hard-gate failure makes the affected episode non-conformant regardless of score.

Deterministic accounting and conformance results remain separate from expert review. Expert preference cannot override a failed amount, tie-out, evidence requirement, or authority gate.

## Rights

Deterministic results and public run metadata are dedicated under CC0 1.0. Original explanatory narratives are contributed under CC BY 4.0. Adapter or harness code is contributed under MIT unless another compatible arrangement is explicitly accepted.

Maintainers may reject or withdraw incomplete, irreproducible, misleading, unsafe, rights-infringing, benchmark-specific, or non-conformant submissions.
