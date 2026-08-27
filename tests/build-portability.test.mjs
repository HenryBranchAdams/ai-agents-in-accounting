import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { chmod, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const projectRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const buildScript = join(projectRoot, "scripts", "build-verified.sh");

function requiredTool(name) {
  const path = [`/usr/bin/${name}`, `/bin/${name}`].find(existsSync);
  assert.ok(path, `${name} is required to exercise the Bash build wrapper`);
  return path;
}

async function portableBuildFixture(vinextSource) {
  const root = await mkdtemp(join(tmpdir(), "accounting-agents-build-"));
  const toolBin = join(root, "tools");
  const projectBin = join(root, "project", "node_modules", ".bin");
  await mkdir(toolBin, { recursive: true });
  await mkdir(projectBin, { recursive: true });
  await symlink(process.execPath, join(toolBin, "node"));
  await symlink(requiredTool("dirname"), join(toolBin, "dirname"));
  const vinext = join(projectBin, "vinext");
  await writeFile(vinext, vinextSource);
  await chmod(vinext, 0o755);
  return { root, toolBin, projectRoot: join(root, "project") };
}

test("production build wrapper runs without GNU timeout on PATH", async () => {
  const fixture = await portableBuildFixture("#!/bin/bash\nprintf 'portable vinext invoked: %s\\n' \"$*\"\n");
  try {
    const result = spawnSync("/bin/bash", [buildScript], {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: fixture.toolBin,
        SITES_ENV_READY: "1",
        SITES_PROJECT_ROOT: fixture.projectRoot,
        SITES_BUILD_TIMEOUT: "2s",
        SITES_BUILD_KILL_AFTER: "1s",
      },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /portable vinext invoked: build/);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("portable build wrapper enforces the configured deadline", async () => {
  const fixture = await portableBuildFixture(
    `#!${process.execPath}\nsetTimeout(() => {}, 800);\n`,
  );
  try {
    const startedAt = performance.now();
    const result = spawnSync("/bin/bash", [buildScript], {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: fixture.toolBin,
        SITES_ENV_READY: "1",
        SITES_PROJECT_ROOT: fixture.projectRoot,
        SITES_BUILD_TIMEOUT: "0.05s",
        SITES_BUILD_KILL_AFTER: "0.05s",
      },
    });
    const elapsedMs = performance.now() - startedAt;
    assert.equal(result.status, 124, result.stderr);
    assert.ok(elapsedMs < 650, `deadline took ${Math.round(elapsedMs)}ms`);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});
