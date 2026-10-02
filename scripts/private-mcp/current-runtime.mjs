import { boundedBody } from './server.mjs';

const operations = new Set(['describe', 'search', 'get', 'context']);
const failure = (code, message, status = 503) => Object.assign(new Error(message), { code, status });
const digest = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join('');

// The loader contains sealed build bytes, never a request, environment or URL.
// It is called only by an already owner-authorized MCP tool invocation.
export function createPinnedCaller({ pin, loadBundle }) {
  let application, initializing;
  async function initializeBundle() {
    try {
      const { createApplication, assets } = await loadBundle();
      if (Object.keys(assets).sort().join('\n') !== Object.keys(pin.assets).sort().join('\n')) throw Error('Asset inventory differs');
      const data = {};
      for (const [key, expected] of Object.entries(pin.assets)) {
        const bytes = Uint8Array.from(atob(assets[key]), character => character.charCodeAt(0));
        if (bytes.length !== expected.bytes || await digest(bytes) !== expected.sha256) throw Error('Asset hash differs');
        if (!Number.isSafeInteger(expected.expanded_bytes) || expected.expanded_bytes <= 0 || expected.expanded_bytes > 128 * 1024 * 1024) throw Error('Expanded bound differs');
        const jsonText = await boundedBody(new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))), expected.expanded_bytes);
        const expanded = new TextEncoder().encode(jsonText);
        if (expanded.length !== expected.expanded_bytes || await digest(expanded) !== key) throw Error('Expanded data key differs');
        data[key] = JSON.parse(jsonText);
      }
      const candidate = createApplication(data);
      // Check the sealed factory against the pin before retaining it or serving data.
      const response = await candidate.fetch(new Request('https://private-corpus.invalid/api/v1/agent/describe'));
      const description = await response.json();
      if (!response.ok || description.corpus_version !== pin.corpus_version || description.agent_schema_version !== pin.agent_schema_version || description.record_count !== pin.record_count)
        throw Error('Factory edition differs');
      application = candidate;
      return application;
    } catch { throw failure('PRIVATE_EDITION_UNAVAILABLE', 'The pinned private edition could not be verified.'); }
  }
  function initialize() {
    if (application) return application;
    // Share only immutable initialization; every request has already passed the
    // owner gate. Failure clears the promise so a later authorized call can retry.
    initializing ||= initializeBundle().finally(() => { initializing = undefined; });
    return initializing;
  }
  return async (op, args) => {
    if (!operations.has(op)) throw failure('UNKNOWN_OPERATION', 'Unknown read-only operation.', 400);
    if (args.corpus_version && args.corpus_version !== pin.corpus_version) throw failure('VERSION_MISMATCH', `Requested corpus ${args.corpus_version}; available ${pin.corpus_version}.`, 409);
    if (args.as_of && (!/^\d{4}-\d{2}-\d{2}$/.test(args.as_of) || !Number.isFinite(Date.parse(args.as_of)) || new Date(args.as_of).toISOString().slice(0, 10) !== args.as_of))
      throw failure('INVALID_ARGUMENT', 'as_of must be a valid YYYY-MM-DD date.', 400);
    const url = new URL(`/api/v1/agent/${op}`, 'https://private-corpus.invalid');
    for (const [key, value] of Object.entries(args))
      for (const item of Array.isArray(value) ? value : [value]) url.searchParams.append(key, String(item));
    const response = await (await initialize()).fetch(new Request(url, { method: 'GET', headers: { Accept: 'application/json' } }));
    const result = JSON.parse(await boundedBody(response, 2_000_000));
    if (!response.ok) throw failure(result.error?.code || 'CORPUS_ERROR', result.error?.message || 'Private corpus request failed.', response.status);
    if (result.corpus_version !== pin.corpus_version || result.agent_schema_version !== pin.agent_schema_version)
      throw failure('PRIVATE_EDITION_UNAVAILABLE', 'The result differs from the pinned private edition.');
    return result;
  };
}
