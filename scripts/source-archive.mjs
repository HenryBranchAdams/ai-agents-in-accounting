import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { deflateRawSync, inflateRawSync } from "node:zlib";

const roots = [
  "src",
  "data",
  "public",
  "schemas",
  "scripts",
  "tests",
  "docs",
  "LICENSES",
  ".github",
  ".openai",
];
const rootFiles = [
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "eslint.config.mjs",
  "components.json",
  ".gitignore",
  "LICENSE",
];
export const SOURCE_HOST_LIMIT_BYTES = 25 * 1024 * 1024;
export const SOURCE_PART_LIMIT_BYTES = 24 * 1024 * 1024;
export const SOURCE_ARCHIVE_NAME = "accounting-agents-source.zip";
export const SOURCE_EXPORT_MANIFEST_NAME = "accounting-agents-source.manifest.json";
// Legacy metadata exports describe this helper checkout. Explicit-root APIs below
// resolve their own edition and reconstruction can run from an empty directory.
export const currentCorpusVersion = JSON.parse(fs.readFileSync(new URL("../data/catalog.json", import.meta.url), "utf8")).corpus_version;
export const currentReleaseGzipPath = `data/releases/${currentCorpusVersion}/corpus.json.gz`;

const sha256 = (body) => createHash("sha256").update(body).digest("hex");

const corpusVersionAt = (root) => JSON.parse(fs.readFileSync(path.join(root, "data/catalog.json"), "utf8")).corpus_version;
const currentGzipAt = (root) => `data/releases/${corpusVersionAt(root)}/corpus.json.gz`;

export function allSourceFiles(root = ".") {
  const files = [
    ...rootFiles,
    ...fs.readdirSync(root).filter((f) => /\.(md|cff)$/.test(f)),
  ];
  function walk(dir) {
    for (const e of fs
      .readdirSync(path.join(root, dir), { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.posix.join(dir, e.name);
      if (e.isSymbolicLink())
        throw new Error(`Source archive disallows symlinks: ${file}`);
      if (e.isDirectory()) walk(file);
      else if (e.isFile()) files.push(file);
    }
  }
  for (const dir of roots) if (fs.existsSync(path.join(root, dir))) {
    if (fs.lstatSync(path.join(root, dir)).isSymbolicLink()) throw new Error(`Source archive disallows symlinks: ${dir}`);
    walk(dir);
  }
  return [...new Set(files)].sort().map(file => {
    if (fs.lstatSync(path.join(root, file)).isSymbolicLink()) throw new Error(`Source archive disallows symlinks: ${file}`);
    return file;
  });
}

export function sourceFiles(root = ".") {
  // The current release gzip is published separately in the release bundle;
  // omit only that duplicate from the reconstructed source ZIP.
  return allSourceFiles(root).filter((file) => file !== currentGzipAt(root));
}

export function sourceMembership(root = ".") {
  const included = new Set(sourceFiles(root));
  return allSourceFiles(root).map((file) => {
    const body = fs.readFileSync(path.join(root, file));
    const entry = {
      path: file,
      bytes: body.length,
      sha256: sha256(body),
      included: included.has(file),
    };
    if (!entry.included) {
      entry.provided_by = currentGzipAt(root);
      entry.reason = "Duplicate current release gzip is provided by the release bundle.";
    }
    return entry;
  });
}

const crcTable = Uint32Array.from({ length: 256 }, (_, i) => {
  let n = i;
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const b of buffer) crc = crcTable[(crc ^ b) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

// Deterministic ZIP with UTF-8 names and a fixed DOS date.
export function createSourceArchive(root = ".") {
  const locals = [],
    central = [],
    entries = [];
  let offset = 0;
  for (const file of sourceFiles(root)) {
    const body = fs.readFileSync(path.join(root, file));
    const name = Buffer.from(file);
    const compressed = deflateRawSync(body, { level: 9 });
    const crc = crc32(body);
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50);
    h.writeUInt16LE(20, 4);
    h.writeUInt16LE(0x800, 6);
    h.writeUInt16LE(8, 8);
    h.writeUInt16LE(33, 12);
    h.writeUInt32LE(crc, 14);
    h.writeUInt32LE(compressed.length, 18);
    h.writeUInt32LE(body.length, 22);
    h.writeUInt16LE(name.length, 26);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50);
    c.writeUInt16LE(20, 4);
    c.writeUInt16LE(20, 6);
    c.writeUInt16LE(0x800, 8);
    c.writeUInt16LE(8, 10);
    c.writeUInt16LE(33, 14);
    c.writeUInt32LE(crc, 16);
    c.writeUInt32LE(compressed.length, 20);
    c.writeUInt32LE(body.length, 24);
    c.writeUInt16LE(name.length, 28);
    c.writeUInt32LE(offset, 42);
    locals.push(h, name, compressed);
    central.push(c, name);
    entries.push({ path: file, bytes: body.length, sha256: sha256(body) });
    offset += h.length + name.length + compressed.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return {
    bytes: Buffer.concat([...locals, directory, end]),
    entries,
  };
}

export function writeSourceArchive(destination) {
  const archive = createSourceArchive();
  fs.writeFileSync(destination, archive.bytes);
  return archive.entries.map((entry) => entry.path);
}

export function readSourceArchiveMembers(bytes) {
  const members = [];
  const seen = new Set();
  let offset = 0;
  while (offset + 4 <= bytes.length && bytes.readUInt32LE(offset) === 0x04034b50) {
    if (offset + 30 > bytes.length) throw new Error("Source archive local header is truncated.");
    const method = bytes.readUInt16LE(offset + 8);
    const compressedSize = bytes.readUInt32LE(offset + 18);
    const uncompressedSize = bytes.readUInt32LE(offset + 22);
    const nameLength = bytes.readUInt16LE(offset + 26);
    const extraLength = bytes.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const bodyStart = nameStart + nameLength + extraLength;
    const bodyEnd = bodyStart + compressedSize;
    if (bodyEnd > bytes.length) throw new Error("Source archive member is truncated.");
    if (method !== 8) throw new Error(`Unsupported source archive compression method: ${method}`);
    const name = bytes.subarray(nameStart, nameStart + nameLength).toString();
    if (seen.has(name)) throw new Error(`Duplicate source archive member: ${name}`);
    seen.add(name);
    const body = inflateRawSync(bytes.subarray(bodyStart, bodyEnd));
    if (body.length !== uncompressedSize) throw new Error(`Source archive size mismatch: ${name}`);
    members.push({ path: name, bytes: body.length, sha256: sha256(body) });
    offset = bodyEnd;
  }
  if (!members.length || offset + 4 > bytes.length || bytes.readUInt32LE(offset) !== 0x02014b50)
    throw new Error("Source archive central directory is missing.");
  const endSignature = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
  if (bytes.lastIndexOf(endSignature) < offset)
    throw new Error("Source archive end record is missing.");
  return members;
}

const generatedPartPattern = /^accounting-agents-source\.zip\.part-\d+$/;
const generatedNames = new Set([
  SOURCE_ARCHIVE_NAME,
  SOURCE_EXPORT_MANIFEST_NAME,
]);
const cleanupGeneratedOutput = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!generatedNames.has(entry.name) && !generatedPartPattern.test(entry.name)) continue;
    if (!entry.isFile() && !entry.isSymbolicLink())
      throw new Error(`Generated source export path is not a file: ${entry.name}`);
    fs.unlinkSync(path.join(directory, entry.name));
  }
};

const manifestPath = (name) => `/downloads/${name}`;
const membershipDigest = (membership) => sha256(Buffer.from(JSON.stringify(membership)));

export function writeSourceExport(directory, { root = ".", hostLimitBytes = SOURCE_HOST_LIMIT_BYTES, partLimitBytes = SOURCE_PART_LIMIT_BYTES } = {}) {
  if (!Number.isSafeInteger(partLimitBytes) || partLimitBytes <= 0 || partLimitBytes > SOURCE_PART_LIMIT_BYTES)
    throw new Error("Source export part limit must be positive and at most 24 MiB.");
  if (!Number.isSafeInteger(hostLimitBytes) || hostLimitBytes <= partLimitBytes)
    throw new Error("Source export host limit must exceed the part limit.");
  fs.mkdirSync(directory, { recursive: true });
  cleanupGeneratedOutput(directory);
  const archive = createSourceArchive(root);
  const membership = sourceMembership(root);
  const includedMembership = membership
    .filter((entry) => entry.included)
    .map(({ path: file, bytes, sha256: digest }) => ({ path: file, bytes, sha256: digest }));
  if (JSON.stringify(includedMembership) !== JSON.stringify(archive.entries))
    throw new Error("Source archive membership does not match the source file inventory.");
  const base = {
    schema_version: "1.0.0",
    contract: "accounting-agents-source-export",
    corpus_version: corpusVersionAt(root),
    archive_name: SOURCE_ARCHIVE_NAME,
    archive_format: "deterministic-zip",
    archive_bytes: archive.bytes.length,
    archive_sha256: sha256(archive.bytes),
    host_limit_bytes: hostLimitBytes,
    part_limit_bytes: partLimitBytes,
    source_file_count: membership.length,
    included_source_file_count: includedMembership.length,
    omitted_source_file_count: membership.length - includedMembership.length,
    source_membership_sha256: membershipDigest(membership),
    source_membership: membership,
    reconstruction: {
      command: `node scripts/reconstruct-source-archive.mjs ${SOURCE_EXPORT_MANIFEST_NAME} reconstructed-${SOURCE_ARCHIVE_NAME}`,
      method: "Verify every part size and SHA-256, concatenate parts in order, then verify the archive SHA-256 and ZIP membership.",
    },
  };
  let manifest;
  if (archive.bytes.length <= hostLimitBytes) {
    fs.writeFileSync(path.join(directory, SOURCE_ARCHIVE_NAME), archive.bytes);
    manifest = {
      ...base,
      mode: "single",
      archive_path: manifestPath(SOURCE_ARCHIVE_NAME),
      parts: [],
    };
  } else {
    const count = Math.ceil(archive.bytes.length / partLimitBytes);
    const width = Math.max(3, String(count).length);
    const parts = [];
    for (let index = 0; index < count; index++) {
      const start = index * partLimitBytes;
      const chunk = archive.bytes.subarray(start, Math.min(start + partLimitBytes, archive.bytes.length));
      if (chunk.length > partLimitBytes || chunk.length > hostLimitBytes)
        throw new Error(`Source archive part exceeds its deterministic limit: ${index + 1}`);
      const name = `${SOURCE_ARCHIVE_NAME}.part-${String(index + 1).padStart(width, "0")}`;
      fs.writeFileSync(path.join(directory, name), chunk);
      parts.push({
        order: index + 1,
        name,
        path: manifestPath(name),
        archive_offset: start,
        bytes: chunk.length,
        sha256: sha256(chunk),
      });
    }
    manifest = {
      ...base,
      mode: "multipart",
      archive_path: null,
      parts,
    };
  }
  fs.writeFileSync(
    path.join(directory, SOURCE_EXPORT_MANIFEST_NAME),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  return manifest;
}
