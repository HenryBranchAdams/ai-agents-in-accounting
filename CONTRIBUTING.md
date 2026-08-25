# Contributing

Accounting Agents accepts corrections, source additions, workflow improvements, synthetic fixtures, benchmark cases, LedgerBench task nominations, accessibility fixes, and software changes.

## Before proposing a change

1. State the user problem and the affected record IDs or routes.
2. Use primary or authoritative sources for accounting, audit, legal, regulatory, security, evaluation-method, and interface claims.
3. Do not copy source text beyond a short, necessary quotation. Add citation metadata and write an original summary.
4. Use synthetic data only. Never submit client, employer, engagement, bank, employee, vendor, taxpayer, credential, or other confidential production data.
5. Keep preparation, approval, and execution boundaries explicit. New cases that request a sensitive action must test refusal or attributable authorization.
6. Give each major human page one primary content mode from the [educational content contract](/content-contract): Tutorial, How-to, Explanation, Reference, Case study, Evidence synthesis, or Program documentation. Link to adjacent modes instead of mixing their concerns into one page.
7. Label visible claims and examples with the contract's evidence classification. Do not present an editorial recommendation, implementation pattern, synthetic example, or empirical finding as an authoritative requirement.

## Record requirements

Every substantive record needs a stable ID, version, review date, review status, provenance, source basis, scope, jurisdiction or applicability note, and reuse status. Workflow and pack changes must identify deterministic checks, human decisions, stop conditions, expected outputs, and retained evidence.

## LedgerBench task nominations

Use the **LedgerBench task nomination** issue form for proposed evaluation episodes. A nomination is only the first stage of the admission pipeline. Do not commit a proposed task to an official or hidden suite merely because its fixture or grader works.

Before admission, a LedgerBench task requires:

1. a complete episode specification;
2. two independent qualified-practitioner solves;
3. a separate practitioner review;
4. three-person ambiguity and evidence-sufficiency review;
5. proof that correct and valid alternative outputs pass;
6. proof that wrong, deceptive, and format-confounded outputs fail;
7. adversarial review;
8. measured human baselines;
9. a diverse multi-system pilot; and
10. approval through accounting-practice, measurement-science, and evaluation-integrity governance.

Task proposals must state the accounting problem, role, reviewer, evidence universe, as-of time, authority, resource budget, deliverables, terminal states, acceptance model, valid alternatives, hard gates, rights, and conflicts. See `docs/ledgerbench/TASK_ADMISSION.md`.

## Local checks

Run:

```sh
npm run generate:platform
npm run validate:platform
npm run validate:ledgerbench
npm run lint
npm test
```

For the existing Core conformance harness, also run `npm run benchmark:sample`.

## Review

Editorial review checks source applicability, plain language, rights, and professional boundaries. Maintainer review checks schemas, API compatibility, accessibility, security, and generated-artifact parity. Material accounting or assurance changes require a designated subject-matter reviewer before publication.

Content releases must satisfy the educational release gate: demonstrate improvement in learning, task completion, reviewer understanding, safety, adoption decisions, or evidence traceability. Corpus count alone is not release evidence. Proposed success measures are design guidance; instrumentation and results are not currently claimed.

LedgerBench program changes additionally require review of the measurement claim, sampling frame, statistical consequences, hidden-evaluation integrity, submitter conflicts, and whether the change alters cross-release comparability. Preview publication is not independent program approval.

By contributing, you agree that software contributions are licensed under MIT, original editorial contributions under CC BY 4.0, and deliberately submitted factual metadata and synthetic fixtures under CC0 1.0.
