import { CorpusMetric } from "./components/corpus-metric";
import { FieldGroup } from "./components/ui/field";
import { SelectField } from "./components/corpus-fields";
import { ResultsPagination } from "./components/results-pagination";
import { NoResults } from "./components/no-results";
import {
  Table,
  TableCaption,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert";
import { Badge } from "./components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./components/ui/card";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "./components/ui/breadcrumb";
import { Fragment } from "react";
import { Button } from "./components/ui/button";
import { coverage, getRecord } from "./corpus";
import { coverageTopology, coverageHistory, coverageMetrics } from "./coverage";
import { shell } from "./components/shell";
import { displayText as esc } from "./components/format";
import { researchPanel } from "./research-view";
const url = (params: URLSearchParams, changes: Record<string, string>) => {
  const next = new URLSearchParams(params);
  next.delete("page");
  for (const [key, value] of Object.entries(changes))
    value ? next.set(key, value) : next.delete(key);
  return `/coverage${next.size ? `?${next}` : ""}`;
};
const count = (value: number) => value.toLocaleString("en-US");
export function coveragePage(params: URLSearchParams) {
  const data = coverage.select(params),
    s = data.summary,
    f = data.filters;
  const selected = data.selected_industry,
    question = data.selected_question;
  const industryOptions = coverageTopology.industry_backbone.nodes.filter(
    (n) => ["sector", "subsector"].includes(n.level) || n.code === f.industry,
  );
  const region = selected ? selected.title : "All industries";
  const table =
    f.view === "industries" ? (
      <>
        <div className="my-5 min-w-0">
          <Table aria-label="Industry and question material">
            <TableCaption>
              {selected
                ? `Inside ${esc(selected.title)}`
                : "The 20 sectors in NAICS-US 2022"}
              {question ? ` · ${esc(question.title)}` : ""}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">{"Industry"}</TableHead>
                <TableHead scope="col">{"At this scope"}</TableHead>
                <TableHead scope="col">{"In narrower industries"}</TableHead>
                <TableHead scope="col">{"Scoped assessments"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {((items) =>
                items.length ? (
                  items
                ) : (
                  <>
                    <TableRow>
                      <TableCell colSpan={4}>
                        {
                          "No narrower industries match this view. Use the Questions tab to inspect this scope."
                        }
                      </TableCell>
                    </TableRow>
                  </>
                ))(
                data.industry_rows.map((n) => (
                  <>
                    <TableRow>
                      <TableHead scope="row">
                        <a
                          href={esc(
                            url(params, { industry: n.code, show: "all" }),
                          )}
                        >
                          <span className="mr-3 font-mono text-xs text-muted-foreground">
                            {esc(n.code)}
                          </span>
                          {esc(n.title)} <span aria-hidden="true">{"→"}</span>
                        </a>
                      </TableHead>
                      <TableCell>{count(n.direct_records)}</TableCell>
                      <TableCell>{count(n.narrower_records)}</TableCell>
                      <TableCell>
                        {n.scoped_assessments ? (
                          n.scoped_assessments
                        ) : (
                          <>
                            <span className="text-sm text-muted-foreground">
                              {"Unassessed"}
                            </span>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  </>
                )),
              )}
            </TableBody>
          </Table>
        </div>
      </>
    ) : (
      <>
        <div className="my-5 min-w-0">
          <Table aria-label="Industry and question material">
            <TableCaption>
              {esc(region)}
              {" · Accounting question families"}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">{"Question family"}</TableHead>
                <TableHead scope="col">
                  {selected ? "At this scope" : "Associated records"}
                </TableHead>
                {selected ? (
                  <>
                    <TableHead scope="col">{"Broader context"}</TableHead>
                  </>
                ) : (
                  ""
                )}
                <TableHead scope="col">{"Scoped assessments"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {((items) =>
                items.length ? (
                  items
                ) : (
                  <>
                    <TableRow>
                      <TableCell colSpan={selected ? 4 : 3}>
                        {"No question families match this view."}
                      </TableCell>
                    </TableRow>
                  </>
                ))(
                data.question_rows.map((q) => (
                  <>
                    <TableRow>
                      <TableHead scope="row">
                        <a
                          href={esc(
                            url(params, {
                              question: q.id,
                              view: "questions",
                              show: "all",
                            }),
                          )}
                        >
                          {esc(q.title)}
                        </a>
                        <small className="mt-1 block text-muted-foreground">
                          {esc(
                            coverageTopology.question_groups[
                              q.group as keyof typeof coverageTopology.question_groups
                            ],
                          )}
                        </small>
                      </TableHead>
                      <TableCell>{count(q.associated_records)}</TableCell>
                      {selected ? (
                        <>
                          <TableCell>{q.broader_context_records}</TableCell>
                        </>
                      ) : (
                        ""
                      )}
                      <TableCell>
                        {q.scoped_assessments ? (
                          q.scoped_assessments
                        ) : (
                          <>
                            <span className="text-sm text-muted-foreground">
                              {"Unassessed"}
                            </span>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  </>
                )),
              )}
            </TableBody>
          </Table>
        </div>
      </>
    );
  const assessments = data.assessments.map((a) => (
    <>
      <Card className="my-6" id={a.id}>
        <CardHeader>
          <Badge variant="outline">
            {esc(a.status)}
            {" · "}
            {esc(a.reviewed_at)}
          </Badge>
          <CardTitle role="heading" aria-level={3}>
            {esc(coverage.questionById.get(a.question_id)?.title)}
            {" / "}
            {esc(a.scope_kind === "shared-context" ? "Shared context" : coverage.nodeByCode.get(a.industry_code || "")?.title)}
          </CardTitle>
          <CardDescription>{a.scope}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="coverage-dimensions">
            {coverageTopology.depth_dimensions.map((d) => (
              <>
                <div>
                  <dt>{esc(d.title)}</dt>
                  <dd>
                    {esc(a.dimensions[d.id as keyof typeof a.dimensions])}
                  </dd>
                </div>
              </>
            ))}
          </dl>
          <h4>{"Remaining gaps"}</h4>
          <ul>
            {a.gaps.map((g) => (
              <>
                <li>{esc(g)}</li>
              </>
            ))}
          </ul>
          <details>
            <summary>{"Evidence and assessment basis"}</summary>
            <p>{esc(a.review_basis)}</p>
            <ul>
              {a.evidence_record_ids.map((id) => (
                <>
                  <li>
                    <a href={"/records/" + esc(id)}>
                      {esc(getRecord(id)?.title || id)}
                    </a>
                  </li>
                </>
              ))}
            </ul>
            <p>
              {esc(a.reviewer)}
              {". Source currency: "}
              {esc(a.source_currency.replaceAll("-", " "))}
              {"."}
            </p>
          </details>
        </CardContent>
      </Card>
    </>
  ));
  const history = coverageHistory.snapshots;
  const screening = coverageTopology.subsector_screening.find(
    (p) => p.naics_code === f.industry,
  );
  const body = (
    <>
      <article className="reading min-w-0 pt-10 md:pt-14">
        {"\n    "}
        <header className="max-w-3xl">
          <h1>Research coverage</h1>
          <p className="mb-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            {
              "Explore the accounting landscape, find the material we have, and see what still needs assessment."
            }
          </p>
          <p className="text-sm text-muted-foreground">
            {count(s.record_count)}
            {" records · "}
            {s.industry_counts.sector}
            {" sectors · "}
            {s.industry_counts.subsector}
            {" subsectors · "}
            {count(s.industry_counts["us-industry"])}
            {" detailed US industries · "}
            {s.question_families}
            {" question families"}
          </p>
        </header>
        {"\n    "}
        <p className="mt-8 text-xs text-muted-foreground">
          {"Entire corpus snapshot · "}
          {esc(data.corpus_version)}
          {" · Mapping method "}
          {esc(data.mapping_version)}
        </p>
        {"\n    "}
        <div
          className="my-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
          role="group"
          aria-label="Entire corpus snapshot; exploration filters apply below"
        >
          <CorpusMetric
            title="Question families with material"
            value={s.question_families_with_material}
            total={s.question_families}
            note="Content associations; see review scope"
          />
          <CorpusMetric
            title="Sectors with associated material"
            value={s.sectors_with_material}
            total={s.industry_counts.sector}
            note="Includes narrower industries"
          />
          <CorpusMetric
            title="Named research questions"
            value={s.research.named_research_questions}
            href="#research-results"
            note={`${s.research.named_partial_questions} partial · ${s.research.named_evidence_gaps} evidence gaps`}
          />
          <CorpusMetric
            title="Records with no question assignment"
            value={s.question_unassigned_records}
            href="/coverage?mapping=question-unassigned#material"
            note="Reasoned dispositions remain in the review ledgers"
          />
        </div>
        {"\n    "}
        <Alert role="note">
          <AlertTitle>How to read coverage</AlertTitle>
          <AlertDescription>
            {
              "Material counts show where records have been linked. Only a scoped assessment evaluates what that evidence supports. General and broader-industry material does not automatically cover every detailed industry."
            }
          </AlertDescription>
        </Alert>
        {"\n    "}
        <details className="my-6 text-sm">
          <summary>{"Metric definitions and source data"}</summary>
          <p>
            {esc(coverageMetrics.population)} {esc(coverageMetrics.time_basis)}
          </p>
          <dl>
            {coverageMetrics.definitions.map((m) => (
              <>
                <div>
                  <dt>
                    {esc(m.title)}
                    {" · "}
                    {esc(m.unit)}
                  </dt>
                  <dd>
                    {esc(m.numerator)}
                    {m.denominator
                      ? `, out of ${esc(m.denominator.toLowerCase())}.`
                      : "."}{" "}
                    {esc(m.caveat)}
                  </dd>
                </div>
              </>
            ))}
          </dl>
          <p>
            <a href="/downloads/coverage-records.jsonl">
              {"Source mapping rows"}
            </a>
            {" · "}
            <a href="/downloads/coverage-assessments.json">
              {"Assessment evidence"}
            </a>
            {" · "}
            <a href="/downloads/coverage-topology.json">
              {"Industry and question denominators"}
            </a>
          </p>
        </details>
        {"\n    "}
        <section className="min-w-0" aria-labelledby="explore-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="explore-heading">{"Explore the landscape"}</h2>
            <a href="/coverage">{"Reset view"}</a>
          </div>
          {"\n      "}
          <form action="/coverage#explore-heading" method="get">
            <input type="hidden" name="view" value={f.view} />
            <FieldGroup className="my-6 grid items-end sm:grid-cols-2 lg:grid-cols-4">
              <SelectField
                name="industry"
                label="Industry"
                allLabel="All industries"
                selected={f.industry}
                values={industryOptions.map((n) => [
                  n.code,
                  `${n.code} · ${n.title}`,
                ])}
              />
              <SelectField
                name="question"
                label="Accounting question"
                allLabel="All question families"
                selected={f.question}
                values={coverageTopology.question_families.map((q) => [
                  q.id,
                  q.title,
                ])}
              />
              <SelectField
                name="show"
                label="Show rows"
                selected={f.show}
                values={[
                  ["all", "All areas"],
                  ["with-material", "With associated material"],
                  ["without-material", "Without direct or narrower material"],
                  ["unassessed", "With unassessed questions"],
                ]}
              />
              <Button type="submit">Apply filters</Button>
            </FieldGroup>
          </form>
          {"\n      "}
          <nav
            className="my-6 flex flex-wrap gap-2"
            aria-label="Coverage views"
          >
            <Button
              asChild
              variant={f.view === "industries" ? "secondary" : "ghost"}
            >
              <a
                href={url(params, { view: "industries" })}
                aria-current={f.view === "industries" ? "page" : undefined}
              >
                Industries
              </a>
            </Button>
            <Button
              asChild
              variant={f.view === "questions" ? "secondary" : "ghost"}
            >
              <a
                href={url(params, { view: "questions" })}
                aria-current={f.view === "questions" ? "page" : undefined}
              >
                Questions
              </a>
            </Button>
          </nav>
          {"\n      "}
          {selected ? (
            <>
              <Breadcrumb aria-label="Industry hierarchy" className="mb-8">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href={url(params, { industry: "" })}>
                      All industries
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {data.ancestors.map((n) => (
                    <Fragment key={n.code}>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink
                          href={url(params, { industry: n.code })}
                        >
                          {n.title}
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    </Fragment>
                  ))}
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{selected.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="my-6">
                <h3>
                  {esc(selected.code)}
                  {" · "}
                  {esc(selected.title)}
                </h3>
                <p>
                  {selected.direct_records}
                  {" record"}
                  {selected.direct_records === 1 ? "" : "s"}
                  {" associated at this scope · "}
                  {selected.narrower_records}
                  {" in narrower industries · "}
                  {selected.broader_context_records}
                  {" in broader context."}
                </p>
                <p>
                  {selected.scoped_assessments
                    ? `${selected.scoped_assessments} scoped assessment(s); boundaries are shown below.`
                    : "Current applicability and named-question reviews appear below; no scoped assessment at this exact scope."}
                </p>
              </div>
            </>
          ) : (
            ""
          )}
          {"\n      "}
          {question ? (
            <>
              <div className="my-6">
                <h3>{esc(question.title)}</h3>
                <p>{esc(question.screening_question)}</p>
                <a href={esc(url(params, { question: "" }))}>
                  {"Show all question families"}
                </a>
              </div>
            </>
          ) : (
            ""
          )}
          {"\n      "}
          {screening ? (
            <>
              <details className="my-6 rounded-md bg-muted p-5">
                <summary>
                  {"Original research prompt for "}
                  {esc(screening.title)}
                </summary>
                <p>{esc(screening.screening_question)}</p>
                <p>
                  {
                    "The reviewed screening and individual exception results appear below; the original prompt is preserved as history."
                  }
                </p>
              </details>
            </>
          ) : (
            ""
          )}
          {"\n      "}
          {table}
          <p className="text-sm text-muted-foreground">
            {
              "Counts use unique records within each cell. Rows can overlap. “At this scope” means the exact recorded industry code; narrower and broader scopes remain separate."
            }
          </p>
          {"\n    "}
        </section>
        {"\n    "}
        {researchPanel(data.research)}
        {"\n    "}
        <section id="assessments">
          <h2>{"Scoped assessments"}</h2>
          {assessments.length ? (
            assessments
          ) : (
            <>
              <p>
                {
                  "No scoped assessment matches this exact scope. The named-question and applicability reviews appear above."
                }
              </p>
            </>
          )}
        </section>
        {"\n    "}
        <section id="material">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2>
              {selected
                ? "Material at this industry scope"
                : "Associated and unassigned records"}
            </h2>
            <span>
              {count(data.total)}
              {" records"}
            </span>
          </div>
          {"\n      "}
          <form action="/coverage#material" method="get">
            {Object.entries(f)
              .filter(([key, value]) => key !== "mapping" && value)
              .map(([key, value]) => (
                <input key={key} type="hidden" name={key} value={value} />
              ))}
            <FieldGroup className="my-6 grid items-end sm:grid-cols-2">
              <SelectField
                name="mapping"
                label="Mapping status"
                selected={f.mapping}
                values={[
                  ["all", "All records in scope"],
                  ["question-unassigned", "Question not yet assigned"],
                  ["industry-unassigned", "Industry not yet assigned"],
                  ["shared-context", "Shared context"],
                ]}
              />
              <Button type="submit">Filter records</Button>
            </FieldGroup>
          </form>
          {"\n      "}
          {((items) =>
            items.length ? (
              items
            ) : (
              <>
                <NoResults
                  title="No records match these mapping filters."
                  href={url(params, { mapping: "all" }) + "#material"}
                  action="Show all records in scope"
                />
              </>
            ))(
            data.records.map((r) => (
              <>
                <Card className="my-4">
                  <CardHeader>
                    <Badge variant="outline">
                      {esc(r.kind)}
                      {" · "}
                      {r.coverage.question_mappings.length
                        ? "Proposed question mapping"
                        : "Question unassigned"}
                    </Badge>
                    <CardTitle role="heading" aria-level={3}>
                      <a href={"/records/" + esc(r.id)}>{esc(r.title)}</a>
                    </CardTitle>
                    <CardDescription>{r.summary}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <span>
                      {r.coverage.industry_scope === "specific"
                        ? r.coverage.industry_mappings
                            .map((i) => esc(i.industry_code))
                            .join(" · ")
                        : esc(r.coverage.industry_scope.replaceAll("-", " "))}
                    </span>
                  </CardFooter>
                </Card>
              </>
            )),
          )}
          {"\n      "}
          <ResultsPagination
            page={data.page}
            pages={data.pages}
            label="Coverage record pages"
            previous={
              data.page > 1
                ? url(params, { page: String(data.page - 1) }) + "#material"
                : undefined
            }
            next={
              data.page < data.pages
                ? url(params, { page: String(data.page + 1) }) + "#material"
                : undefined
            }
          />
          {"\n      "}
          {data.broader_context.length ? (
            <>
              <details>
                <summary>
                  {data.broader_context.length}
                  {" records from broader industry context"}
                </summary>
                <p>
                  {
                    "These are navigation leads. They are not counted as direct material for "
                  }
                  {esc(region)}
                  {"."}
                </p>
                <ul>
                  {data.broader_context.map((r) => (
                    <>
                      <li>
                        <a href={"/records/" + esc(r.id)}>{esc(r.title)}</a>
                        {" · "}
                        {r.industry_codes.map(esc).join(", ")}
                      </li>
                    </>
                  ))}
                </ul>
              </details>
            </>
          ) : (
            ""
          )}
          {"\n    "}
        </section>
        {"\n    "}
        <section className="my-10">
          <h2>{"Keep track of coverage"}</h2>
          <p>
            {history.length
              ? `History begins with the ${esc(history[0].recorded_at)} baseline. Each snapshot preserves its corpus, topology and mapping versions.`
              : "The first baseline is being prepared. No historical trend is inferred."}
          </p>
          {history.length ? (
            <>
              <div className="my-5 min-w-0">
                <Table>
                  <TableCaption>
                    {
                      "Measured snapshots; changes in mapping method can change counts without adding research"
                    }
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{"Date / snapshot"}</TableHead>
                      <TableHead>{"Mapping method"}</TableHead>
                      <TableHead>{"Records"}</TableHead>
                      <TableHead>{"Question families with material"}</TableHead>
                      <TableHead>{"Scoped assessments"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((h) => (
                      <>
                        <TableRow>
                          <TableHead>
                            {esc(h.recorded_at)}
                            <small className="mt-1 block text-muted-foreground">{esc(h.id)}</small>
                          </TableHead>
                          <TableCell>{esc(h.mapping_version)}</TableCell>
                          <TableCell>{h.summary.record_count}</TableCell>
                          <TableCell>
                            {h.summary.question_families_with_material}
                            {" / "}
                            {h.summary.question_families}
                          </TableCell>
                          <TableCell>{h.summary.scoped_assessments}</TableCell>
                        </TableRow>
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            ""
          )}
          <p>
            {
              "Downloads contain the entire corpus snapshot. Exploration filters above do not narrow these files."
            }
          </p>
          <p>
            <a href="/downloads/coverage.json">{"Current analytics JSON"}</a>
            {" · "}
            <a href="/downloads/coverage-records.jsonl">
              {"Record mappings JSONL"}
            </a>
            {" · "}
            <a href="/downloads/coverage-cells.csv">
              {"Subsector screening matrix CSV"}
            </a>
            {" · "}
            <a href="/downloads/coverage-history.json">{"Snapshot history"}</a>
            {" · "}
            <a href="/downloads/coverage-topology.json">{"Full topology"}</a>
          </p>
        </section>
        {"\n    "}
        <details className="mt-8 border-t border-border pt-5">
          <summary>{"How to read and maintain this map"}</summary>
          <p>{esc(data.notes.denominator)}</p>
          <p>
            {esc(data.notes.associations)} {esc(data.notes.assessment)}
          </p>
          <p>
            {s.subsectors_with_direct_material}
            {" of 96 subsectors and "}
            {s.detailed_industries_with_direct_material}
            {
              " of 1,012 detailed industries have material assigned at that exact level. "
            }
            {s.assessed_subsector_question_pairs}
            {" of "}
            {count(s.subsector_question_screening_pairs)}
            {
              " possible subsector/question pairs have a scoped assessment. These are mapping and review totals, not percentages of accounting knowledge."
            }
          </p>
          <p>
            {"The "}
            {s.industry_mapped_records}
            {" records with industry associations, "}
            {s.shared_context_records}
            {" marked as shared context and "}
            {s.industry_unassigned_records}
            {
              " awaiting an industry assignment partition the current corpus. Source currency, professional review and reuse rights retain their record-level status."
            }
          </p>
          <p>
            {
              "Update versioned mappings and scoped assessments in the source corpus, then capture a new snapshot. The site and exports are rebuilt from the same files. "
            }
            <a href="/schemas/coverage.schema.json">{"Coverage schema"}</a>
            {" · "}
            <a href="/api/v1/coverage">{"Coverage API"}</a>
          </p>
          <p>
            {"Industry backbone: "}
            <a
              href={esc(coverageTopology.industry_backbone.source_landing_url)}
            >
              {"US Census Bureau, NAICS-US 2022"}
            </a>
            {". Topology "}
            {esc(data.topology_version)}
            {"; mappings "}
            {esc(data.mapping_version)}
            {"; assessments "}
            {esc(data.assessment_version)}
            {"."}
          </p>
        </details>
        {"\n  "}
      </article>
    </>
  );
  return shell(
    "Research coverage",
    "Explore corpus coverage across industries and accounting questions, with explicit evidence gaps and versioned analytics.",
    body,
    "coverage",
    "/coverage",
  );
}
