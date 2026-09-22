import fs from "node:fs";
import { createHash } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
cytoscape.use(fcose);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const options = {
  name: "fcose",
  quality: "default",
  animate: false,
  randomize: true,
  packComponents: false,
  nodeSeparation: 60,
  seed: 187,
};
/** Build-only force simulation; all topic memberships remain explicit and no evidentiary edge is inferred. */
export function projectLibraryMap(records, snapshot, lockfile) {
  const sorted = [...records].sort((a, b) => a.id.localeCompare(b.id, "en"));
  const labels = [...new Set(sorted.flatMap((r) => r.topics))].sort((a, b) =>
    a.localeCompare(b, "en"),
  );
  const topics = labels.map((title) => ({
    id: `topic_${hash(title).slice(0, 24)}`,
    title,
    count: sorted.filter((r) => r.topics.includes(title)).length,
  }));
  const topicIds = new Map(topics.map((t) => [t.title, t.id]));
  const nodes = sorted.map((r) => ({
    id: r.id,
    title: r.title,
    kind: r.kind,
    summary: r.summary,
    topics: r.topics.map((t) => topicIds.get(t)),
  }));
  const collections = sorted
    .filter((r) => r.kind === "collection")
    .map((r) => ({
      id: r.id,
      title: r.title,
      members: [...new Set(r.source_ids)],
    }));
  const input = JSON.stringify({
    records: nodes,
    collections,
    edges: snapshot.edges.map(({ id, from, to, type }) => ({
      id,
      from,
      to,
      type,
    })),
    topics,
    options,
    algorithm: "cytoscape-3.34.3/fcose-2.2.0",
  });
  const elements = [
    ...nodes.map((n) => ({ data: { id: n.id } })),
    ...topics.map((t) => ({ data: { id: t.id } })),
    ...nodes.flatMap((n) =>
      n.topics.map((t) => ({ data: { source: n.id, target: t } })),
    ),
  ];
  // fCoSE reads Math.random synchronously. A fixed seed and sorted inputs make the saved layout reproducible.
  const random = Math.random;
  let seed = 187;
  let cy;
  try {
    Math.random = () =>
      (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    cy = cytoscape({ headless: true, elements, styleEnabled: false });
    cy.layout(options).run();
  } finally {
    Math.random = random;
  }
  const position = (id) => {
    const { x, y } = cy.getElementById(id).position();
    if (!Number.isFinite(x) || !Number.isFinite(y))
      throw new Error("Nonfinite map position");
    return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
  };
  try {
    const data = {
      schema_version: "1",
      corpus_version: snapshot.corpus_version,
      index_version: snapshot.index_version,
      layout: {
        algorithm: "cytoscape-3.34.3/fcose-2.2.0",
        input_sha256: hash(input),
        lockfile_sha256: hash(lockfile),
        options,
      },
      records: nodes.map((n) => ({ ...n, ...position(n.id) })),
      topics: topics.map((t) => ({ ...t, ...position(t.id) })),
      collections,
      edges: snapshot.edges.map(({ id, from, to, type }) => ({
        id,
        from,
        to,
        type,
      })),
    };
    return { ...data, map_version: hash(JSON.stringify(data)) };
  } finally {
    cy.destroy();
  }
}
export function writeLibraryMap(records, connectionMetadata) {
  const snapshot = JSON.parse(
    gunzipSync(fs.readFileSync(`dist/client${connectionMetadata.path}`)),
  );
  const data = projectLibraryMap(
    records,
    snapshot,
    fs.readFileSync("package-lock.json"),
  );
  const body = Buffer.from(JSON.stringify(data)),
    sha256 = hash(body),
    path = `/_runtime/library-map/${sha256}.json.gz`;
  fs.mkdirSync("dist/client/_runtime/library-map", { recursive: true });
  fs.writeFileSync(`dist/client${path}`, gzipSync(body, { level: 9 }));
  const metadata = {
    path,
    sha256,
    bytes: body.length,
    corpus_version: data.corpus_version,
    map_version: data.map_version,
  };
  fs.writeFileSync(
    "dist/internal/library-map.json",
    JSON.stringify(metadata, null, 2) + "\n",
  );
  return metadata;
}
