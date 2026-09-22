import { useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import type { SearchSuggestions } from "../search-suggestion-contract";
import { suggestionQueryLimit, isSearchSuggestions } from "../search-suggestion-contract";

const destinations = [
  ["/library", "Research library"], ["/briefs", "Research briefs"],
  ["/records/wf-r2r-bank-reconciliations", "Bank reconciliation"],
  ["/records/guide-construction-wip", "Construction work in progress"],
];

function SearchPalette({ edition, trigger }: { edition: string; trigger: HTMLElement | null }) {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchSuggestions | null>(null);
  const [status, setStatus] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const keyboardSelection = useRef(false);
  const q = query.trim();
  useEffect(() => {
    setResult(null);
    setMismatch(false);
    if (!open || !q) { setStatus(""); return; }
    let current = true;
    const abort = new AbortController();
    setStatus("Searching…");
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/v1/search-suggestions?${new URLSearchParams({ q })}`, { signal: abort.signal, credentials: "omit", mode: "same-origin" });
        const body = await response.json();
        if (!current) return;
        if (!response.ok) {
          const message = body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : "Search could not be completed.";
          setStatus(message); return;
        }
        if (!isSearchSuggestions(body) || body.query !== q) {
          setStatus("Search returned an unreadable response. Use the research library or try again."); return;
        }
        if (body.corpus_version !== edition) {
          setMismatch(true); setStatus("The corpus has changed since this page loaded. Reload to search the current edition."); return;
        }
        setResult(body);
        setStatus(body.total ? `Showing ${body.items.length} of ${body.total} matches.` : "No records match this search.");
      } catch (error) {
        if (current && !abort.signal.aborted) setStatus("Search is unavailable. Check your connection or use the research library.");
      }
    }, 180);
    return () => { current = false; window.clearTimeout(timer); abort.abort(); };
  }, [q, edition, open]);
  const item = (href: string, title: string, value: string, detail?: string) => (
    <CommandItem key={value} value={value} asChild onSelect={() => {
      // Pointer activation keeps the anchor's native new-tab/modifier behavior.
      // cmdk's keyboard selection dispatches a separate event, so navigate then.
      if (keyboardSelection.current) window.location.assign(href);
    }}>
      <a href={href} className="flex flex-col items-start gap-1">
        <span>{title}</span>{detail ? <span>{detail}</span> : null}
      </a>
    </CommandItem>
  );
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-dvh overflow-y-auto" onCloseAutoFocus={event => { event.preventDefault(); trigger?.focus(); }}>
        <DialogHeader>
          <DialogTitle>Search the corpus</DialogTitle>
          <DialogDescription>Search every record. Library filters do not apply here.</DialogDescription>
        </DialogHeader>
        <Command shouldFilter={false} label="Whole-corpus search" onKeyDownCapture={event => {
          keyboardSelection.current = event.key === "Enter" && !event.nativeEvent.isComposing;
          queueMicrotask(() => { keyboardSelection.current = false; });
        }}>
          <CommandInput aria-label="Search every corpus record" placeholder="Search accounting research…" value={query} onValueChange={setQuery} maxLength={suggestionQueryLimit} />
          <CommandList>
            {!q ? <CommandGroup heading="Go to">{destinations.map(([href, title]) => item(href, title, href))}</CommandGroup> : null}
            {q && result?.query === q ? <CommandGroup heading="Records">{result.items.map(record => item(record.href, record.title, record.id, `${record.kind}${record.has_brief ? " · Research brief" : ""}. ${record.summary}`))}</CommandGroup> : null}
          </CommandList>
        </Command>
        <p role="status" aria-live="polite">{status}</p>
        {mismatch ? <a href={window.location.href}>Reload this page</a> : <a href={q ? `/library?${new URLSearchParams({ q })}` : "/library"}>{q ? "Search all results" : "Open the research library"}</a>}
      </DialogContent>
    </Dialog>
  );
}

let root: Root | undefined;
let opening = 0;
export function openSearch(edition: string, trigger: HTMLElement | null) {
  if (!root) {
    const container = document.createElement("div");
    container.id = "search-palette";
    document.body.appendChild(container);
    root = createRoot(container, { identifierPrefix: "search-" });
  }
  root.render(<SearchPalette key={++opening} edition={edition} trigger={trigger} />);
}
