"use client";

import { useEffect, useMemo, useState } from "react";
import {
  resourceCurationById,
  resourceIndustryFacets,
  resourceKinds,
  resources,
  sourceRelationshipProfiles,
  resourceTimeRoles,
  resourceTopics,
  type ResourceIndustry,
  type ResourceKind,
  type ResourceTimeRole,
  type ResourceTopic,
} from "./resources-data";

type FilterValue<T extends string> = T | "All";

export function ResourceIndex() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<FilterValue<ResourceTopic>>("All");
  const [kind, setKind] = useState<FilterValue<ResourceKind>>("All");
  const [industry, setIndustry] = useState<FilterValue<ResourceIndustry>>("All");
  const [timeRole, setTimeRole] = useState<FilterValue<ResourceTimeRole>>("All");
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  useEffect(() => {
    const readLocation = () => {
      const parameters = new URLSearchParams(window.location.search);
      const initialTopic = parameters.get("topic");
      const initialKind = parameters.get("kind");
      const initialIndustry = parameters.get("industry");
      const initialTimeRole = parameters.get("time_role");

      setQuery(parameters.get("query") ?? "");
      setTopic(initialTopic && resourceTopics.includes(initialTopic as ResourceTopic)
        ? initialTopic as ResourceTopic
        : "All");
      setKind(initialKind && resourceKinds.includes(initialKind as ResourceKind)
        ? initialKind as ResourceKind
        : "All");
      setIndustry(initialIndustry && resourceIndustryFacets.some((item) => item.id === initialIndustry)
        ? initialIndustry as ResourceIndustry
        : "All");
      setTimeRole(initialTimeRole && resourceTimeRoles.some((item) => item.id === initialTimeRole)
        ? initialTimeRole as ResourceTimeRole
        : "All");
      setFiltersInitialized(true);
    };

    readLocation();
    window.addEventListener("popstate", readLocation);
    return () => window.removeEventListener("popstate", readLocation);
  }, []);

  useEffect(() => {
    if (!filtersInitialized) return;

    const parameters = new URLSearchParams(window.location.search);
    const setOrDelete = (name: string, value: string) => {
      if (value && value !== "All") parameters.set(name, value);
      else parameters.delete(name);
    };

    setOrDelete("query", query);
    setOrDelete("topic", topic);
    setOrDelete("kind", kind);
    setOrDelete("industry", industry);
    setOrDelete("time_role", timeRole);

    const search = parameters.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`,
    );
  }, [filtersInitialized, industry, kind, query, timeRole, topic]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return resources.filter((resource) => {
      const curation = resourceCurationById[resource.id];
      const relationshipProfile = sourceRelationshipProfiles[resource.id];
      const matchesTopic = topic === "All" || resource.topic === topic;
      const matchesKind = kind === "All" || resource.kind === kind;
      const matchesIndustry = industry === "All" || curation?.applicability.includes(industry);
      const matchesTimeRole = timeRole === "All" || curation?.temporal_role === timeRole;
      const searchText = [
        resource.title,
        resource.owner,
        resource.note,
        resource.topic,
        resource.kind,
        resource.jurisdiction,
        curation?.applicability.join(" ") ?? "",
        curation?.applicability_note ?? "",
        curation?.temporal_role ?? "",
        curation?.lifecycle ?? "",
        curation?.publication_status ?? "",
        curation?.method ?? "",
        curation?.transfer_limit ?? "",
        curation?.source_updated_at ?? "",
        curation?.next_review_at ?? "",
        ...(relationshipProfile?.questions ?? []),
        ...(relationshipProfile?.claims.map((claim) => claim.text) ?? []),
        ...(relationshipProfile?.contrary_claims.map((claim) => claim.text) ?? []),
        ...(relationshipProfile?.limitations ?? []),
        relationshipProfile?.next_action ?? "",
      ].join(" ").toLowerCase();

      return matchesTopic && matchesKind && matchesIndustry && matchesTimeRole
        && (!term || searchText.includes(term));
    });
  }, [industry, kind, query, timeRole, topic]);

  const grouped = resourceTopics
    .map((resourceTopic) => ({
      topic: resourceTopic,
      items: filtered.filter((resource) => resource.topic === resourceTopic),
    }))
    .filter((group) => group.items.length > 0);

  const hasFilters = query || topic !== "All" || kind !== "All" || industry !== "All" || timeRole !== "All";

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
        <label>
          <span>Industry</span>
          <select
            onChange={(event) => setIndustry(event.target.value as FilterValue<ResourceIndustry>)}
            value={industry}
          >
            <option>All</option>
            {resourceIndustryFacets.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Time role</span>
          <select
            onChange={(event) => setTimeRole(event.target.value as FilterValue<ResourceTimeRole>)}
            value={timeRole}
          >
            <option>All</option>
            {resourceTimeRoles.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
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
              setIndustry("All");
              setTimeRole("All");
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
                  {resourceCurationById[resource.id]?.applicability.map((facet) => (
                    <span key={facet}>
                      {resourceIndustryFacets.find((item) => item.id === facet)?.label ?? facet}
                    </span>
                  ))}
                  {resourceCurationById[resource.id]?.temporal_role && (
                    <span>
                      {resourceTimeRoles.find((item) => item.id === resourceCurationById[resource.id]?.temporal_role)?.label}
                    </span>
                  )}
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
                {resourceCurationById[resource.id]?.applicability_note && (
                  <p className="source-applicability-note">
                    <strong>Applicability:</strong> {resourceCurationById[resource.id]?.applicability_note}
                  </p>
                )}
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
            setIndustry("All");
            setTimeRole("All");
          }} type="button">Clear filters</button>
        </div>
      )}
    </div>
  );
}
