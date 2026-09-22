// Browser-safe contract. Never import the corpus or a search index into a client.
export const suggestionLimit = 12;
export const suggestionQueryLimit = 240;
export const suggestionSummaryLimit = 280;
export interface SearchSuggestion {
  id: string;
  kind: string;
  title: string;
  summary: string;
  has_brief: boolean;
  href: string;
}
export interface SearchSuggestions {
  corpus_version: string;
  query: string;
  total: number;
  items: SearchSuggestion[];
}

export function isSearchSuggestions(value: unknown): value is SearchSuggestions {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<SearchSuggestions>;
  return typeof data.corpus_version === "string" && typeof data.query === "string" &&
    Number.isSafeInteger(data.total) && Number(data.total) >= 0 && Array.isArray(data.items) &&
    data.items.length <= suggestionLimit && data.items.every(item => item &&
      typeof item.id === "string" && typeof item.kind === "string" &&
      typeof item.title === "string" && typeof item.summary === "string" &&
      item.summary.length <= suggestionSummaryLimit && typeof item.has_brief === "boolean" &&
      item.href === `/records/${encodeURIComponent(item.id)}`);
}
