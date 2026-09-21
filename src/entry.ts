import { storedDownload, importRelease, type StorageEnv, type StorageManifest } from "./release-storage";
declare const RELEASE_STORAGE: StorageManifest;
declare const RELEASE_META: { corpus_version: string; source_revision: string; storage_manifest: string };
declare const RUNTIME_DATA_KEYS: string[];
// Only immutable build data is retained. No request, environment or credentials
// are captured. In-flight initialization is deliberately not shared across requests.
let application: ReturnType<typeof import("./runtime-application").createApplication> | undefined;
export default {
  async fetch(request: Request, env: StorageEnv = {}) {
    const path = new URL(request.url).pathname;
    if (path.startsWith("/_release/")) return importRelease(request, env);
    if (env.BUCKET && !await env.BUCKET.head(`manifests/${RELEASE_STORAGE.id}`))
      return new Response("Release unavailable.\n", { status: 503, headers: { "Cache-Control": "no-store" } });
    if (request.method === "GET" || request.method === "HEAD") {
      let response = path === "/api/v1/release" ? Response.json(RELEASE_META) : await storedDownload(request, env, RELEASE_STORAGE);
      if (response) {
        const headers = new Headers(response.headers);
        headers.set("X-Corpus-Version", RELEASE_META.corpus_version);
        headers.set("X-Source-Revision", RELEASE_META.source_revision);
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Access-Control-Expose-Headers", "ETag, X-Corpus-Version, X-Source-Revision, Content-Length");
        headers.set("X-Content-Type-Options", "nosniff");
        if (response.status >= 400) headers.set("Cache-Control", "no-store");
        return new Response(request.method === "HEAD" ? null : response.body, { status: response.status, headers });
      }
    }
    if (!application) {
      if (!env.ASSETS) return new Response("Application data unavailable.\n", { status: 503 });
      try {
        const data: Record<string, unknown> = {};
        // Limit concurrent reads and release response bodies before starting more.
        for (let i = 0; i < RUNTIME_DATA_KEYS.length; i += 4) {
          await Promise.all(RUNTIME_DATA_KEYS.slice(i, i + 4).map(async key => {
            const response = await env.ASSETS!.fetch(new Request(new URL(`/assets/data/${key}.gz`, request.url)));
            if (!response.ok || !response.body) throw new Error("Application data unavailable");
            data[key] = await new Response(response.body.pipeThrough(new DecompressionStream("gzip"))).json();
          }));
        }
        const { createApplication } = await import("./runtime-application");
        application = createApplication(data);
      } catch (error) {
        console.error("Immutable application initialization failed", error);
        return new Response("Application data unavailable.\n", { status: 503, headers: { "Cache-Control": "no-store" } });
      }
    }
    return application.fetch(request, env);
  },
} satisfies ExportedHandler<StorageEnv>;
