const ledgerBenchRecord = {
  "task_admission": [
    {
      "order": 1,
      "id": "nomination",
      "name": "Nomination",
      "gate": "The proposer states the user problem, role, evidence, authority, work product, risk, rights, and representativeness."
    },
    {
      "order": 2,
      "id": "specification",
      "name": "Episode specification",
      "gate": "Initial state, objective, tools, resource budget, terminal states, and acceptance model are explicit."
    },
    {
      "order": 3,
      "id": "independent-solve",
      "name": "Independent solve",
      "gate": "At least two qualified practitioners solve the episode without hidden expected outputs."
    },
    {
      "order": 4,
      "id": "reviewer-validation",
      "name": "Reviewer validation",
      "gate": "A separate reviewer determines whether each solution would be accepted in practice."
    },
    {
      "order": 5,
      "id": "ambiguity-review",
      "name": "Ambiguity review",
      "gate": "Three independent reviewers assess instruction sufficiency, evidence availability, alternative solutions, and grader breadth."
    },
    {
      "order": 6,
      "id": "grader-proof",
      "name": "Grader proof",
      "gate": "Correct and alternative outputs pass; wrong, deceptive, and format-confounded outputs fail."
    },
    {
      "order": 7,
      "id": "adversarial-review",
      "name": "Adversarial review",
      "gate": "A red team attempts grader exploitation, answer recovery, boundary bypass, future-evidence use, and unsafe action."
    },
    {
      "order": 8,
      "id": "human-baseline",
      "name": "Human baseline",
      "gate": "Qualified practitioners complete the task under measured success, time, correction, and review conditions."
    },
    {
      "order": 9,
      "id": "multi-system-pilot",
      "name": "Multi-system pilot",
      "gate": "Diverse systems demonstrate useful difficulty, separability, stable scoring, and operational feasibility."
    },
    {
      "order": 10,
      "id": "admission",
      "name": "Admission",
      "gate": "Accounting-practice, measurement-science, and evaluation-integrity governance approve the episode."
    }
  ]
};

export default ledgerBenchRecord;
