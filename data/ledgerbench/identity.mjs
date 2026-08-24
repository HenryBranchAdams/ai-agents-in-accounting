export default {
  "id": "ledgerbench",
  "version": "0.1.0",
  "status": "preview",
  "title": "LedgerBench",
  "subtitle": "A first-class benchmark program for accounting agents",
  "reviewed_at": "2026-08-24",
  "mission": "Measure whether an AI system can complete consequential accounting work that a qualified professional would accept under realistic evidence, time, access, and authority constraints.",
  "measurement_claim": "The configured candidate system can produce acceptable accounting work on the stated benchmark release, track, division, task population, and resource budget at the reported reliability and review burden.",
  "unit_under_test": "The configured agent system: model, agent policy, prompts, tools, retrieval, memory, code, configuration, and resource budget.",
  "unit_of_evaluation": {
    "name": "episode",
    "definition": "A versioned accounting objective executed from a declared enterprise state with an acting role, evidence universe, as-of time, authority envelope, tools, resource budget, required deliverables, hidden acceptance model, and terminal state.",
    "terminal_states": [
      "complete",
      "escalate",
      "justified_stop",
      "failed"
    ]
  },
  "non_claims": [
    "A LedgerBench result is not a certification of compliance with GAAP, IFRS, SOX, tax law, audit standards, or any other professional requirement.",
    "A fixed-suite result does not by itself establish broad accounting competence or production readiness.",
    "A leaderboard position does not establish that a system may replace an accountable professional.",
    "A conformance pass establishes only that the tested requirements were not violated in the tested cases."
  ]
};
