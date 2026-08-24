import { ledgerBenchProgram } from "../../data/ledgerbench-program.mjs";
import { ledgerBenchLinks, semver, sha256, stringArray } from "./schema-common";

export const ledgerBenchSubmissionSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: ledgerBenchLinks.submission_schema,
  title: "LedgerBench official submission manifest",
  type: "object",
  additionalProperties: false,
  required: [
    "schema_version", "benchmark_release", "track", "division",
    "candidate", "disclosures", "resource_policy", "results",
    "verification_requested", "rights_declaration",
  ],
  properties: {
    schema_version: { type: "string", pattern: semver },
    benchmark_release: { type: "string" },
    track: { type: "string", enum: ledgerBenchProgram.tracks.map((item) => item.id) },
    division: { type: "string", enum: ledgerBenchProgram.divisions.map((item) => item.id) },
    candidate: {
      type: "object",
      additionalProperties: false,
      required: [
        "system_id", "system_version", "model_id", "model_version",
        "container_or_endpoint", "configuration_sha256",
      ],
      properties: {
        system_id: { type: "string" },
        system_version: { type: "string" },
        model_id: { type: "string" },
        model_version: { type: "string" },
        container_or_endpoint: { type: "string" },
        configuration_sha256: { type: "string", pattern: sha256 },
      },
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
    verification_requested: {
      type: "string",
      enum: ledgerBenchProgram.submission_program.statuses.map((item) => item.id),
    },
    rights_declaration: { type: "string" },
  },
} as const;

