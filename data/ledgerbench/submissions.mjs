const ledgerBenchRecord = {
  "submission_program": {
    "statuses": [
      {
        "id": "self-reported",
        "meaning": "The submitter ran the public harness; no official review."
      },
      {
        "id": "reproducible",
        "meaning": "An independent party reproduced the result from the package."
      },
      {
        "id": "verified",
        "meaning": "The program reviewed configuration, logs, compliance, and result integrity."
      },
      {
        "id": "audited",
        "meaning": "The program or approved laboratory reran a sampled or complete evaluation under controlled conditions."
      }
    ],
    "official_default": [
      "verified",
      "audited"
    ],
    "submission_limits": [
      "Official hidden submissions occur in defined windows.",
      "Each candidate version receives a limited number of official submissions.",
      "Candidate packages are frozen before hidden evaluation.",
      "Resubmission requires a new candidate version.",
      "Test feedback is delayed or coarse enough to limit adaptive overfitting."
    ]
  }
};

export default ledgerBenchRecord;
