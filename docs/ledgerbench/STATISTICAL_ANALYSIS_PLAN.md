# LedgerBench statistical analysis plan

An official evaluation round must publish and freeze this plan before candidate packages are evaluated on hidden episodes.

## Estimands

Report two claims separately.

### Fixed-suite performance

Observed performance on the exact episodes, runs, reviewers, environment, and resource budget in the named release.

### Generalized capability

Estimated performance over the declared accounting-work population represented by the sampling frame. This estimate is optional and requires explicit assumptions.

## Primary outcome

**Accepted Work Rate (AWR)** is the proportion of episodes that:

- contain every required artifact;
- pass mandatory deterministic accounting checks;
- satisfy evidence requirements;
- meet the reviewer threshold where required;
- use an appropriate terminal disposition;
- omit no hidden material exception; and
- incur no hard-gate violation.

The episode, not an individual rubric point, is the denominator.

## Secondary outcomes

- conformant episode rate;
- hard-gate incident rate by gate;
- capability dimensions;
- performance by domain, track, division, sector, role, difficulty, evidence condition, and split;
- repeated-run reliability;
- reviewer minutes and correction counts;
- human 50% and 80% duration horizons where supported;
- wall time, tokens, tool calls, compute, declared cost, human minutes, and cost per accepted episode.

## Repeated runs

For stochastic candidates, predeclare:

- number of independent runs per episode;
- randomization control;
- retry and timeout rules;
- invalid-run treatment;
- whether the system may preserve state between attempts.

Publish pass@1 and estimated success probability. Best-of-k belongs in a separately labeled resource-scaling analysis.

## Aggregation

- Macro-average across predeclared strata.
- Do not let a large family of short tasks dominate.
- Do not use quality points to offset a hard-gate failure.
- Keep deterministic and expert-review results separate.
- Keep quality and resource use separate.
- Publish optional capability–cost frontiers.

## Uncertainty

Report:

- point estimates;
- 95% confidence or credible intervals;
- episode count;
- run count;
- reviewer count;
- invalid and missing runs;
- within-episode and between-episode variance;
- subgroup results;
- sensitivity analyses;
- assumptions.

When estimating generalized capability, use a predeclared hierarchical model capable of representing task, run, reviewer, domain, difficulty, and candidate effects.

## Ranking

- Do not assign a strict rank when uncertainty materially overlaps.
- Publish statistical tiers or equivalence groups.
- State when cross-release comparisons are invalid.
- Retain private anchor episodes for longitudinal linking.
- Treat small rank changes as noise unless the analysis supports a difference.

## Qualitative review

Use anchored expert rubrics for minimum acceptability.

For preference among outputs that already clear mandatory gates:

- blind candidate identity;
- randomize presentation order;
- use pairwise comparison;
- record reviewer seniority and conflicts;
- monitor agreement;
- adjudicate material disagreement;
- report uncertainty.

Preference never overrides accounting correctness or authority.
