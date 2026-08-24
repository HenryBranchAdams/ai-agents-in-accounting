# Part I — First principles

## 1. What is the object being measured?

An accounting agent is not merely a language model that knows accounting terminology. It is a system that:

- receives an accounting objective;
- discovers and evaluates evidence;
- performs calculations and classifications;
- uses tools and maintains state;
- produces reviewable work;
- recognizes uncertainty and missing support;
- respects access, approval, and execution boundaries; and
- reaches a defensible completion or stop condition.

Therefore, the unit under test is:

> **The configured agent system operating in a specified environment under a declared resource and authority budget.**

Every official result must identify:

- the exact model and version;
- system prompt and agent policy version;
- scaffold and adapter versions;
- tools and permissions;
- retrieval and memory configuration;
- fine-tuning or task adaptation;
- resource budget;
- number of attempts;
- environment version;
- benchmark version; and
- verification status.

A result attached only to a model family is not an official system result.

## 2. What is the unit of evaluation?

The atomic unit is an **episode**.

An episode consists of:

1. an initial enterprise state;
2. a task objective;
3. an acting role;
4. an evidence universe;
5. an as-of time;
6. an authority envelope;
7. available tools;
8. a resource budget;
9. required deliverables;
10. hidden acceptance criteria; and
11. a terminal state.

An episode is complete only when the system:

- produces the required artifacts;
- records the evidence used;
- reports unresolved matters;
- preserves the environment;
- stays within its authority; and
- declares completion, escalation, or justified stop.

The benchmark should evaluate both **what changed** and **what did not change**. In accounting, refusing an unsupported entry or leaving a control hold in place may be the correct outcome.

## 3. What claim should a benchmark result support?

The program must distinguish two estimands:

### Fixed-suite performance

> How did the candidate perform on the particular episodes in benchmark release X?

This is directly observable and reproducible.

### Generalized capability

> How is the candidate expected to perform on the broader population of accounting tasks represented by the sampling frame?

This requires assumptions about task sampling and statistical modeling. It must be separately labeled and reported with uncertainty.

A fixed-suite average should never be casually described as broad accounting competence.

## 4. What the program must not become

LedgerBench is not:

- a multiple-choice accounting exam;
- a single-number marketing leaderboard;
- a certification that a system complies with GAAP, IFRS, SOX, tax law, or audit standards;
- a proxy for production readiness;
- a static public test set that becomes training data;
- an LLM-judge contest;
- a contest for who can spend the most tokens;
- a collection of edge cases with no relationship to routine work;
- an environment where every task contains an error;
- a benchmark that rewards action over justified restraint; or
- a benchmark whose rules are controlled by the largest submitters.

---
