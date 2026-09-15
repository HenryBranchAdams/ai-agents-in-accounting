import fs from "node:fs";
import path from "node:path";
import { deflateRawSync } from "node:zlib";

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
export function sourceFiles() {
  const files = [
    ...rootFiles,
    ...fs.readdirSync(".").filter((f) => /\.(md|cff)$/.test(f)),
  ];
  function walk(dir) {
    for (const e of fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.posix.join(dir, e.name);
      if (e.isSymbolicLink())
        throw new Error(`Source archive disallows symlinks: ${file}`);
      if (e.isDirectory()) walk(file);
      else if (e.isFile()) files.push(file);
    }
  }
  for (const dir of roots) if (fs.existsSync(dir)) walk(dir);
  return [...new Set(files)].sort();
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
// Deterministic ZIP with UTF-8 names and a fixed DOS date; includes new files before Git staging.
export function writeSourceArchive(destination) {
  const locals = [],
    central = [];
  let offset = 0;
  const files = sourceFiles();
  for (const file of files) {
    const name = Buffer.from(file),
      body = fs.readFileSync(file),
      compressed = deflateRawSync(body, { level: 9 }),
      crc = crc32(body);
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
    offset += h.length + name.length + compressed.length;
  }
  const directory = Buffer.concat(central),
    end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  fs.writeFileSync(destination, Buffer.concat([...locals, directory, end]));
  return files;
}
