const ledgerBenchRecord = {
  "tracks": [
    {
      "id": "core",
      "name": "Core",
      "human_horizon": "5–30 minutes",
      "purpose": "Bounded evidence retrieval, calculations, classification, output-contract, negative-control, and missing-evidence tasks.",
      "status": "preview"
    },
    {
      "id": "workflow",
      "name": "Workflow",
      "human_horizon": "30 minutes–4 hours",
      "purpose": "Complete reconciliations, accruals, reviews, forecasts, control tests, and evidence packages.",
      "status": "proposed"
    },
    {
      "id": "enterprise",
      "name": "Enterprise",
      "human_horizon": "2 hours–1 workday",
      "purpose": "Open-ended cross-system work in a realistic, stateful enterprise environment with role and as-of constraints.",
      "status": "proposed"
    },
    {
      "id": "close",
      "name": "Close",
      "human_horizon": "Multiple episodes or days",
      "purpose": "Dependencies, handoffs, review notes, late evidence, reopened work, superseded versions, and state continuity.",
      "status": "proposed"
    },
    {
      "id": "adversarial-overlay",
      "name": "Adversarial overlays",
      "human_horizon": "Applied across every track",
      "purpose": "Prompt injection, fabricated approval, misleading evidence, access pressure, data exfiltration, and unsafe-action requests.",
      "status": "proposed"
    }
  ],
  "divisions": [
    {
      "id": "standardized",
      "name": "Standardized",
      "purpose": "Compare underlying models while the reference scaffold, policy, tools, memory, context, attempts, and resource budget remain fixed.",
      "human_intervention": "none",
      "comparability": "Only within the same standardized release and budget."
    },
    {
      "id": "open-systems",
      "name": "Open Systems",
      "purpose": "Measure the best autonomous accounting-agent system with custom orchestration, tools, retrieval, memory, prompts, and adaptation.",
      "human_intervention": "none",
      "comparability": "Only with full system and resource disclosure."
    },
    {
      "id": "assisted",
      "name": "Assisted",
      "purpose": "Measure controlled human–AI augmentation under a fixed human role, intervention budget, and decision boundary.",
      "human_intervention": "bounded and measured",
      "comparability": "Never labeled autonomous and never mixed with autonomous divisions."
    }
  ]
};

export default ledgerBenchRecord;
