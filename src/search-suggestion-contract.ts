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
