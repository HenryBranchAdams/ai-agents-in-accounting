import {
  meta,
  kinds,
  taxonomy,
  records,
  search,
  getRecord,
  coverage,
} from "../corpus";
import { shell } from "../components/shell";
import { label } from "../components/format";
import { RecordRow } from "../components/record-row";
import { Button } from "../components/ui/button";
import { SelectField, InputField } from "../components/corpus-fields";
import { Field, FieldGroup, FieldLabel } from "../components/ui/field";
import { Input } from "../components/ui/input";
import { ResultsPagination } from "../components/results-pagination";
import { NoResults } from "../components/no-results";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { SearchIcon, XIcon } from "lucide-react";
const queryLink = (
  params: URLSearchParams,
  updates: Record<string, string>,
) => {
  const p = new URLSearchParams(params);
  p.delete("page");
  for (const [key, value] of Object.entries(updates)) {
    if (value) p.set(key, value);
    else p.delete(key);
  }
  return `/library${p.size ? "?" + p.toString() : ""}`;
};
export function browse(params: URLSearchParams) {
  const result = search(params);
  const kind = params.get("kind") || "";
  const filterNames = [
    "naics",
    "question_family",
    "kind",
    "topic",
    "source_type",
    "industry",
    "jurisdiction",
    "framework",
    "entity",
    "product",
    "as_of",
    "collection",
  ];
  const filterLabels: Record<string, string> = { kind: "Type", naics: "Exact NAICS", question_family: "Question family", topic: "Topic", source_type: "Source type", industry: "Industry", jurisdiction: "Jurisdiction", framework: "Framework", entity: "Entity", product: "Product", as_of: "Effective on", collection: "Collection" };
  const activeFilters = filterNames.filter((key) => params.get(key));
  const hasFilters =
    !!result.query || activeFilters.length > 0 || result.page > 1;
  const title =
    kind === "context"
      ? "Accounting context"
      : kinds[kind] || "Research library";
  const commonKinds = [
    "",
    "source",
    "context",
    "workflow",
    "guide",
    "collection",
  ];
  const category = (key: string) => (
    <a
      key={key}
      href={queryLink(params, { kind: key })}
      aria-current={kind === key ? "page" : undefined}
      className="flex min-h-11 items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground no-underline hover:bg-muted current:bg-accent current:font-medium current:text-foreground"
    >
      <span>
        {key === "context"
          ? "Accounting context"
          : key
            ? kinds[key]
            : "All records"}
      </span>
      <span className="text-xs tabular-nums">
        {key === "context"
          ? records.filter(
              (r) => r.kind !== "source" && r.kind !== "collection",
            ).length
          : key
            ? meta.counts[key]
            : meta.record_count}
      </span>
    </a>
  );
  const chipValue = (key: string) =>
    key === "kind"
      ? kinds[kind] || "Accounting context"
      : key === "collection"
        ? getRecord(params.get(key)!)?.title || params.get(key)
        : key === "question_family"
          ? coverage.questionById.get(params.get(key)!)?.title || params.get(key)
          : params.get(key);
  const field = (name: string, title: string, values: string[]) => (
    <SelectField
      name={name}
      label={title}
      allLabel={`All ${title.toLowerCase()}`}
      values={[...new Set([...values, ...(params.get(name) ? [params.get(name)!] : [])])].map((v) => [v, label(v)])}
      selected={params.get(name) || ""}
    />
  );
  return shell(
    title,
    meta.mission,
    <>
      <section className="grid items-center gap-6 pt-10 pb-7 md:pt-14 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <h1 className="mb-4 max-w-lg text-4xl leading-tight tracking-tight md:text-5xl">
            {hasFilters
              ? result.query
                ? "Search the library."
                : title
              : "A reference library for accounting agents."}
          </h1>
          <p><a href="/map">Explore the whole library on the map</a></p>
          {!hasFilters && (
            <p className="mb-0 max-w-2xl text-lg text-muted-foreground">
              Find sources, assess the evidence, and connect research to
              accounting practice.
            </p>
          )}
        </div>
        {!hasFilters && (
          <div className="hidden border-l border-border pl-6 text-sm text-muted-foreground lg:block">
            <span className="block font-serif text-4xl text-foreground">
              {meta.record_count.toLocaleString()}
            </span>
            <span>records, open for research</span>
            <a href="/about#coverage" className="mt-3 block text-xs">
              About coverage and review ↗
            </a>
          </div>
        )}
      </section>
      <form action="/library" method="get" role="search">
        {params.has("limit") && <input type="hidden" name="limit" value={params.get("limit")!} />}
        <FieldGroup className="mb-7">
          <Field orientation="horizontal">
            <FieldLabel className="sr-only" htmlFor="q">
              Search the corpus
            </FieldLabel>
            <Input
              id="q"
              name="q"
              type="search"
              maxLength={240}
              defaultValue={params.get("q") || ""}
              placeholder="Search a topic, task, standard, or source…"
            />
            <Button type="submit">
              <SearchIcon data-icon="inline-start" />
              Search
            </Button>
          </Field>
        </FieldGroup>
        {kind && <input type="hidden" name="kind" value={kind} />}
        {params.get("collection") && (
          <input
            type="hidden"
            name="collection"
            value={params.get("collection")!}
          />
        )}
        {!hasFilters && (
          <section
            aria-label="Starting points"
            className="mb-8 grid gap-4 sm:grid-cols-3"
          >
            {[
              [
                "/records/collection-foundations",
                "Foundations",
                "Evidence, controls, and agent design.",
              ],
              [
                "/briefs",
                "Research briefs",
                "Cited answers with qualifications.",
              ],
              [
                "/?kind=workflow",
                "Accounting workflows",
                "Connect the research to accounting tasks.",
              ],
            ].map(([href, title, text]) => (
              <Card key={href}>
                <CardHeader>
                  <CardTitle role="heading" aria-level={2}>
                    <a href={href}>{title}</a>
                  </CardTitle>
                  <CardDescription>{text}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </section>
        )}
        <div className="grid items-start gap-8 lg:grid-cols-4 lg:gap-10">
          <aside className="min-w-0 lg:border-r lg:border-border lg:pr-6">
            <details id="library-filters">
              <summary>Filters and record types{activeFilters.length ? ` (${activeFilters.length} active)` : ""}</summary>
              <p className="text-sm text-muted-foreground">Type counts cover the whole corpus before filters. Exact industry codes and known effective dates keep their recorded scope.</p>
            <details open className="mb-3">
              <summary className="pt-0 text-sm font-semibold">
                Browse by type
              </summary>
              <nav
                aria-label="Record types"
                className="grid grid-cols-2 gap-1 lg:grid-cols-1"
              >
                {commonKinds.map(category)}
              </nav>
            </details>
            <details
              className="border-t border-border"
              open={activeFilters.some(
                (k) => !["kind", "collection"].includes(k),
              )}
            >
              <summary>Filter by topic and scope</summary>
              <FieldGroup className="mb-5">
                {field("topic", "Topics", taxonomy.topics)}
                {field("jurisdiction", "Jurisdictions", [
                  ...new Set([
                    ...taxonomy.normalized_jurisdictions,
                    ...(params.get("jurisdiction")
                      ? [params.get("jurisdiction")!]
                      : []),
                  ]),
                ])}
                {field("source_type", "Source types", taxonomy.source_types)}
                {field("industry", "Industries", taxonomy.industries)}
                {field("framework", "Frameworks", taxonomy.frameworks)}
                {field("entity", "Entities", taxonomy.entities)}
                {field("product", "Products", taxonomy.products)}
                <InputField
                  name="naics"
                  label="Exact NAICS-US 2022 code"
                  inputMode="numeric"
                  defaultValue={params.get("naics") || ""}
                  placeholder="e.g. 236"
                />
                <SelectField
                  name="question_family"
                  label="Question families"
                  allLabel="All question families"
                  values={[...coverage.questionById.values()].map((q) => [
                    q.id,
                    q.title,
                  ])}
                  selected={params.get("question_family") || ""}
                />
                <InputField
                  name="as_of"
                  label="Effective on (known dates only)"
                  type="date"
                  defaultValue={params.get("as_of") || ""}
                />
                <Button
                  variant="secondary"
                  className="w-full mb-4"
                  type="submit"
                >
                  Apply filters
                </Button>
              </FieldGroup>
            </details>
            <details
              className="border-t border-border"
              open={!!kind && !commonKinds.includes(kind)}
            >
              <summary>More record types</summary>
              <nav
                aria-label="More record types"
                className="grid grid-cols-2 gap-1 lg:grid-cols-1"
              >
                {Object.keys(kinds)
                  .filter((k) => !commonKinds.includes(k))
                  .map(category)}
              </nav>
            </details>
            </details>
            <p className="mt-6 hidden text-xs leading-relaxed text-muted-foreground lg:block">
              A source’s inclusion is not an endorsement. Assess its evidence,
              applicability, and rights before reuse.
            </p>
          </aside>
          <section
            className="min-w-0 lg:col-span-3"
            aria-labelledby="results-heading"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-4">
              <h2 id="results-heading" className="mb-0 text-2xl">
                {result.query
                  ? `Results for “${result.query}”`
                  : hasFilters
                    ? title
                    : "All records"}
              </h2>
              <span className="text-sm text-muted-foreground">
                {result.total.toLocaleString()} {result.total === 1 ? "record" : "records"} total · Showing {result.records.length} on this page
              </span>
            </div>
            {activeFilters.length > 0 && (
              <nav
                className="flex flex-wrap items-center gap-2 border-b border-border py-4"
                aria-label="Active filters"
              >
                {activeFilters.map((key) => (
                  <Button key={key} asChild variant="secondary" size="sm">
                    <a
                      href={queryLink(params, { [key]: "" })}
                      aria-label={`Remove ${filterLabels[key]}: ${chipValue(key)}`}
                    >
                      {filterLabels[key]}: {chipValue(key)} <XIcon data-icon="inline-end" />
                    </a>
                  </Button>
                ))}
                <Button asChild variant="ghost" size="sm">
                  <a
                    href={queryLink(
                      params,
                      Object.fromEntries(filterNames.map((k) => [k, ""])),
                    )}
                  >
                    Clear filters
                  </a>
                </Button>
              </nav>
            )}
            {result.records.length ? (
              <div className="flex flex-col gap-4 py-5">
                {result.records.map((r) => (
                  <RecordRow key={r.id} record={r} />
                ))}
              </div>
            ) : (
              <NoResults />
            )}
            <ResultsPagination
              page={result.page}
              pages={result.pages}
              previous={
                result.page > 1
                  ? queryLink(params, { page: String(result.page - 1) })
                  : undefined
              }
              next={
                result.page < result.pages
                  ? queryLink(params, { page: String(result.page + 1) })
                  : undefined
              }
            />
            <div className="border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
              <p>
                Coverage is broad and still uneven. Review depth and source
                currency vary by record.{" "}
                <a href="/about#coverage">See coverage and review status.</a>
              </p>
              <p>
                This page as <a href={`/api/v1/records?${params}`}>JSON</a> ·{" "}
                <a
                  href={`/api/v1/records?${params}${params.size ? "&" : ""}format=markdown`}
                >
                  Markdown
                </a>{" "}
                · <a href="/use">Download the corpus</a>
              </p>
            </div>
          </section>
        </div>
      </form>
    </>,
    "library",
    "/library",
  );
}
