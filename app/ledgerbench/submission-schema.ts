import { ledgerBenchProgram } from "../../data/ledgerbench-program.mjs";
import { ledgerBenchLinks, semver, sha256, stringArray } from "./schema-common";

const packagedArtifactSchema = {
  type: "object",
  additionalProperties: false,
  required: ["path", "sha256", "media_type"],
  properties: {
    path: { type: "string", minLength: 1 },
    sha256: { type: "string", pattern: sha256 },
    media_type: { type: "string", minLength: 1 },
  },
} as const;

export const ledgerBenchSubmissionSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: ledgerBenchLinks.submission_schema,
  title: "LedgerBench official submission manifest",
  type: "object",
  additionalProperties: false,
  required: [
    "schema_version", "benchmark_release", "track", "division",
    "candidate", "disclosures", "resource_policy", "results", "submission_package",
    "verification_requested", "rights_declaration", "confidentiality_declaration",
  ],
  properties: {
    schema_version: { type: "string", pattern: semver },
    benchmark_release: { type: "string" },
    track: { type: "string", enum: ledgerBenchProgram.tracks.filter((item) => item.id !== "adversarial-overlay").map((item) => item.id) },
    division: { type: "string", enum: ledgerBenchProgram.divisions.map((item) => item.id) },
    candidate: {
      type: "object",
      additionalProperties: false,
      required: [
        "system_id", "system_version", "model_id", "model_version",
        "deployment_kind", "container_or_endpoint", "endpoint_id", "endpoint_version", "configuration_sha256",
      ],
      properties: {
        system_id: { type: "string", minLength: 1 },
        system_version: { type: "string", minLength: 1 },
        model_id: { type: "string", minLength: 1 },
        model_version: { type: "string", minLength: 1 },
        deployment_kind: { type: "string", enum: ["container", "endpoint"] },
        container_or_endpoint: { type: "string" },
        endpoint_id: { type: ["string", "null"] },
        endpoint_version: { type: ["string", "null"] },
        configuration_sha256: { type: "string", pattern: sha256 },
      },
      allOf: [
        {
          if: { properties: { deployment_kind: { const: "endpoint" } } },
          then: {
            properties: {
              endpoint_id: { type: "string", minLength: 1 },
              endpoint_version: { type: "string", minLength: 1 },
            },
          },
        },
        {
          if: { properties: { deployment_kind: { const: "container" } } },
          then: { properties: { endpoint_id: { type: "null" }, endpoint_version: { type: "null" } } },
        },
      ],
    },
    disclosures: {
      type: "object",
      additionalProperties: false,
      required: [
        "prompts_and_policy", "tools", "retrieval", "memory",
        "fine_tuning_or_adaptation", "training_source_statement",
        "human_intervention",
      ],
      properties: {
        prompts_and_policy: { type: "string" },
        tools: stringArray,
        retrieval: { type: "string" },
        memory: { type: "string" },
        fine_tuning_or_adaptation: { type: "string" },
        training_source_statement: { type: "string" },
        human_intervention: { type: "string" },
      },
    },
    resource_policy: {
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
    results: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["episode_id", "result_sha256"],
        properties: {
          episode_id: { type: "string" },
          result_sha256: { type: "string", pattern: sha256 },
        },
      },
    },
    submission_package: {
      type: "object",
      additionalProperties: false,
      required: [
        "candidate_system_card", "source_or_container", "dependency_lockfiles", "configuration", "run_command",
        "tool_logs", "environment_logs", "artifact_hashes", "cost_time_records",
        "known_failures", "conformance_declaration",
      ],
      properties: {
        candidate_system_card: packagedArtifactSchema,
        source_or_container: packagedArtifactSchema,
        dependency_lockfiles: { type: "array", minItems: 1, items: packagedArtifactSchema },
        configuration: packagedArtifactSchema,
        run_command: { type: "string", minLength: 1 },
        tool_logs: { type: "array", minItems: 1, items: packagedArtifactSchema },
        environment_logs: { type: "array", minItems: 1, items: packagedArtifactSchema },
        artifact_hashes: { type: "array", minItems: 1, items: packagedArtifactSchema },
        cost_time_records: { type: "array", minItems: 1, items: packagedArtifactSchema },
        known_failures: stringArray,
        conformance_declaration: { type: "string", minLength: 1 },
      },
    },
    verification_requested: {
      type: "string",
      enum: ledgerBenchProgram.submission_program.statuses.map((item) => item.id),
    },
    rights_declaration: { type: "string", minLength: 1 },
    confidentiality_declaration: { type: "string", minLength: 1 },
  },
} as const;
