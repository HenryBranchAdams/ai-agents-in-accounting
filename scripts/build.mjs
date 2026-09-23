import { writeLibraryMap } from "./library-map.mjs";
import { writeConnectionsIndex } from "./connections-index.mjs";
import { clientEntryUrl } from "./client-entries.mjs";
import { historySummaryPlugin } from "./history-summary.mjs";
import { editorialReviewReport } from "./editorial-review.mjs";
import { prepareStorage } from "./release-storage.mjs";
import { readSnapshotHistory } from "./snapshot-history.mjs";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import {
  preparePublication,
  writeReleaseArtifacts,
} from "./release-history.mjs";
import { loadObservations } from "./maintenance.mjs";
import { createHash } from "node:crypto";
import { build } from "esbuild";
import { validateCorpus } from "./validate.mjs";
import {
  SOURCE_ARCHIVE_NAME,
  SOURCE_EXPORT_MANIFEST_NAME,
  writeSourceExport,
} from "./source-archive.mjs";

const preview = process.argv.includes("--preview");
if (process.argv.slice(2).some(arg => arg !== "--preview")) throw new Error("Usage: build.mjs [--preview]");
const buildStarted = performance.now();
console.log("Validated", validateCorpus({ includeHistory: !preview }));
// Full snapshots are export artifacts, never executable application data.
const history = preview ? { schema_version: "1.0.0", snapshots: [] } : readSnapshotHistory();
const historyPlugin = historySummaryPlugin({ history });
fs.rmSync("dist", { recursive: true, force: true });
fs.mkdirSync("dist/client/downloads", { recursive: true });
fs.mkdirSync("dist/server", { recursive: true });
fs.mkdirSync("dist/internal", { recursive: true });
await build({
  entryPoints: ["src/corpus.ts"],
  outfile: "dist/internal/corpus.mjs",
  bundle: true,
  plugins: [historyPlugin],
  format: "esm",
  platform: "neutral",
  target: "es2023",
});
const { meta, records, corpusExport, corpusMarkdown, knowledge, coverage } =
  await import("../dist/internal/corpus.mjs");
let agentIndexRows, agentPassageRows, agentJsonSchema;
if (!preview) {
await build({
  entryPoints: ["src/agent.ts"],
  outfile: "dist/internal/agent.mjs",
  bundle: true,
  plugins: [historyPlugin],
  format: "esm",
  platform: "neutral",
  target: "es2023",
});
await build({
  entryPoints: ["src/agent-contract.ts"],
  outfile: "dist/internal/agent-contract.mjs",
  bundle: true,
  plugins: [historyPlugin],
  format: "esm",
  platform: "neutral",
  target: "es2023",
});
({ agentIndexRows, agentPassageRows, agentJsonSchema } =
  await import("../dist/internal/agent.mjs"));
}
fs.cpSync("public", "dist/client", { recursive: true });
execFileSync(
  process.execPath,
  [
    "node_modules/@tailwindcss/cli/dist/index.mjs",
    "-i",
    "public/style.css",
    "-o",
    "dist/client/style.css",
    "--minify",
  ],
  { stdio: "inherit" },
);
const clientBuild = await build({
  entryPoints: { navigation: "src/client/navigation.tsx", "library-map": "src/client/library-map.tsx" },
  splitting: true,
  outdir: "dist/client/assets",
  entryNames: "[name]-[hash]",
  bundle: true,
  plugins: [historyPlugin],
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  metafile: true,
  legalComments: "eof",
  define: { "process.env.NODE_ENV": '"production"' },
});
fs.writeFileSync("dist/internal/client-build.json", JSON.stringify(clientBuild.metafile, null, 2) + "\n");
const navigationScript = clientEntryUrl(clientBuild.metafile, "src/client/navigation.tsx");
const libraryMapScript = clientEntryUrl(clientBuild.metafile, "src/client/library-map.tsx");
const preservedVersions = preview ? JSON.parse(fs.readFileSync("data/releases/index.json", "utf8")).versions : fs
  .readdirSync("data/releases", { withFileTypes: true })
  .filter(
    (entry) =>
      entry.isDirectory() && /^\d{4}-\d{2}-\d{2}\.\d+$/.test(entry.name),
  )
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
const previousVersion = preservedVersions
  .filter(
    (version) =>
      version.localeCompare(meta.corpus_version, "en", { numeric: true }) < 0,
  )
  .at(-1);
if (!previousVersion)
  throw new Error(
    "A preserved predecessor is required for corpus release history",
  );
const previous = preview ? null : JSON.parse(
  gunzipSync(
    fs.readFileSync(`data/releases/${previousVersion}/corpus.json.gz`),
  ),
);
const prepared = preview ? { changes: [], queue: [] } : preparePublication(records, previous, loadObservations());
const editorial_reviews = editorialReviewReport(records);
for (const review of editorial_reviews) console.log("Editorial dependency review:", review);
const publication = {
  editorial_reviews,
  previous_version: previousVersion,
  versions: [...new Set([...preservedVersions, meta.corpus_version])],
  changes: prepared.changes,
  queue: prepared.queue,
};
let sourceExport;
let entries = [];
if (!preview) {
fs.cpSync("data/releases", "dist/client/releases", { recursive: true });
writeReleaseArtifacts(corpusExport(), "dist/client/releases", {
  previousExport: previous,
});

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
write(
  "downloads/maintenance.json",
  JSON.stringify(
    { corpus_version: meta.corpus_version, ...publication },
    null,
    2,
  ) + "\n",
);
write(
  "downloads/knowledge.json",
  JSON.stringify(
    {
      corpus_version: meta.corpus_version,
      schema_version: "1.0.0",
      profiles: Object.fromEntries(knowledge.profiles),
      relationships: records.flatMap((r) =>
        knowledge.relations(r.id, { direction: "out" }),
      ),
    },
    null,
    2,
  ) + "\n",
);
write("downloads/vocabulary.json", fs.readFileSync("data/vocabulary.json"));
write(
  "downloads/knowledge.schema.json",
  fs.readFileSync("schemas/knowledge.schema.json"),
);
write(
  "downloads/coverage.json",
  JSON.stringify(coverage.analytics(), null, 2) + "\n",
);
write(
  "downloads/coverage-topology.json",
  fs.readFileSync("data/coverage/topology.json"),
);
write(
  "downloads/coverage-records.jsonl",
  [...coverage.profiles.values()]
    .map((m) => JSON.stringify({ ...coverage.versions, ...m }))
    .join("\n") + "\n",
);
write(
  "downloads/coverage-assessments.json",
  fs.readFileSync("data/coverage/assessments.json"),
);
write(
  "downloads/coverage-history.json",
  JSON.stringify(history, null, 2) + "\n",
);
write(
  "downloads/coverage.schema.json",
  fs.readFileSync("schemas/coverage.schema.json"),
);
for (const name of [
  "research-questions",
  "research-criteria",
  "subsector-profiles",
  "subsector-screening",
  "industry-exception-reviews",
  "classification-relationships",
])
  write(
    `downloads/${name}.json`,
    fs.readFileSync(`data/coverage/${name}.json`),
  );
for (const name of ["source-reviews", "editorial-reviews"])
  write(`downloads/${name}.json`, fs.readFileSync(`data/reviews/${name}.json`));
write(
  "downloads/research.schema.json",
  fs.readFileSync("schemas/research.schema.json"),
);
const coverageTopology = JSON.parse(
  fs.readFileSync("data/coverage/topology.json"),
);
const cellRows = coverageTopology.industry_backbone.nodes
  .filter((n) => n.level === "subsector")
  .flatMap((n) =>
    coverageTopology.question_families.map((q) => {
      const cell = coverage.cell(n.code, q.id);
      return [
        meta.corpus_version,
        coverage.versions.topology_version,
        coverage.versions.mapping_version,
        coverage.versions.assessment_version,
        n.code,
        n.title,
        q.id,
        q.title,
        cell.direct_records,
        cell.narrower_records,
        cell.broader_context_records,
        cell.shared_context_records,
        cell.assessments.length,
        cell.assessment_status,
        cell.screening?.applicability,
        cell.screening?.evidence_outcome,
        cell.screening?.rationale,
        cell.screening?.named_question_ids.join(";"),
      ];
    }),
  );
const csvField = (value) => `"${String(value).replaceAll('"', '""')}"`;
write(
  "downloads/coverage-cells.csv",
  [
    "corpus_version,topology_version,mapping_version,assessment_version,industry_code,industry_title,question_id,question_title,direct_records,narrower_records,broader_context_records,shared_context_records,scoped_assessments,assessment_status,applicability,evidence_outcome,rationale,named_question_ids",
    ...cellRows.map((row) => row.map(csvField).join(",")),
  ].join("\n") + "\n",
);

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
sourceExport = writeSourceExport("dist/client/downloads");
entries = fs
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
      source_archive_file_count: sourceExport.included_source_file_count,
      source_export: {
        manifest: `/downloads/${SOURCE_EXPORT_MANIFEST_NAME}`,
        mode: sourceExport.mode,
        archive_name: SOURCE_ARCHIVE_NAME,
        archive_path: sourceExport.archive_path,
        archive_bytes: sourceExport.archive_bytes,
        archive_sha256: sourceExport.archive_sha256,
        part_count: sourceExport.parts.length,
        source_file_count: sourceExport.source_file_count,
        included_source_file_count: sourceExport.included_source_file_count,
        omitted_source_file_count: sourceExport.omitted_source_file_count,
      },
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
}
const connectionIndex = await writeConnectionsIndex(records, meta.corpus_version);
const libraryMap = writeLibraryMap(records, connectionIndex);
const runtimeDataKeys = new Set();
const runtimeDataPlugin = { name: "immutable-runtime-data", setup(builder) {
  builder.onLoad({ filter: /\.json$/ }, ({ path: file }) => {
    if (!file.includes("/data/") || fs.statSync(file).size < 100000) return;
    const body = Buffer.from(JSON.stringify(JSON.parse(fs.readFileSync(file, "utf8"))));
    const key = createHash("sha256").update(body).digest("hex");
    fs.mkdirSync("dist/client/_runtime/data", { recursive: true });
    fs.writeFileSync(`dist/client/_runtime/data/${key}.gz`, gzipSync(body, { level: 9 }));
    runtimeDataKeys.add(key);
    return { contents: `export default RUNTIME_DATA[${JSON.stringify(key)}]`, loader: "js" };
  });
} };
const applicationBuild = await build({
  entryPoints: ["src/worker.ts"],
  mainFields: ["module", "main"], conditions: ["browser"],
  define: {
    "process.env.NODE_ENV": '"production"',
    NAVIGATION_SCRIPT: JSON.stringify(navigationScript),
    CONNECTION_INDEX: JSON.stringify(connectionIndex),
    LIBRARY_MAP: JSON.stringify(libraryMap),
    LIBRARY_MAP_SCRIPT: JSON.stringify(libraryMapScript),
    CLIENT_ASSETS: JSON.stringify(Object.keys(clientBuild.metafile.outputs).filter(file => file.endsWith(".js")).map(file => "/assets/" + path.basename(file))),
    PREVIEW_BUILD: JSON.stringify(preview),
    PUBLICATION_DATA: JSON.stringify(publication),
    STYLE_VERSION: JSON.stringify(
      createHash("sha256")
        .update(fs.readFileSync("dist/client/style.css"))
        .digest("hex")
        .slice(0, 12),
    ),
  },
  bundle: true, plugins: [historyPlugin, runtimeDataPlugin],
  format: "iife", globalName: "compiledApplication", platform: "neutral",
  target: "es2023", minify: true, legalComments: "eof", write: false, metafile: true,
});
const releaseStorage = preview ? { id: "preview", files: {} } : prepareStorage();
const releaseMeta = { build_mode: preview ? "preview" : "release", input_digest: preview ? process.env.PREVIEW_INPUT_DIGEST || null : null, corpus_version: meta.corpus_version, source_revision: (preview ? process.env.PREVIEW_SOURCE_REVISION : null) || execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), storage_manifest: releaseStorage.id };
fs.writeFileSync("dist/internal/release-meta.json", JSON.stringify(releaseMeta));
fs.writeFileSync("dist/internal/runtime-application.mjs", `export function createApplication(RUNTIME_DATA) { ${applicationBuild.outputFiles[0].text}; return compiledApplication.default; }`);
await build({
  entryPoints: { index: "src/entry.ts" },
  define: { RELEASE_STORAGE: JSON.stringify(releaseStorage), RELEASE_META: JSON.stringify(releaseMeta), RUNTIME_DATA_KEYS: JSON.stringify([...runtimeDataKeys]) },
  plugins: [{ name: "runtime-factory", setup(builder) {
    builder.onResolve({ filter: /runtime-application$/ }, () => ({ path: path.resolve("dist/internal/runtime-application.mjs") }));
  } }],
  outdir: "dist/server", splitting: true, chunkNames: "application-[hash]",
  bundle: true, format: "esm", platform: "neutral", target: "es2023", minify: true,
  legalComments: "eof", metafile: true,
}).then(result => fs.writeFileSync("dist/internal/server-meta.json", JSON.stringify({ inputs: { ...applicationBuild.metafile.inputs, ...result.metafile.inputs }, outputs: result.metafile.outputs })));
fs.writeFileSync(
  "dist/server/wrangler.json",
  JSON.stringify(
    {
      name: "accounting-agents",
      main: "index.js",
      compatibility_date: "2026-09-07",
      no_bundle: true,
      find_additional_modules: true,
      rules: [{ type: "ESModule", globs: ["**/*.js"] }],
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
  preview ? `Built draft preview of ${records.length} records without release exports.` : `Built ${records.length} records, ${entries.length} downloads, and a ${sourceExport.included_source_file_count}-file ${sourceExport.mode} source export.`,
);

console.log(JSON.stringify({ build_mode: preview ? "preview" : "release", seconds: (performance.now() - buildStarted) / 1000, source_exports: preview ? 0 : 1 }));
