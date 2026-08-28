import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const archiveScript = join(projectRoot, "scripts", "build-source-archive.sh");
const generatedAssets = [
  "accounting-agent-packs.zip",
  "accounting-agent-packs.json",
  "accounting-agent-bench.json",
  "accounting-agents-source.zip",
];
const forbiddenMember = [
  /^(?:dist|\.next|out|\.wrangler|\.sites-runtime|node_modules|coverage)(?:\/|$)/,
  /^public\/downloads(?:\/|$)/,
  /(^|\/)\.env(?:[^/]*)$/,
  /(^|\/)[^/]+\.(?:pem|key|p12|pfx)$/,
  /(^|\/)\.DS_Store$/,
];

function trackedArchiveMembers(root) {
  const result = spawnSync("bash", [archiveScript, "--list"], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      SOURCE_ARCHIVE_PROJECT_ROOT: root,
    },
  });
  assert.equal(result.status, 0, "source archive member listing failed");
  return result.stdout
    .split("\0")
    .filter(Boolean);
}

function archiveEntries(archivePath) {
  return execFileSync("unzip", ["-Z1", archivePath], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
}

function assertArchiveIntegrity(archivePath) {
  const result = spawnSync("unzip", ["-tq", archivePath], { encoding: "utf8" });
  assert.equal(result.status, 0, "source archive failed integrity verification");
}

function runArchive(root, downloads) {
  const result = spawnSync("bash", [archiveScript], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      SOURCE_ARCHIVE_PROJECT_ROOT: root,
      SOURCE_ARCHIVE_DOWNLOADS: downloads,
    },
  });
  assert.equal(result.status, 0, "source archive command failed");
}

async function seedGeneratedAssets(downloads) {
  await mkdir(downloads, { recursive: true });
  for (const name of generatedAssets.slice(0, -1)) {
    await cp(join(projectRoot, "public", "downloads", name), join(downloads, name));
  }
}

function assertOnlyExpectedMembers(entries, expectedMembers) {
  const members = entries.filter((entry) => !entry.endsWith("/"));
  const expected = new Set(expectedMembers);
  const actual = new Set(members);
  assert.equal(members.length, actual.size, "source archive has duplicate file members");
  assert.equal(members.length, expected.size, "source archive file-member count differs from the tracked allowlist");
  for (const member of members) assert.ok(expected.has(member), "source archive contains a non-allowlisted member");
  for (const member of expected) assert.ok(actual.has(member), "source archive omits a tracked allowlisted member");
  for (const entry of entries) assert.equal(forbiddenMember.some((pattern) => pattern.test(entry)), false, "source archive contains a forbidden member");
}

async function assertDigests(downloads) {
  const digestManifest = JSON.parse(await readFile(join(downloads, "archive-digests.json"), "utf8"));
  const checksums = (await readFile(join(downloads, "SHA256SUMS"), "utf8")).split(/\r?\n/).filter(Boolean);
  for (const name of generatedAssets) {
    const bytes = await readFile(join(downloads, name));
    const digest = createHash("sha256").update(bytes).digest("hex");
    assert.deepEqual(digestManifest.assets[name], {
      sha256: `sha256:${digest}`,
      bytes: bytes.byteLength,
    }, "archive digest metadata disagrees with an asset");
    const checksum = checksums.find((line) => line.endsWith(`  ${name}`));
    assert.ok(checksum, "SHA-256 manifest omits an asset");
    assert.equal(checksum.split(/\s+/)[0], digest, "SHA-256 manifest disagrees with an asset");
  }
}

test("source archive excludes untracked and private-looking files in an isolated fixture", async () => {
  const fixture = await mkdtemp(join(tmpdir(), "accounting-agents-archive-fixture-"));
  try {
    await mkdir(join(fixture, "app"), { recursive: true });
    await mkdir(join(fixture, "docs"), { recursive: true });
    await mkdir(join(fixture, "public", "downloads"), { recursive: true });
    await writeFile(join(fixture, "app", "kept.ts"), "export const kept = true;\n");
    await writeFile(join(fixture, "docs", "kept.md"), "# Kept\n");
    await writeFile(join(fixture, "app", "staged-secret.pem"), "fixture-only\n");
    await writeFile(join(fixture, ".env"), "FIXTURE_ONLY=true\n");
    await writeFile(join(fixture, "public", "downloads", "staged-release.txt"), "fixture-only\n");
    execFileSync("git", ["init", "-q", fixture]);
    execFileSync("git", ["-C", fixture, "add", "-f", "app/kept.ts", "docs/kept.md", "app/staged-secret.pem", ".env", "public/downloads/staged-release.txt"]);
    await writeFile(join(fixture, "app", "untracked-private.md"), "fixture-only\n");
    await writeFile(join(fixture, "docs", "untracked-private.md"), "fixture-only\n");
    const downloads = join(fixture, "public", "downloads");
    await seedGeneratedAssets(downloads);
    runArchive(fixture, downloads);

    const archivePath = join(downloads, "accounting-agents-source.zip");
    const entries = archiveEntries(archivePath);
    const listedMembers = trackedArchiveMembers(fixture);
    assertOnlyExpectedMembers(entries, listedMembers);
    assert.equal(listedMembers.length, 2, "fixture allowlist should contain only its two tracked source files");
    assert.ok(listedMembers.includes("app/kept.ts"), "fixture should retain the tracked app source");
    assert.ok(listedMembers.includes("docs/kept.md"), "fixture should retain the tracked docs source");
    assertArchiveIntegrity(archivePath);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test("source archive members and digests are tracked, complete, and reproducible", async () => {
  const downloads = await mkdtemp(join(tmpdir(), "accounting-agents-archive-output-"));
  try {
    await seedGeneratedAssets(downloads);
    runArchive(projectRoot, downloads);
    const archivePath = join(downloads, "accounting-agents-source.zip");
    const entries = archiveEntries(archivePath);
    const expectedMembers = trackedArchiveMembers(projectRoot);
    assertOnlyExpectedMembers(entries, expectedMembers);
    assert.ok(expectedMembers.includes("build/sites-vite-plugin.ts"), "source archive allowlist must retain the build plugin");
    assert.ok(expectedMembers.includes("worker/index.ts"), "source archive allowlist must retain the Worker entry point");
    assert.ok(expectedMembers.includes("db/schema.ts"), "source archive allowlist must retain the database schema");
    assert.ok(expectedMembers.includes("drizzle.config.ts"), "source archive allowlist must retain the migration configuration");
    assert.ok(expectedMembers.includes(".openai/hosting.json"), "source archive allowlist must retain non-secret hosting metadata");
    await assertDigests(downloads);
    const firstArchive = await readFile(archivePath);

    runArchive(projectRoot, downloads);
    const secondArchive = await readFile(archivePath);
    assert.deepEqual(secondArchive, firstArchive, "rebuilding unchanged source inputs must be byte-stable");
    await assertDigests(downloads);
  } finally {
    await rm(downloads, { recursive: true, force: true });
  }
});
