import { ledgerBenchProgram } from "../../data/ledgerbench-program.mjs";
import { evidenceLinkSchema, journalLineSchema, ledgerBenchLinks, semver, sha256, stringArray } from "./schema-common";

export const ledgerBenchResultSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: ledgerBenchLinks.result_schema,
  title: "LedgerBench candidate episode result",
  description: "The common structured result for one candidate system on one episode. Private chain-of-thought is neither requested nor accepted.",
  type: "object",
  additionalProperties: false,
  required: [
    "schema_version", "episode_id", "candidate", "environment", "terminal_state",
    "evidence_links", "calculations", "findings", "proposed_journal_entries",
    "proposed_actions", "executed_actions", "artifacts", "run_record",
  ],
  properties: {
    schema_version: { type: "string", pattern: semver },
    episode_id: { type: "string", pattern: "^lb-ep-[a-z0-9-]+$" },
    candidate: {
      type: "object",
      additionalProperties: false,
      required: [
        "system_id", "system_version", "model_id", "model_version",
        "adapter_version", "configuration_sha256",
      ],
      properties: {
        system_id: { type: "string" },
        system_version: { type: "string" },
        model_id: { type: "string" },
        model_version: { type: "string" },
        adapter_version: { type: "string" },
        configuration_sha256: { type: "string", pattern: sha256 },
      },
    },
    environment: {
      type: "object",
      additionalProperties: false,
      required: ["environment_id", "environment_version", "manifest_sha256"],
      properties: {
        environment_id: { type: "string" },
        environment_version: { type: "string" },
        manifest_sha256: { type: "string", pattern: sha256 },
      },
    },
    terminal_state: { type: "string", enum: ledgerBenchProgram.unit_of_evaluation.terminal_states },
    evidence_links: { type: "array", items: evidenceLinkSchema },
    calculations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "description", "inputs", "formula", "result"],
        properties: {
          id: { type: "string" },
          description: { type: "string" },
          inputs: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "value", "evidence_ids"],
              properties: {
                name: { type: "string" },
                value: { type: ["string", "number", "integer"] },
                evidence_ids: stringArray,
              },
            },
          },
          formula: { type: "string" },
          result: { type: ["string", "number", "integer"] },
          currency: { type: ["string", "null"] },
        },
      },
    },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["code", "classification", "description", "evidence_ids"],
        properties: {
          code: { type: "string" },
          classification: {
            type: "string",
            enum: [
              "timing_item", "accounting_error", "control_exception",
              "documentation_gap", "missing_evidence", "no_exception",
              "policy_question", "authority_exception",
            ],
          },
          description: { type: "string" },
          amount: { type: ["string", "null"] },
          currency: { type: ["string", "null"] },
          entity_id: { type: ["string", "null"] },
          period: { type: ["string", "null"] },
          evidence_ids: stringArray,
        },
      },
    },
    proposed_journal_entries: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["entry_id", "entity_id", "period", "currency", "description", "lines", "evidence_ids"],
        properties: {
          entry_id: { type: "string" },
          entity_id: { type: "string" },
          period: { type: "string" },
          currency: { type: "string" },
          description: { type: "string" },
          reversal_date: { type: ["string", "null"], format: "date" },
          lines: { type: "array", minItems: 2, items: journalLineSchema },
          evidence_ids: stringArray,
        },
      },
    },
    proposed_actions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["action_type", "description", "requires_human_approval"],
        properties: {
          action_type: { type: "string" },
          description: { type: "string" },
          requires_human_approval: { type: "boolean" },
        },
      },
    },
    executed_actions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["action_type", "status", "receipt_id"],
        properties: {
          action_type: { type: "string" },
          status: { type: "string" },
          receipt_id: { type: "string" },
        },
      },
    },
    artifacts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["path", "media_type", "sha256"],
        properties: {
          path: { type: "string" },
          media_type: { type: "string" },
          sha256: { type: "string", pattern: sha256 },
        },
      },
    },
    run_record: {
      type: "object",
      additionalProperties: false,
      required: [
        "started_at", "completed_at", "attempt", "tool_event_count",
        "tool_log_sha256", "input_tree_unchanged", "warnings", "limitations",
      ],
      properties: {
        started_at: { type: "string", format: "date-time" },
        completed_at: { type: "string", format: "date-time" },
        attempt: { type: "integer", minimum: 1 },
        tool_event_count: { type: "integer", minimum: 0 },
        tool_log_sha256: { type: "string", pattern: sha256 },
        input_tree_unchanged: { type: "boolean" },
        wall_time_seconds: { type: ["number", "null"], minimum: 0 },
        input_tokens: { type: ["integer", "null"], minimum: 0 },
        output_tokens: { type: ["integer", "null"], minimum: 0 },
        declared_cost_usd: { type: ["number", "null"], minimum: 0 },
        human_minutes: { type: ["number", "null"], minimum: 0 },
        warnings: stringArray,
        limitations: stringArray,
      },
    },
  },
} as const;

