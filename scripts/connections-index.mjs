import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

/** Graph-specific data stays out of the ordinary reader's runtime-data initialization. */
export async function writeConnectionsIndex(records, corpusVersion) {
  await build({ entryPoints: ['src/connections/model.ts'], outfile: 'dist/internal/connections-model.mjs', bundle: true, format: 'esm', platform: 'neutral', target: 'es2023' });
  const { projectConnections } = await import('../dist/internal/connections-model.mjs');
  const snapshot = await projectConnections(records, JSON.parse(fs.readFileSync('data/relationships.json', 'utf8')), corpusVersion);
  const body = Buffer.from(JSON.stringify(snapshot));
  const sha256 = createHash('sha256').update(body).digest('hex');
  const assetPath = `/assets/connections/${sha256}.json.gz`;
  fs.mkdirSync('dist/client/assets/connections', { recursive: true });
  fs.writeFileSync(`dist/client${assetPath}`, gzipSync(body, { level: 9 }));
  const metadata = { path: assetPath, sha256, bytes: body.length, schema_version: snapshot.schema_version, corpus_version: snapshot.corpus_version, index_version: snapshot.index_version, counts: snapshot.counts, diagnostics: snapshot.diagnostics };
  fs.writeFileSync('dist/internal/connections-index.json', JSON.stringify(metadata, null, 2) + '\n');
  return metadata;
}
