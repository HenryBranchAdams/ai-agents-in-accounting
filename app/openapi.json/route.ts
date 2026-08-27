import {
  agentResources,
  allowedIndustries,
  allowedKinds,
  allowedTimeRoles,
  allowedTopics,
  apiVersion,
  catalogReviewedAt,
  catalogVersion,
  publicResponse,
  siteOrigin,
} from "../agent-interface";
import { allowedAuthorityLevels, allowedFamilies } from "../domain-interface";
import { authorityDecisionGuide, corpusReviewedAt, corpusVersion } from "../domain-model";
import { ecosystemLayers } from "../ecosystem-data";
import { controlPatterns, sensitiveActions } from "../governance-data";
import { glossary, templates } from "../reference-data";
import {
  resourceLifecycleStates,
  sourceAudienceValues,
  sourceEvidenceTiers,
} from "../resources-data";
import {
  ledgerBenchEpisodeSchema,
  ledgerBenchProgramSchema,
  ledgerBenchResultSchema,
  ledgerBenchSubmissionSchema,
} from "../ledgerbench-data";
import { workflowRecords } from "../workflows-data";
import {
  benchmarkCaseSchema,
  benchmarkCases,
  packSchema,
  packs,
  releaseManifestSchema,
} from "../platform-data";
import {
  contentModeIds,
  educationalContentContract,
  evidenceClassificationIds,
} from "../content-contract";
import { accountingAgentControlModel, controlModelElements } from "../control-model";
import { accountingAgentsCoverageMap, coverageStates } from "../coverage-map";
import { accountingAgentsStartHere } from "../start-here";
import { accountingAgentReviewerGuide, reviewerDispositions } from "../reviewer-guide";

const startHereSchema = {
  type: "object",
  required: [
    "id", "version", "title", "description", "prepared_at", "review_status", "review_note",
    "primary_mode", "intended_audience", "prerequisites", "learning_objectives", "definition",
    "comparisons", "governing_rule", "evidence_to_decision_chain", "scenario", "knowledge_check",
    "completion_artifact", "audience_paths", "limitations", "next_action", "source_basis", "rights",
  ],
  properties: {
    id: { type: "string", const: accountingAgentsStartHere.id },
    version: { type: "string", const: accountingAgentsStartHere.version },
    title: { type: "string" },
    description: { type: "string" },
    prepared_at: { type: "string", format: "date" },
    review_status: { type: "string", const: accountingAgentsStartHere.review_status },
    review_note: { type: "string" },
    primary_mode: { type: "string", const: "tutorial" },
    intended_audience: { type: "string" },
    prerequisites: { type: "array", minItems: 2, items: { type: "string" } },
    learning_objectives: { type: "array", minItems: 4, items: { type: "string" } },
    definition: {
      type: "object",
      required: ["id", "text", "evidence_classification", "reliance_boundary"],
      properties: { id: { type: "string" }, text: { type: "string" }, evidence_classification: { type: "string", enum: evidenceClassificationIds }, reliance_boundary: { type: "string" } },
    },
    comparisons: { type: "array", minItems: 4, maxItems: 4, items: { type: "object", required: ["id", "label", "controller", "behavior", "accounting_example", "boundary"] } },
    governing_rule: { type: "object", required: ["id", "text", "evidence_classification", "implication"] },
    evidence_to_decision_chain: { type: "array", minItems: 6, maxItems: 6, items: { type: "object", required: ["id", "label", "text", "owner"] } },
    scenario: { type: "object", required: ["id", "title", "evidence_classification", "fictional", "context", "guided_steps", "deliberate_exception", "finished_artifact", "safe_reset"], properties: { fictional: { type: "boolean", const: true }, evidence_classification: { type: "string", const: "synthetic-example" }, guided_steps: { type: "array", minItems: 5, items: { type: "string" } } } },
    knowledge_check: { type: "array", minItems: 3, maxItems: 3, items: { type: "object", required: ["id", "prompt", "options", "correct_option_id", "correct_feedback", "incorrect_feedback"], properties: { options: { type: "array", minItems: 3, items: { type: "object", required: ["id", "label"] } } } } },
    completion_artifact: { type: "object", required: ["id", "title", "statements", "interpretation_boundary"] },
    audience_paths: { type: "array", minItems: 5, maxItems: 5, items: { type: "object", required: ["id", "label", "href", "next", "outcome"] } },
    limitations: { type: "array", minItems: 4, items: { type: "string" } },
    next_action: { type: "string" },
    source_basis: { type: "array", minItems: 2, items: { type: "object", required: ["id", "title", "href", "evidence_classification", "scope"] } },
    rights: { type: "object", required: ["editorial_content", "synthetic_example_and_factual_metadata", "external_sources"] },
  },
} as const;

const reviewerGuideSchema = {
  type: "object",
  required: [
    "id", "version", "title", "description", "prepared_at", "review_status", "review_note",
    "primary_mode", "evidence_classification", "intended_audience", "use_when", "prerequisites",
    "required_inputs", "reader_outcome", "governing_rule", "review_sequence", "disposition_guide",
    "stop_conditions", "minimum_reviewer_packet", "automation_bias_traps", "worked_examples",
    "calibration_exercise", "review_program_scaffold", "related_material", "limitations", "next_action",
    "source_basis", "rights",
  ],
  properties: {
    id: { type: "string", const: accountingAgentReviewerGuide.id },
    version: { type: "string", const: accountingAgentReviewerGuide.version },
    title: { type: "string" },
    description: { type: "string" },
    prepared_at: { type: "string", format: "date" },
    review_status: { type: "string", const: accountingAgentReviewerGuide.review_status },
    review_note: { type: "string" },
    primary_mode: { type: "string", const: "how-to" },
    evidence_classification: { type: "string", const: "implementation-pattern" },
    intended_audience: { type: "string" },
    use_when: { type: "string" },
    prerequisites: { type: "array", minItems: 3, items: { type: "string" } },
    required_inputs: { type: "array", minItems: 6, items: { type: "string" } },
    reader_outcome: { type: "string" },
    governing_rule: {
      type: "object",
      required: ["id", "text", "evidence_classification", "implication"],
    },
    review_sequence: {
      type: "array",
      minItems: 8,
      maxItems: 8,
      items: {
        type: "object",
        required: ["id", "label", "action", "challenge_questions", "proceed_when", "stop_when"],
      },
    },
    disposition_guide: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        required: ["id", "disposition", "use_when", "record"],
        properties: { disposition: { type: "string", enum: reviewerDispositions } },
      },
    },
    stop_conditions: { type: "array", minItems: 7, items: { type: "string" } },
    minimum_reviewer_packet: {
      type: "array",
      minItems: 12,
      maxItems: 12,
      items: { type: "object", required: ["id", "field", "challenge"] },
    },
    automation_bias_traps: {
      type: "array",
      minItems: 5,
      items: { type: "object", required: ["id", "trap", "countermeasure"] },
    },
    worked_examples: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        required: ["id", "label", "domain", "evidence_classification", "fictional", "facts", "challenge", "disposition", "record", "why"],
      },
    },
    calibration_exercise: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        required: ["id", "domain", "prompt", "options", "correct_option_id", "rationale"],
      },
    },
    review_program_scaffold: {
      type: "object",
      required: [
        "id", "evidence_classification", "approval_status", "claim_boundary", "qualification_fields",
        "appointment_fields", "conflict_questions", "re_review_triggers", "review_states", "current_project_claim_state",
      ],
    },
    related_material: {
      type: "array",
      minItems: 8,
      items: { type: "object", required: ["id", "kind", "label", "href"] },
    },
    limitations: { type: "array", minItems: 4, items: { type: "string" } },
    next_action: { type: "string" },
    source_basis: {
      type: "array",
      minItems: 7,
      items: { type: "object", required: ["id", "title", "href", "evidence_classification", "scope"] },
    },
    rights: {
      type: "object",
      required: ["editorial_content", "synthetic_examples_and_factual_metadata", "external_sources"],
    },
  },
} as const;

const coverageMapSchema = {
  type: "object",
  required: ["id", "version", "title", "review_status", "evidence_classification", "state_definitions", "deep_coverage", "family_coverage", "expansion_coverage", "out_of_scope", "counts", "applicability", "provenance", "rights"],
  properties: {
    id: { type: "string", const: accountingAgentsCoverageMap.id },
    version: { type: "string", const: accountingAgentsCoverageMap.version },
    title: { type: "string" },
    review_status: { type: "string" },
    evidence_classification: { type: "string", const: "editorial-recommendation" },
    state_definitions: { type: "array", minItems: 5, maxItems: 5, items: { type: "object", required: ["id", "label", "definition"], properties: { id: { type: "string", enum: coverageStates.map((state) => state.id) }, label: { type: "string" }, definition: { type: "string" } } } },
    deep_coverage: { type: "object", required: ["state", "current_count", "boundary", "planned_candidates", "evidence_classification"] },
    family_coverage: { type: "array", minItems: 8, maxItems: 8, items: { type: "object", required: ["id", "family_id", "family_name", "state", "workflow_count", "includes", "excludes", "next_gap", "evidence_classification"] } },
    expansion_coverage: { type: "array", items: { type: "object", required: ["id", "label", "current_state", "source_query", "planned_issue", "boundary"] } },
    out_of_scope: { type: "array", items: { type: "object", required: ["id", "label", "boundary"] } },
    counts: { type: "object" }, applicability: { type: "string" }, provenance: { type: "object" }, rights: { type: "object" },
  },
} as const;

const resourceSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id", "record_version", "record_updated_at", "topic", "source_type", "owner", "title",
    "published_or_status", "jurisdiction", "access", "summary", "reviewed_at", "verified_at",
    "curation", "relationship_profile", "source_license", "source_license_url", "source_rights", "metadata_rights", "annotation_rights", "canonical_source_url", "catalog_url", "record_url", "provenance",
  ],
  properties: {
    id: { type: "string", pattern: "^src_[a-z0-9]{4,}$", description: "Stable catalog ID." },
    record_version: { type: "string" },
    record_updated_at: { type: "string", format: "date" },
    topic: { type: "string", enum: allowedTopics },
    source_type: { type: "string", enum: allowedKinds },
    owner: { type: "string" },
    title: { type: "string" },
    published_or_status: { type: "string" },
    jurisdiction: { type: "string" },
    access: { type: "string" },
    summary: { type: "string" },
    reviewed_at: { type: "string", format: "date" },
    verified_at: { type: "string", format: "date" },
    curation: {
      type: "object",
      additionalProperties: false,
      required: ["review_status", "applicability", "applicability_note", "temporal_role", "lifecycle", "publication_status", "method", "transfer_limit", "commercial_interest", "source_updated_at", "next_review_at", "profile_status"],
      properties: {
        review_status: { type: "string", enum: ["maintainer-review-pending", "not-curated"] },
        applicability: { type: "array", uniqueItems: true, items: { type: "string", enum: allowedIndustries } },
        applicability_note: { type: ["string", "null"] },
        temporal_role: { type: ["string", "null"], enum: [...allowedTimeRoles, null] },
        lifecycle: { type: ["string", "null"], enum: ["current", "amended", "superseded", "draft", "withdrawn", "archival", null] },
        publication_status: { type: ["string", "null"] },
        method: { type: ["string", "null"] },
        transfer_limit: { type: ["string", "null"] },
        commercial_interest: { type: "string", enum: ["none identified", "publisher or author has commercial interest", "unknown"] },
        source_updated_at: { type: ["string", "null"], format: "date" },
        next_review_at: { type: ["string", "null"], format: "date" },
        profile_status: { type: "string", enum: ["relationship-profiled", "curated", "unclassified"] },
      },
    },
    relationship_profile: {
      oneOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: ["evidence_tier", "questions", "claims", "contrary_claims", "workflow_ids", "related_paths", "audiences", "difficulty", "estimated_reading_minutes", "importance", "supersedes", "superseded_by", "related_source_ids", "prerequisites", "expected_outcome", "accounting_example", "limitations", "next_action", "review_status"],
          properties: {
            evidence_tier: { type: "string", enum: sourceEvidenceTiers.map((item) => item.id) },
            questions: { type: "array", minItems: 1, items: { type: "string" } },
            claims: { type: "array", minItems: 1, items: { type: "object", additionalProperties: false, required: ["id", "text", "evidence_classification"], properties: { id: { type: "string" }, text: { type: "string" }, evidence_classification: { type: "string", enum: evidenceClassificationIds } } } },
            contrary_claims: { type: "array", minItems: 1, items: { type: "object", additionalProperties: false, required: ["text", "source_ids", "evidence_classification"], properties: { text: { type: "string" }, source_ids: { type: "array", minItems: 1, items: { type: "string", pattern: "^src_" } }, evidence_classification: { type: "string", enum: evidenceClassificationIds } } } },
            workflow_ids: { type: "array", minItems: 1, items: { type: "string", pattern: "^wf-" } },
            related_paths: { type: "array", minItems: 1, items: { type: "object", additionalProperties: false, required: ["label", "href"], properties: { label: { type: "string" }, href: { type: "string", pattern: "^/" } } } },
            audiences: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string", enum: sourceAudienceValues } },
            difficulty: { type: "string", enum: ["introductory", "intermediate", "advanced"] },
            estimated_reading_minutes: { type: "integer", minimum: 1 },
            importance: { type: "string", enum: ["core", "high", "supporting"] },
            supersedes: { type: "array", items: { type: "string", pattern: "^src_" } },
            superseded_by: { type: ["string", "null"], pattern: "^src_" },
            related_source_ids: { type: "array", minItems: 1, items: { type: "string", pattern: "^src_" } },
            prerequisites: { type: "string" },
            expected_outcome: { type: "string" },
            accounting_example: { type: "object", additionalProperties: false, required: ["text", "evidence_classification"], properties: { text: { type: "string" }, evidence_classification: { type: "string", const: "synthetic-example" } } },
            limitations: { type: "array", minItems: 1, items: { type: "string" } },
            next_action: { type: "string" },
            review_status: { type: "string", const: "maintainer-review-pending" },
          },
        },
      ],
    },
    source_license: { type: "string", enum: ["unknown"] },
    source_license_url: { type: ["string", "null"], format: "uri" },
    source_rights: {
      type: "object",
      additionalProperties: false,
      required: ["status", "license_id", "license_url", "full_text_stored", "permission_scope", "notes"],
      properties: {
        status: { type: "string", enum: ["unknown"] },
        license_id: { type: "null" },
        license_url: { type: "null" },
        full_text_stored: { type: "boolean", const: false },
        permission_scope: { type: "null" },
        notes: { type: "string" },
      },
    },
    metadata_rights: {
      type: "object",
      additionalProperties: false,
      required: ["license_id", "license_url", "applies_to"],
      properties: {
        license_id: { type: "string", const: "CC0-1.0" },
        license_url: { type: "string", format: "uri" },
        applies_to: { type: "string" },
      },
    },
    annotation_rights: {
      type: "object",
      additionalProperties: false,
      required: ["creator", "license_id", "license_url", "applies_to"],
      properties: {
        creator: { type: "string", const: "Accounting Agents contributors" },
        license_id: { type: "string", const: "CC-BY-4.0" },
        license_url: { type: "string", format: "uri" },
        applies_to: { type: "string" },
      },
    },
    canonical_source_url: { type: "string", format: "uri" },
    catalog_url: { type: "string", format: "uri" },
    record_url: { type: "string", format: "uri" },
    provenance: {
      type: "object",
      additionalProperties: false,
      required: ["source_owner", "source_url", "annotation_by", "annotation_type"],
      properties: {
        source_owner: { type: "string" },
        source_url: { type: "string", format: "uri" },
        annotation_by: { type: "string", const: "Accounting Agents" },
        annotation_type: { type: "string", const: "original editorial summary" },
      },
    },
  },
} as const;

const taxonomyRecordArraySchema = {
  type: "array",
  items: { type: "object", additionalProperties: true },
} as const;

const taxonomySchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "schema_version", "catalog_version", "process_families", "authority_levels", "workflows",
    "topics", "source_types", "industries", "time_roles", "lifecycle_states",
    "source_evidence_tiers", "source_audiences", "source_relationship_profile_count",
    "source_curation_contract", "workflow_packs", "benchmark_case_types", "ecosystem_layers",
    "search_record_types", "content_modes", "evidence_classifications", "control_model_elements",
    "coverage_states",
  ],
  properties: {
    schema_version: { type: "string", const: apiVersion },
    catalog_version: { type: "string", const: catalogVersion },
    process_families: taxonomyRecordArraySchema,
    authority_levels: taxonomyRecordArraySchema,
    workflows: taxonomyRecordArraySchema,
    topics: taxonomyRecordArraySchema,
    source_types: taxonomyRecordArraySchema,
    industries: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["value", "label", "description", "record_count"],
        properties: {
          value: { type: "string", enum: allowedIndustries },
          label: { type: "string" },
          description: { type: "string" },
          record_count: { type: "integer", minimum: 0 },
        },
      },
    },
    time_roles: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["value", "label", "description", "record_count"],
        properties: {
          value: { type: "string", enum: allowedTimeRoles },
          label: { type: "string" },
          description: { type: "string" },
          record_count: { type: "integer", minimum: 0 },
        },
      },
    },
    lifecycle_states: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["value", "record_count"],
        properties: {
          value: { type: "string", enum: resourceLifecycleStates },
          record_count: { type: "integer", minimum: 0 },
        },
      },
    },
    source_evidence_tiers: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["value", "label", "description", "record_count"],
        properties: {
          value: { type: "string", enum: sourceEvidenceTiers.map((item) => item.id) },
          label: { type: "string" },
          description: { type: "string" },
          record_count: { type: "integer", minimum: 0 },
        },
      },
    },
    source_audiences: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["value", "record_count"],
        properties: {
          value: { type: "string", enum: sourceAudienceValues },
          record_count: { type: "integer", minimum: 0 },
        },
      },
    },
    source_relationship_profile_count: { type: "integer", minimum: 0 },
    source_curation_contract: {
      type: "object",
      additionalProperties: false,
      required: [
        "status", "curation_review_status", "relationship_profile_review_status", "unclassified_records_are_not_assumed_general",
        "supported_industry_values", "supported_time_role_values", "human_invariant",
      ],
      properties: {
        status: { type: "string", const: "pilot" },
        curation_review_status: { type: "string", const: "maintainer-review-pending" },
        relationship_profile_review_status: { type: "string", const: "maintainer-review-pending" },
        unclassified_records_are_not_assumed_general: { type: "boolean", const: true },
        supported_industry_values: { type: "array", uniqueItems: true, items: { type: "string", enum: allowedIndustries } },
        supported_time_role_values: { type: "array", uniqueItems: true, items: { type: "string", enum: allowedTimeRoles } },
        human_invariant: { type: "string" },
      },
    },
    workflow_packs: taxonomyRecordArraySchema,
    benchmark_case_types: { type: "array", items: { type: "string" } },
    ecosystem_layers: taxonomyRecordArraySchema,
    search_record_types: { type: "array", items: { type: "string" } },
    content_modes: taxonomyRecordArraySchema,
    evidence_classifications: taxonomyRecordArraySchema,
    control_model_elements: taxonomyRecordArraySchema,
    coverage_states: taxonomyRecordArraySchema,
  },
} as const;

const stringArraySchema = { type: "array", items: { type: "string" } } as const;
const provenanceSchema = {
  type: "object",
  required: ["publisher", "annotation_type", "source_basis", "review_process"],
  properties: {
    publisher: { type: "string" },
    annotation_type: { type: "string" },
    source_basis: {
      oneOf: [
        { type: "string" },
        { type: "array", items: { type: "string" } },
      ],
    },
    review_process: { type: "string" },
  },
  additionalProperties: true,
} as const;

const workflowActionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["action", "authority_level", "agent_role", "human_role"],
  properties: {
    action: { type: "string" },
    authority_level: { type: "string", enum: allowedAuthorityLevels },
    agent_role: { type: "string" },
    human_role: { type: "string" },
  },
} as const;

const workflowSourceLinkSchema = {
  type: "object",
  additionalProperties: false,
  required: ["source_id", "supports", "claims", "applicability"],
  properties: {
    source_id: { type: "string", pattern: "^src_" },
    supports: {
      type: "string",
      enum: ["framework baseline", "workflow-specific claim", "evidence design", "documentation design"],
    },
    claims: {
      type: "array",
      minItems: 1,
      description: "Exact workflow claims and the human-page sections where their citations appear.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "placement"],
        properties: {
          text: { type: "string" },
          placement: { type: "string", enum: ["objective", "evidence", "authority", "record"] },
        },
      },
    },
    applicability: { type: "string" },
  },
} as const;

const workflowBriefSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id", "version", "content_mode", "evidence_classification", "intended_audience",
    "prerequisites", "outcome", "why_agentic", "best_fit", "poor_fit", "default_boundary",
    "owner", "reviewer", "top_check", "top_failure", "expected_artifact", "pilot_suitability",
    "synthetic_example", "related_material", "limitations", "next_action", "source_basis",
    "prepared_at", "review_status", "review_note", "rights",
  ],
  properties: {
    id: { type: "string", pattern: "^brief-wf-[a-z0-9-]+$" },
    version: { type: "string", const: "1" },
    content_mode: { type: "string", const: "how-to" },
    evidence_classification: { type: "string", const: "implementation-pattern" },
    intended_audience: { type: "string" },
    prerequisites: { type: "array", minItems: 3, items: { type: "string" } },
    outcome: { type: "string" },
    why_agentic: { type: "string" },
    best_fit: { type: "array", minItems: 3, items: { type: "string" } },
    poor_fit: { type: "array", minItems: 3, items: { type: "string" } },
    default_boundary: { type: "string" },
    owner: { type: "string" },
    reviewer: { type: "string" },
    top_check: { type: "string" },
    top_failure: { type: "string" },
    expected_artifact: { type: "string" },
    pilot_suitability: {
      type: "object",
      additionalProperties: false,
      required: ["rating", "rationale", "conditions"],
      properties: {
        rating: { type: "string", enum: ["good-supervised-pilot", "conditional", "poor"] },
        rationale: { type: "string" },
        conditions: { type: "array", minItems: 3, items: { type: "string" } },
      },
    },
    synthetic_example: {
      type: "object",
      additionalProperties: false,
      required: ["id", "title", "fictional", "evidence_classification", "facts", "decision"],
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        fictional: { type: "boolean", const: true },
        evidence_classification: { type: "string", const: "synthetic-example" },
        facts: { type: "array", minItems: 3, items: { type: "string" } },
        decision: { type: "string" },
      },
    },
    related_material: {
      type: "array",
      minItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "kind", "label", "href"],
        properties: {
          id: { type: "string" },
          kind: { type: "string", enum: ["workflow", "control", "template", "case", "source", "guide"] },
          label: { type: "string" },
          href: { type: "string", pattern: "^/" },
        },
      },
    },
    limitations: { type: "array", minItems: 4, items: { type: "string" } },
    next_action: { type: "string" },
    source_basis: {
      type: "array",
      minItems: 2,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "evidence_classification", "supports", "applicability"],
        properties: {
          id: { type: "string", pattern: "^src_" },
          evidence_classification: { type: "string", const: "authoritative-requirement" },
          supports: { type: "string" },
          applicability: { type: "string" },
        },
      },
    },
    prepared_at: { type: "string", format: "date" },
    review_status: { type: "string", const: "maintainer-review-pending" },
    review_note: { type: "string" },
    rights: {
      type: "object",
      additionalProperties: false,
      required: ["editorial_content", "synthetic_example_and_factual_metadata", "external_sources"],
      properties: {
        editorial_content: { type: "string", const: "CC-BY-4.0" },
        synthetic_example_and_factual_metadata: { type: "string", const: "CC0-1.0" },
        external_sources: { type: "string" },
      },
    },
  },
} as const;

const workflowRequired = [
  "id", "version", "family", "family_name", "name", "summary", "accounting_objective",
  "accountable_owner", "reviewer", "trigger", "scope", "entity_scope", "period_scope", "trigger_scope",
  "jurisdiction", "inputs", "control_totals", "source_ids", "source_links", "agent_procedures",
  "deterministic_checks", "read_tools", "write_tools",
  "authority_level", "actions", "thresholds", "human_decisions", "segregation_of_duties",
  "stop_conditions", "outputs", "proposed_accounting_effects", "run_record", "retention",
  "reproducibility", "failure_modes", "recovery_actions", "pilot_measures", "production_signals",
  "reviewed_at", "review_status", "provenance",
  "control_model",
] as const;

const workflowSchema = {
  type: "object",
  additionalProperties: false,
  required: workflowRequired,
  properties: {
    id: { type: "string", pattern: "^wf-[a-z0-9-]+$" },
    version: { type: "string" },
    family: { type: "string", enum: allowedFamilies },
    family_name: { type: "string" },
    name: { type: "string" },
    summary: { type: "string" },
    accounting_objective: { type: "string" },
    accountable_owner: { type: "string" },
    reviewer: { type: "string" },
    trigger: { type: "string" },
    scope: { type: "string" },
    entity_scope: { type: "string" },
    period_scope: { type: "string" },
    trigger_scope: { type: "string" },
    jurisdiction: { type: "string" },
    inputs: stringArraySchema,
    control_totals: stringArraySchema,
    source_ids: { type: "array", items: { type: "string", pattern: "^src_" } },
    source_links: { type: "array", items: workflowSourceLinkSchema },
    brief: workflowBriefSchema,
    agent_procedures: stringArraySchema,
    deterministic_checks: stringArraySchema,
    read_tools: stringArraySchema,
    write_tools: stringArraySchema,
    authority_level: {
      type: "string",
      enum: allowedAuthorityLevels,
      description: "Controlling workflow boundary. Inspect actions for the separate preparation, recommendation, execution, and human-only levels.",
    },
    actions: { type: "array", items: workflowActionSchema },
    thresholds: stringArraySchema,
    human_decisions: stringArraySchema,
    segregation_of_duties: stringArraySchema,
    stop_conditions: stringArraySchema,
    outputs: stringArraySchema,
    proposed_accounting_effects: { type: "string" },
    run_record: stringArraySchema,
    retention: { type: "string" },
    reproducibility: { type: "string" },
    failure_modes: stringArraySchema,
    recovery_actions: stringArraySchema,
    pilot_measures: stringArraySchema,
    production_signals: stringArraySchema,
    reviewed_at: { type: "string", format: "date" },
    review_status: { type: "string" },
    provenance: provenanceSchema,
    control_model: {
      type: "object",
      additionalProperties: false,
      required: ["model_id", "model_version", "elements"],
      properties: {
        model_id: { type: "string", const: accountingAgentControlModel.id },
        model_version: { type: "string", const: accountingAgentControlModel.version },
        elements: {
          type: "array",
          minItems: 9,
          maxItems: 9,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["element_id", "source_fields"],
            properties: {
              element_id: { type: "string", enum: controlModelElements.map((element) => element.id) },
              source_fields: stringArraySchema,
            },
          },
        },
      },
    },
  },
} as const;

const controlModelSchema = {
  type: "object",
  required: ["id", "version", "title", "review_status", "evidence_classification", "governing_invariant", "elements", "scenarios", "workflow_mapping", "source_basis", "rights"],
  properties: {
    id: { type: "string", const: accountingAgentControlModel.id },
    version: { type: "string", const: accountingAgentControlModel.version },
    title: { type: "string" },
    review_status: { type: "string" },
    evidence_classification: { type: "string", const: "implementation-pattern" },
    governing_invariant: { type: "string" },
    elements: { type: "array", minItems: 9, maxItems: 9, items: { type: "object", required: ["id", "ordinal", "label", "question", "definition", "required_record", "failure_boundary", "evidence_classification"] } },
    scenarios: { type: "array", minItems: 2, items: { type: "object", required: ["id", "title", "context", "evidence_classification", "fictional", "elements", "accountable_conclusion"] } },
    workflow_mapping: { type: "object" },
    source_basis: { type: "array", items: { type: "object", required: ["id", "title", "url", "classification", "scope"] } },
    rights: { type: "object" },
  },
} as const;

const normalizedRecordProperties = {
  version: { type: "string" },
  reviewed_at: { type: "string", format: "date" },
  review_status: { type: "string" },
  provenance: provenanceSchema,
} as const;

const authorityDecisionOutcomeSchema = {
  type: "object",
  additionalProperties: false,
  required: ["kind", "target", "label"],
  properties: {
    kind: { type: "string", enum: ["step", "authority", "stop"] },
    target: { type: "string" },
    label: { type: "string" },
  },
} as const;

const authorityDecisionGuideSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id", "version", "prepared_at", "review_status", "review_note", "primary_mode",
    "evidence_classification", "intended_audience", "prerequisites", "expected_outcome",
    "operating_rule", "decision_steps", "stop_conditions", "execution_comparison",
    "mixed_level_workflow", "common_misclassifications", "segregation_of_duties_examples",
    "sensitive_action_mappings", "limitations", "next_action", "source_basis", "rights",
  ],
  properties: {
    id: { type: "string", const: authorityDecisionGuide.id },
    version: { type: "string", const: authorityDecisionGuide.version },
    prepared_at: { type: "string", format: "date" },
    review_status: { type: "string", const: authorityDecisionGuide.review_status },
    review_note: { type: "string" },
    primary_mode: { type: "string", const: "reference" },
    evidence_classification: { type: "string", const: "implementation-pattern" },
    intended_audience: { type: "string" },
    prerequisites: { type: "array", minItems: 2, items: { type: "string" } },
    expected_outcome: { type: "string" },
    operating_rule: {
      type: "object",
      additionalProperties: false,
      required: ["id", "text", "evidence_classification"],
      properties: {
        id: { type: "string" },
        text: { type: "string" },
        evidence_classification: { type: "string", const: "editorial-recommendation" },
      },
    },
    decision_steps: {
      type: "array",
      minItems: 7,
      maxItems: 7,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "question", "why_it_matters", "yes", "no"],
        properties: {
          id: { type: "string" },
          question: { type: "string" },
          why_it_matters: { type: "string" },
          yes: authorityDecisionOutcomeSchema,
          no: authorityDecisionOutcomeSchema,
        },
      },
    },
    stop_conditions: { type: "array", minItems: 7, items: { type: "string" } },
    execution_comparison: { type: "array", minItems: 3, maxItems: 3, items: { type: "object", required: ["id", "level_id", "entry_condition", "decision_owner", "permitted_effect", "accounting_example", "stop_when"] } },
    mixed_level_workflow: { type: "object", required: ["id", "title", "fictional", "evidence_classification", "context", "actions", "finished_artifact"], properties: { fictional: { type: "boolean", const: true }, evidence_classification: { type: "string", const: "synthetic-example" }, actions: { type: "array", minItems: 7, items: { type: "object", required: ["id", "action", "level_id", "why", "accountable_person"] } } } },
    common_misclassifications: { type: "array", minItems: 6, items: { type: "object", required: ["id", "mistaken_claim", "correction"] } },
    segregation_of_duties_examples: { type: "array", minItems: 4, items: { type: "object", required: ["id", "unsafe_combination", "safer_design", "principle"] } },
    sensitive_action_mappings: { type: "array", minItems: 5, items: { type: "object", required: ["id", "sensitive_action_id", "href", "rule"] } },
    limitations: { type: "array", minItems: 4, items: { type: "string" } },
    next_action: { type: "string" },
    source_basis: { type: "array", minItems: 4, items: { type: "object", required: ["id", "evidence_classification", "scope"] } },
    rights: { type: "object", required: ["editorial_content", "synthetic_examples_and_factual_metadata", "external_sources"] },
  },
} as const;

const authorityLevelSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id", "label", "agent_role", "execution_rule", "required_controls", "accounting_example",
    "boundary", "version", "reviewed_at", "review_status", "provenance",
  ],
  properties: {
    id: { type: "string", enum: allowedAuthorityLevels },
    label: { type: "string" },
    agent_role: { type: "string" },
    execution_rule: { type: "string" },
    required_controls: stringArraySchema,
    accounting_example: { type: "string" },
    boundary: { type: "string" },
    ...normalizedRecordProperties,
  },
} as const;

const sensitiveActionSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id", "version", "name", "summary", "default_authority", "agent_may_prepare",
    "agent_may_execute", "human_only_conditions", "identity_and_sod", "limits",
    "approval_evidence", "pre_execution_checks", "rollback_or_compensation", "logging_and_review",
    "source_ids", "reviewed_at", "review_status", "provenance",
  ],
  properties: {
    id: { type: "string", pattern: "^sa-[a-z0-9-]+$" },
    name: { type: "string" },
    summary: { type: "string" },
    default_authority: { type: "string", enum: allowedAuthorityLevels },
    agent_may_prepare: stringArraySchema,
    agent_may_execute: stringArraySchema,
    human_only_conditions: stringArraySchema,
    identity_and_sod: stringArraySchema,
    limits: stringArraySchema,
    approval_evidence: stringArraySchema,
    pre_execution_checks: stringArraySchema,
    rollback_or_compensation: stringArraySchema,
    logging_and_review: stringArraySchema,
    source_ids: { type: "array", items: { type: "string", pattern: "^src_" } },
    ...normalizedRecordProperties,
  },
} as const;

const controlPatternSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id", "version", "name", "risk", "objective", "procedure", "evidence", "exceptions",
    "owner", "frequency", "source_ids", "reviewed_at", "review_status", "provenance",
  ],
  properties: {
    id: { type: "string", pattern: "^ctrl-[a-z0-9-]+$" },
    name: { type: "string" },
    risk: { type: "string" },
    objective: { type: "string" },
    procedure: stringArraySchema,
    evidence: stringArraySchema,
    exceptions: stringArraySchema,
    owner: { type: "string" },
    frequency: { type: "string" },
    source_ids: { type: "array", items: { type: "string", pattern: "^src_" } },
    ...normalizedRecordProperties,
  },
} as const;

const templateSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id", "version", "name", "purpose", "use_when", "sections", "reviewed_at",
    "review_status", "provenance",
  ],
  properties: {
    id: { type: "string", pattern: "^tpl-[a-z0-9-]+$" },
    name: { type: "string" },
    purpose: { type: "string" },
    use_when: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["heading", "prompt"],
        properties: { heading: { type: "string" }, prompt: { type: "string" } },
      },
    },
    ...normalizedRecordProperties,
  },
} as const;

const glossaryEntrySchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id", "term", "definition", "related", "version", "reviewed_at", "review_status", "provenance",
  ],
  properties: {
    id: { type: "string", pattern: "^term-[a-z0-9-]+$" },
    term: { type: "string" },
    definition: { type: "string" },
    related: stringArraySchema,
    ...normalizedRecordProperties,
  },
} as const;

const ecosystemLayerSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "role", "posture", "use_here", "boundary", "local_href", "local_label", "source_ids"],
  properties: {
    id: { type: "string", pattern: "^[a-z0-9-]+$" },
    name: { type: "string" },
    role: { type: "string" },
    posture: { type: "string", enum: ["adopted", "available when needed", "deferred"] },
    use_here: { type: "string" },
    boundary: { type: "string" },
    local_href: { type: ["string", "null"] },
    local_label: { type: ["string", "null"] },
    source_ids: { type: "array", items: { type: "string", pattern: "^src_" } },
  },
} as const;

const contentModeSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "label", "reader_need", "required_anatomy", "completion_standard", "mixing_quality_boundary"],
  properties: {
    id: { type: "string", enum: contentModeIds },
    label: { type: "string" },
    reader_need: { type: "string" },
    required_anatomy: stringArraySchema,
    completion_standard: { type: "string" },
    mixing_quality_boundary: { type: "string" },
  },
} as const;

const evidenceClassificationSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "label", "meaning", "display_reliance_boundary"],
  properties: {
    id: { type: "string", enum: evidenceClassificationIds },
    label: { type: "string" },
    meaning: { type: "string" },
    display_reliance_boundary: { type: "string" },
  },
} as const;

const contentReleaseImprovementSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "label", "test", "evidence_examples"],
  properties: {
    id: { type: "string" },
    label: { type: "string" },
    test: { type: "string" },
    evidence_examples: stringArraySchema,
  },
} as const;

const contentSuccessMeasureSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "label", "question", "signal", "interpretation_boundary"],
  properties: {
    id: { type: "string" },
    label: { type: "string" },
    question: { type: "string" },
    signal: { type: "string" },
    interpretation_boundary: { type: "string" },
  },
} as const;

const contentPageAssignmentSchema = {
  type: "object",
  additionalProperties: false,
  required: ["path", "primary_mode", "page_kind"],
  properties: {
    path: { type: "string" },
    primary_mode: { type: "string", enum: contentModeIds },
    page_kind: { type: "string", enum: ["static", "dynamic"] },
  },
} as const;

const contentContractSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id", "version", "title", "description", "prepared_at", "review_status", "review_note",
    "governing_invariant", "source_basis", "modes", "evidence_classifications", "release_gate",
    "success_measures", "measurement_status", "page_assignments",
  ],
  properties: {
    id: { type: "string", const: educationalContentContract.id },
    version: { type: "string", const: educationalContentContract.version },
    title: { type: "string" },
    description: { type: "string" },
    prepared_at: { type: "string", format: "date" },
    review_status: { type: "string", const: educationalContentContract.review_status },
    review_note: { type: "string" },
    governing_invariant: { type: "string" },
    source_basis: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "url", "scope"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          url: { type: "string", format: "uri" },
          scope: { type: "string" },
        },
      },
    },
    modes: { type: "array", minItems: 7, maxItems: 7, items: contentModeSchema },
    evidence_classifications: { type: "array", minItems: 7, maxItems: 7, items: evidenceClassificationSchema },
    release_gate: {
      type: "object",
      additionalProperties: false,
      required: ["principle", "qualifying_improvements", "non_qualifying_basis", "required_boundary"],
      properties: {
        principle: { type: "string" },
        qualifying_improvements: { type: "array", minItems: 6, items: contentReleaseImprovementSchema },
        non_qualifying_basis: { type: "string" },
        required_boundary: { type: "string" },
      },
    },
    success_measures: { type: "array", minItems: 9, items: contentSuccessMeasureSchema },
    measurement_status: { type: "string" },
    page_assignments: { type: "array", minItems: 1, items: contentPageAssignmentSchema },
  },
} as const;

const problemSchema = {
  type: "object",
  required: ["type", "title", "status", "detail"],
  properties: {
    type: { type: "string", format: "uri" },
    title: { type: "string" },
    status: { type: "integer" },
    detail: { type: "string" },
  },
  additionalProperties: true,
} as const;

const commonParameters = [
  { name: "q", in: "query", description: "Space-separated terms combined with AND logic.", schema: { type: "string", maxLength: 200 } },
  { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 200, default: 50 } },
  { name: "cursor", in: "query", description: "ID of the last record from the previous page in the same filtered result set.", schema: { type: "string" } },
  { name: "format", in: "query", description: "Overrides Accept-based content negotiation.", schema: { type: "string", enum: ["json", "markdown"] } },
] as const;

const workflowCollectionParameters = [
  ...commonParameters,
  { name: "family", in: "query", schema: { type: "string", enum: allowedFamilies } },
  { name: "authority", in: "query", schema: { type: "string", enum: allowedAuthorityLevels } },
] as const;

const resourceCollectionParameters = [
  ...commonParameters,
  { name: "topic", in: "query", schema: { type: "string", enum: allowedTopics } },
  { name: "kind", in: "query", schema: { type: "string", enum: allowedKinds } },
  { name: "industry", in: "query", schema: { type: "string", enum: allowedIndustries } },
  { name: "time_role", in: "query", schema: { type: "string", enum: allowedTimeRoles } },
] as const;

function collectionResponses(schemaName: string, additionalProperties: Record<string, unknown> = {}) {
  return {
    "200": {
      description: "Matching records in JSON or Markdown.",
      headers: {
        ETag: { schema: { type: "string" } },
        "Last-Modified": { schema: { type: "string" } },
        "X-Next-Page": { schema: { type: "string", format: "uri" } },
      },
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: [
              "schema_version", "total_catalog_records", "total_matching_records", "returned_records",
              "limit", "cursor", "next_cursor", "filters", "links", "items",
            ],
            properties: {
              schema_version: { type: "string" },
              corpus_version: { type: "string" },
              corpus_reviewed_at: { type: "string", format: "date" },
              catalog_version: { type: "string" },
              catalog_reviewed_at: { type: "string", format: "date" },
              collection: { type: "string" },
              rights_notice: { type: "string" },
              total_catalog_records: { type: "integer" },
              total_matching_records: { type: "integer" },
              returned_records: { type: "integer" },
              limit: { type: "integer" },
              cursor: { type: ["string", "null"] },
              next_cursor: { type: ["string", "null"] },
              filters: { type: "object", additionalProperties: true },
              links: { type: "object", additionalProperties: true },
              items: { type: "array", items: { $ref: `#/components/schemas/${schemaName}` } },
              ...additionalProperties,
            },
            additionalProperties: true,
          },
        },
        "text/markdown": { schema: { type: "string" } },
      },
    },
    "304": { description: "The representation has not changed." },
    "400": { description: "Invalid query parameter.", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } } },
    "406": { description: "No acceptable JSON or Markdown representation was requested.", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } } },
  };
}

function collectionPath(
  operationId: string,
  summary: string,
  tag: string,
  schemaName: string,
  additionalResponseProperties: Record<string, unknown> = {},
) {
  return {
    get: {
      operationId,
      summary,
      tags: [tag],
      parameters: commonParameters,
      responses: collectionResponses(schemaName, additionalResponseProperties),
    },
    head: {
      operationId: `${operationId}Head`,
      summary: "Retrieve collection headers",
      tags: [tag],
      parameters: commonParameters,
      responses: {
        "200": { description: "Collection headers." },
        "304": { description: "The representation has not changed." },
        "400": { description: "Invalid query parameter." },
        "406": { description: "No acceptable representation was requested." },
      },
    },
    options: {
      operationId: `${operationId}Options`,
      summary: "CORS preflight",
      tags: [tag],
      responses: { "204": { description: "Allowed methods and headers." } },
    },
  };
}

const document = {
  openapi: "3.1.0",
  info: {
    title: "Accounting Agents Public Corpus API",
    version: apiVersion,
    summary: "Read-only access to accounting-agent workflows, authority, controls, templates, terminology, sources, and the open-interface map.",
    description: `Corpus ${corpusVersion}, reviewed ${corpusReviewedAt}; source catalog ${catalogVersion}, reviewed ${catalogReviewedAt}. Coverage does not grant execution authority. External source content remains subject to each publisher's terms.`,
  },
  servers: [{ url: siteOrigin, description: "Public production service" }],
  security: [],
  tags: [
    { name: "Workflows", description: `${workflowRecords.length} canonical workflow specifications across eight accounting process families.` },
    { name: "Authority", description: "A0–A4 and human-only boundaries plus the canonical action decision guide." },
    { name: "Governance", description: `${sensitiveActions.length} sensitive-action boundaries and ${controlPatterns.length} control patterns.` },
    { name: "Reference", description: `${templates.length} implementation templates and ${glossary.length} controlled terms.` },
    { name: "Resources", description: `${agentResources.length} standards, guidance, technical references, evidence, and practice examples.` },
    { name: "Packs", description: `${packs.length} portable workflow packs with clean-room synthetic fixtures.` },
    { name: "Benchmark", description: `${benchmarkCases.length} public conformance cases with hard authority gates.` },
    { name: "LedgerBench", description: "Preview benchmark program, episode, result, and submission contracts." },
    { name: "Ecosystem", description: `${ecosystemLayers.length} role-based interface and standards layers.` },
    { name: "Content", description: `${educationalContentContract.modes.length} educational modes and ${educationalContentContract.evidence_classifications.length} visible evidence classifications.` },
    { name: "Discovery", description: "Corpus metadata and controlled taxonomies." },
  ],
  paths: {
    "/api/v1/workflows": {
      get: {
        operationId: "listWorkflows",
        summary: "Search and filter workflow records",
        tags: ["Workflows"],
        parameters: workflowCollectionParameters,
        responses: collectionResponses("Workflow"),
      },
      head: {
        operationId: "listWorkflowsHead",
        summary: "Retrieve workflow collection headers",
        tags: ["Workflows"],
        parameters: workflowCollectionParameters,
        responses: {
          "200": { description: "Workflow collection headers." },
          "304": { description: "The representation has not changed." },
          "400": { description: "Invalid query parameter." },
          "406": { description: "No acceptable representation was requested." },
        },
      },
      options: { operationId: "listWorkflowsOptions", summary: "CORS preflight", tags: ["Workflows"], responses: { "204": { description: "Allowed methods and headers." } } },
    },
    "/api/v1/workflows/{id}": {
      get: {
        operationId: "getWorkflow",
        summary: "Retrieve one workflow record",
        tags: ["Workflows"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", pattern: "^wf-[a-z0-9-]+$" } },
          { name: "format", in: "query", schema: { type: "string", enum: ["json", "markdown"] } },
        ],
        responses: {
          "200": { description: "One workflow record.", content: { "application/json": { schema: { type: "object", required: ["schema_version", "corpus_version", "collection", "item"], properties: { schema_version: { type: "string" }, corpus_version: { type: "string" }, collection: { type: "string", const: "workflows" }, item: { $ref: "#/components/schemas/Workflow" } } } }, "text/markdown": { schema: { type: "string" } } } },
          "304": { description: "The representation has not changed." },
          "400": { description: "Invalid format parameter.", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } } },
          "406": { description: "No acceptable representation was requested.", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } } },
          "404": { description: "Unknown workflow ID.", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } } },
        },
      },
      head: {
        operationId: "getWorkflowHead",
        summary: "Retrieve workflow record headers",
        tags: ["Workflows"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", pattern: "^wf-[a-z0-9-]+$" } },
          { name: "format", in: "query", schema: { type: "string", enum: ["json", "markdown"] } },
        ],
        responses: {
          "200": { description: "Workflow record headers." },
          "304": { description: "The representation has not changed." },
          "400": { description: "Invalid format parameter." },
          "406": { description: "No acceptable representation was requested." },
          "404": { description: "Unknown workflow ID." },
        },
      },
      options: {
        operationId: "getWorkflowOptions",
        summary: "CORS preflight",
        tags: ["Workflows"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", pattern: "^wf-[a-z0-9-]+$" } }],
        responses: { "204": { description: "Allowed methods and headers." } },
      },
    },
    "/api/v1/authority-levels": collectionPath(
      "listAuthorityLevels",
      "Search authority levels and retrieve the action decision guide",
      "Authority",
      "AuthorityLevel",
      { decision_guide: { $ref: "#/components/schemas/AuthorityDecisionGuide" } },
    ),
    "/api/v1/sensitive-actions": collectionPath("listSensitiveActions", "Search sensitive-action boundaries", "Governance", "SensitiveAction"),
    "/api/v1/controls": collectionPath("listControls", "Search control patterns", "Governance", "ControlPattern"),
    "/api/v1/templates": collectionPath("listTemplates", "Search implementation templates", "Reference", "Template"),
    "/api/v1/glossary": collectionPath("listGlossary", "Search controlled terms", "Reference", "GlossaryEntry"),
    "/api/v1/ecosystem": collectionPath("listEcosystemLayers", "Search open-interface and standards layers", "Ecosystem", "EcosystemLayer"),
    "/api/v1/resources": {
      get: {
        operationId: "listResources",
        summary: "Search and filter source records",
        tags: ["Resources"],
        parameters: resourceCollectionParameters,
        responses: collectionResponses("Resource"),
      },
      head: {
        operationId: "listResourcesHead",
        summary: "Retrieve source collection headers",
        tags: ["Resources"],
        parameters: resourceCollectionParameters,
        responses: {
          "200": { description: "Source collection headers." },
          "304": { description: "The representation has not changed." },
          "400": { description: "Invalid query parameter." },
          "406": { description: "No acceptable representation was requested." },
        },
      },
      options: { operationId: "listResourcesOptions", summary: "CORS preflight", tags: ["Resources"], responses: { "204": { description: "Allowed methods and headers." } } },
    },
    "/api/v1/resources/{id}": {
      get: {
        operationId: "getResource",
        summary: "Retrieve one source record",
        tags: ["Resources"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", pattern: "^src_[a-z0-9]{4,}$" } },
          { name: "format", in: "query", schema: { type: "string", enum: ["json", "markdown"] } },
        ],
        responses: {
          "200": { description: "One source record.", content: { "application/json": { schema: { type: "object", required: ["schema_version", "catalog_version", "rights_notice", "item"], properties: { schema_version: { type: "string" }, catalog_version: { type: "string" }, rights_notice: { type: "string" }, item: { $ref: "#/components/schemas/Resource" } } } }, "text/markdown": { schema: { type: "string" } } } },
          "304": { description: "The representation has not changed." },
          "400": { description: "Invalid format parameter.", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } } },
          "406": { description: "No acceptable representation was requested.", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } } },
          "404": { description: "Unknown resource ID.", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } } },
        },
      },
      head: {
        operationId: "getResourceHead",
        summary: "Retrieve source record headers",
        tags: ["Resources"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", pattern: "^src_[a-z0-9]{4,}$" } },
          { name: "format", in: "query", schema: { type: "string", enum: ["json", "markdown"] } },
        ],
        responses: {
          "200": { description: "Source record headers." },
          "304": { description: "The representation has not changed." },
          "400": { description: "Invalid format parameter." },
          "406": { description: "No acceptable representation was requested." },
          "404": { description: "Unknown source ID." },
        },
      },
      options: {
        operationId: "getResourceOptions",
        summary: "CORS preflight",
        tags: ["Resources"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", pattern: "^src_[a-z0-9]{4,}$" } }],
        responses: { "204": { description: "Allowed methods and headers." } },
      },
    },
    "/api/v1/search": {
      get: {
        operationId: "searchCorpus",
        summary: "Search pages, workflows, sources, packs, cases, and changes",
        tags: ["Discovery"],
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string", minLength: 1, maxLength: 200 } },
          { name: "type", in: "query", description: "Repeat or comma-separate record types.", schema: { type: "array", items: { type: "string" } }, style: "form", explode: true },
          { name: "family", in: "query", schema: { type: "string" } },
          { name: "authority", in: "query", schema: { type: "string" } },
          { name: "topic", in: "query", schema: { type: "string" } },
          { name: "kind", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 25 } },
          { name: "cursor", in: "query", description: "record_type:id cursor from the prior page with the same filters.", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Explainably ranked search results.", content: { "application/json": { schema: { type: "object" } } } },
          "304": { description: "The representation has not changed." },
          "400": { description: "Invalid or missing query.", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } } },
        },
      },
      head: { operationId: "searchCorpusHead", summary: "Retrieve search headers", tags: ["Discovery"], responses: { "200": { description: "Search headers." }, "400": { description: "Invalid or missing query." } } },
      options: { operationId: "searchCorpusOptions", summary: "CORS preflight", tags: ["Discovery"], responses: { "204": { description: "Allowed methods and headers." } } },
    },
    "/api/v1/packs": {
      get: {
        operationId: "listPacks",
        summary: "Search portable workflow packs",
        tags: ["Packs"],
        parameters: [...commonParameters, { name: "family", in: "query", schema: { type: "string", enum: allowedFamilies } }],
        responses: collectionResponses("Pack"),
      },
      head: { operationId: "listPacksHead", summary: "Retrieve pack collection headers", tags: ["Packs"], parameters: commonParameters, responses: { "200": { description: "Pack collection headers." }, "400": { description: "Invalid query." } } },
      options: { operationId: "listPacksOptions", summary: "CORS preflight", tags: ["Packs"], responses: { "204": { description: "Allowed methods and headers." } } },
    },
    "/api/v1/packs/{id}": {
      get: {
        operationId: "getPack",
        summary: "Retrieve one workflow pack",
        tags: ["Packs"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "format", in: "query", schema: { type: "string", enum: ["json", "markdown"] } },
        ],
        responses: {
          "200": { description: "One workflow pack in JSON or Markdown.", content: { "application/json": { schema: { type: "object", properties: { item: { $ref: "#/components/schemas/Pack" } } } }, "text/markdown": { schema: { type: "string" } } } },
          "404": { description: "Unknown pack ID.", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } } },
        },
      },
      head: { operationId: "getPackHead", summary: "Retrieve pack headers", tags: ["Packs"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Pack headers." }, "404": { description: "Unknown pack ID." } } },
      options: { operationId: "getPackOptions", summary: "CORS preflight", tags: ["Packs"], responses: { "204": { description: "Allowed methods and headers." } } },
    },
    "/api/v1/benchmark": {
      get: {
        operationId: "listBenchmarkCases",
        summary: "Search Accounting Agent Bench cases",
        tags: ["Benchmark"],
        parameters: [
          ...commonParameters,
          { name: "pack", in: "query", schema: { type: "string", enum: packs.map((pack) => pack.id) } },
          { name: "case_type", in: "query", schema: { type: "string" } },
        ],
        responses: collectionResponses("BenchmarkCase"),
      },
      head: { operationId: "listBenchmarkCasesHead", summary: "Retrieve benchmark headers", tags: ["Benchmark"], parameters: commonParameters, responses: { "200": { description: "Benchmark headers." }, "400": { description: "Invalid query." } } },
      options: { operationId: "listBenchmarkCasesOptions", summary: "CORS preflight", tags: ["Benchmark"], responses: { "204": { description: "Allowed methods and headers." } } },
    },
    "/api/v1/ledgerbench": {
      get: {
        operationId: "getLedgerBenchProgram",
        summary: "Retrieve the canonical LedgerBench program record",
        tags: ["LedgerBench"],
        responses: {
          "200": { description: "LedgerBench program record and canonical links.", content: { "application/json": { schema: { type: "object", properties: { item: { $ref: "#/components/schemas/LedgerBenchProgram" } } } } } },
          "304": { description: "The representation has not changed." },
        },
      },
      head: { operationId: "getLedgerBenchProgramHead", summary: "Retrieve LedgerBench program headers", tags: ["LedgerBench"], responses: { "200": { description: "LedgerBench program headers." }, "304": { description: "The representation has not changed." } } },
      options: { operationId: "getLedgerBenchProgramOptions", summary: "CORS preflight", tags: ["LedgerBench"], responses: { "204": { description: "Allowed methods and headers." } } },
    },
    "/schemas/ledgerbench-program.schema.json": { get: { operationId: "getLedgerBenchProgramSchema", summary: "Retrieve the LedgerBench program JSON Schema", tags: ["LedgerBench"], responses: { "200": { description: "Program schema.", content: { "application/schema+json": { schema: { type: "object" } } } } } } },
    "/schemas/ledgerbench-episode.schema.json": { get: { operationId: "getLedgerBenchEpisodeSchema", summary: "Retrieve the LedgerBench episode JSON Schema", tags: ["LedgerBench"], responses: { "200": { description: "Episode schema.", content: { "application/schema+json": { schema: { type: "object" } } } } } } },
    "/schemas/ledgerbench-result.schema.json": { get: { operationId: "getLedgerBenchResultSchema", summary: "Retrieve the LedgerBench result JSON Schema", tags: ["LedgerBench"], responses: { "200": { description: "Result schema.", content: { "application/schema+json": { schema: { type: "object" } } } } } } },
    "/schemas/ledgerbench-submission.schema.json": { get: { operationId: "getLedgerBenchSubmissionSchema", summary: "Retrieve the LedgerBench submission JSON Schema", tags: ["LedgerBench"], responses: { "200": { description: "Submission schema.", content: { "application/schema+json": { schema: { type: "object" } } } } } } },
    "/api/v1/meta": {
      get: {
        operationId: "getCorpusMetadata",
        summary: "Retrieve corpus metadata, rights notes, and canonical links",
        tags: ["Discovery"],
        responses: {
          "200": { description: "Corpus metadata.", content: { "application/json": { schema: { type: "object" } } } },
          "304": { description: "The representation has not changed." },
        },
      },
      head: {
        operationId: "getCorpusMetadataHead",
        summary: "Retrieve corpus metadata headers",
        tags: ["Discovery"],
        responses: { "200": { description: "Corpus metadata headers." }, "304": { description: "The representation has not changed." } },
      },
      options: { operationId: "getCorpusMetadataOptions", summary: "CORS preflight", tags: ["Discovery"], responses: { "204": { description: "Allowed methods and headers." } } },
    },
    "/api/v1/taxonomy": {
      get: {
        operationId: "getCorpusTaxonomy",
        summary: "Retrieve controlled families, authority levels, source facets, lifecycle states, and curation status",
        tags: ["Discovery"],
        responses: {
          "200": { description: "Corpus taxonomy.", content: { "application/json": { schema: { $ref: "#/components/schemas/Taxonomy" } } } },
          "304": { description: "The representation has not changed." },
        },
      },
      head: {
        operationId: "getCorpusTaxonomyHead",
        summary: "Retrieve corpus taxonomy headers",
        tags: ["Discovery"],
        responses: { "200": { description: "Corpus taxonomy headers." }, "304": { description: "The representation has not changed." } },
      },
      options: { operationId: "getCorpusTaxonomyOptions", summary: "CORS preflight", tags: ["Discovery"], responses: { "204": { description: "Allowed methods and headers." } } },
    },
    "/api/v1/content-contract": {
      get: {
        operationId: "getContentContract",
        summary: "Retrieve the educational content contract",
        tags: ["Content"],
        parameters: [{ name: "format", in: "query", description: "Overrides Accept-based content negotiation.", schema: { type: "string", enum: ["json", "markdown"] } }],
        responses: {
          "200": {
            description: "Educational content contract in JSON or Markdown.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["schema_version", "collection", "rights_notice", "links", "item"],
                  properties: {
                    schema_version: { type: "string" },
                    collection: { type: "string", const: "content_contract" },
                    rights_notice: { type: "string" },
                    links: { type: "object", additionalProperties: { type: "string", format: "uri" } },
                    item: { $ref: "#/components/schemas/ContentContract" },
                  },
                },
              },
              "text/markdown": { schema: { type: "string" } },
            },
          },
          "304": { description: "The representation has not changed." },
          "400": { description: "Invalid format parameter.", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } } },
          "406": { description: "No acceptable JSON or Markdown representation was requested.", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } } },
        },
      },
      head: {
        operationId: "getContentContractHead",
        summary: "Retrieve educational content contract headers",
        tags: ["Content"],
        parameters: [{ name: "format", in: "query", schema: { type: "string", enum: ["json", "markdown"] } }],
        responses: {
          "200": { description: "Content contract headers." },
          "304": { description: "The representation has not changed." },
          "400": { description: "Invalid format parameter." },
          "406": { description: "No acceptable representation was requested." },
        },
      },
      options: { operationId: "getContentContractOptions", summary: "CORS preflight", tags: ["Content"], responses: { "204": { description: "Allowed methods and headers." } } },
    },
    "/api/v1/start-here": {
      get: {
        operationId: "getStartHereOrientation",
        summary: "Retrieve the five-minute Start here orientation",
        tags: ["Content"],
        parameters: [{ name: "format", in: "query", description: "Overrides Accept-based content negotiation.", schema: { type: "string", enum: ["json", "markdown"] } }],
        responses: {
          "200": { description: "Start here orientation in JSON or Markdown.", content: { "application/json": { schema: { type: "object", required: ["schema_version", "collection", "rights_notice", "links", "item"], properties: { schema_version: { type: "string" }, collection: { type: "string", const: "start_here_orientation" }, rights_notice: { type: "string" }, links: { type: "object" }, item: { $ref: "#/components/schemas/StartHereOrientation" } } } }, "text/markdown": { schema: { type: "string" } } } },
          "304": { description: "The representation has not changed." },
          "400": { description: "Invalid format parameter." },
          "406": { description: "No acceptable representation was requested." },
        },
      },
      head: { operationId: "getStartHereOrientationHead", summary: "Retrieve Start here orientation headers", tags: ["Content"], responses: { "200": { description: "Orientation headers." }, "304": { description: "The representation has not changed." } } },
      options: { operationId: "getStartHereOrientationOptions", summary: "CORS preflight", tags: ["Content"], responses: { "204": { description: "Allowed methods and headers." } } },
    },
    "/api/v1/reviewer-guide": {
      get: {
        operationId: "getReviewerFieldGuide",
        summary: "Retrieve the reviewer field guide",
        tags: ["Governance"],
        parameters: [{ name: "format", in: "query", description: "Overrides Accept-based content negotiation.", schema: { type: "string", enum: ["json", "markdown"] } }],
        responses: {
          "200": { description: "Reviewer field guide in JSON or Markdown.", content: { "application/json": { schema: { type: "object", required: ["schema_version", "collection", "rights_notice", "links", "item"], properties: { schema_version: { type: "string" }, collection: { type: "string", const: "reviewer_field_guide" }, rights_notice: { type: "string" }, links: { type: "object" }, item: { $ref: "#/components/schemas/ReviewerFieldGuide" } } } }, "text/markdown": { schema: { type: "string" } } } },
          "304": { description: "The representation has not changed." },
          "400": { description: "Invalid format parameter." },
          "406": { description: "No acceptable representation was requested." },
        },
      },
      head: { operationId: "getReviewerFieldGuideHead", summary: "Retrieve reviewer field guide headers", tags: ["Governance"], responses: { "200": { description: "Reviewer guide headers." }, "304": { description: "The representation has not changed." } } },
      options: { operationId: "getReviewerFieldGuideOptions", summary: "CORS preflight", tags: ["Governance"], responses: { "204": { description: "Allowed methods and headers." } } },
    },
    "/api/v1/control-model": {
      get: {
        operationId: "getAccountingAgentControlModel",
        summary: "Retrieve the Accounting Agent Control Model",
        tags: ["Governance"],
        parameters: [{ name: "format", in: "query", schema: { type: "string", enum: ["json", "markdown"] } }],
        responses: {
          "200": { description: "Control Model in JSON or Markdown.", content: { "application/json": { schema: { type: "object", required: ["schema_version", "collection", "rights_notice", "links", "item"], properties: { schema_version: { type: "string" }, collection: { type: "string", const: "control_model" }, rights_notice: { type: "string" }, links: { type: "object" }, item: { $ref: "#/components/schemas/ControlModel" } } } }, "text/markdown": { schema: { type: "string" } } } },
          "304": { description: "The representation has not changed." },
          "400": { description: "Invalid format parameter." },
          "406": { description: "No acceptable representation was requested." },
        },
      },
      head: { operationId: "getAccountingAgentControlModelHead", summary: "Retrieve Control Model headers", tags: ["Governance"], responses: { "200": { description: "Control Model headers." }, "304": { description: "The representation has not changed." } } },
      options: { operationId: "getAccountingAgentControlModelOptions", summary: "CORS preflight", tags: ["Governance"], responses: { "204": { description: "Allowed methods and headers." } } },
    },
    "/api/v1/coverage": {
      get: {
        operationId: "getCoverageMap",
        summary: "Retrieve the versioned coverage and gaps map",
        tags: ["Content"],
        parameters: [{ name: "format", in: "query", schema: { type: "string", enum: ["json", "markdown"] } }],
        responses: {
          "200": { description: "Coverage map in JSON or Markdown.", content: { "application/json": { schema: { type: "object", required: ["schema_version", "collection", "rights_notice", "links", "item"], properties: { schema_version: { type: "string" }, collection: { type: "string", const: "coverage_map" }, rights_notice: { type: "string" }, links: { type: "object" }, item: { $ref: "#/components/schemas/CoverageMap" } } } }, "text/markdown": { schema: { type: "string" } } } },
          "304": { description: "The representation has not changed." }, "400": { description: "Invalid format parameter." }, "406": { description: "No acceptable representation was requested." },
        },
      },
      head: { operationId: "getCoverageMapHead", summary: "Retrieve coverage map headers", tags: ["Content"], responses: { "200": { description: "Coverage map headers." }, "304": { description: "The representation has not changed." } } },
      options: { operationId: "getCoverageMapOptions", summary: "CORS preflight", tags: ["Content"], responses: { "204": { description: "Allowed methods and headers." } } },
    },
  },
  components: {
    schemas: {
      Resource: resourceSchema,
      Taxonomy: taxonomySchema,
      Workflow: workflowSchema,
      AuthorityLevel: authorityLevelSchema,
      SensitiveAction: sensitiveActionSchema,
      ControlPattern: controlPatternSchema,
      Template: templateSchema,
      GlossaryEntry: glossaryEntrySchema,
      EcosystemLayer: ecosystemLayerSchema,
      ContentContract: contentContractSchema,
      StartHereOrientation: startHereSchema,
      ReviewerFieldGuide: reviewerGuideSchema,
      AuthorityDecisionGuide: authorityDecisionGuideSchema,
      ControlModel: controlModelSchema,
      CoverageMap: coverageMapSchema,
      Pack: packSchema,
      BenchmarkCase: benchmarkCaseSchema,
      LedgerBenchProgram: ledgerBenchProgramSchema,
      LedgerBenchEpisode: ledgerBenchEpisodeSchema,
      LedgerBenchResult: ledgerBenchResultSchema,
      LedgerBenchSubmission: ledgerBenchSubmissionSchema,
      ReleaseManifest: releaseManifestSchema,
      Problem: problemSchema,
    },
  },
};

export async function GET(request: Request) {
  return publicResponse(
    request,
    JSON.stringify(document, null, 2),
    "application/vnd.oai.openapi+json;version=3.1; charset=utf-8",
  );
}

export const HEAD = GET;
