# Part X — Leaderboard and reporting

## 46. The official result card

Each system receives a result card containing:

### Identity

- candidate;
- model;
- scaffold;
- tools;
- division;
- benchmark release;
- verification status.

### Primary outcomes

- Accepted Work Rate;
- conformant episode rate;
- hard-gate incident rate;
- 50% and 80% human-time horizon where available.

### Capability profile

- evidence;
- completeness;
- accounting correctness;
- judgment;
- workflow;
- authority;
- reviewability;
- reliability.

### Operating metrics

- time;
- cost;
- tokens;
- tool calls;
- human review minutes;
- retries.

### Coverage

- domains;
- sectors;
- horizons;
- evidence conditions;
- authority exposures.

### Uncertainty

- confidence intervals;
- run count;
- reviewer count;
- invalid runs;
- statistical assumptions.

### Failure profile

- top failure modes;
- hard-gate incidents;
- tasks stopped;
- missing-evidence handling;
- negative-control false positives.

## 47. Leaderboard structure

Avoid one global rank.

Publish:

- track-specific leaderboards;
- division-specific leaderboards;
- process-family profiles;
- capability–cost frontiers;
- reliability tiers;
- verified-only default view;
- confidence intervals;
- statistical equivalence groups.

An optional overall index may be offered as an exploratory view only, with visible weights and no claim of official superiority.

## 48. Benchmark-health dashboard

The program should measure itself.

Required health metrics:

- coverage of the declared task universe;
- human solvability;
- ambiguity rejection rate;
- expert agreement;
- grader false-positive and false-negative rates;
- separability among current systems;
- confidence-interval width;
- task difficulty distribution;
- contamination risk;
- anchor stability;
- task challenge rate;
- withdrawal rate;
- execution failure rate;
- subgroup representation;
- saturation rate; and
- time from submission to verified result.

A benchmark that cannot measure its own validity should not be trusted to measure systems.

---
