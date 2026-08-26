"use client";

import { useEffect } from "react";

type ToolInput = Record<string, unknown>;

type ToolExecutionOptions = {
  signal: AbortSignal;
};

type WebMcpTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: {
    readOnlyHint: boolean;
    untrustedContentHint: boolean;
  };
  execute: (input: ToolInput, options: ToolExecutionOptions) => Promise<unknown>;
};

type ModelContext = {
  registerTool: (
    tool: WebMcpTool,
    options?: { signal?: AbortSignal; exposedTo?: string[] },
  ) => Promise<void>;
};

type WebMcpDocument = Document & {
  modelContext?: ModelContext;
};

type SearchItem = {
  id: string;
  record_type: string;
  title: string;
  summary: string;
  canonical_path: string;
  api_path: string | null;
  [key: string]: unknown;
};

type SearchResponse = {
  schema_version: string;
  query: string;
  total_matching_records: number;
  returned_records: number;
  ranking: string[];
  filters: Record<string, unknown>;
  next_cursor: string | null;
  items: SearchItem[];
};

const searchRecordTypes = [
  "page",
  "workflow",
  "resource",
  "authority",
  "control",
  "sensitive-action",
  "template",
  "glossary",
  "pack",
  "benchmark",
  "change",
  "ecosystem",
] as const;

const relianceBoundary =
  "Educational retrieval only. Agents may prepare accounting work; accountable people approve conclusions and sensitive external actions.";

function currentPageContext() {
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href
    ?? window.location.href;
  const heading = document.querySelector<HTMLHeadingElement>("main h1")?.textContent?.trim()
    ?? document.querySelector<HTMLHeadingElement>("h1")?.textContent?.trim()
    ?? null;
  const summary = document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content
    ?? document.querySelector<HTMLElement>("main header p")?.textContent?.trim()
    ?? null;
  const mode = document.querySelector<HTMLElement>("[data-primary-mode]");
  const reviewed = document.querySelector<HTMLTimeElement>("main time");
  const selectedText = window.getSelection()?.toString().trim().slice(0, 2_000) || null;

  return {
    source_url: window.location.href,
    canonical_url: canonical,
    title: document.title,
    heading,
    summary,
    content_mode: mode
      ? { id: mode.dataset.primaryMode ?? null, label: mode.textContent?.trim() ?? null }
      : null,
    reviewed_at: reviewed?.dateTime || null,
    selected_text: selectedText,
    reliance_boundary: relianceBoundary,
  };
}

async function searchAccountingAgents(input: ToolInput, signal: AbortSignal) {
  const query = typeof input.query === "string" ? input.query.trim() : "";
  if (!query || query.length > 200) {
    throw new TypeError("query must contain between 1 and 200 characters");
  }

  const limit = input.limit === undefined ? 10 : Number(input.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw new TypeError("limit must be an integer from 1 through 20");
  }

  const requestedTypes = input.types === undefined
    ? []
    : Array.isArray(input.types)
      ? input.types
      : null;
  if (requestedTypes === null || requestedTypes.some((value) => (
    typeof value !== "string" || !searchRecordTypes.includes(value as (typeof searchRecordTypes)[number])
  ))) {
    throw new TypeError("types must contain only published Accounting Agents record types");
  }

  const url = new URL("/api/v1/search", window.location.origin);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  for (const type of new Set(requestedTypes as string[])) url.searchParams.append("type", type);

  const response = await fetch(url, {
    headers: { accept: "application/json" },
    signal,
  });
  const payload = await response.json() as SearchResponse & { detail?: string; title?: string };
  if (!response.ok) {
    throw new Error(payload.detail || payload.title || `Search failed with status ${response.status}`);
  }

  return {
    schema_version: payload.schema_version,
    query: payload.query,
    total_matching_records: payload.total_matching_records,
    returned_records: payload.returned_records,
    ranking: payload.ranking,
    filters: payload.filters,
    next_cursor: payload.next_cursor,
    items: payload.items.map((item) => ({
      ...item,
      canonical_url: new URL(item.canonical_path, window.location.origin).toString(),
      api_url: item.api_path ? new URL(item.api_path, window.location.origin).toString() : null,
    })),
    reliance_boundary: relianceBoundary,
  };
}

const tools: WebMcpTool[] = [
  {
    name: "accounting_agents.get_current_page",
    title: "Read current Accounting Agents page",
    description:
      "Read the title, canonical URL, heading, evidence mode, review date, and any user-selected text from the current Accounting Agents page. This does not modify the page or establish an accounting conclusion.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: async () => currentPageContext(),
  },
  {
    name: "accounting_agents.search",
    title: "Search Accounting Agents",
    description:
      "Search the public Accounting Agents corpus using its deterministic ranking and stable record IDs. Returns read-only educational records, provenance paths, and explicit reliance limits; it does not approve conclusions or perform external actions.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          minLength: 1,
          maxLength: 200,
          description: "Accounting topic, workflow, control, source, pack, or stable record ID.",
        },
        types: {
          type: "array",
          items: { type: "string", enum: searchRecordTypes },
          uniqueItems: true,
          maxItems: searchRecordTypes.length,
          description: "Optional record-type filter. Omit to search every published record type.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 20,
          default: 10,
          description: "Maximum number of ranked records to return.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: async (input, options) => searchAccountingAgents(input, options.signal),
  },
];

export function WebMcpTools() {
  useEffect(() => {
    const modelContext = (document as WebMcpDocument).modelContext;
    if (typeof modelContext?.registerTool !== "function") return;

    const controller = new AbortController();
    for (const tool of tools) {
      void modelContext.registerTool(tool, { signal: controller.signal }).catch((error: unknown) => {
        if (!controller.signal.aborted) console.warn(`Unable to register ${tool.name}`, error);
      });
    }

    return () => controller.abort();
  }, []);

  return null;
}
