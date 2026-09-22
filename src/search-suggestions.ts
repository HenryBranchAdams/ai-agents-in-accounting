import { meta, QueryError, search } from "./corpus";
import { editedBrief } from "./editorial";
import { suggestionLimit, suggestionQueryLimit, suggestionSummaryLimit } from "./search-suggestion-contract";
import type { SearchSuggestions } from "./search-suggestion-contract";

export function searchSuggestions(params: URLSearchParams): SearchSuggestions {
  for (const key of params.keys()) {
    if (key !== "q") throw new QueryError(`Unknown search-suggestions parameter: ${key}.`);
  }
  if (params.getAll("q").length > 1) throw new QueryError("Supply q only once.");
  const query = (params.get("q") || "").trim();
  if (query.length > suggestionQueryLimit) throw new QueryError("Search must be 240 characters or fewer.");
  // An empty palette contains navigation destinations, never a corpus dump.
  if (!query) return { corpus_version: meta.corpus_version, query, total: 0, items: [] };
  const result = search(new URLSearchParams({ q: query, limit: String(suggestionLimit) }));
  return {
    corpus_version: result.corpus_version,
    query: result.query,
    total: result.total,
    items: result.records.map(record => ({
      id: record.id,
      kind: record.kind,
      title: record.title,
      summary: record.summary.length > suggestionSummaryLimit
        ? record.summary.slice(0, suggestionSummaryLimit - 1) + "…" : record.summary,
      has_brief: !!editedBrief(record.data.editorial_brief),
      href: `/records/${encodeURIComponent(record.id)}`,
    })),
  };
}
