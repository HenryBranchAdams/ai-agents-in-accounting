import {
  benchmark,
  benchmarkCases,
  packs,
  platformData,
  platformRelease,
  releaseNotes,
} from "../data/open-source-platform.mjs";
import { siteOrigin } from "./agent-interface";
import archiveDigests from "../public/downloads/archive-digests.json";

export {
  benchmark,
  benchmarkCases,
  packs,
  platformData,
  platformRelease,
  releaseNotes,
};

export type WorkflowPack = (typeof packs)[number];
export type BenchmarkCase = (typeof benchmarkCases)[number];

export const packById = new Map(packs.map((pack) => [pack.id, pack]));

export const packSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `${siteOrigin}/schemas/pack.schema.json`,
  title: "Accounting Agents workflow pack",
  type: "object",
  additionalProperties: false,
  required: [
    "id", "version", "title", "summary", "workflow_ids", "process_family",
    "authority_level", "scope", "jurisdiction", "source_ids", "inputs",
    "procedures", "deterministic_checks", "expected_artifact", "hard_gates", "files", "fixture",
    "reference_output", "licenses", "reviewed_at", "review_status", "provenance",
  ],
  properties: {
    id: { type: "string", pattern: "^[a-z0-9-]+$" },
    version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
    specification_version: { type: "string" },
    title: { type: "string" },
    summary: { type: "string" },
    workflow_ids: { type: "array", minItems: 1, items: { type: "string", pattern: "^wf-" } },
    process_family: { type: "string" },
    authority_level: { type: "string", enum: ["A0", "A1", "A2", "A3", "A4", "human-only"] },
    accountable_owner: { type: "string" },
    scope: { type: "string" },
    jurisdiction: { type: "string" },
    source_ids: { type: "array", minItems: 1, items: { type: "string", pattern: "^src_" } },
    inputs: { type: "array", minItems: 1, items: { type: "string" } },
    procedures: { type: "array", minItems: 1, items: { type: "string" } },
    deterministic_checks: { type: "array", minItems: 1, items: { type: "string" } },
    expected_artifact: { type: "string" },
    hard_gates: { type: "array", minItems: 1, items: { type: "string" } },
    files: { type: "array", minItems: 4, items: { type: "string" } },
    fixture: { type: "object" },
    reference_output: { type: "object" },
    licenses: { type: "object" },
    reviewed_at: { type: "string", format: "date" },
    review_status: { type: "string" },
    provenance: { type: "object" },
  },
} as const;

export const benchmarkCaseSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `${siteOrigin}/schemas/benchmark-case.schema.json`,
  title: "Accounting Agent Bench case",
  type: "object",
  additionalProperties: false,
  required: [
    "id", "version", "pack_id", "pack_version", "title", "case_type",
    "objective", "input_fixture", "expected", "assertions",
    "expert_review_dimensions", "hard_authority_gate", "reviewed_at", "license",
  ],
  properties: {
    id: { type: "string", pattern: "^[a-z0-9-]+--[a-z0-9-]+$" },
    version: { type: "string" },
    pack_id: { type: "string" },
    pack_version: { type: "string" },
    title: { type: "string" },
    case_type: { type: "string" },
    objective: { type: "string" },
    input_fixture: { type: "object" },
    expected: {
      type: "object",
      additionalProperties: false,
      required: ["outcome", "exception_codes", "minimum_evidence_links", "review_required", "executed_actions_must_be_empty"],
      properties: {
        outcome: { type: "string", enum: ["complete", "stop"] },
        exception_codes: { type: "array", items: { type: "string" } },
        minimum_evidence_links: { type: "integer", minimum: 0 },
        review_required: { type: "boolean" },
        executed_actions_must_be_empty: { type: "boolean" },
      },
    },
    assertions: { type: "array", minItems: 1, items: { type: "object" } },
    expert_review_dimensions: { type: "array", minItems: 1, items: { type: "string" } },
    hard_authority_gate: { type: "boolean" },
    reviewed_at: { type: "string", format: "date" },
    license: { type: "string", const: "CC0-1.0" },
  },
} as const;

export const releaseManifestSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `${siteOrigin}/schemas/release-manifest.schema.json`,
  title: "Accounting Agents release manifest",
  type: "object",
  additionalProperties: false,
  required: ["schema_version", "release", "corpus_digest", "counts", "assets", "licenses"],
  properties: {
    schema_version: { type: "string" },
    release: { type: "object" },
    corpus_digest: { type: "string", pattern: "^sha256:[a-f0-9]{64}$" },
    counts: { type: "object" },
    assets: { type: "array", items: { type: "object" } },
    licenses: { type: "object" },
  },
} as const;

function list(label: string, items: readonly string[]) {
  return [`**${label}**`, "", ...items.map((item) => `- ${item}`), ""];
}

export function renderPackMarkdown(pack: WorkflowPack) {
  return [
    `# ${pack.title}`,
    "",
    `> ${pack.summary}`,
    "",
    `Pack ID: \`${pack.id}\`. Version: ${pack.version}. Reviewed: ${pack.reviewed_at}. Authority: ${pack.authority_level}.`,
    "",
    "This pack uses synthetic fixtures. It prepares review material and does not grant execution authority.",
    "",
    "## Scope",
    "",
    pack.scope,
    "",
    `- Process family: ${pack.process_family}`,
    `- Accountable owner: ${pack.accountable_owner}`,
    `- Jurisdiction: ${pack.jurisdiction}`,
    `- Workflow records: ${pack.workflow_ids.map((id) => `\`${id}\``).join(", ")}`,
    `- Source records: ${pack.source_ids.map((id) => `\`${id}\``).join(", ")}`,
    "",
    ...list("Inputs", pack.inputs),
    ...list("Procedures", pack.procedures),
    ...list("Deterministic checks", pack.deterministic_checks),
    ...list("Hard gates", pack.hard_gates),
    "## Fixture",
    "",
    "```json",
    JSON.stringify(pack.fixture, null, 2),
    "```",
    "",
    "## Reference output",
    "",
    "```json",
    JSON.stringify(pack.reference_output, null, 2),
    "```",
    "",
    "## Files and rights",
    "",
    ...pack.files.map((file) => `- \`${file}\``),
    "",
    `- Manifest and factual metadata: ${pack.licenses.manifest_and_factual_metadata}`,
    `- Original explanatory content: ${pack.licenses.original_explanatory_content}`,
    `- Code: ${pack.licenses.code}`,
    `- External sources: ${pack.licenses.external_sources}`,
    "",
  ].join("\n");
}

export function renderPacksMarkdown(records: readonly WorkflowPack[] = packs) {
  return [
    "# Accounting Agents workflow packs",
    "",
    "> Portable specifications, synthetic fixtures, reference outputs, and benchmark cases for governed accounting-agent work.",
    "",
    ...records.flatMap((pack) => [
      `## ${pack.title}`,
      "",
      pack.summary,
      "",
      `- ID: \`${pack.id}\`; version ${pack.version}`,
      `- Authority: ${pack.authority_level}`,
      `- Detail: ${siteOrigin}/packs/${pack.id}`,
      `- API: ${siteOrigin}/api/v1/packs/${pack.id}`,
      "",
    ]),
  ].join("\n");
}

export function renderBenchmarkMarkdown(records: readonly BenchmarkCase[] = benchmarkCases) {
  return [
    `# ${benchmark.title}`,
    "",
    `> ${benchmark.summary}`,
    "",
    `Version ${benchmark.version}. ${records.length} cases across ${new Set(records.map((item) => item.pack_id)).size} packs.`,
    "",
    "A hard authority-gate failure makes a submission non-conformant. Expert review is reported separately and is not averaged into deterministic points.",
    "",
    ...packs.flatMap((pack) => [
      `## ${pack.title}`,
      "",
      ...records.filter((item) => item.pack_id === pack.id).map((item) => (
        `- \`${item.id}\` — ${item.case_type}; expected ${item.expected.outcome}${item.hard_authority_gate ? "; hard authority gate" : ""}`
      )),
      "",
    ]),
  ].join("\n");
}

export async function createReleaseManifest() {
  const bytes = new TextEncoder().encode(JSON.stringify(platformData));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");

  return {
    schema_version: "1.0",
    release: platformRelease,
    corpus_digest: `sha256:${hex}`,
    counts: {
      packs: packs.length,
      benchmark_cases: benchmarkCases.length,
      release_notes: releaseNotes.length,
    },
    assets: [
      { id: "packs", href: `${siteOrigin}/downloads/accounting-agent-packs.json`, media_type: "application/json", ...archiveDigests.assets["accounting-agent-packs.json"], license: "mixed: CC0-1.0 metadata and fixtures; CC-BY-4.0 explanations" },
      { id: "benchmark", href: `${siteOrigin}/downloads/accounting-agent-bench.json`, media_type: "application/json", ...archiveDigests.assets["accounting-agent-bench.json"], license: "mixed: CC0-1.0 cases and fixtures; CC-BY-4.0 explanations" },
      { id: "packs-archive", href: `${siteOrigin}/downloads/accounting-agent-packs.zip`, media_type: "application/zip", ...archiveDigests.assets["accounting-agent-packs.zip"], license: "mixed: MIT, CC-BY-4.0, and CC0-1.0" },
      { id: "openapi", href: `${siteOrigin}/openapi.json`, media_type: "application/vnd.oai.openapi+json;version=3.1" },
      { id: "pack-schema", href: `${siteOrigin}/schemas/pack.schema.json`, media_type: "application/schema+json" },
      { id: "case-schema", href: `${siteOrigin}/schemas/benchmark-case.schema.json`, media_type: "application/schema+json" },
      { id: "source", href: `${siteOrigin}/downloads/accounting-agents-source.zip`, media_type: "application/zip", ...archiveDigests.assets["accounting-agents-source.zip"], license: "mixed: MIT, CC-BY-4.0, and CC0-1.0" },
      { id: "checksums", href: `${siteOrigin}/downloads/SHA256SUMS`, media_type: "text/plain", license: "CC0-1.0" },
    ],
    licenses: platformRelease.licenses,
  };
}
