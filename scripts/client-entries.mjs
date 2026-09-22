import path from "node:path";

// Shared chunks and lazy entrypoints can precede the requested entry in esbuild's
// output map. Only entryPoint metadata identifies the script the page must load.
export function clientEntryUrl(metafile, entry, outputDirectory = "dist/client/assets") {
  const matches = Object.entries(metafile.outputs).filter(([file, metadata]) =>
    file.endsWith(".js") && metadata.entryPoint &&
    path.resolve(metadata.entryPoint) === path.resolve(entry));
  if (matches.length !== 1) throw new Error(`Expected one browser entry for ${entry}, found ${matches.length}`);
  const relative = path.relative(path.resolve(outputDirectory), path.resolve(matches[0][0]));
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Browser entry escapes the asset directory: ${entry}`);
  }
  return `/assets/${relative.split(path.sep).join("/")}`;
}
