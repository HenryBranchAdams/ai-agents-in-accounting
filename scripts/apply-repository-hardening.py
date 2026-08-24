from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def path(name: str) -> Path:
    return ROOT / name


def read(name: str) -> str:
    return path(name).read_text(encoding="utf-8")


def write(name: str, content: str) -> None:
    target = path(name)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.rstrip() + "\n", encoding="utf-8")


def replace(name: str, old: str, new: str, count: int = 1) -> None:
    text = read(name)
    if old not in text:
        raise RuntimeError(f"expected text not found in {name}: {old[:100]!r}")
    text = text.replace(old, new, count)
    write(name, text)


def remove(name: str) -> None:
    target = path(name)
    if target.is_dir():
        shutil.rmtree(target)
    elif target.exists():
        target.unlink()


# Canonical release/origin metadata.
write("app/release.ts", r'''
const DEFAULT_SITE_ORIGIN = "https://accounting-agents.madebyhenry.chatgpt.site";

function normalizeOrigin(value: string | undefined) {
  if (!value) return DEFAULT_SITE_ORIGIN;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return DEFAULT_SITE_ORIGIN;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_SITE_ORIGIN;
  }
}

export const siteOrigin = normalizeOrigin(
  process.env.PUBLIC_SITE_ORIGIN ?? process.env.NEXT_PUBLIC_SITE_ORIGIN,
);

export const publicRelease = {
  id: "2026-08-24.1",
  packageVersion: "0.2.0",
  apiVersion: "1.0",
  specificationVersion: "1.1.0",
  benchmarkVersion: "1.0.0",
  publishedAt: "2026-08-24T00:00:00.000Z",
  modifiedAt: "2026-08-24T00:00:00.000Z",
  catalog: {
    version: "2026-08-23.7",
    reviewedAt: "2026-08-23",
    modifiedAt: "2026-08-23T00:00:00.000Z",
  },
  domain: {
    version: "2026-08-23.5",
    reviewedAt: "2026-08-23",
    modifiedAt: "2026-08-23T00:00:00.000Z",
    schemaVersion: "1.0",
  },
} as const;

export function newestModifiedAt(...values: Array<string | Date | null | undefined>) {
  const dates = values
    .filter((value): value is string | Date => Boolean(value))
    .map((value) => value instanceof Date ? value : new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()));
  return dates.length
    ? new Date(Math.max(...dates.map((value) => value.getTime()))).toISOString()
    : publicRelease.modifiedAt;
}
''')

# Re-export the canonical release metadata from existing public interfaces.
text = read("app/agent-interface.ts")
text = text.replace(
    'import {\n  evidenceChain,',
    'import { publicRelease, siteOrigin } from "./release";\nimport {\n  evidenceChain,',
    1,
)
old_constants = '''export const siteOrigin = "https://accounting-agents.madebyhenry.chatgpt.site";
export const catalogReviewedAt = "2026-08-23";
export const catalogModifiedAt = "2026-08-23T00:00:00.000Z";
export const catalogVersion = "2026-08-23.7";
export const apiVersion = "1.0";'''
new_constants = '''export { siteOrigin };
export const catalogReviewedAt = publicRelease.catalog.reviewedAt;
export const catalogModifiedAt = publicRelease.catalog.modifiedAt;
export const catalogVersion = publicRelease.catalog.version;
export const apiVersion = publicRelease.apiVersion;'''
if old_constants not in text:
    raise RuntimeError("agent-interface release constants changed")
text = text.replace(old_constants, new_constants, 1)
text = text.replace(
    '''    headers?: Record<string, string>;
    conditional?: boolean;''',
    '''    headers?: Record<string, string>;
    conditional?: boolean;
    modifiedAt?: string | Date;''',
    1,
)
text = text.replace(
    '  const lastModified = new Date(catalogModifiedAt);',
    '  const lastModified = new Date(options.modifiedAt ?? publicRelease.modifiedAt);',
    1,
)
write("app/agent-interface.ts", text)

text = read("app/domain-model.ts")
old = '''export const corpusReviewedAt = "2026-08-23";
export const corpusModifiedAt = "2026-08-23T00:00:00.000Z";
export const corpusVersion = "2026-08-23.5";
export const domainSchemaVersion = "1.0";'''
new = '''import { publicRelease } from "./release";

export const corpusReviewedAt = publicRelease.domain.reviewedAt;
export const corpusModifiedAt = publicRelease.domain.modifiedAt;
export const corpusVersion = publicRelease.domain.version;
export const domainSchemaVersion = publicRelease.domain.schemaVersion;'''
if old not in text:
    raise RuntimeError("domain release constants changed")
write("app/domain-model.ts", text.replace(old, new, 1))

# Configurable canonical origin and no permanent preview marker.
text = read("app/layout.tsx")
text = text.replace('import "./globals.css";', 'import "./globals.css";\nimport { siteOrigin } from "./release";', 1)
text = text.replace('metadataBase: new URL("https://accounting-agents.madebyhenry.chatgpt.site"),', 'metadataBase: new URL(siteOrigin),', 1)
text = text.replace('        <meta content="development" name="codex-preview" />\n', '')
write("app/layout.tsx", text)

write("app/docsMetadata.ts", r'''
import type { Metadata } from "next";

const socialImage = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Accounting Agents field guide",
};

export function docsMetadata(title: string, description: string, canonical: string): Metadata {
  const fullTitle = `${title} | Accounting Agents`;
  return {
    title: fullTitle,
    description,
    alternates: { canonical },
    openGraph: {
      title: fullTitle,
      description,
      type: "article",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [socialImage.url],
    },
  };
}
''')

# Search: retain the tiny curated navigation list in the browser and query the
# existing server index only after the dialog is used.
write("app/DocsSearch.tsx", r'''
"use client";

import Link from "next/link";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { searchItems } from "./content";

type SearchEntry = (typeof searchItems)[number];
type SearchDocument = {
  id: string;
  record_type: string;
  title: string;
  summary: string;
  canonical_path: string;
  kind: string | null;
};
type SearchResponse = {
  total_matching_records: number;
  items: SearchDocument[];
};

type SearchState = {
  items: SearchEntry[];
  total: number;
  status: "idle" | "loading" | "ready" | "error";
};

const resultCache = new Map<string, SearchState>();
const recordLabels: Record<string, string> = {
  authority: "Authority levels",
  benchmark: "Accounting Agent Bench",
  change: "Changes",
  control: "Control patterns",
  ecosystem: "Open ecosystem",
  glossary: "Glossary",
  pack: "Workflow packs",
  page: "Guide",
  resource: "Source library",
  "sensitive-action": "Sensitive actions",
  template: "Templates",
  workflow: "Workflows",
};

function mapDocument(item: SearchDocument): SearchEntry {
  return {
    href: item.canonical_path,
    title: item.title,
    category: recordLabels[item.record_type] ?? item.kind ?? item.record_type,
    detail: item.summary,
  };
}

function localPages(term: string) {
  const lowered = term.toLowerCase();
  return searchItems.filter((item) =>
    `${item.title} ${item.category} ${item.detail}`.toLowerCase().includes(lowered),
  );
}

export function DocsSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<SearchState>({ items: [], total: 0, status: "idle" });
  const deferredQuery = useDeferredValue(query.trim());
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

  useEffect(() => {
    const term = deferredQuery.toLowerCase();
    if (!open || term.length < 2) {
      setRemote({ items: [], total: 0, status: "idle" });
      return;
    }
    const cached = resultCache.get(term);
    if (cached) {
      setRemote(cached);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setRemote((current) => ({ ...current, status: "loading" }));
      try {
        const response = await fetch(`/api/v1/search?q=${encodeURIComponent(term)}&limit=100`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Search returned ${response.status}`);
        const payload = await response.json() as SearchResponse;
        const next: SearchState = {
          items: payload.items.map(mapDocument),
          total: payload.total_matching_records,
          status: "ready",
        };
        resultCache.set(term, next);
        setRemote(next);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Documentation search failed", error);
        setRemote({ items: [], total: 0, status: "error" });
      }
    }, 150);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [deferredQuery, open]);

  const searchResult = useMemo<SearchState>(() => {
    const term = deferredQuery.trim();
    if (!term) return { items: searchItems, total: searchItems.length, status: "idle" };
    if (term.length < 2) {
      const items = localPages(term);
      return { items, total: items.length, status: "ready" };
    }
    return remote;
  }, [deferredQuery, remote]);

  const groups = useMemo(() => {
    const grouped = new Map<string, SearchEntry[]>();
    for (const result of searchResult.items) {
      const current = grouped.get(result.category) ?? [];
      current.push(result);
      grouped.set(result.category, current);
    }
    return [...grouped.entries()];
  }, [searchResult.items]);

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

      {open ? (
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
            <button type="button" onClick={closeSearch} aria-label="Close search">Esc</button>
          </div>
          <p aria-live="polite" className="sr-only">
            {searchResult.status === "loading"
              ? "Searching documentation"
              : `${searchResult.total} search results${searchResult.total > searchResult.items.length ? `; showing the first ${searchResult.items.length}` : ""}`}
          </p>
          <div className="search-results">
            {searchResult.status === "loading" ? (
              <p className="search-empty">Searching…</p>
            ) : searchResult.status === "error" ? (
              <p className="search-empty">Search is temporarily unavailable. Try again.</p>
            ) : searchResult.items.length ? (
              groups.map(([category, items], index) => (
                <section aria-labelledby={`search-group-${index}`} className="search-result-group" key={category}>
                  <h3 id={`search-group-${index}`}>{category}</h3>
                  {items.map((item) => (
                    <Link href={item.href} key={`${item.category}:${item.href}`} onClick={closeSearch}>
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </Link>
                  ))}
                </section>
              ))
            ) : (
              <p className="search-empty">No pages match “{query}”.</p>
            )}
          </div>
        </dialog>
      ) : null}
    </>
  );
}
''')

# API metadata and cache validators.
text = read("app/api/v1/search/route.ts")
text = text.replace(
    'import { corsOptionsResponse, problemResponse, publicResponse, siteOrigin } from "../../../agent-interface";',
    'import { corsOptionsResponse, problemResponse, publicResponse, siteOrigin } from "../../../agent-interface";\nimport { publicRelease } from "../../../release";',
    1,
)
text = text.replace(
    '  }, null, 2), "application/json; charset=utf-8");',
    '  }, null, 2), "application/json; charset=utf-8", { modifiedAt: publicRelease.modifiedAt });',
    1,
)
write("app/api/v1/search/route.ts", text)

text = read("app/platform-api.ts")
text = text.replace(
    '      headers: next ? { "X-Next-Page": next.toString(), "Content-Language": "en" } : { "Content-Language": "en" },',
    '      modifiedAt: platformRelease.published_at,\n      headers: next ? { "X-Next-Page": next.toString(), "Content-Language": "en" } : { "Content-Language": "en" },',
    1,
)
text = text.replace(
    '    headers: next ? { "X-Next-Page": next.toString() } : undefined,\n  });',
    '    headers: next ? { "X-Next-Page": next.toString() } : undefined,\n    modifiedAt: platformRelease.published_at,\n  });',
    1,
)
text = text.replace(
    '      headers: { "Content-Language": "en" },\n    });',
    '      headers: { "Content-Language": "en" },\n      modifiedAt: platformRelease.published_at,\n    });',
    1,
)
text = text.replace(
    '  }, null, 2), "application/json; charset=utf-8");\n}',
    '  }, null, 2), "application/json; charset=utf-8", { modifiedAt: platformRelease.published_at });\n}',
    1,
)
write("app/platform-api.ts", text)

text = read("app/domain-api.ts")
text = text.replace(
    'import { corpusReviewedAt, corpusVersion } from "./domain-model";',
    'import { corpusModifiedAt, corpusReviewedAt, corpusVersion } from "./domain-model";',
    1,
)
text = text.replace(
    '      headers: {\n        "Content-Language": "en",',
    '      modifiedAt: corpusModifiedAt,\n      headers: {\n        "Content-Language": "en",',
    1,
)
text = text.replace(
    '    headers: nextUrl ? { "X-Next-Page": nextUrl.toString() } : undefined,\n  });',
    '    headers: nextUrl ? { "X-Next-Page": nextUrl.toString() } : undefined,\n    modifiedAt: corpusModifiedAt,\n  });',
    1,
)
text = text.replace(
    '      headers: { "Content-Language": "en" },\n    });',
    '      headers: { "Content-Language": "en" },\n      modifiedAt: corpusModifiedAt,\n    });',
    1,
)
text = text.replace(
    '    "application/json; charset=utf-8",\n  );',
    '    "application/json; charset=utf-8",\n    { modifiedAt: corpusModifiedAt },\n  );',
    1,
)
write("app/domain-api.ts", text)

text = read("app/api/v1/meta/route.ts")
needle = 'export async function GET(request: Request) {\n  const body = JSON.stringify({'
replacement = '''export async function GET(request: Request) {
  const recordCounts = {
    process_families: processFamilies.length,
    workflows: workflowRecords.length,
    authority_levels: authorityLevels.length,
    sensitive_actions: sensitiveActions.length,
    control_patterns: controlPatterns.length,
    templates: templates.length,
    glossary_terms: glossary.length,
    source_records: agentResources.length,
    workflow_packs: packs.length,
    benchmark_cases: benchmarkCases.length,
    ecosystem_layers: ecosystemLayers.length,
  };
  const totalRecords = Object.values(recordCounts).reduce((total, count) => total + count, 0);
  const body = JSON.stringify({'''
if needle not in text:
    raise RuntimeError("meta route GET signature changed")
text = text.replace(needle, replacement, 1)
text = re.sub(
    r'    total_records: agentResources\.length,\n    record_counts: \{.*?\n    \},\n    access:',
    '    total_records: totalRecords,\n    total_source_records: agentResources.length,\n    record_counts: recordCounts,\n    access:',
    text,
    count=1,
    flags=re.S,
)
text = text.replace(
    '  return publicResponse(request, body, "application/json; charset=utf-8");',
    '  return publicResponse(request, body, "application/json; charset=utf-8", { modifiedAt: platformRelease.published_at });',
    1,
)
write("app/api/v1/meta/route.ts", text)

# Dynamic visible counts and consistent internal navigation.
text = read("app/page.tsx")
text = text.replace('import { resources } from "./resources-data";', 'import { readingRoomResources } from "./reading-room-data";\nimport { resources } from "./resources-data";', 1)
text = text.replace(
    '''          This open guide describes the work in accounting terms. Sixty workflow
          records across eight process families name the objective, evidence,''',
    '''          This open guide describes the work in accounting terms. {workflowRecords.length} workflow
          records across eight process families name the objective, evidence,''',
    1,
)
text = text.replace(
    '''          Six portable packs turn representative workflows into synthetic,
          runnable specimens. Accounting Agent Bench tests thirty normal, edge,''',
    '''          {packs.length} portable packs turn representative workflows into synthetic,
          runnable specimens. Accounting Agent Bench tests {benchmarkCases.length} normal, edge,''',
    1,
)
text = text.replace('Expanded reading room · 153 readings', 'Expanded reading room · {readingRoomResources.length} readings', 1)
text = text.replace('<a href="/fundamentals">', '<Link href="/fundamentals">', 1).replace('</a>\n          <Link href="/packs">', '</Link>\n          <Link href="/packs">', 1)
text = text.replace('<a href="/machine-access">', '<Link href="/machine-access">', 1).replace('</a>\n        </div>\n        <p>', '</Link>\n        </div>\n        <p>', 1)
text = text.replace('Use <a href="/authority">Authority levels</a> to classify each action\n          and <a href="/sensitive-actions">Sensitive actions</a>', 'Use <Link href="/authority">Authority levels</Link> to classify each action\n          and <Link href="/sensitive-actions">Sensitive actions</Link>', 1)
write("app/page.tsx", text)

text = read("app/DocsShell.tsx")
text = text.replace('<a\n              aria-current={item.href === active ? "page" : undefined}\n              href={item.href}', '<Link\n              aria-current={item.href === active ? "page" : undefined}\n              href={item.href}', 1)
text = text.replace('              {item.label}\n            </a>', '              {item.label}\n            </Link>', 1)
text = text.replace('<a href="/machine-access">Agent access</a>', '<Link href="/machine-access">Agent access</Link>', 1)
text = text.replace('<a href={previous.href} rel="prev">', '<Link href={previous.href} rel="prev">', 1)
text = text.replace('</a>\n                ) : <span />}\n                {next ?', '</Link>\n                ) : <span />}\n                {next ?', 1)
text = text.replace('<a href={next.href} rel="next">', '<Link href={next.href} rel="next">', 1)
text = text.replace('</a>\n                ) : <span />}\n              </nav>', '</Link>\n                ) : <span />}\n              </nav>', 1)
write("app/DocsShell.tsx", text)

# Release metadata.
text = read("data/open-source-platform.mjs")
text = re.sub(
    r'export const platformRelease = \{.*?\n\};',
    '''export const platformRelease = {
  id: "2026-08-24.1",
  published_at: "2026-08-24T00:00:00.000Z",
  reviewed_at: "2026-08-24",
  status: "current",
  title: "Repository hardening and runtime quality",
  summary: "Adds portable contributor commands, enforced CI, lazy server-backed search, correct cache validators, real-browser quality coverage, source-freshness operations, and repository governance scaffolding.",
  specification_version: "1.1.0",
  licenses: {
    software: "MIT",
    editorial_content: "CC-BY-4.0",
    factual_metadata_and_synthetic_fixtures: "CC0-1.0",
    third_party_materials: "Excluded; publisher terms apply",
  },
};''',
    text,
    count=1,
    flags=re.S,
)
write("data/open-source-platform.mjs", text)

write("CITATION.cff", '''
cff-version: 1.2.0
message: "If you use Accounting Agents, cite the versioned release and the specific records, packs, or benchmark contracts you relied on."
title: "Accounting Agents"
type: software
version: "2026-08-24.1"
date-released: "2026-08-24"
license:
  - MIT
  - CC-BY-4.0
  - CC0-1.0
repository-code: "https://github.com/HenryBranchAdams/ai-agents-in-accounting"
url: "https://accounting-agents.madebyhenry.chatgpt.site"
abstract: "An open field guide, workflow library, measurement program, conformance suite, and machine-readable corpus for governed AI-agent work in accounting and finance."
''')

# Package and contributor workflow: ordinary npm commands first; hosting
# hardening remains explicitly available.
pkg = json.loads(read("package.json"))
pkg["version"] = "0.2.0"
scripts = pkg["scripts"]
scripts.pop("db:generate", None)
scripts.update({
    "install:ci": "npm run install:sites",
    "install:sites": "bash scripts/install-ci.sh",
    "build": "vinext build",
    "build:sites": "bash scripts/build-verified.sh",
    "test": "npm run build && npm run test:unit",
    "test:unit": "node --test tests/*.test.mjs",
    "test:browser": "playwright test",
    "test:browser:update": "playwright test --update-snapshots",
    "check:sources": "node scripts/check-source-freshness.mjs",
    "lint": "eslint . --ignore-pattern dist --ignore-pattern .next --ignore-pattern playwright-report --ignore-pattern test-results",
    "lint:sites": "bash scripts/sites-env.sh -- eslint . --ignore-pattern dist --ignore-pattern .next",
    "verify": "npm run generate:platform && npm run validate:platform && npm run validate:ledgerbench && npm run lint && npm test",
})
pkg.get("dependencies", {}).pop("drizzle-orm", None)
pkg.get("devDependencies", {}).pop("drizzle-kit", None)
write("package.json", json.dumps(pkg, indent=2))

# Remove unused starter state/auth examples. Hosting-specific files that remain
# are documented and used by the deployment adapter.
for item in [
    "app/chatgpt-auth.ts",
    "db",
    "drizzle.config.ts",
    "drizzle",
    "examples/d1",
]:
    remove(item)

text = read("worker/index.ts")
text = text.replace('/** Cloudflare Worker entry point for the vinext-starter template. */', '/** Cloudflare Worker entry point for the public, read-only Accounting Agents site. */', 1)
text = text.replace('  DB: D1Database;\n', '')
write("worker/index.ts", text)

# Browser quality.
write("playwright.config.ts", r'''
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "line",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
''')

write("tests/browser/site.spec.ts", r'''
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

test("search is keyboard-accessible and uses the public index", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Accounting Agents/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+K" : "Control+K");
  const search = page.getByRole("searchbox", { name: "Search documentation" });
  await expect(search).toBeFocused();
  await search.fill("bank reconciliation");
  await expect(page.getByRole("link", { name: /Bank reconciliations/i }).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
  await expect(page).toHaveScreenshot("search-dialog.png", { animations: "disabled" });
});

test("mobile navigation remains usable without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ledgerbench");
  await page.locator("details.mobile-navigation > summary").click();
  await expect(page.getByRole("navigation", { name: "Mobile documentation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "LedgerBench" }).last()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot("mobile-navigation.png", { animations: "disabled" });
});

test("representative documentation routes render without framework errors", async ({ page }) => {
  for (const route of ["/", "/workflows", "/resources", "/machine-access", "/bench", "/ledgerbench"]) {
    await page.goto(route);
    await expect(page.locator("main#main-content")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/Application error|Internal Server Error|Unhandled Runtime Error/);
  }
});
''')

text = read(".gitignore")
if "/playwright-report/" not in text:
    text += "\n# browser testing\n/playwright-report/\n/test-results/\n"
write(".gitignore", text)

# Source freshness checker with persistent consecutive-failure state.
write("scripts/check-source-freshness.mjs", r'''
#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function classifyStatus(status) {
  if (status >= 200 && status < 400) return "ok";
  if ([401, 403, 405, 429].includes(status)) return "restricted";
  if (status === 404 || status === 410 || status >= 500) return "hard_failure";
  return "soft_failure";
}

export function updateState(previous, results, threshold) {
  const records = { ...(previous.records ?? {}) };
  for (const result of results) {
    const prior = records[result.id] ?? { consecutive_hard_failures: 0 };
    records[result.id] = {
      consecutive_hard_failures: result.classification === "hard_failure"
        ? prior.consecutive_hard_failures + 1
        : 0,
      last_status: result.status,
      last_classification: result.classification,
      last_checked_at: result.checked_at,
      last_success_at: result.classification === "ok" ? result.checked_at : prior.last_success_at ?? null,
      final_url: result.final_url,
    };
  }
  const alerts = results.filter((result) =>
    result.classification === "hard_failure"
    && (records[result.id]?.consecutive_hard_failures ?? 0) >= threshold,
  );
  return { state: { version: 1, records }, alerts };
}

function parseArgs(argv) {
  const args = { input: "public/downloads/resources.json", output: "source-freshness-report.json", state: ".cache/source-freshness-state.json", threshold: 3, concurrency: 8 };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === "--input") args.input = argv[++index];
    else if (flag === "--output") args.output = argv[++index];
    else if (flag === "--state") args.state = argv[++index];
    else if (flag === "--threshold") args.threshold = Number(argv[++index]);
    else if (flag === "--concurrency") args.concurrency = Number(argv[++index]);
  }
  return args;
}

function recordsFrom(payload) {
  if (Array.isArray(payload)) return payload;
  for (const key of ["items", "resources", "records"]) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  throw new Error("Could not find the source-record array in resources.json");
}

async function checkRecord(record) {
  const sourceUrl = record.canonical_source_url ?? record.source_url ?? record.href ?? record.url;
  const checkedAt = new Date().toISOString();
  if (!sourceUrl || !/^https:\/\//i.test(sourceUrl)) {
    return { id: record.id, source_url: sourceUrl ?? null, status: null, final_url: null, classification: "hard_failure", error: "missing HTTPS source URL", checked_at: checkedAt };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    let response = await fetch(sourceUrl, { method: "HEAD", redirect: "follow", signal: controller.signal, headers: { "User-Agent": "Accounting-Agents-Source-Verifier/1.0" } });
    if ([400, 405, 501].includes(response.status)) {
      response = await fetch(sourceUrl, { method: "GET", redirect: "follow", signal: controller.signal, headers: { "User-Agent": "Accounting-Agents-Source-Verifier/1.0", Range: "bytes=0-1023" } });
    }
    return { id: record.id, title: record.title, source_url: sourceUrl, status: response.status, final_url: response.url, content_type: response.headers.get("content-type"), classification: classifyStatus(response.status), error: null, checked_at: checkedAt };
  } catch (error) {
    return { id: record.id, title: record.title, source_url: sourceUrl, status: null, final_url: null, content_type: null, classification: "hard_failure", error: error instanceof Error ? error.message : String(error), checked_at: checkedAt };
  } finally {
    clearTimeout(timeout);
  }
}

async function mapConcurrent(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  }));
  return results;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const payload = JSON.parse(await readFile(resolve(args.input), "utf8"));
  const records = recordsFrom(payload);
  let previous = { version: 1, records: {} };
  try { previous = JSON.parse(await readFile(resolve(args.state), "utf8")); } catch {}
  const results = await mapConcurrent(records, args.concurrency, checkRecord);
  const { state, alerts } = updateState(previous, results, args.threshold);
  const report = {
    schema_version: "1.0",
    checked_at: new Date().toISOString(),
    record_count: records.length,
    summary: Object.fromEntries(["ok", "restricted", "soft_failure", "hard_failure"].map((classification) => [classification, results.filter((result) => result.classification === classification).length])),
    alert_threshold: args.threshold,
    alert_count: alerts.length,
    alerts,
    results,
  };
  await mkdir(dirname(resolve(args.output)), { recursive: true });
  await mkdir(dirname(resolve(args.state)), { recursive: true });
  await writeFile(resolve(args.output), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(resolve(args.state), `${JSON.stringify(state, null, 2)}\n`);
  console.log(JSON.stringify({ record_count: report.record_count, summary: report.summary, alert_count: report.alert_count }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error); process.exitCode = 1; });
}
''')

write("tests/source-freshness.test.mjs", r'''
import assert from "node:assert/strict";
import test from "node:test";
import { classifyStatus, updateState } from "../scripts/check-source-freshness.mjs";

test("source status classification separates access restrictions from broken links", () => {
  assert.equal(classifyStatus(200), "ok");
  assert.equal(classifyStatus(302), "ok");
  assert.equal(classifyStatus(403), "restricted");
  assert.equal(classifyStatus(404), "hard_failure");
  assert.equal(classifyStatus(503), "hard_failure");
});

test("alerts require repeated hard failures and reset after recovery", () => {
  const prior = { version: 1, records: { src_a: { consecutive_hard_failures: 2 } } };
  const failed = updateState(prior, [{ id: "src_a", status: 404, classification: "hard_failure", checked_at: "2026-08-24T00:00:00Z", final_url: "https://example.com/a" }], 3);
  assert.equal(failed.alerts.length, 1);
  assert.equal(failed.state.records.src_a.consecutive_hard_failures, 3);
  const recovered = updateState(failed.state, [{ id: "src_a", status: 200, classification: "ok", checked_at: "2026-08-25T00:00:00Z", final_url: "https://example.com/a" }], 3);
  assert.equal(recovered.alerts.length, 0);
  assert.equal(recovered.state.records.src_a.consecutive_hard_failures, 0);
});
''')

# Deterministic source archive, independent of filesystem mtimes.
write("scripts/build-source-archive.sh", r'''#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "${script_dir}/.." && pwd)"
downloads="${project_root}/public/downloads"
source_archive="${downloads}/accounting-agents-source.zip"

mkdir -p "${downloads}"
rm -f "${source_archive}"

python3 - "${project_root}" "${source_archive}" <<'PYZIP'
from pathlib import Path
import sys
import zipfile

root = Path(sys.argv[1])
out = Path(sys.argv[2])
roots = [
    ".github", ".openai", "app", "benchmark", "bin", "build", "clients", "data", "docs",
    "packs", "public/images", "scripts", "tests", "worker",
]
files = []
for name in roots:
    candidate = root / name
    if candidate.is_dir():
        files.extend(path for path in candidate.rglob("*") if path.is_file())
    elif candidate.is_file():
        files.append(candidate)
for name in [
    ".gitignore", ".npmrc", "AGENTS.md", "ATTRIBUTION.md", "BENCHMARK_SUBMISSIONS.md",
    "CITATION.cff", "CODE_OF_CONDUCT.md", "CONTRIBUTING.md", "CORRECTIONS.md",
    "EDITORIAL_POLICY.md", "GOVERNANCE.md", "LICENSE", "LICENSE-CONTENT.md",
    "LICENSE-DATA.md", "LICENSE_POLICY.md", "NOTICE.md", "README.md", "RELEASES.md",
    "SECURITY.md", "SOURCE_ARCHIVE_NOTICE.md", "TESTING.md", "eslint.config.mjs",
    "next.config.ts", "package-lock.json", "package.json", "playwright.config.ts",
    "postcss.config.mjs", "tsconfig.json", "vite.config.ts",
]:
    candidate = root / name
    if candidate.is_file(): files.append(candidate)
with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for file in sorted(set(files), key=lambda item: item.relative_to(root).as_posix()):
        relative = file.relative_to(root).as_posix()
        info = zipfile.ZipInfo(relative, date_time=(2026, 8, 24, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = (0o755 if file.stat().st_mode & 0o111 else 0o644) << 16
        archive.writestr(info, file.read_bytes())
PYZIP

cd "${downloads}"
sha256sum accounting-agent-packs.zip accounting-agent-packs.json accounting-agent-bench.json accounting-agents-source.zip > SHA256SUMS

node --input-type=module -e '
  import { createHash } from "node:crypto";
  import { readFile, stat, writeFile } from "node:fs/promises";
  const names = ["accounting-agent-packs.zip", "accounting-agent-packs.json", "accounting-agent-bench.json", "accounting-agents-source.zip"];
  const assets = {};
  for (const name of names) {
    const bytes = await readFile(name);
    assets[name] = { sha256: `sha256:${createHash("sha256").update(bytes).digest("hex")}`, bytes: (await stat(name)).size };
  }
  await writeFile("archive-digests.json", `${JSON.stringify({ generated_at: "2026-08-24T00:00:00.000Z", assets }, null, 2)}\n`);
'

printf 'Built deterministic source archive and SHA-256 manifest.\n'
''')
path("scripts/build-source-archive.sh").chmod(0o755)

# GitHub governance and automation.
write(".github/CODEOWNERS", '''
* @HenryBranchAdams
/app/workflows-data.ts @HenryBranchAdams
/app/domain-model.ts @HenryBranchAdams
/app/governance-data.ts @HenryBranchAdams
/app/resources*.ts @HenryBranchAdams
/data/ @HenryBranchAdams
/docs/ledgerbench/ @HenryBranchAdams
/packs/ @HenryBranchAdams
/scripts/ @HenryBranchAdams
/.github/workflows/ @HenryBranchAdams
''')

write(".github/dependabot.yml", '''
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
    groups:
      development-tooling:
        dependency-type: development
      production-runtime:
        dependency-type: production
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: monthly
''')

write(".github/pull_request_template.md", '''
## Purpose

Describe the user problem and the records, routes, or contracts changed.

## Change type

- [ ] Software or interface
- [ ] Editorial or source record
- [ ] Accounting workflow or control
- [ ] Generated artifact
- [ ] Repository operations

## Evidence and rights

- [ ] Source applicability, jurisdiction, effective date, and rights were checked where relevant.
- [ ] No confidential production data is included.
- [ ] Stable IDs and public links remain compatible or the break is documented.

## Verification

- [ ] `npm ci`
- [ ] `npm run generate:platform`
- [ ] `npm run validate:platform`
- [ ] `npm run validate:ledgerbench`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run test:browser` for rendered changes

## Reviewer notes

Call out accounting judgments, authority-boundary changes, migration impact, known limitations, and follow-up repository settings.
''')

write(".github/ISSUE_TEMPLATE/bug-report.yml", '''
name: Bug report
description: Report a reproducible software, API, build, or rendered-site defect.
title: "[Bug]: "
body:
  - type: textarea
    id: problem
    attributes:
      label: What happened?
      description: Include the route, command, or public record and the user-visible effect.
    validations:
      required: true
  - type: textarea
    id: reproduce
    attributes:
      label: Reproduction
      description: Give the smallest reproducible sequence and expected result.
    validations:
      required: true
  - type: input
    id: release
    attributes:
      label: Release or commit
      placeholder: 2026-08-24.1 or commit SHA
  - type: textarea
    id: evidence
    attributes:
      label: Evidence
      description: Logs, screenshots, response headers, or failing test output. Remove secrets and production data.
''')

write(".github/ISSUE_TEMPLATE/source-correction.yml", '''
name: Source correction or freshness issue
description: Correct source metadata, applicability, access, supersession, or a broken link.
title: "[Source]: "
body:
  - type: input
    id: record
    attributes:
      label: Source record ID
      placeholder: src_...
    validations:
      required: true
  - type: textarea
    id: correction
    attributes:
      label: Proposed correction
      description: State what is wrong and the replacement fact or link.
    validations:
      required: true
  - type: textarea
    id: support
    attributes:
      label: Supporting evidence
      description: Prefer the publisher, standard setter, regulator, or other primary source.
    validations:
      required: true
  - type: checkboxes
    id: rights
    attributes:
      label: Rights and confidentiality
      options:
        - label: I am not submitting copyrighted full text or confidential production data.
          required: true
''')

write(".github/ISSUE_TEMPLATE/config.yml", '''
blank_issues_enabled: true
contact_links:
  - name: Security report
    url: https://github.com/HenryBranchAdams/ai-agents-in-accounting/security/policy
    about: Report vulnerabilities through the private security process.
''')

write(".github/REPOSITORY_SETTINGS.md", '''
# Repository settings after merge

The repository should enforce the controls represented in source control.

## Required settings

- Protect `main`.
- Require the `verify` and `browser` CI jobs.
- Require one approving review and resolved conversations.
- Require branches to be current before merge.
- Block force pushes and deletion of `main`.
- Prefer squash or rebase merges for contributor branches.
- Set the homepage to `https://accounting-agents.madebyhenry.chatgpt.site`.
- Add topics: `accounting`, `ai-agents`, `agentic-ai`, `audit`, `internal-controls`, `benchmark`, `open-source`.
- Enable Discussions for source suggestions and workflow proposals.
- Disable the wiki unless it receives a named maintainer.
- Publish annotated or signed tags for public releases.

These are repository-administration settings and cannot be enforced by a pull request alone. `CODEOWNERS`, CI, issue forms, Dependabot, and the pull-request template are versioned in this repository.
''')

write(".github/workflows/ci.yml", '''
name: ci

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run generate:platform
      - run: npm run validate:platform
      - run: npm run validate:ledgerbench
      - run: npm run lint
      - run: npm test
      - run: npm run archive:source
      - name: Generated artifact drift
        run: git diff --exit-code

  browser:
    needs: verify
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium webkit
      - run: npm run test:browser
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: |
            playwright-report
            test-results
          if-no-files-found: ignore
          retention-days: 14
''')

write(".github/workflows/source-freshness.yml", '''
name: source-freshness

on:
  schedule:
    - cron: "17 11 * * 2"
  workflow_dispatch:

permissions:
  contents: read
  issues: write

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - uses: actions/cache@v4
        with:
          path: .cache/source-freshness-state.json
          key: source-freshness-${{ github.run_id }}
          restore-keys: source-freshness-
      - run: npm run check:sources -- --threshold 3 --output source-freshness-report.json --state .cache/source-freshness-state.json
      - uses: actions/upload-artifact@v4
        with:
          name: source-freshness-report
          path: source-freshness-report.json
          retention-days: 30
      - uses: actions/github-script@v7
        with:
          script: |
            const fs = require("fs");
            const report = JSON.parse(fs.readFileSync("source-freshness-report.json", "utf8"));
            const title = "[Source freshness] Repeated external-source failures";
            const { data } = await github.rest.issues.listForRepo({ owner: context.repo.owner, repo: context.repo.repo, state: "open", per_page: 100 });
            const existing = data.find((issue) => issue.title === title && !issue.pull_request);
            if (!report.alert_count) {
              if (existing) await github.rest.issues.update({ owner: context.repo.owner, repo: context.repo.repo, issue_number: existing.number, state: "closed", state_reason: "completed" });
              return;
            }
            const rows = report.alerts.slice(0, 50).map((item) => `- \`${item.id}\` — ${item.status ?? item.error} — ${item.source_url}`).join("\n");
            const body = `The scheduled verifier observed at least ${report.alert_threshold} consecutive hard failures for ${report.alert_count} source record(s). A transient outage does not open this issue.\n\n${rows}\n\nThe complete report is attached to workflow run ${context.runId}.`;
            if (existing) await github.rest.issues.update({ owner: context.repo.owner, repo: context.repo.repo, issue_number: existing.number, body });
            else await github.rest.issues.create({ owner: context.repo.owner, repo: context.repo.repo, title, body });
''')

# Documentation.
text = read("README.md")
text = re.sub(
    r'## Development\n\n.*?\n## Project structure',
    '''## Development

Requires Node.js 22.13 or newer. The standard contributor path is cross-platform:

```sh
npm ci
npm run generate:platform
npm run validate:platform
npm run validate:ledgerbench
npm run lint
npm test
```

Rendered changes should also run:

```sh
npx playwright install chromium webkit
npm run test:browser
```

The current ChatGPT Sites deployment retains a separate hardened Linux adapter with install locking, integrity preflight, and bounded builds:

```sh
npm run install:sites
npm run build:sites
```

`npm test` builds the production Worker and runs contract, site-wide quality, mobile, source-verifier, and LedgerBench program suites. GitHub Actions enforces generated-artifact parity and real-browser Chromium/WebKit checks. See [`TESTING.md`](TESTING.md).

`data/open-source-platform.mjs` is the canonical source for packs, public conformance cases, and release notes. `data/ledgerbench-program.mjs` is the canonical structured Preview record for the LedgerBench measurement program.

Run the deterministic Core reference harness with `npm run benchmark:sample`. Run the tolerant external-source verifier with `npm run check:sources`; scheduled CI opens an issue only after repeated hard failures.

Build the deterministic public source archive after other generated artifacts are current with `npm run archive:source`.

## Project structure''',
    text,
    count=1,
    flags=re.S,
)
text = text.replace('- `tests/`: rendered Worker, accessibility, API, schema, release, route-crawl, mobile, link, asset, metadata, referential-integrity, and LedgerBench program contracts', '- `tests/`: rendered Worker, API, schema, route-crawl, mobile, browser, accessibility, source-freshness, and LedgerBench contracts')
text = text.replace('The deployed site is public and read-only. It does not use a database, authentication, vector store, runtime scraper, or required agent framework.', 'The deployed site is public and read-only. It does not use a database, authentication, vector store, runtime scraper, or required agent framework. Hosting-specific files are isolated to `.openai/`, `build/`, `worker/`, and the explicit `*:sites` commands.')
write("README.md", text)

text = read("CONTRIBUTING.md")
text = text.replace('## Local checks\n\nRun:', '## Local checks\n\nInstall dependencies with `npm ci`. Run:', 1)
text = text.replace('For the existing Core conformance harness, also run `npm run benchmark:sample`.', 'For rendered changes, also run `npm run test:browser`. For the existing Core conformance harness, run `npm run benchmark:sample`. The Linux-only deployment hardening is available through `npm run install:sites` and `npm run build:sites`; it is not required for ordinary contribution.', 1)
write("CONTRIBUTING.md", text)

write("TESTING.md", '''
# Testing

The test strategy treats the built Worker and rendered browser experience as the public product. Static contracts catch broad corpus and interface drift; Playwright verifies behavior in Chromium and WebKit.

## Coverage matrix

| Surface | Coverage |
| --- | --- |
| Canonical pages | Every sitemap URL returns semantic HTML with one heading, a main landmark, a title, and no framework error output. |
| Navigation | Internal links and fragments resolve; mobile and desktop navigation expose the same destinations. |
| Accessibility | Static semantics plus browser-executed axe checks, keyboard search, focus restoration, labels, landmarks, and reduced layout risk. |
| Mobile and visual | CSS contracts plus phone-sized browser execution, overflow assertions, and committed representative screenshots. |
| Public API | GET, HEAD, OPTIONS, CORS, content negotiation, pagination, filters, per-layer cache validators, and problem-detail errors. |
| Machine access | OpenAPI, API catalog, `llms.txt`, `AGENTS.md`, Markdown, JSON snapshots, feeds, schemas, and release manifests. |
| Corpus integrity | Unique identifiers, valid references, rights metadata, source provenance, and generated-artifact parity. |
| Source operations | A tolerant scheduled verifier records redirects, access restrictions, repeated hard failures, final URLs, and recovery. |
| Accounting safety | Conformance hard gates, empty executed-action sets, approval boundaries, evidence links, and deterministic calculations. |

## Commands

```sh
npm ci
npm run generate:platform
npm run validate:platform
npm run validate:ledgerbench
npm run lint
npm test

# Real-browser interaction, accessibility, overflow, and visual regression
npx playwright install chromium webkit
npm run test:browser

# Other focused suites
npm run test:contracts
npm run test:quality
npm run test:mobile
npm run benchmark:sample
npm run check:sources
```

GitHub Actions runs the portable release gate on pull requests. The `*:sites` commands remain a separate Linux-specific deployment adapter.
''')

text = read("clients/README.md")
if "Support posture" not in text:
    text += '''

## Support posture

These clients are maintained reference examples, not published npm or PyPI SDKs. Their compatibility target is the current public API major version. Contract coverage lives in the repository test suite; consumers should vendor a pinned copy or generate a client from OpenAPI when stronger package-management guarantees are required.
'''
write("clients/README.md", text)

# Remove temporary workflow/bootstrap files before the final commit and source archive.
for item in [
    ".github/workflows/bootstrap-source.yml",
    ".github/workflows/apply-hardening.yml",
    "scripts/apply-repository-hardening.py",
]:
    remove(item)

print("repository hardening changes applied")
