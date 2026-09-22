import type { ReactNode } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { FieldGroup } from "./ui/field";
import { InputField, SelectField } from "./corpus-fields";
import { ConnectionEvidence, NodeContext } from "./connection-evidence";
import { mapURL, type MapView, type MapDetail } from "../library-map/contract";
export function LibraryExplorer({
  view,
  detail,
  graph,
  status = "",
}: {
  view: MapView;
  detail?: MapDetail;
  graph?: ReactNode;
  status?: string;
}) {
  const s = view.state,
    topic = view.topics.find((t) => t.id === s.topic),
    collection = view.collections.find((c) => c.id === s.collection);
  const next = (updates: Partial<typeof s>) =>
    mapURL({ ...s, page: 1, ...updates });
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4 pt-6 pb-3">
        <div>
          <h1 className="text-3xl">Library map</h1>
          <p className="text-muted-foreground">
            Explore every topic and reading.
          </p>
        </div>
        <nav aria-label="Library map views" className="flex flex-wrap gap-2">
          <Button asChild variant={s.mode === "map" ? "default" : "outline"}>
            <a
              href={next({ mode: "map" })}
              aria-current={s.mode === "map" ? "page" : undefined}
            >
              Map
            </a>
          </Button>
          <Button asChild variant={s.mode === "list" ? "default" : "outline"}>
            <a
              href={next({ mode: "list" })}
              aria-current={s.mode === "list" ? "page" : undefined}
            >
              List
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={mapURL({ mode: s.mode, map: s.map })} data-map-whole="">
              Whole library
            </a>
          </Button>
        </nav>
      </header>
      <div className="library-map-controls">
        <form
          action="/map"
          method="get"
          aria-label="Search whole library"
          key={`search-${s.q}`}
        >
          <input type="hidden" name="mode" value={s.mode} />
          <FieldGroup className="flex-row items-end">
            <InputField
              name="q"
              label="Search the whole library"
              placeholder="A topic, title or question"
              defaultValue={s.q}
              maxLength={240}
            />
            <Button type="submit">Search</Button>
          </FieldGroup>
        </form>
        <details className="map-filter-disclosure">
          <summary>Filters: topics, types and collections</summary>
          <form
            action="/map"
            method="get"
            aria-label="Filter library map"
            key={`filters-${s.topic}-${s.kind}-${s.collection}-${s.q}`}
          >
            <input type="hidden" name="mode" value={s.mode} />
            <input type="hidden" name="q" value={s.q} />
            <FieldGroup className="grid grid-cols-2 items-end lg:grid-cols-4">
              <SelectField
                name="topic"
                label="Topic"
                selected={s.topic}
                allLabel="All topics"
                values={view.topics.map((t) => [
                  t.id,
                  `${t.title} (${t.count})`,
                ])}
              />
              <SelectField
                name="kind"
                label="Record type"
                selected={s.kind}
                allLabel="All types"
                values={view.kinds.map((k) => [k, k])}
              />
              <SelectField
                name="collection"
                label="Reading collection"
                selected={s.collection}
                allLabel="All collections"
                values={view.collections.map((c) => [c.id, c.title])}
              />
              <Button type="submit">Apply</Button>
            </FieldGroup>
          </form>
        </details>
      </div>
      <div
        className="flex flex-wrap items-center gap-3 py-4"
        role="status"
        aria-live="polite"
      >
        <Badge variant="secondary">
          {view.total.toLocaleString("en")} records
        </Badge>
        <span>{view.topics.length} topics</span>
        <span>
          {s.q || s.topic || s.kind || s.collection
            ? `${view.matching.toLocaleString("en")} matching records`
            : "Whole library"}
        </span>
        {topic ? <span>Topic: {topic.title}</span> : null}
        {collection ? <span>Collection: {collection.title}</span> : null}
        {s.q || s.topic || s.kind || s.collection ? (
          <a href={mapURL({ mode: s.mode, map: s.map })}>Clear filters</a>
        ) : null}
      </div>
      {status ? (
        <Alert>
          <AlertTitle>Map status</AlertTitle>
          <AlertDescription>
            <p role="status">{status}</p>
            <a data-map-reload="" href={mapURL({ ...s, map: "" })}>
              Reload the current map
            </a>
          </AlertDescription>
        </Alert>
      ) : null}
      <div
        className={
          s.mode === "map" ? "library-map-workspace" : "library-list-workspace"
        }
      >
        {s.mode === "map" ? (
          <section
            aria-label="Whole library visualization"
            className="library-map-stage"
          >
            {graph || (
              <div className="library-map-placeholder">
                <p>
                  The interactive map requires JavaScript. Every record is available
                  in the List below.
                </p>
                <a href={next({ mode: "list" })}>Use the accessible List</a>
              </div>
            )}
          </section>
        ) : null}
        <aside className="library-map-inspector" aria-label="Map selection">
          <h2 id="map-selection-title" tabIndex={-1}>
            {view.selected
              ? view.selected.title
              : topic
                ? topic.title
                : "Find your next reading"}
          </h2>
          {view.selected ? (
            <>
              {detail?.node.id === view.selected.id ? (
                <NodeContext node={detail.node} />
              ) : (
                <>
                  <p>{view.selected.summary}</p>
                  <p>
                    <a
                      href={`/records/${encodeURIComponent(view.selected.id)}`}
                    >
                      Open the complete record
                    </a>
                  </p>
                </>
              )}
              <p>Topics</p>
              <ul>
                {view.selected.topics.map((id) => {
                  const t = view.topics.find((t) => t.id === id);
                  return t ? (
                    <li key={id}>
                      <a
                        href={next({
                          topic: id,
                          q: "",
                          kind: "",
                          collection: "",
                          record: "",
                          edge: "",
                        })}
                      >
                        {t.title}
                      </a>
                    </li>
                  ) : null;
                })}
              </ul>
              {view.collections.some((c) => c.id === view.selected!.id) ? (
                <p>
                  <a
                    href={next({
                      collection: view.selected.id,
                      topic: "",
                      kind: "",
                      q: "",
                      record: "",
                      edge: "",
                    })}
                  >
                    Explore this collection in its reading order
                  </a>
                </p>
              ) : null}
              <details open={!!s.edge}>
                <summary>{view.relations.length} recorded connections</summary>
                <p>
                  Arrows follow the stored reference. Citation is not
                  validation; a shared source does not establish support.
                </p>
                <ul>
                  {view.relations.map((e) => (
                    <li key={e.id}>
                      <a href={next({ edge: e.id })}>
                        {e.from_title} → {e.to_title}: {e.type}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
              {detail?.edge ? (
                <section aria-label="Selected connection evidence">
                  <h3>{detail.edge.type}</h3>
                  <ConnectionEvidence edge={detail.edge} />
                </section>
              ) : null}
            </>
          ) : (
            <>
              <p>
                {topic
                  ? `${topic.count} records carry this topic. Records may belong to several topics.`
                  : "Select a topic or a record on the map, or search across the entire library."}
              </p>
              {!topic ? (
                <ul className="map-popular-topics">
                  {[...view.topics]
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 7)
                    .map((t) => (
                      <li key={t.id}>
                        <a
                          href={next({
                            topic: t.id,
                            q: "",
                            kind: "",
                            collection: "",
                            record: "",
                            edge: "",
                          })}
                        >
                          {t.title}
                        </a>
                        <span>{t.count}</span>
                      </li>
                    ))}
                </ul>
              ) : null}
              <details>
                <summary>How to read the map</summary>
                <p>
                  Small points are records; larger points are topics. Diamonds
                  mark reading collections. Labels appear as space allows. Zoom
                  in for more detail.
                </p>
                <p>
                  Position follows topic membership. Distance and point size do
                  not measure authority, confidence or support. Evidence
                  relationships appear when you select a record.
                </p>
              </details>
              <details>
                <summary>Browse all {view.topics.length} topics</summary>
                <ul>
                  {view.topics.map((t) => (
                    <li key={t.id}>
                      <a
                        href={next({
                          topic: t.id,
                          q: "",
                          kind: "",
                          collection: "",
                          record: "",
                          edge: "",
                        })}
                      >
                        {t.title} ({t.count})
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            </>
          )}
          {collection ? (
            <p>
              The List follows the collection's recorded source order. Inclusion
              is an editorial reading choice, not a support relationship.
            </p>
          ) : null}
        </aside>
      </div>
      <section
        id="map-record-list"
        aria-label="Library map record list"
        className="py-6"
      >
        <h2>{s.mode === "map" ? "Explore in the List" : "Library records"}</h2>
        <p>
          {view.matching} matching records. Page {s.page} of {view.pages}.{" "}
          {s.mode === "map"
            ? "The map retains the whole library; filters highlight matching records."
            : ""}
        </p>
        {!view.records.length ? (
          <p>
            No records match these filters.{" "}
            <a href={mapURL({ mode: s.mode, map: s.map })}>
              Return to the whole library.
            </a>
          </p>
        ) : null}
        <ol className="map-record-results" start={(s.page - 1) * 30 + 1}>
          {view.records.map((r) => (
            <li key={r.id}>
              <div>
                <a
                  href={next({ record: r.id, edge: "" })}
                  aria-current={r.id === s.record ? "true" : undefined}
                >
                  {r.title}
                </a>
                <Badge variant="outline">{r.kind}</Badge>
              </div>
              <p>{r.summary}</p>
              <a href={`/records/${encodeURIComponent(r.id)}`}>Read record</a>
            </li>
          ))}
        </ol>
        <nav aria-label="Map List pages" className="flex gap-3">
          {s.page > 1 ? (
            <Button asChild variant="outline">
              <a href={next({ page: s.page - 1 })}>Previous page</a>
            </Button>
          ) : null}
          {s.page < view.pages ? (
            <Button asChild variant="outline">
              <a href={next({ page: s.page + 1 })}>Next page</a>
            </Button>
          ) : null}
        </nav>
      </section>
      <p className="text-xs text-muted-foreground">
        Corpus {view.corpus_version}.{" "}
        <a href={`/api/v1/library-map?map=${view.map_version}`}>
          Map data and layout identity
        </a>
        . Topic membership and evidence relationships are separate.
      </p>
    </>
  );
}
