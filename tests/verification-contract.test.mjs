import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const workflow = fs.readFileSync(".github/workflows/corpus.yml", "utf8");

test("local full verification and CI retain one primary build and all required gates", () => {
  assert.equal(pkg.scripts.check, "npm run lint && npm test && npm run qualify");
  assert.equal(pkg.scripts.test, "npm run build && npm run test:only");
  assert.equal(pkg.scripts["test:only"], "node --test --test-concurrency=2 tests/*.test.mjs");
  assert.equal(pkg.scripts.lint, "npm run typecheck && npm run validate && npm run lint:ui && node scripts/verify-design-lint.mjs");
  const phases = [...workflow.matchAll(/^\s+(?:- )?run: (npm (?:ci|run \S+))$/gm)].map(m => m[1]);
  assert.deepEqual(phases, ["npm ci", "npm run lint", "npm run build", "npm run test:only", "npm run qualify"]);
  assert.match(workflow, /^  verify:$/m);
  assert.match(workflow, /contents: read/);
  assert.doesNotMatch(workflow, /continue-on-error|pull_request_target|paths-ignore/);
  assert.match(workflow, /if: always\(\)/);
});

test("a failed local gate exits nonzero and cannot reach a later gate", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aa-gate-failure-"));
  try {
    const log = path.join(root, "calls.jsonl");
    // Exercise the actual nested package commands, replacing only expensive
    // leaf operations with deterministic successes/failures.
    fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ ...pkg, type: "commonjs" }));
    const npm = path.join(root, "npm");
    fs.writeFileSync(npm, `#!${process.execPath}\n` + `
const fs = require('node:fs');
const {spawnSync} = require('node:child_process');
const name = process.argv[2] === 'run' ? process.argv[3] : process.argv[2];
const scripts = JSON.parse(fs.readFileSync(process.env.GATE_PACKAGE)).scripts;
if (name === 'check' || name === 'test') {
  const r = spawnSync(scripts[name], {shell:true,env:process.env}); process.exit(r.status ?? 1);
}
fs.appendFileSync(process.env.GATE_LOG, JSON.stringify(name)+'\\n');
process.exit(name === process.env.FAIL_GATE ? 37 : 0);
`);
    fs.chmodSync(npm, 0o755);
    const gates = ["lint", "build", "test:only", "qualify"];
    for (const fail of [...gates, "none"]) {
      fs.writeFileSync(log, "");
      const result = spawnSync(npm, ["run", "check"], { env: { ...process.env, PATH: `${root}:${process.env.PATH}`, GATE_PACKAGE: path.join(root,"package.json"), GATE_LOG:log, FAIL_GATE:fail } });
      assert.equal(result.status, fail === "none" ? 0 : 37);
      const observed = fs.readFileSync(log,"utf8").trim().split("\n").map(JSON.parse);
      assert.deepEqual(observed, gates.slice(0, fail === "none" ? gates.length : gates.indexOf(fail)+1));
    }
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});

test("concurrency cancels only superseded runs of the same PR", () => {
  assert.match(workflow, /group: \$\{\{ github.workflow \}\}-\$\{\{ github.event_name \}\}-\$\{\{ github.event.pull_request.number \|\| github.run_id \}\}/);
  assert.match(workflow, /cancel-in-progress: \$\{\{ github.event_name == 'pull_request' \}\}/);
  const group = (workflow, event, pr, run) => `${workflow}-${event}-${pr || run}`;
  assert.equal(group("corpus","pull_request",1,10),group("corpus","pull_request",1,11));
  assert.notEqual(group("corpus","pull_request",1,10),group("corpus","pull_request",2,11));
  assert.notEqual(group("corpus","push",null,10),group("corpus","push",null,11));
  assert.notEqual(group("corpus","pull_request",1,10),group("other","pull_request",1,10));
});
