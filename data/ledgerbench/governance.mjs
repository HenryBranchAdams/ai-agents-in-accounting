const ledgerBenchRecord = {
  "governance": [
    {
      "id": "program-council",
      "name": "Program Council",
      "responsibility": "Charter, budget, appointments, strategy, and public-interest accountability."
    },
    {
      "id": "accounting-practice-board",
      "name": "Accounting Practice Board",
      "responsibility": "Task relevance, professional realism, reviewer standards, and domain coverage."
    },
    {
      "id": "measurement-science-committee",
      "name": "Measurement Science Committee",
      "responsibility": "Sampling, statistical plans, human baselines, uncertainty, validity, and benchmark health."
    },
    {
      "id": "evaluation-integrity-board",
      "name": "Evaluation Integrity Board",
      "responsibility": "Hidden data, contamination controls, red teaming, sandboxing, audits, and incident response."
    },
    {
      "id": "technical-working-groups",
      "name": "Technical Working Groups",
      "responsibility": "Tracks, environments, graders, schemas, adapters, and reference implementations."
    },
    {
      "id": "submitter-forum",
      "name": "Submitter Forum",
      "responsibility": "Operational feedback without control over hidden items or self-adjudication."
    },
    {
      "id": "appeals-panel",
      "name": "Independent Appeals Panel",
      "responsibility": "Task, environment, grader, scoring, and compliance appeals without conflicts."
    }
  ],
  "lifecycle": [
    "proposed",
    "preview",
    "active",
    "saturated",
    "retired",
    "archived"
  ],
  "launch_gates": [
    "The measurement claim, scope, products, divisions, and non-claims are public.",
    "At least three diverse candidate systems have completed the full pipeline.",
    "Human baselines exist for every admitted episode.",
    "Task ambiguity and evidence sufficiency have independent review.",
    "Deterministic graders and automated judges have adversarial validation.",
    "Uncertainty and ranking rules are predeclared.",
    "Sandboxing and hidden-data isolation are verified.",
    "Submission, audit, correction, and appeal procedures have been exercised.",
    "Governance membership and conflicts are public.",
    "Benchmark-health metrics meet the launch threshold."
  ],
  "first_release": {
    "name": "LedgerBench 1.0",
    "status": "proposed",
    "reporting_basis": "US GAAP-centered first release with explicit jurisdictional limitations",
    "episode_plan": [
      {
        "track": "core",
        "official_hidden_episodes": 40
      },
      {
        "track": "workflow",
        "official_hidden_episodes": 48
      },
      {
        "track": "enterprise",
        "official_hidden_episodes": 24
      },
      {
        "track": "close",
        "official_hidden_sequences": 8
      },
      {
        "track": "development",
        "public_episodes": "30–40 additional"
      }
    ],
    "minimum_operating_models": 3,
    "minimum_organizational_contexts": 3,
    "human_baseline": "Two independent qualified preparers and one independent reviewer per admitted episode."
  }
};

export default ledgerBenchRecord;
