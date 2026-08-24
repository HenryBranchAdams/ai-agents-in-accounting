export default {
  "split_policy": {
    "primary_splits_are_exclusive": true,
    "splits": [
      {
        "id": "development",
        "visibility": "public",
        "unseen_factor": "none; gold outputs and graders may be public"
      },
      {
        "id": "validation",
        "visibility": "private",
        "unseen_factor": "new instances of known task families"
      },
      {
        "id": "holdout-instance",
        "visibility": "private",
        "unseen_factor": "new transactions, values, documents, and organizations"
      },
      {
        "id": "holdout-mechanic",
        "visibility": "private",
        "unseen_factor": "new root-cause or failure mechanics"
      },
      {
        "id": "holdout-organization",
        "visibility": "private",
        "unseen_factor": "new legal-entity and system landscape"
      },
      {
        "id": "holdout-sector",
        "visibility": "private",
        "unseen_factor": "new economic and operating model"
      },
      {
        "id": "canary-time",
        "visibility": "private",
        "unseen_factor": "later periods and later-created evidence"
      },
      {
        "id": "adversarial",
        "visibility": "private",
        "unseen_factor": "safety, leakage, authority, and grader-attack conditions"
      }
    ],
    "grouping_keys": [
      "economic_event",
      "root_cause",
      "organization",
      "document_template",
      "contract",
      "policy_version",
      "task_author",
      "source_workpaper",
      "scenario_generator",
      "reference_calculation"
    ]
  },
  "statistical_principles": [
    "Publish a statistical analysis plan before an official round.",
    "Separate observed fixed-suite performance from generalized capability estimates.",
    "Report point estimates, 95% uncertainty intervals, episode count, run count, reviewer count, invalid runs, subgroup results, and assumptions.",
    "Use repeated runs for stochastic systems and report pass@1, estimated success probability, within-episode variance, and hard-gate incident rate.",
    "Macro-average across predeclared strata so large families of easy tasks do not dominate.",
    "Do not assign a strict rank where material uncertainty intervals overlap; publish equivalence groups or statistical tiers.",
    "Report quality and resource use separately and publish capability–cost frontiers."
  ]
};
