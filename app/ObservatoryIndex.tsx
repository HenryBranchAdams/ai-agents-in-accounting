"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  PracticeObservatoryItem,
  PracticeObservatoryLaneId,
} from "./practice-observatory";
import type { ResourceIndustry } from "./resources-data";

type Lane = {
  id: PracticeObservatoryLaneId;
  label: string;
  description: string;
};

type Industry = {
  id: ResourceIndustry;
  label: string;
};

type FilterValue<T extends string> = T | "All";

export function ObservatoryIndex({
  industries,
  items,
  lanes,
}: {
  industries: readonly Industry[];
  items: readonly PracticeObservatoryItem[];
  lanes: readonly Lane[];
}) {
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState<FilterValue<PracticeObservatoryLaneId>>("All");
  const [industry, setIndustry] = useState<FilterValue<ResourceIndustry>>("All");
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  useEffect(() => {
    const readLocation = () => {
      const parameters = new URLSearchParams(window.location.search);
      const initialLane = parameters.get("lane");
      const initialIndustry = parameters.get("industry");

      setQuery(parameters.get("query") ?? "");
      setLane(initialLane && lanes.some((item) => item.id === initialLane)
        ? initialLane as PracticeObservatoryLaneId
        : "All");
      setIndustry(initialIndustry && industries.some((item) => item.id === initialIndustry)
        ? initialIndustry as ResourceIndustry
        : "All");
      setFiltersInitialized(true);
    };

    readLocation();
    window.addEventListener("popstate", readLocation);
    return () => window.removeEventListener("popstate", readLocation);
  }, [industries, lanes]);

  useEffect(() => {
    if (!filtersInitialized) return;
    const parameters = new URLSearchParams(window.location.search);
    const setOrDelete = (name: string, value: string) => {
      if (value && value !== "All") parameters.set(name, value);
      else parameters.delete(name);
    };

    setOrDelete("query", query);
    setOrDelete("lane", lane);
    setOrDelete("industry", industry);
    const search = parameters.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`,
    );
  }, [filtersInitialized, industry, lane, query]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => {
      if (lane !== "All" && item.lane_id !== lane) return false;
      if (industry !== "All" && !item.applicability.some((facet) => facet.id === industry)) return false;
      if (!term) return true;

      return [
        item.resource_id,
        item.title,
        item.publisher,
        item.source_type,
        item.topic,
        item.summary,
        item.jurisdiction,
        item.publication_status,
        item.method,
        item.transfer_limit,
        item.evidence_tier_label,
        ...item.applicability.map((facet) => `${facet.id} ${facet.label}`),
      ].join(" ").toLowerCase().includes(term);
    });
  }, [industry, items, lane, query]);

  const grouped = lanes
    .map((item) => ({ ...item, records: filtered.filter((record) => record.lane_id === item.id) }))
    .filter((item) => item.records.length > 0);

  const hasFilters = query || lane !== "All" || industry !== "All";
  const clearFilters = () => {
    setQuery("");
    setLane("All");
    setIndustry("All");
  };

  return (
    <div className="observatory-index">
      <div className="resource-controls observatory-controls">
        <label className="resource-query">
          <span>Search</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Title, publisher, topic, or method"
            type="search"
            value={query}
          />
        </label>
        <label>
          <span>Development type</span>
          <select
            onChange={(event) => setLane(event.target.value as FilterValue<PracticeObservatoryLaneId>)}
            value={lane}
          >
            <option>All</option>
            {lanes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label>
          <span>Industry applicability</span>
          <select
            onChange={(event) => setIndustry(event.target.value as FilterValue<ResourceIndustry>)}
            value={industry}
          >
            <option>All</option>
            {industries.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
      </div>

      <div className="resource-index-status observatory-status">
        <p aria-live="polite">{filtered.length} of {items.length} current-development records</p>
        {hasFilters && <button onClick={clearFilters} type="button">Clear filters</button>}
      </div>

      {grouped.length ? grouped.map((group) => (
        <section className="observatory-lane" id={`lane-${group.id}`} key={group.id}>
          <header>
            <div>
              <h2>{group.label}</h2>
              <p>{group.description}</p>
            </div>
            <span aria-label={`${group.records.length} records`}>{group.records.length}</span>
          </header>
          <div className="observatory-records">
            {group.records.map((item) => (
              <article className="observatory-card" id={item.id} key={item.id}>
                <div className="source-meta">
                  <span>{item.source_type}</span>
                  <span>{item.source_updated_at ?? "Source update not normalized"}</span>
                  {item.applicability.map((facet) => <span key={facet.id}>{facet.label}</span>)}
                </div>
                <h3><a href={item.catalog_href}>{item.title}</a></h3>
                <p className="source-owner">{item.publisher} · {item.jurisdiction} · {item.access}</p>
                <p>{item.summary}</p>
                <p className="evidence-label" data-evidence-classification="editorial-recommendation">
                  Evidence weight: {item.evidence_tier_label}
                </p>
                <details className="observatory-details">
                  <summary>Method, freshness, and transfer limit</summary>
                  <dl>
                    <div><dt>Source ID</dt><dd><code>{item.resource_id}</code></dd></div>
                    <div><dt>Publisher status</dt><dd>{item.published_or_status} · {item.publication_status}</dd></div>
                    <div><dt>Lifecycle</dt><dd>{item.lifecycle}</dd></div>
                    <div><dt>Method</dt><dd>{item.method}</dd></div>
                    <div><dt>Applicability</dt><dd>{item.applicability_note}</dd></div>
                    <div><dt>Transfer limit</dt><dd>{item.transfer_limit}</dd></div>
                    <div><dt>Commercial interest</dt><dd>{item.commercial_interest}</dd></div>
                    <div><dt>Catalog review</dt><dd>{item.record_reviewed_at}; source verified {item.source_verified_at}; next review {item.next_review_at}</dd></div>
                  </dl>
                </details>
                <p className="observatory-links">
                  <a href={item.catalog_href}>Catalog record</a>
                  {" · "}
                  <a href={item.original_source_href} rel="noreferrer" target="_blank">Original source ↗</a>
                  {item.reading_room_shelf && <>{" · "}<a href={item.reading_room_shelf.href}>{item.reading_room_shelf.label}</a></>}
                </p>
              </article>
            ))}
          </div>
        </section>
      )) : (
        <div className="resource-empty">
          <p>No current-development records match these filters.</p>
          <button onClick={clearFilters} type="button">Clear filters</button>
        </div>
      )}
    </div>
  );
}
