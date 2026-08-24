import { siteOrigin } from "../agent-interface";

export const stringArray = { type: "array", items: { type: "string" } } as const;
export const semver = "^\\d+\\.\\d+\\.\\d+$";
export const sha256 = "^sha256:[a-f0-9]{64}$";

export const ledgerBenchLinks = {
  human: `${siteOrigin}/ledgerbench`,
  markdown: `${siteOrigin}/ledgerbench.md`,
  api: `${siteOrigin}/api/v1/ledgerbench`,
  program_schema: `${siteOrigin}/schemas/ledgerbench-program.schema.json`,
  episode_schema: `${siteOrigin}/schemas/ledgerbench-episode.schema.json`,
  result_schema: `${siteOrigin}/schemas/ledgerbench-result.schema.json`,
  submission_schema: `${siteOrigin}/schemas/ledgerbench-submission.schema.json`,
  source: `${siteOrigin}/downloads/accounting-agents-source.zip`,
} as const;

export const productSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "question", "result", "ranking"],
  properties: {
    id: { type: "string", pattern: "^[a-z0-9-]+$" },
    name: { type: "string" },
    question: { type: "string" },
    result: { type: "string" },
    ranking: { type: "boolean" },
  },
} as const;

export const trackSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "human_horizon", "purpose", "status"],
  properties: {
    id: { type: "string", pattern: "^[a-z0-9-]+$" },
    name: { type: "string" },
    human_horizon: { type: "string" },
    purpose: { type: "string" },
    status: { type: "string", enum: ["proposed", "preview", "active", "saturated", "retired", "archived"] },
  },
} as const;

export const divisionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "purpose", "human_intervention", "comparability"],
  properties: {
    id: { type: "string", pattern: "^[a-z0-9-]+$" },
    name: { type: "string" },
    purpose: { type: "string" },
    human_intervention: { type: "string" },
    comparability: { type: "string" },
  },
} as const;


export const evidenceLinkSchema = {
  type: "object",
  additionalProperties: false,
  required: ["evidence_id", "source_version", "sha256", "supports"],
  properties: {
    evidence_id: { type: "string" },
    source_version: { type: "string" },
    sha256: { type: "string", pattern: sha256 },
    supports: { type: "string" },
  },
} as const;

export const journalLineSchema = {
  type: "object",
  additionalProperties: false,
  required: ["account_id", "debit", "credit"],
  properties: {
    account_id: { type: "string" },
    debit: { type: "string", pattern: "^-?\\d+(?:\\.\\d+)?$" },
    credit: { type: "string", pattern: "^-?\\d+(?:\\.\\d+)?$" },
    dimensions: { type: "object", additionalProperties: { type: "string" } },
  },
} as const;

