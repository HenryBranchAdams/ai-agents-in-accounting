import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
export const hash = body => createHash('sha256').update(body).digest('hex');
export const CHUNK_BYTES = 4 * 1024 * 1024;
// Content-defined boundaries preserve deduplication when a source ZIP entry shifts
// later bytes. Fixed maximum bounds upload and decompression memory.
const gear = Uint32Array.from({ length: 256 }, (_, i) => {
  let x = i + 1; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return Math.imul(x, 2654435761) >>> 0;
});
export function* chunks(body) {
  let start = 0, rolling = 0;
  for (let i = 0; i < body.length; i++) {
    rolling = ((rolling << 1) + gear[body[i]]) >>> 0;
    const size = i + 1 - start;
    if (size >= CHUNK_BYTES || (size >= 256 * 1024 && (rolling & 0xfffff) === 0)) {
      yield body.subarray(start, i + 1); start = i + 1; rolling = 0;
    }
  }
  if (start < body.length) yield body.subarray(start);
}
export function prepareStorage(root = 'dist/client') {
  const files = {};
  const objects = new Map();
  fs.mkdirSync(`${root}/assets/objects`, { recursive: true });
  for (const folder of ['downloads', 'releases']) {
    for (const name of fs.readdirSync(`${root}/${folder}`, { recursive: true }).sort()) {
      const file = `${root}/${folder}/${name}`;
      if (!fs.statSync(file).isFile()) continue;
      const body = fs.readFileSync(file);
      const keys = [];
      for (const chunk of chunks(body)) {
        const compressed = gzipSync(chunk, { level: 9 });
        const key = hash(compressed);
        keys.push(key);
        if (!objects.has(key)) fs.writeFileSync(`${root}/assets/objects/${key}`, compressed);
        objects.set(key, compressed.length);
      }
      files[`/${folder}/${name}`] = { bytes: body.length, sha256: hash(body), chunks: keys };
    }
  }
  fs.mkdirSync(`${root}/assets/objects`, { recursive: true });
  const manifest = { schema_version: '1.0.0', files, objects: Object.fromEntries(objects) };
  const body = JSON.stringify(manifest);
  fs.mkdirSync('dist/storage', { recursive: true });
  fs.writeFileSync('dist/storage/manifest.json', body);
  return { id: hash(body), ...manifest };
}
