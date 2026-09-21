import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { requiredPhases } from "../scripts/verify.mjs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const workflow = fs.readFileSync(".github/workflows/corpus.yml", "utf8");

test("local full verification and CI retain one primary build and all required gates", () => {
  assert.equal(pkg.scripts.check, "node scripts/verify.mjs");
  assert.equal(pkg.scripts.preflight, "node scripts/verify.mjs --preflight");
  assert.deepEqual(requiredPhases.map(p=>p.command.join(" ")), ["npm run lint","npm run build","npm run test:only","npm run qualify"]);
  assert.equal(pkg.scripts.test, "npm run build && npm run test:only");
  assert.equal(pkg.scripts["test:only"], "node --test --test-concurrency=2 tests/*.test.mjs");
  assert.equal(pkg.scripts.lint, "npm run typecheck && npm run validate && npm run lint:ui && node scripts/verify-design-lint.mjs");
  const phases = [...workflow.matchAll(/run: node scripts\/verify\.mjs --phase (\w+)/g)].map(m => m[1]);
  assert.deepEqual(phases, requiredPhases.map(p=>p.name));
  assert.ok(workflow.indexOf("run: npm run preflight") < workflow.indexOf("--phase lint"));
  assert.equal((workflow.match(/--phase build/g)||[]).length,1);
  assert.match(workflow, /include-hidden-files: true/);
  assert.match(workflow, /name: corpus-release-\$\{\{ github.sha \}\}-attempt-\$\{\{ github.run_attempt \}\}/);
  assert.match(workflow, /^  verify:$/m);
  assert.match(workflow, /contents: read/);
  assert.doesNotMatch(workflow, /continue-on-error|pull_request_target|paths-ignore/);
  assert.match(workflow, /if: always\(\)/);
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
