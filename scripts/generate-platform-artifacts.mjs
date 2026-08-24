import { execFileSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { benchmark, benchmarkCases, packs, platformData } from "../data/open-source-platform.mjs";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packsRoot = join(projectRoot, "packs");
const downloadsRoot = join(projectRoot, "public", "downloads");
const benchmarkRoot = join(projectRoot, "benchmark");

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function packReadme(pack) {
  return [
    `# ${pack.title}`,
    "",
    pack.summary,
    "",
    `Pack ID: \`${pack.id}\`  `,
    `Version: ${pack.version}  `,
    `Authority boundary: ${pack.authority_level}  `,
    `Reviewed: ${pack.reviewed_at}`,
    "",
    "## Run order",
    "",
    ...pack.procedures.map((item, index) => `${index + 1}. ${item}`),
    "",
    "## Required checks",
    "",
    ...pack.deterministic_checks.map((item) => `- ${item}`),
    "",
    "## Authority",
    "",
    ...pack.hard_gates.map((item) => `- ${item}`),
    "",
    "All fixture records are fictional and clean-room synthetic. The pack prepares review material and does not grant production authority.",
    "",
  ].join("\n");
}

await rm(packsRoot, { recursive: true, force: true });
await mkdir(downloadsRoot, { recursive: true });
await mkdir(benchmarkRoot, { recursive: true });

for (const pack of packs) {
  const root = join(packsRoot, pack.id);
  await writeJson(join(root, "manifest.json"), pack);
  await writeFile(join(root, "README.md"), packReadme(pack), "utf8");
  await mkdir(join(root, "LICENSES"), { recursive: true });
  await writeFile(join(root, "LICENSES", "CODE.txt"), "SPDX-License-Identifier: MIT\nSee ../../LICENSES/MIT.txt in the source distribution.\n", "utf8");
  await writeFile(join(root, "LICENSES", "DATA.txt"), "SPDX-License-Identifier: CC0-1.0\nAll fixtures and reference numeric values are clean-room synthetic.\n", "utf8");
  await writeFile(join(root, "LICENSES", "DOCS.txt"), "SPDX-License-Identifier: CC-BY-4.0\nOriginal explanatory documentation requires attribution.\n", "utf8");
  await writeJson(join(root, "fixtures", "input.json"), pack.fixture);
  await writeJson(join(root, "reference", "output.json"), pack.reference_output);
  for (const testCase of benchmarkCases.filter((item) => item.pack_id === pack.id)) {
    const slug = testCase.id.slice(pack.id.length + 2);
    await writeJson(join(root, "cases", `${slug}.json`), testCase);
  }
}

await writeJson(join(downloadsRoot, "accounting-agent-packs.json"), {
  schema_version: platformData.schema_version,
  release: platformData.release,
  pack_count: packs.length,
  packs,
});
await writeJson(join(downloadsRoot, "accounting-agent-bench.json"), benchmark);

const sampleResults = {
  benchmark_id: benchmark.id,
  benchmark_version: benchmark.version,
  candidate: { id: "reference-shape", version: "1.0.0", adapter_version: "1.0.0" },
  results: benchmarkCases.map((item) => ({
    case_id: item.id,
    outcome: item.expected.outcome,
    exception_codes: item.expected.exception_codes,
    evidence_links: item.input_fixture.base_fixture.source_record_ids,
    proposed_actions: [],
    executed_actions: [],
    review_required: item.expected.review_required,
    notes: "Reference-shape result for harness validation; not a model evaluation.",
  })),
};
await writeJson(join(benchmarkRoot, "sample-results.json"), sampleResults);

const zipPath = join(downloadsRoot, "accounting-agent-packs.zip");
await rm(zipPath, { force: true });
execFileSync("zip", ["-qr", zipPath, "packs"], { cwd: projectRoot });

process.stdout.write(`Generated ${packs.length} packs, ${benchmarkCases.length} cases, and public downloads.\n`);
