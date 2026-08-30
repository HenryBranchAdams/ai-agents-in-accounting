"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react/MagnifyingGlass";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { searchItems } from "./content";

type SearchEntry = (typeof searchItems)[number];

type SearchApiItem = {
  id: string;
  record_type: string;
  title: string;
  summary: string;
  canonical_path: string;
  kind: string | null;
};

type SearchApiResponse = {
  total_matching_records: number;
  items: SearchApiItem[];
};

type RemoteSearchResult = {
  query: string;
  items: SearchEntry[];
  total: number;
};

type SearchStatus = "idle" | "loading" | "error";

const SEARCH_DEBOUNCE_MS = 200;
const SEARCH_ERROR_MESSAGE = "Search is unavailable. Please try again.";

function isSearchApiItem(value: unknown): value is SearchApiItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string"
    && typeof item.record_type === "string"
    && typeof item.title === "string"
    && typeof item.summary === "string"
    && typeof item.canonical_path === "string"
    && (item.kind === null || typeof item.kind === "string");
}

function isSearchApiResponse(value: unknown): value is SearchApiResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Record<string, unknown>;
  return Number.isInteger(response.total_matching_records)
    && Number(response.total_matching_records) >= 0
    && Array.isArray(response.items)
    && response.items.every(isSearchApiItem);
}

function categoryForRecord(item: SearchApiItem) {
  switch (item.record_type) {
    case "page":
      return item.kind || "Documentation";
    case "workflow":
      return "Workflows";
    case "resource":
      return "Source library";
    case "authority":
      return "Authority ladder";
    case "control":
      return "Control patterns";
    case "sensitive-action":
      return "Sensitive actions";
    case "template":
      return "Templates";
    case "glossary":
      return "Glossary";
    case "agent":
      return "Specialized agents";
    case "pack":
      return "Workflow packs";
    case "benchmark":
      return "Deferred lab/reference";
    case "change":
      return "Changes";
    case "ecosystem":
      return "Ecosystem";
    default:
      return "Reference";
  }
}

function toSearchEntry(item: SearchApiItem): SearchEntry {
  const category = categoryForRecord(item);
  const detail = item.record_type === "benchmark"
    ? `Deferred lab/reference · ${item.kind || "Benchmark case"} · ${item.summary}`
    : item.summary;
  return {
    href: item.canonical_path,
    title: item.title,
    category,
    detail,
  };
}

export function DocsSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remoteResult, setRemoteResult] = useState<RemoteSearchResult>({ query: "", items: [], total: 0 });
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");
  const [searchError, setSearchError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const openSearch = useCallback(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    setOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setRemoteResult({ query: "", items: [], total: 0 });
    setSearchStatus("idle");
    setSearchError(null);
    window.setTimeout(() => previousFocusRef.current?.focus(), 0);
  }, []);

  const updateQuery = useCallback((value: string) => {
    setQuery(value);
    setRemoteResult({ query: "", items: [], total: 0 });
    setSearchStatus("idle");
    setSearchError(null);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
      const target = event.target;
      const typing = target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
        || (target instanceof HTMLElement && target.isContentEditable);
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        openSearch();
      }
      if (event.key === "Escape" && open) closeSearch();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeSearch, open, openSearch]);

  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    inputRef.current?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      if (dialog?.open) dialog.close();
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    const term = query.trim();
    if (!open || !term) return;

    const controller = new AbortController();
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      setSearchStatus("loading");
      setSearchError(null);
      void (async () => {
        try {
          const params = new URLSearchParams({ q: term, limit: "100" });
          const response = await fetch(`/api/v1/search?${params.toString()}`, {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          });
          if (!response.ok) throw new Error(SEARCH_ERROR_MESSAGE);
          const payload: unknown = await response.json();
          if (!isSearchApiResponse(payload)) throw new Error(SEARCH_ERROR_MESSAGE);
          if (cancelled) return;
          setRemoteResult({
            query: term,
            items: payload.items.map(toSearchEntry),
            total: payload.total_matching_records,
          });
          setSearchStatus("idle");
        } catch {
          if (cancelled || controller.signal.aborted) return;
          setRemoteResult({ query: term, items: [], total: 0 });
          setSearchStatus("error");
          setSearchError(SEARCH_ERROR_MESSAGE);
        }
      })();
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [open, query]);

  const searchResult = useMemo(() => {
    const term = query.trim();
    if (!term) return { items: searchItems, total: searchItems.length };
    if (remoteResult.query !== term) return { items: [], total: 0 };
    return { items: remoteResult.items, total: remoteResult.total };
  }, [query, remoteResult]);
  const results = searchResult.items;
  const isLoading = Boolean(query.trim()) && (remoteResult.query !== query.trim() || searchStatus === "loading");
  const groups = useMemo(() => {
    const grouped = new Map<string, typeof results>();
    for (const result of results) {
      const current = grouped.get(result.category) ?? [];
      current.push(result);
      grouped.set(result.category, current);
    }
    return [...grouped.entries()];
  }, [results]);

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-keyshortcuts="Meta+K Control+K /"
        className="search-trigger"
        type="button"
        onClick={openSearch}
      >
        <MagnifyingGlassIcon aria-hidden="true" className="search-icon" size={20} />
        <span>Search documentation</span>
        <kbd>⌘/Ctrl K</kbd>
      </button>

      {open && (
          <dialog
            aria-labelledby="docs-search-title"
            className="search-dialog"
            onCancel={(event) => {
              event.preventDefault();
              closeSearch();
            }}
            onClick={(event) => {
              if (event.target === event.currentTarget) closeSearch();
            }}
            onKeyDown={(event) => {
              const links = [...(dialogRef.current?.querySelectorAll<HTMLAnchorElement>(".search-results a") ?? [])];
              if (event.key === "Enter" && document.activeElement === inputRef.current && links[0]) {
                event.preventDefault();
                links[0].click();
                return;
              }
              if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
              if (!links.length) return;
              event.preventDefault();
              const current = links.findIndex((link) => link === document.activeElement);
              const next = event.key === "ArrowDown"
                ? links[(current + 1) % links.length]
                : links[current <= 0 ? links.length - 1 : current - 1];
              next.focus();
            }}
            ref={dialogRef}
          >
            <h2 className="sr-only" id="docs-search-title">Search documentation</h2>
            <div className="search-input-row">
              <MagnifyingGlassIcon aria-hidden="true" className="search-icon" size={20} />
              <input
                aria-label="Search documentation"
                onChange={(event) => updateQuery(event.target.value)}
                placeholder="Search documentation"
                ref={inputRef}
                type="search"
                value={query}
              />
              <button type="button" onClick={closeSearch} aria-label="Close search">
                Esc
              </button>
            </div>
            <p aria-live="polite" className="sr-only">
              {isLoading
                ? "Searching documentation…"
                : query.trim() && searchStatus === "error"
                  ? searchError ?? SEARCH_ERROR_MESSAGE
                  : `${searchResult.total} search results${searchResult.total > results.length ? `; showing the first ${results.length}` : ""}`}
            </p>
            <div aria-busy={isLoading ? "true" : undefined} className="search-results">
              {isLoading ? (
                <p aria-live="polite" className="search-empty" role="status">Searching documentation…</p>
              ) : query.trim() && searchStatus === "error" ? (
                <p aria-live="assertive" className="search-empty" role="alert">{searchError ?? SEARCH_ERROR_MESSAGE}</p>
              ) : results.length ? (
                groups.map(([category, items], index) => (
                  <section aria-labelledby={`search-group-${index}`} className="search-result-group" key={category}>
                    <h3 id={`search-group-${index}`}>{category}</h3>
                    {items.map((item) => (
                      <a href={item.href} key={item.href} onClick={closeSearch}>
                        <strong>{item.title}</strong>
                        <span>{item.detail}</span>
                      </a>
                    ))}
                  </section>
                ))
              ) : (
                <p className="search-empty">No documentation matches “{query}”.</p>
              )}
            </div>
          </dialog>
      )}
    </>
  );
}
