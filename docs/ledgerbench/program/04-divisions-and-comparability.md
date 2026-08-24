# Part IV — Divisions and comparability

## 11. Standardized Division

Purpose: compare underlying model capability under controlled conditions.

Fixed:

- reference scaffold;
- prompt and policy;
- tool interfaces;
- retrieval policy;
- memory policy;
- context budget;
- wall-time budget;
- token or compute budget;
- number of attempts; and
- output format.

Variable:

- model or model endpoint.

Rules:

- no task-specific code;
- no benchmark detection;
- no access to hidden tasks;
- no test-set fine-tuning;
- no human intervention;
- fixed resource budget;
- exact model version required.

## 12. Open Systems Division

Purpose: measure the best autonomous accounting-agent system.

Allowed:

- custom orchestration;
- specialized tools;
- retrieval systems;
- memory;
- fine-tuning;
- multiple agents;
- custom prompts;
- test-time compute.

Required:

- full disclosure;
- no human intervention;
- no hidden-test access;
- declared training sources;
- declared resource use;
- reproducible container or hosted endpoint;
- anti-benchmark-detection compliance.

Open results are not directly comparable to Standardized results.

## 13. Assisted Division

Purpose: measure human–AI augmentation.

The program controls:

- acting human role;
- maximum human minutes;
- allowed intervention types;
- visibility into agent work;
- whether the human may edit outputs;
- whether the agent may ask questions; and
- who makes final decisions.

Report:

- total human time;
- intervention count;
- accepted work rate;
- reviewer time;
- cost;
- quality; and
- comparison with unaided humans.

Assisted results must never be labeled autonomous.

## 14. Research and Preview status

New tracks or experimental metrics begin as **Preview**.

Preview results:

- are published separately;
- do not determine official category leaders;
- may change materially;
- are used to validate task quality, scoring, and operational feasibility.

A track becomes **Active** only after:

- expert task validation;
- reference implementation;
- human baseline;
- grader validation;
- multi-system pilot;
- statistical review;
- public methodology review; and
- governance approval.

---
