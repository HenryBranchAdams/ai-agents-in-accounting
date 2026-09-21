import { readSnapshotHistory } from "./snapshot-history.mjs";

// Shared by the production build and applied-data retrieval verification.
// The latter also supports the historical direct generated-history import.
export function historySummaryPlugin({ root = process.cwd(), history = readSnapshotHistory({ root }) } = {}) {
  const summary = { ...history, snapshots: history.snapshots.map(({ id, recorded_at, corpus_version, topology_version, mapping_version, summary }) => ({ id, recorded_at, corpus_version, topology_version, mapping_version, summary })) };
  return {
    name: "coverage-summary",
    setup(builder) {
      builder.onLoad({ filter: /(?:coverage-history-data\.js|snapshots\.generated\.ts)$/ }, () => ({ contents: `export default ${JSON.stringify(summary)}`, loader: "js" }));
    },
  };
}
