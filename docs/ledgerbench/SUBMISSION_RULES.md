# LedgerBench submission rules

## Divisions

### Standardized

The program fixes the reference scaffold, prompt and policy, tools, retrieval, memory, context budget, resource budget, attempts, and output contract. The model is the principal variable.

### Open Systems

Custom orchestration, tools, retrieval, memory, fine-tuning, multiple agents, prompts, and test-time compute are allowed with full disclosure.

### Assisted

Human intervention is bounded and measured. The acting role, allowed intervention types, human-minute budget, editing rights, and final decision owner are fixed. Assisted results are never labeled autonomous.

## Candidate package

An official submission includes:

- candidate system card;
- exact model and endpoint versions;
- source, container, or reproducible hosted endpoint;
- dependency locks;
- prompts and policy;
- tools and permissions;
- retrieval and memory configuration;
- fine-tuning or adaptation disclosure;
- training-source statement;
- resource budget;
- run command;
- per-episode result digests;
- complete tool and environment logs;
- artifact hashes;
- time and cost records;
- known failures;
- conformance declaration;
- rights and confidentiality declaration.

Private chain-of-thought is neither required nor accepted.

## Result states

- **Self-reported:** submitter-run public harness.
- **Reproducible:** independent reproduction from the package.
- **Verified:** program review of configuration, logs, compliance, and integrity.
- **Audited:** sampled or complete controlled rerun by the program or approved laboratory.

Only Verified and Audited results appear in the default official comparison.

## Official round

1. Publish rules, benchmark release, resource budgets, and statistical plan.
2. Register submitters.
3. Run the public development period.
4. Freeze candidate packages.
5. Deliver controlled hidden evaluation.
6. Run automated validation.
7. Conduct independent review and random audits.
8. Resolve issues and appeals.
9. Freeze and publish results.
10. Publish a post-round benchmark-health report.

## Submission limits

- Hidden submissions occur in defined windows.
- A candidate version has a limited number of official submissions.
- Preflight uses public smoke tests.
- Hidden feedback is delayed or coarse.
- A resubmission requires a new candidate version.
- Every submission is logged.

## Prohibited conduct

- hidden-item access;
- answer-store access;
- task-ID-specific answers;
- benchmark-layout detection that changes behavior;
- undisclosed human intervention;
- undeclared model or tool substitution;
- input mutation;
- fabricated evidence or approval;
- prohibited network or filesystem access;
- misleading result claims.

## Claims

Every claim states the benchmark release, track, division, candidate version, resource budget, metric, run count, and verification status.

A result does not establish universal accounting competence, compliance, production safety, or professional replacement.
