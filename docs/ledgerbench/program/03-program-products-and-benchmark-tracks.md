# Part III — Program products and benchmark tracks

## 7. Product A: Capability Benchmark

The Capability Benchmark compares systems.

### 7.1 LedgerBench Core

Bounded tasks with a human horizon of roughly 5–30 minutes.

Purpose:

- diagnose evidence retrieval;
- test calculations and classifications;
- validate output contracts;
- measure negative controls and missing evidence; and
- provide a low-cost development suite.

Core is necessary but not sufficient evidence of useful autonomy.

### 7.2 LedgerBench Workflow

End-to-end procedures with a human horizon of roughly 30 minutes to four hours.

Examples:

- prepare a reconciliation;
- search for unrecorded liabilities;
- review a contract;
- prepare an accrual and reversal;
- test a control population;
- prepare a cash forecast;
- assemble an audit request;
- perform a financial-statement tie-out.

Workflow should be the principal benchmark for deployable accounting-agent work.

### 7.3 LedgerBench Enterprise

Open-ended work inside a realistic, stateful enterprise environment.

The system must:

- find the right sources among many plausible files and systems;
- respect role and as-of access;
- work across multiple applications or APIs;
- handle inconsistent records;
- create native work products; and
- preserve a complete run record.

Enterprise measures the full agent system, not just the model.

### 7.4 LedgerBench Close

Longitudinal sequences spanning a simulated close or reporting cycle.

A Close evaluation may include:

- dependencies;
- task handoffs;
- changing evidence;
- review notes;
- late adjustments;
- reopened work;
- superseded versions;
- escalating materiality; and
- final reviewer decisions.

The system is judged on the whole sequence, not only independent subtasks.

### 7.5 LedgerBench Adversarial

Adversarial conditions should be layered across every track rather than isolated into a novelty suite.

Required adversarial families include:

- prompt injection inside evidence;
- unauthorized-action requests;
- fake approval;
- misleading filenames;
- stale and superseded records;
- access-boundary pressure;
- duplicate records with altered identifiers;
- contradictory support;
- near-threshold amounts;
- wrong entity or currency;
- data exfiltration attempts;
- hidden instructions in formulas or metadata; and
- pressure to conceal an exception.

## 8. Product B: Conformance Suite

Conformance is pass/fail and must not be used to rank products.

Conformance profiles should include:

### Profile 1 — Evidence record

- stable evidence identifiers;
- source version and hash;
- claim-to-evidence links;
- retained calculations;
- immutable output manifest.

### Profile 2 — Authority behavior

- preparation separated from approval;
- no execution beyond the declared authority;
- exact payload integrity;
- attributable approvals;
- clear stop behavior.

### Profile 3 — Run record

- system and configuration identity;
- tool events;
- inputs and outputs;
- exceptions;
- approvals;
- timestamps;
- deterministic checks;
- final disposition.

### Profile 4 — Benchmark adapter

- input and output schemas;
- sandbox compatibility;
- standardized telemetry;
- error semantics;
- deterministic packaging.

A system can be conformant without being highly capable. A capable system can fail conformance. Both facts matter.

## 9. Product C: Field-utility studies

Field studies measure real human outcomes and should not be mixed into the benchmark leaderboard.

They should test:

- preparer time saved;
- reviewer time;
- reviewer corrections;
- first-pass acceptance;
- cycle time;
- exception detection;
- override rate;
- user trust calibration;
- control incidents;
- cost per accepted work product; and
- downstream rework.

Field results are context-specific and should identify the company, workflow, controls, users, and deployment configuration.

## 10. Product D: Judge and grader validation

Any automated grader or LLM judge used by LedgerBench must itself be evaluated.

The program should maintain:

- human-adjudicated candidate outputs;
- valid alternative solutions;
- near-miss outputs;
- deceptive outputs;
- style-confounded outputs;
- missing-evidence outputs;
- safety violations; and
- adversarial attempts to manipulate the judge.

A judge may scale expert review only after demonstrating acceptable false-positive, false-negative, calibration, and subgroup behavior. It can never override deterministic hard gates.

---
