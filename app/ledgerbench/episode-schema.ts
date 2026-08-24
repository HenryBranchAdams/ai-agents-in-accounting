import { ledgerBenchProgram } from "../../data/ledgerbench-program.mjs";
import { ledgerBenchLinks, semver, sha256, stringArray } from "./schema-common";

const nonEmptyStringArray = { type: "array", minItems: 1, items: { type: "string", minLength: 1 } } as const;
const operatingContextProperties = Object.fromEntries(
  ledgerBenchProgram.task_universe.operating_context_fields.map((field) => [
    field,
    { type: ["string", "number", "boolean", "null"] },
  ]),
);

export const ledgerBenchEpisodeSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: ledgerBenchLinks.episode_schema,
  title: "LedgerBench episode",
  description: "A versioned unit of accounting-agent evaluation.",
  type: "object",
  additionalProperties: false,
  required: [
    "schema_version", "episode_id", "benchmark_release", "track", "overlays", "division",
    "task_population", "initial_state", "objective", "acting_role", "as_of",
    "authority_envelope", "tools", "resource_budget", "deliverables",
    "terminal_states", "acceptance_model", "provenance",
  ],
  properties: {
    schema_version: { type: "string", pattern: semver },
    episode_id: { type: "string", pattern: "^lb-ep-[a-z0-9-]+$" },
    benchmark_release: { type: "string" },
    track: { type: "string", enum: ledgerBenchProgram.tracks.filter((item) => item.id !== "adversarial-overlay").map((item) => item.id) },
    overlays: { type: "array", uniqueItems: true, items: { type: "string", enum: ["adversarial-overlay"] } },
    division: { type: "string", enum: ledgerBenchProgram.divisions.map((item) => item.id) },
    task_population: {
      type: "object",
      additionalProperties: false,
      required: [
        "domain", "behaviors", "evidence_conditions", "time_horizon",
        "authority_exposure", "consequence_class", "operating_context", "primary_split",
      ],
      properties: {
        domain: { type: "string", enum: ledgerBenchProgram.task_universe.domains },
        behaviors: { type: "array", minItems: 1, items: { type: "string", enum: ledgerBenchProgram.task_universe.behaviors } },
        evidence_conditions: { type: "array", minItems: 1, items: { type: "string", enum: ledgerBenchProgram.task_universe.evidence_conditions } },
        time_horizon: { type: "string", enum: ledgerBenchProgram.task_universe.time_horizons },
        authority_exposure: { type: "string", enum: ledgerBenchProgram.task_universe.authority_exposures },
        consequence_class: { type: "string", enum: ledgerBenchProgram.task_universe.consequence_classes },
        operating_context: {
          type: "object",
          additionalProperties: false,
          minProperties: 1,
          properties: operatingContextProperties,
        },
        primary_split: { type: "string", enum: ledgerBenchProgram.split_policy.splits.map((item) => item.id) },
        group_ids: { type: "object", additionalProperties: { type: "string" } },
      },
    },
    initial_state: {
      type: "object",
      additionalProperties: false,
      required: ["environment_id", "environment_version", "manifest_sha256", "read_only"],
      properties: {
        environment_id: { type: "string" },
        environment_version: { type: "string" },
        manifest_sha256: { type: "string", pattern: sha256 },
        read_only: { type: "boolean", const: true },
      },
    },
    objective: { type: "string", minLength: 1 },
    acting_role: { type: "string", minLength: 1 },
    as_of: { type: "string", format: "date-time" },
    authority_envelope: {
      type: "object",
      additionalProperties: false,
      required: ["maximum_authority", "allowed_actions", "prohibited_actions", "approval_evidence"],
      properties: {
        maximum_authority: { type: "string", enum: ["A0", "A1", "A2", "A3", "A4", "human-only"] },
        allowed_actions: stringArray,
        prohibited_actions: stringArray,
        approval_evidence: { type: "string", minLength: 1 },
      },
    },
    tools: {
      type: "object",
      additionalProperties: false,
      required: ["allowed", "network_policy", "input_mount", "output_mount"],
      properties: {
        allowed: stringArray,
        network_policy: { type: "string", enum: ["disabled", "allowlisted"] },
        input_mount: { type: "string" },
        output_mount: { type: "string" },
      },
    },
    resource_budget: {
      type: "object",
      additionalProperties: false,
      required: ["attempts", "wall_time_seconds"],
      properties: {
        attempts: { type: "integer", minimum: 1 },
        wall_time_seconds: { type: "integer", minimum: 1 },
        token_budget: { type: ["integer", "null"], minimum: 1 },
        declared_cost_limit_usd: { type: ["number", "null"], minimum: 0 },
        human_minutes: { type: ["number", "null"], minimum: 0 },
      },
    },
    deliverables: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["path", "media_type", "required"],
        properties: {
          path: { type: "string" },
          media_type: { type: "string" },
          required: { type: "boolean" },
          schema_href: { type: ["string", "null"], format: "uri-reference" },
        },
      },
    },
    terminal_states: { type: "array", minItems: 1, items: { type: "string", enum: ledgerBenchProgram.unit_of_evaluation.terminal_states } },
    acceptance_model: {
      type: "object",
      additionalProperties: false,
      required: [
        "mandatory_checks", "review_required", "review_threshold", "hard_gates",
        "invariants", "acceptable_values_or_tolerances", "required_evidence",
        "hierarchical_rubric", "hard_exclusions", "materiality",
      ],
      properties: {
        invariants: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "description", "grader"],
            properties: { id: { type: "string" }, description: { type: "string" }, grader: { type: "string" } },
          },
        },
        acceptable_values_or_tolerances: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "target", "comparison", "expected", "tolerance", "unit", "allowed_values"],
            properties: {
              id: { type: "string" },
              target: { type: "string" },
              comparison: { type: "string", enum: ["exact", "absolute", "relative", "set-membership", "reviewer-disposition"] },
              expected: { type: ["string", "number", "null"] },
              tolerance: { type: ["number", "null"], minimum: 0 },
              unit: { type: ["string", "null"] },
              allowed_values: { type: "array", items: { type: ["string", "number", "boolean", "null"] } },
            },
          },
        },
        required_evidence: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "description", "source_constraints", "cutoff_required"],
            properties: {
              id: { type: "string" },
              description: { type: "string" },
              source_constraints: nonEmptyStringArray,
              cutoff_required: { type: "boolean" },
            },
          },
        },
        hierarchical_rubric: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "criterion", "weight", "children"],
            properties: {
              id: { type: "string" },
              criterion: { type: "string" },
              weight: { type: "number", minimum: 0, maximum: 1 },
              children: stringArray,
            },
          },
        },
        hard_exclusions: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "description", "hard_gate"],
            properties: {
              id: { type: "string" },
              description: { type: "string" },
              hard_gate: { type: "string", enum: ledgerBenchProgram.hard_gates },
            },
          },
        },
        materiality: {
          type: "object",
          additionalProperties: false,
          required: ["basis", "thresholds"],
          properties: {
            basis: { type: "string" },
            thresholds: nonEmptyStringArray,
          },
        },
        mandatory_checks: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "grader", "severity"],
            properties: {
              id: { type: "string" },
              grader: { type: "string" },
              severity: { type: "string", enum: ["required", "material", "advisory", "authority_gate"] },
              public_parameters: {
                type: "object",
                additionalProperties: false,
                properties: {
                  description: { type: "string" },
                  tolerance: { type: ["number", "null"] },
                  allowed_values: stringArray,
                },
              },
            },
          },
        },
        review_required: { type: "boolean" },
        review_threshold: { type: ["number", "null"], minimum: 0, maximum: 1 },
        hard_gates: { type: "array", minItems: 1, items: { type: "string", enum: ledgerBenchProgram.hard_gates } },
      },
    },
    provenance: {
      type: "object",
      additionalProperties: false,
      required: ["task_source", "rights", "admission_record_id"],
      properties: {
        task_source: { type: "string" },
        rights: { type: "string" },
        admission_record_id: { type: "string" },
      },
    },
  },
} as const;
