# Part VIII — Submission and verification program

## 35. Result statuses

### Self-reported

The submitter ran the public harness. Not officially reviewed.

### Reproducible

A third party reproduced the result from the submitted package.

### Verified

The program reviewed the submission, logs, configuration, and compliance.

### Audited

The program or an approved laboratory reran a sampled or complete evaluation under controlled conditions.

Only Verified and Audited results appear on the official leaderboard by default.

## 36. Submission package

An official submission includes:

- candidate system card;
- exact model and endpoint IDs;
- source or container image;
- dependency lockfiles;
- configuration;
- prompts and policy;
- tools;
- training and adaptation disclosure;
- run command;
- resource limits;
- per-episode result records;
- complete tool and environment logs;
- artifact hashes;
- cost and time records;
- known failures;
- conformance declaration;
- rights and confidentiality declaration.

## 37. Official round process

1. Rules and suite version announced.
2. Submitters register.
3. Public development period.
4. Candidate packages frozen.
5. Encrypted or controlled submissions delivered.
6. Automated verification.
7. Peer and independent review.
8. Random audit selection.
9. Issue-resolution period.
10. Appeals.
11. Results frozen.
12. Coordinated publication.
13. Post-round report and rule update.

## 38. Audits

Audits may test:

- reproducibility;
- benchmark detection;
- hidden-answer access;
- declared resource use;
- tool isolation;
- model version;
- task-specific code;
- input mutation;
- logging completeness;
- repeated-run variance.

Failure to reproduce within tolerance can downgrade or invalidate a result.

## 39. Claims and messaging

Every public claim must include:

- benchmark and version;
- track;
- division;
- candidate system version;
- resource budget;
- verification status;
- run count; and
- metric name.

Unverified results must be labeled unverified.

Derived composite scores must disclose their formula and may not be described as official unless the program defines them.

No result may be described as proving:

- overall accounting competence;
- compliance;
- audit readiness;
- safe deployment;
- ability to replace a professional; or
- performance outside the measured scope.

## 40. Appeals and task challenges

Submitters may challenge:

- task ambiguity;
- unavailable evidence;
- invalid grader behavior;
- rights issues;
- environment failure;
- misclassification;
- scoring error.

Challenges are reviewed by an independent panel.

Possible remedies:

- no change;
- task correction for future rounds;
- rescoring;
- task withdrawal;
- result annotation;
- benchmark version update.

Sanitized decisions and subsequent rule changes should be public.

---
