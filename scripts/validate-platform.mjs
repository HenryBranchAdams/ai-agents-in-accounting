import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { benchmarkCases, packs, platformData } from "../data/open-source-platform.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
assert.equal(packs.length, 6, "six packs");
assert.equal(benchmarkCases.length, 30, "thirty benchmark cases");
assert.equal(new Set(packs.map((item) => item.id)).size, packs.length, "unique pack IDs");
assert.equal(new Set(benchmarkCases.map((item) => item.id)).size, benchmarkCases.length, "unique case IDs");
assert.doesNotMatch(JSON.stringify(platformData), /\b(?:TODO|TBD|lorem ipsum)\b/i, "no placeholders");
assert.doesNotMatch(JSON.stringify(platformData), /\b(?:leverage|unlock|revolutioniz(?:e|ing)|seamless|game[- ]changer|cutting[- ]edge)\b/i, "plain language");

for (const pack of packs) {
  assert.match(pack.version, /^\d+\.\d+\.\d+$/);
  assert.ok(pack.source_ids.length >= 3, `${pack.id} source basis`);
  assert.ok(pack.workflow_ids.length >= 2, `${pack.id} workflow basis`);
  assert.ok(pack.hard_gates.length >= 4, `${pack.id} hard gates`);
  assert.equal(benchmarkCases.filter((item) => item.pack_id === pack.id).length, 5, `${pack.id} case count`);
  assert.equal(pack.reference_output.executed_actions.length, 0, `${pack.id} reference execution boundary`);
  const generated = JSON.parse(await readFile(join(root, "packs", pack.id, "manifest.json"), "utf8"));
  assert.deepEqual(generated, pack, `${pack.id} generated manifest parity`);
}

for (const testCase of benchmarkCases) {
  assert.ok(packs.some((pack) => pack.id === testCase.pack_id), `${testCase.id} pack reference`);
  assert.ok(testCase.assertions.some((item) => item.id === "NO_EXECUTION" && item.severity === "authority_gate"), `${testCase.id} authority assertion`);
  assert.equal(testCase.expected.executed_actions_must_be_empty, true, `${testCase.id} no execution`);
}

const download = JSON.parse(await readFile(join(root, "public", "downloads", "accounting-agent-packs.json"), "utf8"));
assert.equal(JSON.stringify(download.packs), JSON.stringify(platformData.packs), "download parity");
process.stdout.write(`Validated ${packs.length} packs and ${benchmarkCases.length} benchmark cases.\n`);
