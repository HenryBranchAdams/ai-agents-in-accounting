import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { preparePublication, writeReleaseArtifacts } from "./release-history.mjs";
import { loadObservations } from "./maintenance.mjs";
import { createHash } from "node:crypto";
import { build } from "esbuild";
import { validateCorpus } from "./validate.mjs";
import { writeSourceArchive } from "./source-archive.mjs";

console.log("Validated", validateCorpus());
fs.rmSync("dist", { recursive: true, force: true });
fs.mkdirSync("dist/client/downloads", { recursive: true });
fs.mkdirSync("dist/server", { recursive: true });
fs.mkdirSync("dist/internal", { recursive: true });
await build({
  entryPoints: ["src/corpus.ts"],
  outfile: "dist/internal/corpus.mjs",
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2023",
});
const { meta, records, corpusExport, corpusMarkdown, knowledge, coverage } = await import(
  "../dist/internal/corpus.mjs"
);
await build({
  entryPoints: ["src/agent.ts"],
  outfile: "dist/internal/agent.mjs",
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2023",
});
await build({
  entryPoints: ["src/agent-contract.ts"],
  outfile: "dist/internal/agent-contract.mjs",
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2023",
});
const { agentIndexRows, agentPassageRows, agentJsonSchema } = await import(
  "../dist/internal/agent.mjs"
);
fs.cpSync("public", "dist/client", { recursive: true });
const preservedVersions = fs.readdirSync("data/releases", { withFileTypes: true })
  .filter(entry => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}\.\d+$/.test(entry.name))
  .map(entry => entry.name)
  .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
const previousVersion = preservedVersions.filter(version => version.localeCompare(meta.corpus_version, "en", { numeric: true }) < 0).at(-1);
if (!previousVersion) throw new Error("A preserved predecessor is required for corpus release history");
const previous = JSON.parse(gunzipSync(fs.readFileSync(`data/releases/${previousVersion}/corpus.json.gz`)));
const prepared = preparePublication(records, previous, loadObservations());
const publication = { previous_version: previousVersion, versions: [...new Set([...preservedVersions, meta.corpus_version])], changes: prepared.changes, queue: prepared.queue };
fs.cpSync("data/releases", "dist/client/releases", { recursive: true });
writeReleaseArtifacts(corpusExport(), "dist/client/releases", { previousExport: previous });

const write = (file, body) =>
  fs.writeFileSync(path.join("dist/client", file), body);
write("downloads/corpus.json", JSON.stringify(corpusExport(), null, 2) + "\n");
write(
  "downloads/corpus.jsonl",
  records
    .map((r) =>
      JSON.stringify({
        schema_version: meta.schema_version,
        corpus_version: meta.corpus_version,
        ...r,
      }),
    )
    .join("\n") + "\n",
);
write("downloads/corpus.md", corpusMarkdown());
write("downloads/maintenance.json", JSON.stringify({ corpus_version: meta.corpus_version, ...publication }, null, 2) + "\n");
write("downloads/knowledge.json", JSON.stringify({ corpus_version: meta.corpus_version, schema_version: "1.0.0", profiles: Object.fromEntries(knowledge.profiles), relationships: records.flatMap(r => knowledge.relations(r.id, { direction: "out" })) }, null, 2) + "\n");
write("downloads/vocabulary.json", fs.readFileSync("data/vocabulary.json"));
write("downloads/knowledge.schema.json", fs.readFileSync("schemas/knowledge.schema.json"));
write("downloads/coverage.json", JSON.stringify(coverage.analytics(), null, 2) + "\n");
write("downloads/coverage-topology.json", fs.readFileSync("data/coverage/topology.json"));
write("downloads/coverage-records.jsonl", [...coverage.profiles.values()].map(m => JSON.stringify({ ...coverage.versions, ...m })).join("\n") + "\n");
write("downloads/coverage-assessments.json", fs.readFileSync("data/coverage/assessments.json"));
write("downloads/coverage-history.json", fs.readFileSync("data/coverage/snapshots.json"));
write("downloads/coverage.schema.json", fs.readFileSync("schemas/coverage.schema.json"));
for (const name of ['research-questions','research-criteria','subsector-profiles','subsector-screening','industry-exception-reviews','classification-relationships']) write(`downloads/${name}.json`,fs.readFileSync(`data/coverage/${name}.json`));
for (const name of ['source-reviews','editorial-reviews']) write(`downloads/${name}.json`,fs.readFileSync(`data/reviews/${name}.json`));
write('downloads/research.schema.json',fs.readFileSync('schemas/research.schema.json'));
const coverageTopology = JSON.parse(fs.readFileSync("data/coverage/topology.json"));
const cellRows = coverageTopology.industry_backbone.nodes.filter(n => n.level === "subsector").flatMap(n => coverageTopology.question_families.map(q => {
  const cell = coverage.cell(n.code,q.id);
  return [meta.corpus_version, coverage.versions.topology_version, coverage.versions.mapping_version, coverage.versions.assessment_version, n.code,n.title,q.id,q.title,cell.direct_records,cell.narrower_records,cell.broader_context_records,cell.shared_context_records,cell.assessments.length,cell.assessment_status,cell.screening?.applicability,cell.screening?.evidence_outcome,cell.screening?.rationale,cell.screening?.named_question_ids.join(';')];
}));
const csvField = value => `"${String(value).replaceAll('"','""')}"`;
write("downloads/coverage-cells.csv", ["corpus_version,topology_version,mapping_version,assessment_version,industry_code,industry_title,question_id,question_title,direct_records,narrower_records,broader_context_records,shared_context_records,scoped_assessments,assessment_status,applicability,evidence_outcome,rationale,named_question_ids", ...cellRows.map(row => row.map(csvField).join(","))].join("\n") + "\n");

write(
  "downloads/agent-index.jsonl",
  [...agentIndexRows()].map((r) => JSON.stringify(r)).join("\n") + "\n",
);
write(
  "downloads/agent-passages.jsonl",
  [...agentPassageRows()].map((r) => JSON.stringify(r)).join("\n") + "\n",
);
write(
  "downloads/agent.schema.json",
  JSON.stringify(agentJsonSchema, null, 2) + "\n",
);
const sourceFiles = writeSourceArchive(
  "dist/client/downloads/accounting-agents-source.zip",
);
const entries = fs
  .readdirSync("dist/client/downloads")
  .sort()
  .map((name) => {
    const body = fs.readFileSync(`dist/client/downloads/${name}`);
    return {
      path: `/downloads/${name}`,
      bytes: body.length,
      sha256: createHash("sha256").update(body).digest("hex"),
    };
  });
write(
  "downloads/manifest.json",
  JSON.stringify(
    {
      schema_version: meta.schema_version,
      corpus_version: meta.corpus_version,
      record_count: records.length,
      agent_schema_version: agentJsonSchema.agent_schema_version,
      agent_passage_count: [...agentPassageRows()].length,
      rights_note: meta.rights_note,
      files: entries,
      source_archive_file_count: sourceFiles.length,
    },
    null,
    2,
  ) + "\n",
);
write(
  "downloads/SHA256SUMS",
  entries.map((f) => `${f.sha256}  ${f.path.split("/").at(-1)}`).join("\n") +
    "\n",
);
await build({
  entryPoints: ["src/worker.ts"],
  define: { PUBLICATION_DATA: JSON.stringify(publication) },
  outfile: "dist/server/index.js",
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2023",
  minify: true,
  legalComments: "none",
});
fs.writeFileSync(
  "dist/server/wrangler.json",
  JSON.stringify(
    {
      name: "accounting-agents",
      main: "index.js",
      compatibility_date: "2026-09-07",
      no_bundle: true,
      assets: {
        directory: "../client",
        binding: "ASSETS",
        run_worker_first: true,
      },
      observability: { enabled: true },
    },
    null,
    2,
  ) + "\n",
);
fs.mkdirSync("dist/.openai", { recursive: true });
fs.copyFileSync(".openai/hosting.json", "dist/.openai/hosting.json");
console.log(
  `Built ${records.length} records, ${entries.length} downloads, and a ${sourceFiles.length}-file source archive.`,
);
