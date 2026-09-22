import { isLibraryMap, type LibraryMapData } from "./contract";
import { ConnectionIndexUnavailable } from "../connections/service";
import { ConnectionSnapshotError } from "../connections/select";
declare const LIBRARY_MAP: {
  path: string;
  sha256: string;
  bytes: number;
  corpus_version: string;
  map_version: string;
};
let immutable: LibraryMapData | undefined;
export const libraryMapMetadata = () => LIBRARY_MAP;
export async function loadLibraryMap(
  request: Request,
  assets?: Fetcher,
  version = "",
) {
  if (version && version !== LIBRARY_MAP.map_version)
    throw new ConnectionSnapshotError(
      "The library map changed. Reload the current map.",
    );
  if (immutable) return immutable;
  try {
    if (!assets) throw new Error("Missing assets");
    const response = await assets.fetch(
      new Request(new URL(LIBRARY_MAP.path, request.url)),
    );
    if (!response.ok || !response.body) throw new Error("Missing map");
    const reader = response.body
        .pipeThrough(new DecompressionStream("gzip"))
        .getReader(),
      bytes = new Uint8Array(LIBRARY_MAP.bytes);
    let offset = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (offset + value.length > bytes.length)
          throw new Error("Size mismatch");
        bytes.set(value, offset);
        offset += value.length;
      }
    } finally {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
    const digest = [
      ...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    ]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
    const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (
      offset !== bytes.length ||
      digest !== LIBRARY_MAP.sha256 ||
      !isLibraryMap(data, LIBRARY_MAP.corpus_version, LIBRARY_MAP.map_version)
    )
      throw new Error("Map identity mismatch");
    immutable = data;
    return data;
  } catch {
    throw new ConnectionIndexUnavailable(
      "The library map is temporarily unavailable. Read the research library or retry the map.",
    );
  }
}
