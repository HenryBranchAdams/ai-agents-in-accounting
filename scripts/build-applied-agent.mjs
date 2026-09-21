import fs from "node:fs";
import { build } from "esbuild";
import { historySummaryPlugin } from "./history-summary.mjs";

// Run with cwd set to the disposable, applied historical checkout. Never reuse
// the primary agent: its corpus differs from the applied package under test.
const started = performance.now();
fs.mkdirSync("dist/internal", { recursive: true });
const result = await build({
  absWorkingDir: process.cwd(),
  entryPoints: ["src/agent.ts"],
  outfile: "dist/internal/agent.mjs",
  bundle: true,
  plugins: [historySummaryPlugin()],
  format: "esm",
  platform: "neutral",
  target: "es2023",
  metafile: true,
});
if (Object.keys(result.metafile.inputs).some(file => /data\/coverage\/snapshots\//.test(file)))
  throw new Error("Applied retrieval bundle unexpectedly includes full historical snapshots");
console.log(JSON.stringify({ contract: "applied-retrieval-build", seconds: (performance.now() - started) / 1000, bytes: fs.statSync("dist/internal/agent.mjs").size }));
