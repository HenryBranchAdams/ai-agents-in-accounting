# Part V — Environment and task construction

## 15. The enterprise digital twin

The benchmark should use controlled enterprise environments rather than isolated prompts.

Each environment should contain:

- legal entities;
- chart of accounts;
- accounting policies;
- source systems;
- subledgers;
- general ledger;
- bank activity;
- contracts;
- invoices;
- purchase orders;
- receipts;
- approvals;
- emails;
- workpapers;
- reports;
- user roles;
- access policies;
- document versions;
- operational events; and
- a timeline.

The environment may be synthetic, permissioned real data, or a hybrid. In all cases, it must have a traceable source of truth and explicit rights.

The correct construction order is:

1. define economic events and policy;
2. generate or validate clean books;
3. derive systems and documents;
4. validate internal consistency;
5. introduce controlled issues or evidence conditions;
6. derive tasks and hidden adjudication;
7. create role-and-time views;
8. validate leakage and solvability.

Do not reverse-engineer the “truth” from rendered documents.

## 16. Task sources

Tasks should come from four channels.

### Practitioner-derived

Experienced preparers and reviewers propose tasks from real workflows, stripped of confidential details.

### Standards-derived

Requirements and common procedures are translated into practical work, not trivia questions.

### Environment-derived

Tasks arise naturally from generated economic events, documents, issues, and controls.

### Failure-derived

New tasks are created from observed model failures, challenge submissions, incidents, and adversarial testing.

No one channel should dominate.

## 17. Task admission pipeline

A task enters the official item bank only after passing all stages.

### Stage 1 — Nomination

The proposer states:

- user and business problem;
- domain;
- role;
- evidence;
- authority;
- expected artifact;
- realistic human workflow;
- risk;
- rights; and
- why the task belongs in the benchmark.

### Stage 2 — Specification

The task is written as an episode with explicit initial state, objective, tools, resource budget, and acceptance model.

### Stage 3 — Independent solve

At least two qualified practitioners solve the task independently without access to hidden expected outputs.

A task is rejected if experts cannot solve it consistently under the stated conditions.

### Stage 4 — Reviewer validation

A separate reviewer determines whether each solution would be accepted in practice and identifies valid alternative approaches.

### Stage 5 — Ambiguity review

Three independent reviewers assess:

- sufficiency of instructions;
- whether hidden requirements exist;
- whether evidence is available;
- whether alternative valid solutions can pass;
- whether the grader is too narrow; and
- whether the task is representative.

A conservative aggregation rule should reject questionable tasks.

### Stage 6 — Grader proof

The authors demonstrate:

- correct outputs pass;
- wrong outputs fail;
- alternative valid outputs pass;
- deceptive outputs fail;
- required hard gates trigger; and
- the grader does not depend on irrelevant formatting.

### Stage 7 — Adversarial review

A red team attempts to:

- exploit the grader;
- recover hidden answers;
- bypass access;
- use future evidence;
- overfit to task identifiers;
- conceal an unsafe action; and
- produce superficially convincing but wrong work.

### Stage 8 — Human baseline

Qualified practitioners complete the task under measured conditions.

Collect:

- success;
- time;
- review score;
- corrections;
- evidence use;
- tool use; and
- disagreement.

### Stage 9 — Multi-system pilot

Run diverse candidate systems to verify:

- task separability;
- useful difficulty;
- stable scoring;
- meaningful failure modes; and
- operational feasibility.

### Stage 10 — Admission

A domain working group recommends admission. The Measurement Committee and Evaluation Integrity Board approve it.

## 18. Gold truth is not one golden answer

Many accounting tasks allow multiple valid methods or conclusions.

The acceptance model should combine:

### Invariants

Examples:

- debits equal credits;
- population ties;
- source identifiers are preserved;
- entity and period are correct;
- prohibited actions are absent.

### Acceptable value sets or tolerances

Examples:

- allowed rounding;
- multiple acceptable account mappings;
- alternative supported estimates;
- acceptable reviewer dispositions.

### Required evidence

The conclusion must be linked to evidence available to the acting role at the cutoff.

### Hierarchical rubric

Open-ended judgment and work-product quality are decomposed into specific, independently gradable criteria.

### Hard exclusions

Certain behavior is unacceptable regardless of other quality:

- fabricated approval;
- concealed material exception;
- unsupported material conclusion;
- unauthorized execution;
- use of inaccessible evidence;
- mutation of source records.

---
