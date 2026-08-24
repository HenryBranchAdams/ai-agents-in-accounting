# LedgerBench — one-page program brief

## Mission

Measure whether an AI system can complete consequential accounting work that a qualified professional would accept, under realistic evidence, time, access, and authority constraints.

## What is evaluated

The complete candidate system:

- model;
- agent policy;
- scaffold;
- tools;
- retrieval;
- memory;
- configuration;
- resource budget.

## Unit of evaluation

An **episode**:

- initial enterprise state;
- objective;
- role;
- evidence universe;
- as-of time;
- authority;
- tools;
- budget;
- deliverables;
- hidden acceptance criteria;
- terminal state.

## Program products

1. **Capability Benchmark** — comparative.
2. **Conformance Suite** — pass/fail.
3. **Field-Utility Studies** — human productivity and reviewer effort.
4. **GraderBench** — validates automated graders and judges.

## Tracks

- **Core:** 5–30 minute bounded tasks.
- **Workflow:** 30 minutes–4 hours, end-to-end procedures.
- **Enterprise:** realistic, stateful, cross-system work.
- **Close:** multi-episode longitudinal workflows.
- **Adversarial:** safety and control conditions embedded throughout.

## Divisions

- **Standardized:** fixed harness, tools, and budget; compares models.
- **Open Systems:** arbitrary autonomous stack with full disclosure.
- **Assisted:** controlled human intervention, separately reported.

Conformance is a separate neutral pass/fail product, not a leaderboard division.

## Primary metric

**Accepted Work Rate**

An episode counts only when:

- required artifacts exist;
- mandatory accounting checks pass;
- evidence is valid;
- reviewer threshold is met;
- no hard authority or safety gate fails.

## Other required metrics

- hard-gate incident rate;
- evidence, completeness, correctness, judgment, workflow, and reviewability profiles;
- reliability across repeated runs;
- reviewer minutes;
- cost per accepted episode;
- 50% and 80% human-time horizon;
- confidence intervals.

## Task quality pipeline

Nominate → specify → two independent expert solves → independent reviewer → triple ambiguity review → grader proof → adversarial review → human baseline → multi-system pilot → governance approval.

## Integrity model

- public development tasks;
- hidden validation;
- instance, mechanic, company, sector, and temporal holdouts;
- rotating official rounds;
- private anchor items;
- limited submissions;
- anti-benchmark-detection tests;
- task retirement and correction process.

## Governance

Independent sponsor with:

- Program Council;
- Accounting Practice Board;
- Measurement Science Committee;
- Evaluation Integrity Board;
- Technical Working Groups;
- Submitter Forum;
- independent Appeals Panel.

Official results are labeled:

- self-reported;
- reproducible;
- verified;
- audited.

## First release

- 40 Core episodes;
- 48 Workflow episodes;
- 24 Enterprise episodes;
- 8 Close sequences;
- three operating models;
- three organizational contexts;
- US GAAP-centered first release;
- human baselines on every admitted episode;
- adversarial conditions distributed throughout.

## North-star principle

A benchmark is trustworthy only when it measures its own validity: coverage, ambiguity, grader error, separability, uncertainty, contamination, saturation, and reproducibility.
