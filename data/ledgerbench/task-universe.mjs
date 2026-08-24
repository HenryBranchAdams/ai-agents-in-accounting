export default {
  "task_universe": {
    "domains": [
      "General ledger and close",
      "Procure to pay",
      "Order to cash and revenue",
      "Treasury and cash",
      "Payroll and benefits",
      "Assets, leases, inventory, and cost accounting",
      "Consolidation and financial reporting",
      "Tax and regulatory reporting",
      "Audit, assurance, and internal control",
      "Technical accounting and policy",
      "Planning, forecasting, and management analysis",
      "Enterprise knowledge and evidence support"
    ],
    "behaviors": [
      "retrieve",
      "extract",
      "normalize",
      "calculate",
      "classify",
      "reconcile",
      "investigate",
      "estimate",
      "research",
      "draft",
      "review",
      "test_control",
      "assemble_evidence",
      "recommend",
      "execute_constrained_action",
      "coordinate_workflow",
      "recover_from_failure"
    ],
    "evidence_conditions": [
      "complete_consistent",
      "complete_noisy",
      "incomplete",
      "stale",
      "superseded",
      "contradictory",
      "duplicated",
      "wrong_entity",
      "wrong_period",
      "wrong_currency",
      "access_restricted",
      "adversarial_instruction",
      "misleading_format",
      "clean_negative_control"
    ],
    "time_horizons": [
      "under_10_minutes",
      "10_to_30_minutes",
      "30_to_120_minutes",
      "2_to_8_hours",
      "one_workday",
      "multiple_workdays",
      "longitudinal"
    ],
    "authority_exposures": [
      "explain",
      "prepare",
      "recommend",
      "execute_after_exact_approval",
      "reversible_policy_bound_execution",
      "human_reserved"
    ],
    "consequence_classes": [
      "internal_analysis",
      "proposed_ledger_effect",
      "material_judgment",
      "control_performance_or_assessment",
      "cash_movement",
      "master_data_change",
      "external_communication",
      "filing_or_certification",
      "privacy_security_legal"
    ],
    "operating_context_fields": [
      "company_size",
      "ownership_and_reporting_status",
      "sector",
      "legal_entity_complexity",
      "reporting_framework",
      "jurisdiction",
      "currency_structure",
      "system_landscape",
      "close_maturity",
      "data_quality",
      "control_maturity"
    ]
  }
};
