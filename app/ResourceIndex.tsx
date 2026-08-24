"use client";

import { useEffect, useMemo, useState } from "react";
import {
  resourceKinds,
  resources,
  resourceTopics,
  type ResourceKind,
  type ResourceTopic,
} from "./resources-data";

type FilterValue<T extends string> = T | "All";

export function ResourceIndex() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<FilterValue<ResourceTopic>>("All");
  const [kind, setKind] = useState<FilterValue<ResourceKind>>("All");

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    const initialQuery = parameters.get("query") ?? "";
    const initialTopic = parameters.get("topic");
    const initialKind = parameters.get("kind");

    const update = window.setTimeout(() => {
      setQuery(initialQuery);
      if (initialTopic && resourceTopics.includes(initialTopic as ResourceTopic)) {
        setTopic(initialTopic as ResourceTopic);
      }
      if (initialKind && resourceKinds.includes(initialKind as ResourceKind)) {
        setKind(initialKind as ResourceKind);
      }
    }, 0);
    return () => window.clearTimeout(update);
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return resources.filter((resource) => {
      const matchesTopic = topic === "All" || resource.topic === topic;
      const matchesKind = kind === "All" || resource.kind === kind;
      const searchText = [
        resource.title,
        resource.owner,
        resource.note,
        resource.topic,
        resource.kind,
        resource.jurisdiction,
      ].join(" ").toLowerCase();

      return matchesTopic && matchesKind && (!term || searchText.includes(term));
    });
  }, [kind, query, topic]);

  const grouped = resourceTopics
    .map((resourceTopic) => ({
      topic: resourceTopic,
      items: filtered.filter((resource) => resource.topic === resourceTopic),
    }))
    .filter((group) => group.items.length > 0);

  const hasFilters = query || topic !== "All" || kind !== "All";

  return (
    <div className="resource-index">
      <div className="resource-controls">
        <label className="resource-query">
          <span>Search</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Title, publisher, or subject"
            type="search"
            value={query}
          />
        </label>
        <label>
          <span>Topic</span>
          <select
            onChange={(event) => setTopic(event.target.value as FilterValue<ResourceTopic>)}
            value={topic}
          >
            <option>All</option>
            {resourceTopics.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span>Source type</span>
          <select
            onChange={(event) => setKind(event.target.value as FilterValue<ResourceKind>)}
            value={kind}
          >
            <option>All</option>
            {resourceKinds.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <div className="resource-index-status">
        <p aria-live="polite">{filtered.length} of {resources.length} sources</p>
        {hasFilters && (
          <button
            onClick={() => {
              setQuery("");
              setTopic("All");
              setKind("All");
            }}
            type="button"
          >
            Clear filters
          </button>
        )}
      </div>

      {grouped.length ? grouped.map((group) => (
        <div className="resource-group" key={group.topic}>
          <div className="resource-group-heading">
            <h3>{group.topic}</h3>
            <span>{group.items.length}</span>
          </div>
          <div className="source-list">
            {group.items.map((resource) => (
              <article key={resource.id}>
                <div className="source-meta">
                  <span>{resource.kind}</span>
                  <span>{resource.date}</span>
                </div>
                <h4>
                  <a href={resource.href} rel="noreferrer" target="_blank">
                    {resource.title}<span aria-hidden="true"> ↗</span>
                  </a>
                </h4>
                <p className="source-owner">
                  {resource.owner} · {resource.jurisdiction} · {resource.access}
                </p>
                <p>{resource.note}</p>
                <p className="source-record-link">
                  <a href={`/resources/${resource.id}`}>Catalog record · {resource.id}</a>
                </p>
              </article>
            ))}
          </div>
        </div>
      )) : (
        <div className="resource-empty">
          <p>No sources match the current filters.</p>
          <button onClick={() => {
            setQuery("");
            setTopic("All");
            setKind("All");
          }} type="button">Clear filters</button>
        </div>
      )}
    </div>
  );
}
