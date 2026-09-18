import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { readSourceArchiveMembers } from "./source-archive.mjs";

const [manifestArgument, outputArgument] = process.argv.slice(2);
if (!manifestArgument || !outputArgument) {
  console.error("Usage: node scripts/reconstruct-source-archive.mjs <manifest.json> <output.zip>");
  process.exit(2);
}

const sha256 = (body) => createHash("sha256").update(body).digest("hex");
const manifestPath = path.resolve(manifestArgument);
const outputPath = path.resolve(outputArgument);
const directory = path.dirname(manifestPath);
const temporaryPath = `${outputPath}.tmp-${process.pid}`;
let outputFd = null;
const safeLocalPath = (name) => {
  if (typeof name !== "string" || !name || path.basename(name) !== name || name.includes("\\"))
    throw new Error(`Unsafe source export file name: ${name}`);
  return path.join(directory, name);
};
const readLocalFile = (name, label) => {
  const file = safeLocalPath(name);
  if (!fs.existsSync(file)) fail(`Missing source export ${label}: ${name}`);
  return fs.readFileSync(file);
};
const fail = (message) => {
  throw new Error(message);
};

try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.contract !== "accounting-agents-source-export") fail("Unsupported source export manifest contract.");
  if (!Array.isArray(manifest.source_membership) || !Array.isArray(manifest.parts))
    fail("Source export manifest is missing its membership or parts.");
  if (sha256(Buffer.from(JSON.stringify(manifest.source_membership))) !== manifest.source_membership_sha256)
    fail("Source export membership hash does not match the manifest.");
  const included = manifest.source_membership
    .filter((entry) => entry.included)
    .map(({ path: file, bytes, sha256: digest }) => ({ path: file, bytes, sha256: digest }));
  if (included.length !== manifest.included_source_file_count)
    fail("Source export included-file count does not match its membership.");

  const hash = createHash("sha256");
  let archiveBytes = 0;
  outputFd = fs.openSync(temporaryPath, "w", 0o644);
  const write = (body) => {
    let offset = 0;
    while (offset < body.length)
      offset += fs.writeSync(outputFd, body, offset, body.length - offset);
  };

  if (manifest.mode === "single") {
    if (manifest.archive_path !== `/downloads/${manifest.archive_name}` || manifest.parts.length)
      fail("Single source export manifest has inconsistent paths.");
    const source = readLocalFile(manifest.archive_name, "archive");
    if (source.length !== manifest.archive_bytes) fail("Single source archive size does not match the manifest.");
    if (sha256(source) !== manifest.archive_sha256) fail("Single source archive SHA-256 does not match the manifest.");
    hash.update(source);
    write(source);
    archiveBytes = source.length;
  } else if (manifest.mode === "multipart") {
    if (manifest.archive_path !== null || !manifest.parts.length)
      fail("Multipart source export manifest has inconsistent paths.");
    let expectedOrder = 1;
    for (const part of manifest.parts) {
      if (part.order !== expectedOrder) fail(`Source archive part order is not contiguous at ${part.name}.`);
      if (part.archive_offset !== archiveBytes) fail(`Source archive part offset is not contiguous at ${part.name}.`);
      const body = readLocalFile(part.name, "part");
      if (body.length !== part.bytes) fail(`Source archive part size does not match the manifest: ${part.name}`);
      if (body.length > manifest.part_limit_bytes || body.length > manifest.host_limit_bytes)
        fail(`Source archive part exceeds its declared limit: ${part.name}`);
      if (sha256(body) !== part.sha256) fail(`Source archive part SHA-256 does not match the manifest: ${part.name}`);
      hash.update(body);
      write(body);
      archiveBytes += body.length;
      expectedOrder++;
    }
  } else {
    fail(`Unsupported source export mode: ${manifest.mode}`);
  }
  fs.closeSync(outputFd);
  outputFd = null;
  if (archiveBytes !== manifest.archive_bytes) fail("Reconstructed source archive size does not match the manifest.");
  if (hash.digest("hex") !== manifest.archive_sha256) fail("Reconstructed source archive SHA-256 does not match the manifest.");

  const reconstructed = fs.readFileSync(temporaryPath);
  const actual = readSourceArchiveMembers(reconstructed);
  if (JSON.stringify(actual) !== JSON.stringify(included))
    fail("Reconstructed source archive membership does not match the manifest.");
  fs.renameSync(temporaryPath, outputPath);
  console.log(JSON.stringify({
    output: outputPath,
    archive_bytes: archiveBytes,
    archive_sha256: manifest.archive_sha256,
    source_file_count: manifest.source_file_count,
    included_source_file_count: manifest.included_source_file_count,
    part_count: manifest.parts.length,
  }, null, 2));
} catch (error) {
  if (outputFd !== null) fs.closeSync(outputFd);
  outputPath && fs.rmSync(temporaryPath, { force: true });
  console.error(`Source archive reconstruction failed: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}
