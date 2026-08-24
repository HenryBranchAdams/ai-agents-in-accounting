# Part VII — Contamination, overfitting, and benchmark longevity

## 28. Split design

A serious benchmark should have more than “train” and “test.”

### Public development

- full tasks;
- gold outputs;
- graders;
- reference implementations;
- worked examples.

### Private validation

- known task families;
- unseen values, files, and organizations;
- limited submissions.

### Holdout instance

New instances of known workflows and issue mechanics.

### Holdout mechanic

Previously unseen root-cause or failure mechanics.

### Holdout organization

A new company structure and system landscape.

### Holdout sector

A new economic and operational model.

### Temporal canary

Later periods and documents generated after the development suite.

### Adversarial holdout

Confidential safety, authority, leakage, and grader-attack tasks.

Every official episode has exactly one primary evaluation split.

## 29. Group-aware splitting

Related tasks must remain together across splits when they share:

- root cause;
- economic event;
- company;
- document template;
- contract;
- policy version;
- task author;
- source workpaper;
- scenario generator; or
- reference calculation.

Randomly hashing task IDs is insufficient.

## 30. Rotating rounds

Run official rounds on a fixed schedule, preferably twice per year.

Each round should contain:

- a private anchor set for longitudinal comparison;
- a larger rotating hidden set;
- fresh adversarial tasks;
- new values, names, ordering, and file variants;
- a published coverage manifest; and
- a versioned scoring plan.

Retired tasks may later become public development data.

## 31. Dynamic failure harvesting

After each round:

1. analyze common failure modes;
2. invite practitioner and researcher counterexamples;
3. create new tasks that target genuine weaknesses;
4. validate them against humans;
5. keep them hidden for the next official round.

This creates a feedback loop between evaluation and task design without turning the benchmark into arbitrary trick questions.

## 32. Submission limits

To reduce adaptive overfitting:

- official hidden submissions occur in defined windows;
- each candidate version receives a limited number of official submissions;
- preflight validation uses public or synthetic smoke tests;
- test-set feedback is delayed or coarse;
- resubmissions require a new candidate version;
- all submissions and model versions are logged.

## 33. Benchmark detection prohibition

In the Standardized Division, a candidate must not:

- identify task IDs and switch behavior;
- contain task-specific answers;
- use hidden-test fingerprints;
- detect benchmark file layouts and invoke special code;
- encode known reference outputs;
- access external answer stores.

Compliance testing should include mutated and canary episodes designed to detect such behavior.

## 34. Saturation and retirement

Monitor benchmark health.

A task or track should be reviewed when:

- several independent systems exceed the target ceiling;
- confidence intervals can no longer separate systems;
- contamination is plausible;
- task validity is challenged;
- the workflow is no longer representative;
- standards or policies change;
- the grader has exploitable weaknesses.

A track transitions through:

1. Proposed
2. Preview
3. Active
4. Saturated
5. Retired
6. Archived

Historical scores remain available with version warnings.

---
