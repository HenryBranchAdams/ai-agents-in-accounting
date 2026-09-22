import { ConnectionQueryError } from "../connections/state";
import {
  connectionTypes,
  type GraphNode,
  type GraphEdge,
} from "../connections/contract";
export interface MapRecord {
  id: string;
  title: string;
  kind: string;
  summary: string;
  topics: string[];
  x: number;
  y: number;
}
export interface MapTopic {
  id: string;
  title: string;
  count: number;
  x: number;
  y: number;
}
export interface MapEdge {
  id: string;
  from: string;
  to: string;
  type: (typeof connectionTypes)[number];
}
export interface LibraryMapData {
  schema_version: "1";
  corpus_version: string;
  index_version: string;
  map_version: string;
  layout: {
    algorithm: string;
    input_sha256: string;
    lockfile_sha256: string;
    options: Record<string, unknown>;
  };
  records: MapRecord[];
  topics: MapTopic[];
  edges: MapEdge[];
  collections: { id: string; title: string; members: string[] }[];
}
export interface MapState {
  q: string;
  topic: string;
  collection: string;
  kind: string;
  record: string;
  edge: string;
  mode: "map" | "list";
  page: number;
  map: string;
}
export interface MapDetail {
  node: GraphNode;
  edge?: GraphEdge;
  corpus_version: string;
  index_version: string;
  map_version: string;
}
export interface MapView {
  state: MapState;
  corpus_version: string;
  index_version: string;
  map_version: string;
  total: number;
  matching: number;
  pages: number;
  records: MapRecord[];
  topics: Pick<MapTopic, "id" | "title" | "count">[];
  collections: { id: string; title: string }[];
  kinds: string[];
  selected?: MapRecord;
  relations: (MapEdge & { from_title: string; to_title: string })[];
}
const keys = [
  "q",
  "topic",
  "collection",
  "kind",
  "record",
  "edge",
  "mode",
  "page",
  "map",
];
export function mapState(params: URLSearchParams): MapState {
  if (
    params.toString().length > 4096 ||
    [...params.keys()].some(
      (k) => !keys.includes(k) || params.getAll(k).length !== 1,
    )
  )
    throw new ConnectionQueryError(
      "Use one value for each library map filter.",
    );
  const s = {
    q: params.get("q")?.trim() || "",
    topic: params.get("topic") || "",
    collection: params.get("collection") || "",
    kind: params.get("kind") || "",
    record: params.get("record") || "",
    edge: params.get("edge") || "",
    mode: params.get("mode") || "map",
    page: Number(params.get("page") || 1),
    map: params.get("map") || "",
  };
  if (
    s.q.length > 240 ||
    !["map", "list"].includes(s.mode) ||
    !Number.isInteger(s.page) ||
    s.page < 1 ||
    s.page > 100000 ||
    [s.record, s.kind, s.collection, s.topic].some(
      (v) => v && !/^[a-zA-Z0-9_-]+$/.test(v),
    ) ||
    (s.map && !/^[a-f0-9]{64}$/.test(s.map))
  )
    throw new ConnectionQueryError("Invalid library map filter.");
  return s as MapState;
}
export function mapURL(state: Partial<MapState> = {}) {
  const p = new URLSearchParams();
  for (const k of keys) {
    const v = state[k as keyof MapState];
    if (v && !(k === "mode" && v === "map") && !(k === "page" && v === 1))
      p.set(k, String(v));
  }
  return "/map" + (p.size ? "?" + p : "");
}
export function matchingRecords(data: LibraryMapData, state: MapState) {
  const collection = state.collection
    ? data.collections.find((c) => c.id === state.collection)
    : undefined;
  const memberOrder = new Map(collection?.members.map((id, i) => [id, i]));
  const topicTitles = new Map(data.topics.map((t) => [t.id, t.title]));
  const terms = state.q.toLocaleLowerCase("en").split(/\s+/).filter(Boolean);
  const results = data.records.filter(
    (r) =>
      (!state.topic || r.topics.includes(state.topic)) &&
      (!state.kind || r.kind === state.kind) &&
      (!state.collection || memberOrder.has(r.id)) &&
      terms.every((term) =>
        `${r.title} ${r.id} ${r.summary} ${r.topics.map((t) => topicTitles.get(t)).join(" ")}`
          .toLocaleLowerCase("en")
          .includes(term),
      ),
  );
  return results.sort((a, b) =>
    collection
      ? memberOrder.get(a.id)! - memberOrder.get(b.id)!
      : a.title.localeCompare(b.title, "en") || a.id.localeCompare(b.id, "en"),
  );
}
export function mapView(data: LibraryMapData, state: MapState): MapView {
  for (const [value, valid] of [
    [state.topic, data.topics.map((t) => t.id)],
    [state.collection, data.collections.map((c) => c.id)],
    [state.kind, [...new Set(data.records.map((r) => r.kind))]],
    [state.record, data.records.map((r) => r.id)],
  ] as const)
    if (value && !valid.includes(value))
      throw new ConnectionQueryError(
        "A selected topic, collection, type or record is not in this map.",
      );
  const matching = matchingRecords(data, state),
    pages = Math.max(1, Math.ceil(matching.length / 30));
  const selected = data.records.find((r) => r.id === state.record);
  const names = new Map(data.records.map((r) => [r.id, r.title]));
  const relations = selected
    ? data.edges
        .filter((e) => e.from === selected.id || e.to === selected.id)
        .map((e) => ({
          ...e,
          from_title: names.get(e.from)!,
          to_title: names.get(e.to)!,
        }))
    : [];
  if (state.edge && !relations.some((e) => e.id === state.edge))
    throw new ConnectionQueryError(
      "Select a connection belonging to the selected record.",
    );
  return {
    state: {
      ...state,
      page: Math.min(state.page, pages),
      map: data.map_version,
    },
    corpus_version: data.corpus_version,
    index_version: data.index_version,
    map_version: data.map_version,
    total: data.records.length,
    matching: matching.length,
    pages,
    records: matching.slice(
      (Math.min(state.page, pages) - 1) * 30,
      Math.min(state.page, pages) * 30,
    ),
    topics: data.topics.map(({ id, title, count }) => ({ id, title, count })),
    collections: data.collections.map(({ id, title }) => ({ id, title })),
    kinds: [...new Set(data.records.map((r) => r.kind))].sort(),
    selected,
    relations,
  };
}
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((s) => typeof s === "string");
export function isLibraryMap(
  value: unknown,
  corpus: string,
  version: string,
): value is LibraryMapData {
  if (
    !object(value) ||
    value.schema_version !== "1" ||
    value.corpus_version !== corpus ||
    value.map_version !== version ||
    typeof value.index_version !== "string" ||
    !object(value.layout) ||
    !Array.isArray(value.records) ||
    !Array.isArray(value.topics) ||
    !Array.isArray(value.edges) ||
    !Array.isArray(value.collections)
  )
    return false;
  const positioned = (v: unknown) =>
    object(v) &&
    typeof v.id === "string" &&
    /^[a-zA-Z0-9_-]+$/.test(v.id) &&
    typeof v.title === "string" &&
    typeof v.x === "number" &&
    Number.isFinite(v.x) &&
    typeof v.y === "number" &&
    Number.isFinite(v.y);
  if (
    !value.topics.every(
      (t) =>
        positioned(t) &&
        object(t) &&
        Number.isInteger(t.count) &&
        Number(t.count) > 0,
    ) ||
    !value.records.every(
      (r) =>
        positioned(r) &&
        object(r) &&
        typeof r.kind === "string" &&
        typeof r.summary === "string" &&
        strings(r.topics),
    )
  )
    return false;
  const ids = new Set(value.records.map((r) => r.id)),
    topics = new Set(value.topics.map((t) => t.id));
  return (
    ids.size === value.records.length &&
    topics.size === value.topics.length &&
    ![...topics].some((id) => ids.has(id)) &&
    value.records.every((r) => r.topics.every((t: string) => topics.has(t))) &&
    value.edges.every(
      (e) =>
        object(e) &&
        typeof e.id === "string" &&
        ids.has(e.from) &&
        ids.has(e.to) &&
        connectionTypes.includes(e.type as MapEdge["type"]),
    ) &&
    new Set(value.edges.map((e) => e.id)).size === value.edges.length &&
    value.collections.every(
      (c) =>
        object(c) &&
        ids.has(c.id) &&
        typeof c.title === "string" &&
        strings(c.members) &&
        c.members.every((id) => ids.has(id)),
    )
  );
}
export function isMapDetail(value: unknown, view: MapView): value is MapDetail {
  if (
    !object(value) ||
    value.corpus_version !== view.corpus_version ||
    value.index_version !== view.index_version ||
    value.map_version !== view.map_version ||
    !object(value.node)
  )
    return false;
  const n = value.node;
  return (
    n.id === view.state.record &&
    n.href === `/records/${encodeURIComponent(view.state.record)}` &&
    [
      "id",
      "kind",
      "title",
      "summary",
      "revision",
      "scope",
      "review_status",
      "access",
    ].every((k) => typeof n[k] === "string") &&
    (n.reviewed_at === null || typeof n.reviewed_at === "string") &&
    strings(n.limitations) &&
    object(n.rights)
  );
}
