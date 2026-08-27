"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { searchItems } from "./content";
import { authorityLevels } from "./domain-model";
import { controlPatterns, sensitiveActions } from "./governance-data";
import { glossary, templates } from "./reference-data";
import { resourceCurationById, resources, sourceRelationshipProfiles } from "./resources-data";
import { workflowRecords } from "./workflows-data";
import { benchmarkCases, packs, releaseNotes } from "./platform-data";

type SearchEntry = (typeof searchItems)[number];

function searchRank(item: SearchEntry, term: string) {
  const title = item.title.toLowerCase();
  const hrefTail = item.href.split(/[\/#]/).filter(Boolean).at(-1)?.toLowerCase() ?? "";
  if (title === term || hrefTail === term) return 0;
  if (title.startsWith(term) || hrefTail.startsWith(term)) return 1;
  if (title.includes(term)) return 2;
  return 3;
}

export function DocsSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
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
    window.setTimeout(() => previousFocusRef.current?.focus(), 0);
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

  const searchResult = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return { items: searchItems, total: searchItems.length };
    const pageResults = searchItems.filter((item) =>
      `${item.title} ${item.category} ${item.detail}`.toLowerCase().includes(term),
    );
    const sourceResults: SearchEntry[] = resources
      .filter((resource) => {
        const curation = resourceCurationById[resource.id];
        const relationshipProfile = sourceRelationshipProfiles[resource.id];
        return `${resource.id} ${resource.title} ${resource.owner} ${resource.topic} ${resource.kind} ${resource.note} ${curation?.applicability.join(" ") ?? ""} ${curation?.applicability_note ?? ""} ${curation?.temporal_role ?? ""} ${curation?.method ?? ""} ${curation?.transfer_limit ?? ""} ${relationshipProfile?.questions.join(" ") ?? ""} ${relationshipProfile?.claims.map((claim) => claim.text).join(" ") ?? ""} ${relationshipProfile?.contrary_claims.map((claim) => claim.text).join(" ") ?? ""}`
          .toLowerCase()
          .includes(term);
      })
      .map((resource) => ({
        href: `/resources/${resource.id}`,
        title: resource.title,
        category: "Source library",
        detail: `${resource.owner} · ${resource.kind}`,
      }));

    const workflowResults: SearchEntry[] = workflowRecords
      .filter((workflow) =>
        `${workflow.id} ${workflow.name} ${workflow.family_name} ${workflow.summary} ${workflow.accounting_objective} ${workflow.brief ? `${workflow.brief.pilot_suitability.rating.replaceAll("-", " ")} ${JSON.stringify(workflow.brief)}` : ""}`
          .toLowerCase()
          .includes(term),
      )
      .map((workflow) => ({
        href: `/workflows/${workflow.family}/${workflow.id}`,
        title: workflow.name,
        category: workflow.family_name,
        detail: `${workflow.brief ? "One-minute brief · " : ""}Controlling boundary ${workflow.authority_level} · ${workflow.summary}`,
      }));

    const glossaryResults: SearchEntry[] = glossary
      .filter((entry) => `${entry.id} ${entry.term} ${entry.definition} ${entry.related.join(" ")}`.toLowerCase().includes(term))
      .map((entry) => ({
        href: `/glossary#${entry.id}`,
        title: entry.term,
        category: "Glossary",
        detail: entry.definition,
      }));

    const controlResults: SearchEntry[] = controlPatterns
      .filter((control) =>
        `${control.id} ${control.name} ${control.risk} ${control.objective} ${control.procedure.join(" ")} ${control.evidence.join(" ")} ${control.exceptions.join(" ")}`
          .toLowerCase()
          .includes(term),
      )
      .map((control) => ({
        href: `/controls#${control.id}`,
        title: control.name,
        category: "Control patterns",
        detail: control.objective,
      }));

    const authorityResults: SearchEntry[] = authorityLevels
      .filter((level) =>
        `${level.id} ${level.label} ${level.agent_role} ${level.execution_rule} ${level.required_controls.join(" ")} ${level.accounting_example} ${level.boundary}`
          .toLowerCase()
          .includes(term),
      )
      .map((level) => ({
        href: `/authority#level-${level.id}`,
        title: `${level.id === "human-only" ? "Human-only" : level.id} · ${level.label}`,
        category: "Authority ladder",
        detail: level.boundary,
      }));

    const sensitiveActionResults: SearchEntry[] = sensitiveActions
      .filter((action) =>
        `${action.id} ${action.name} ${action.summary} ${action.default_authority} ${action.agent_may_prepare.join(" ")} ${action.agent_may_execute.join(" ")} ${action.human_only_conditions.join(" ")} ${action.identity_and_sod.join(" ")} ${action.limits.join(" ")} ${action.approval_evidence.join(" ")} ${action.pre_execution_checks.join(" ")} ${action.rollback_or_compensation.join(" ")} ${action.logging_and_review.join(" ")}`
          .toLowerCase()
          .includes(term),
      )
      .map((action) => ({
        href: `/sensitive-actions#${action.id}`,
        title: action.name,
        category: "Sensitive actions",
        detail: `Default ${action.default_authority} · ${action.summary}`,
      }));

    const templateResults: SearchEntry[] = templates
      .filter((template) =>
        `${template.id} ${template.name} ${template.purpose} ${template.use_when} ${template.sections.map((section) => `${section.heading} ${section.prompt}`).join(" ")}`
          .toLowerCase()
          .includes(term),
      )
      .map((template) => ({
        href: `/templates#${template.id}`,
        title: template.name,
        category: "Templates",
        detail: template.purpose,
      }));

    const packResults: SearchEntry[] = packs
      .filter((pack) => JSON.stringify(pack).toLowerCase().includes(term))
      .map((pack) => ({
        href: `/packs/${pack.id}`,
        title: pack.title,
        category: "Workflow packs",
        detail: `${pack.process_family} · ${pack.authority_level} · ${pack.summary}`,
      }));

    const benchmarkResults: SearchEntry[] = benchmarkCases
      .filter((item) => JSON.stringify(item).toLowerCase().includes(term))
      .map((item) => ({
        href: `/bench#${item.id}`,
        title: item.title,
        category: "Accounting Agent Bench",
        detail: `${item.case_type} · expected ${item.expected.outcome}`,
      }));

    const changeResults: SearchEntry[] = releaseNotes
      .filter((item) => JSON.stringify(item).toLowerCase().includes(term))
      .map((item) => ({
        href: `/changes#release-${item.id}`,
        title: item.title,
        category: "Changes",
        detail: `${item.id} · ${item.summary}`,
      }));

    const matches = [
      ...pageResults,
      ...workflowResults,
      ...authorityResults,
      ...controlResults,
      ...sensitiveActionResults,
      ...templateResults,
      ...glossaryResults,
      ...sourceResults,
      ...packResults,
      ...benchmarkResults,
      ...changeResults,
    ].sort((left, right) => searchRank(left, term) - searchRank(right, term));
    return { items: matches.slice(0, 100), total: matches.length };
  }, [query]);
  const results = searchResult.items;
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
        <span className="search-icon" aria-hidden="true">⌕</span>
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
              <span className="search-icon" aria-hidden="true">⌕</span>
              <input
                aria-label="Search documentation"
                onChange={(event) => setQuery(event.target.value)}
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
              {searchResult.total} search results{searchResult.total > results.length ? `; showing the first ${results.length}` : ""}
            </p>
            <div className="search-results">
              {results.length ? (
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
                <p className="search-empty">No pages match “{query}”.</p>
              )}
            </div>
          </dialog>
      )}
    </>
  );
}
