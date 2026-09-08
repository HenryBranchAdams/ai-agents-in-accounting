import fs from "node:fs";
import path from "node:path";
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
const { meta, records, corpusExport, corpusMarkdown } = await import(
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
