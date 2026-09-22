import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { allSourceFiles } from "./source-archive.mjs";

export const sha256 = body => createHash("sha256").update(body).digest("hex");
const json = file => JSON.parse(fs.readFileSync(file, "utf8"));
const git = (root, args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

export function inputInventory(root = process.cwd(), { include = () => true } = {}) {
  const files = allSourceFiles(root).filter(include).map(file => {
    const absolute = path.join(root, file);
    const before = fs.statSync(absolute);
    const bytes = fs.readFileSync(absolute);
    const after = fs.statSync(absolute);
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ino !== after.ino)
      throw new Error(`Source changed while reading: ${file}`);
    return { path: file, bytes: bytes.length, sha256: sha256(bytes), executable: Boolean(after.mode & 0o111) };
  });
  return { files, digest: sha256(JSON.stringify(files)) };
}

// Preview does not serve historical payloads or release exports. Their bytes are
// not runtime inputs; full verification always inventories and validates them.
export function previewInventory(root = process.cwd()) {
  return inputInventory(root, {include:file=>!/^data\/releases\/\d{4}-/.test(file)&&!file.startsWith("data/coverage/snapshots/")});
}

export function buildInventory(root = process.cwd()) {
  const directory=path.join(root,"dist");
  const files=fs.readdirSync(directory,{recursive:true}).sort().flatMap(file=>{
    const absolute=path.join(directory,file),stat=fs.lstatSync(absolute);
    if(stat.isSymbolicLink()||(!stat.isFile()&&!stat.isDirectory()))throw new Error(`Nonregular build input: ${file}`);
    if(!stat.isFile()||file==="storage/qualification.json")return [];
    return [{path:file,bytes:stat.size,sha256:sha256(fs.readFileSync(absolute)),executable:Boolean(stat.mode&0o111)}];
  });
  return {files,digest:sha256(JSON.stringify(files))};
}

export function editionProblems(root) {
  const problems = [];
  const catalog = json(path.join(root, "data/catalog.json"));
  const edition = catalog.corpus_version;
  const preparations = path.join(root, "outputs/editions");
  if (fs.existsSync(preparations)) {
    for (const file of fs.readdirSync(preparations).filter(file => /^\d{4}-\d{2}-\d{2}\.\d+\.json$/.test(file))) {
      if (json(path.join(preparations, file)).status === "promoting")
        problems.push(`Interrupted edition finalization: ${file}; resume the same candidate before verification`);
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}\.\d+$/.test(edition)) problems.push("data/catalog.json: invalid corpus_version");
  // These are synchronized current headers, not older independently reviewed
  // classification/exception versions or immutable historical snapshots.
  const headers = {
    "data/coverage/record-mappings.json": ["corpus_version", "mapping_version"],
    "data/coverage/mapping-overrides.json": ["mapping_version"],
    "data/coverage/assessments.json": ["assessment_version"],
    "data/coverage/research-questions.json": ["corpus_version", "question_set_version"],
    "data/coverage/subsector-profiles.json": ["corpus_version"],
    "data/coverage/subsector-screening.json": ["corpus_version"],
    "data/releases/index.json": ["current_version"],
  };
  for (const [file, fields] of Object.entries(headers)) {
    try {
      const value = json(path.join(root, file));
      for (const field of fields) if (value[field] !== edition) problems.push(`${file}: ${field} is ${value[field]}, expected ${edition}`);
    } catch (error) { problems.push(`${file}: ${error.message}`); }
  }
  try {
    const versions = json(path.join(root, "data/releases/index.json")).versions;
    if (!Array.isArray(versions) || !versions.includes(edition)) problems.push("data/releases/index.json: current edition absent");
    if (!Array.isArray(versions) || !versions.some(v => v.localeCompare(edition, "en", { numeric: true }) < 0)) problems.push("data/releases/index.json: no predecessor");
  } catch (error) { problems.push(`data/releases/index.json: ${error.message}`); }
  return problems;
}

export async function loopbackCapability() {
  const server = net.createServer();
  return new Promise(resolve => {
    server.once("error", error => resolve({ available: false, code: error.code, message: error.message }));
    server.listen(0, "127.0.0.1", () => server.close(() => resolve({ available: true })));
  });
}

export async function preflight({ root = process.cwd(), revision, mode = "release", requireLoopback = true } = {}) {
  if (!["release", "working-copy"].includes(mode)) throw new Error("Unknown verification mode");
  const problems = [];
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 13)) problems.push("Node >=22.13 is required");
  const head = git(root, ["rev-parse", "HEAD"]);
  if (mode === "release" && (!revision || !/^[a-f0-9]{40}$/.test(revision) || revision !== head)) problems.push("Release requires explicit full current source revision");
  const inventory = inputInventory(root);
  if (mode === "release") {
    const tracked = new Set(git(root, ["ls-files", "-z"]).split("\0"));
    const modified = new Set(git(root, ["diff", "HEAD", "--name-only", "-z"]).split("\0"));
    for (const file of inventory.files) {
      if (!tracked.has(file.path)) problems.push(`${file.path}: untracked source input`);
      else if (modified.has(file.path)) problems.push(`${file.path}: differs from committed source`);
    }
    // Deleted tracked source files must also fail, even if absent from inventory.
    for (const file of git(root, ["diff", "HEAD", "--diff-filter=D", "--name-only", "-z"]).split("\0").filter(Boolean))
      problems.push(`${file}: deleted tracked input`);
  }
  problems.push(...editionProblems(root));
  const lock = json(path.join(root, "package-lock.json"));
  const pkg = json(path.join(root, "package.json"));
  for (const field of ["dependencies", "devDependencies"])
    if (JSON.stringify(pkg[field] || {}) !== JSON.stringify(lock.packages[""][field] || {})) problems.push(`package-lock.json: ${field} differs from package.json`);
  for (const [location, expected] of Object.entries(lock.packages).filter(([location]) => location)) {
    const file = path.join(root, location, "package.json");
    if (!fs.existsSync(file)) {
      if (!expected.optional) problems.push(`${location}: required dependency is not installed`);
    } else if (json(file).version !== expected.version) problems.push(`${location}: installed version differs from lockfile`);
  }
  const output = path.join(root, "outputs");
  fs.mkdirSync(output, { recursive: true });
  fs.accessSync(output, fs.constants.W_OK);
  const capability = requireLoopback ? await loopbackCapability() : { checked: false };
  if (requireLoopback && !capability.available) problems.push(`Loopback listener unavailable (${capability.code}); use an environment with this capability, without weakening the test`);
  return { schema_version: 1, mode, source_revision: head, input_digest: inventory.digest, lockfile_sha256: sha256(fs.readFileSync(path.join(root,"package-lock.json"))), node: process.versions.node, loopback: capability, problems, ok: problems.length === 0 };
}

export function captureCandidate({ root = process.cwd(), destination, mode = "working-copy" }) {
  if (mode !== "working-copy") throw new Error("Snapshot capture is working-copy only; committed releases use their pinned checkout");
  if (!destination || fs.existsSync(destination)) throw new Error("Use a fresh candidate destination");
  const before = inputInventory(root);
  const revision = git(root,["rev-parse","HEAD"]);
  fs.mkdirSync(path.dirname(destination), { recursive:true });
  const temporary = fs.mkdtempSync(path.join(path.dirname(destination), ".candidate-"));
  try {
    // Keep real history for the existing historical integration tests.
    execFileSync("git",["clone","--local","--no-hardlinks","--no-checkout",root,temporary],{stdio:"pipe"});
    git(temporary,["reset","--mixed",revision]);
    for (const file of before.files) {
      const target = path.join(temporary,file.path);
      fs.mkdirSync(path.dirname(target),{recursive:true});
      fs.copyFileSync(path.join(root,file.path),target);
      fs.chmodSync(target,file.executable ? 0o755 : 0o644);
    }
    const captured = inputInventory(temporary);
    const after = inputInventory(root);
    if (before.digest !== captured.digest || before.digest !== after.digest || revision !== git(root,["rev-parse","HEAD"]))
      throw new Error("Source changed during candidate capture; no candidate promoted");
    fs.mkdirSync(path.join(temporary,"outputs"),{recursive:true});
    fs.writeFileSync(path.join(temporary,"outputs/candidate.json"),JSON.stringify({schema_version:1,mode,source_revision:revision,input_digest:captured.digest,publishable:false},null,2)+"\n");
    fs.renameSync(temporary,destination);
    return { destination, source_revision:revision, input_digest:captured.digest, mode, publishable:false };
  } catch(error) { fs.rmSync(temporary,{recursive:true,force:true}); throw error; }
}
