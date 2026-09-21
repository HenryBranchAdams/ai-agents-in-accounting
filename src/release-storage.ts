export type StorageManifest = {
  id: string;
  files: Record<string, { bytes: number; sha256: string; chunks: string[] }>;
};
export type StorageEnv = { ASSETS?: Fetcher; BUCKET?: R2Bucket; RELEASE_IMPORT_TOKEN?: string };
const contentType = (path: string) => path.endsWith('.json') ? 'application/json'
  : path.endsWith('.jsonl') ? 'application/x-ndjson; charset=utf-8'
  : path.endsWith('.md') ? 'text/markdown; charset=utf-8'
  : path.endsWith('.csv') ? 'text/csv; charset=utf-8'
  : path.endsWith('.zip') ? 'application/zip'
  : path.endsWith('.gz') || path.includes('.part-') ? 'application/octet-stream' : 'text/plain; charset=utf-8';
export async function storedDownload(request: Request, env: StorageEnv, manifest: StorageManifest): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname === '/api/v1/coverage/history' ? '/downloads/coverage-history.json' : url.pathname;
  const file = manifest.files[path];
  if (!file) return null;
  const headers = new Headers({ 'Content-Type': contentType(path), 'Content-Length': String(file.bytes), ETag: `"${file.sha256}"`, 'Cache-Control': path.startsWith('/releases/') ? 'public, max-age=31536000, immutable' : 'public, max-age=300, must-revalidate' });
  if (request.headers.get('If-None-Match')?.split(',').map(s => s.trim()).some(s => s === headers.get('ETag') || s === `W/${headers.get('ETag')}` || s === '*')) {
    return new Response(null, { status: 304, headers });
  }
  if (request.method === 'HEAD') return new Response(null, { headers });
  // Read one compressed chunk at a time, respecting consumer backpressure.
  let index = 0;
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  const next = async () => {
    if (index >= file.chunks.length) return false;
    const key = file.chunks[index++];
    const object = env.BUCKET ? await env.BUCKET.get(`objects/${key}`) : await env.ASSETS?.fetch(new Request(new URL(`/assets/objects/${key}`, url)));
    if (!object || ('ok' in object && !object.ok) || !object.body) throw new Error('Release object unavailable');
    reader = object.body.pipeThrough(new DecompressionStream('gzip')).getReader();
    return true;
  };
  try { await next(); } catch { return new Response('Download unavailable.\n', { status: 503 }); }
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        while (reader) {
          const item = await reader.read();
          if (!item.done) { controller.enqueue(item.value); return; }
          reader.releaseLock(); reader = undefined;
          if (!await next()) break;
        }
        controller.close();
      } catch (error) { controller.error(error); }
    },
    async cancel(reason) { await reader?.cancel(reason); },
  });
  return new Response(body, { headers });
}
const digest = async (body: ArrayBuffer) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', body)), x => x.toString(16).padStart(2, '0')).join('');
export async function importRelease(request: Request, env: StorageEnv): Promise<Response> {
  // Administrative API is disabled unless an explicit secret is configured.
  if (!env.RELEASE_IMPORT_TOKEN || request.headers.get('Authorization') !== `Bearer ${env.RELEASE_IMPORT_TOKEN}`) return new Response('Not found', { status: 404 });
  if (!env.BUCKET) return new Response('Storage unavailable', { status: 503 });
  const match = new URL(request.url).pathname.match(/^\/_release\/(objects|manifests)\/([a-f0-9]{64})$/);
  if (!match) return new Response('Not found', { status: 404 });
  const [, kind, key] = match;
  const storageKey = `${kind}/${key}`;
  if (request.method === 'HEAD') return new Response(null, { status: await env.BUCKET.head(storageKey) ? 200 : 404 });
  if (request.method !== 'PUT') return new Response('Method not allowed', { status: 405 });
  // Bound reads even when Content-Length is absent or dishonest.
  const limit = 5 * 1024 * 1024;
  const parts: Uint8Array[] = []; let bytes = 0;
  const reader = request.body?.getReader();
  if (!reader) return new Response('Body required', { status: 400 });
  for (;;) { const item = await reader.read(); if (item.done) break; bytes += item.value.length; if (bytes > limit) { await reader.cancel(); return new Response('Too large', { status: 413 }); } parts.push(item.value); }
  const body = new Uint8Array(bytes); let offset = 0;
  for (const part of parts) { body.set(part, offset); offset += part.length; }
  if (await digest(body.buffer) !== key) return new Response('Checksum mismatch', { status: 422 });
  if (kind === 'manifests') {
    let manifest: { objects?: Record<string, number> };
    try { manifest = JSON.parse(new TextDecoder().decode(body)); } catch { return new Response('Invalid manifest', { status: 422 }); }
    if (!manifest.objects || Object.keys(manifest.objects).length > 10000) return new Response('Invalid manifest', { status: 422 });
    for (const [objectKey, size] of Object.entries(manifest.objects)) {
      if (!/^[a-f0-9]{64}$/.test(objectKey) || !Number.isInteger(size) || size < 1 || size > limit) return new Response('Invalid object', { status: 422 });
      const object = await env.BUCKET.head(`objects/${objectKey}`);
      if (!object || object.size !== size) return new Response('Incomplete import', { status: 409 });
    }
  }
  // Content-addressed writes are idempotent; no active pointer or deletion API.
  await env.BUCKET.put(storageKey, body, { sha256: key });
  return new Response(null, { status: 201 });
}
