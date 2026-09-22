import { createConnectionIndex } from './select';
import type { GraphSnapshot } from './contract';

declare const CONNECTION_INDEX: { path: string; sha256: string; bytes: number; corpus_version: string; index_version: string; schema_version: string };
let immutableIndex: ReturnType<typeof createConnectionIndex> | undefined;
export const connectionIndexMetadata = () => CONNECTION_INDEX;

/** Only verified immutable data is retained. No request, environment or pending promise is shared. */
export class ConnectionIndexUnavailable extends Error {}
export async function loadConnectionIndex(request: Request, assets?: Fetcher) {
  try { return await readVerifiedIndex(request, assets); }
  catch { throw new ConnectionIndexUnavailable('Connection data is temporarily unavailable. The complete records remain readable.'); }
}
async function readVerifiedIndex(request: Request, assets?: Fetcher) {
  if (immutableIndex) return immutableIndex;
  if (!assets) throw new Error('Connection index unavailable');
  const response = await assets.fetch(new Request(new URL(CONNECTION_INDEX.path, request.url)));
  if (!response.ok || !response.body) throw new Error('Connection index unavailable');
  const bytes = await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  if (bytes.byteLength !== CONNECTION_INDEX.bytes) throw new Error('Connection index size mismatch');
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('');
  if (digest !== CONNECTION_INDEX.sha256) throw new Error('Connection index digest mismatch');
  const snapshot = JSON.parse(new TextDecoder().decode(bytes)) as GraphSnapshot;
  if (snapshot.schema_version !== CONNECTION_INDEX.schema_version || snapshot.corpus_version !== CONNECTION_INDEX.corpus_version || snapshot.index_version !== CONNECTION_INDEX.index_version) throw new Error('Connection index identity mismatch');
  immutableIndex = createConnectionIndex(snapshot);
  return immutableIndex;
}
