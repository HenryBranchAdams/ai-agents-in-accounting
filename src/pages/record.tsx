import { constructionSectionLinks, recordSectionLinks } from "../record-sections";
import { PageOutline } from "../components/page-outline";
import { buildEvidencePreview } from "../evidence-preview";
import { FamilyOfficeReference } from "../components/family-office-reference";
import { editedBrief } from "../editorial";
import { BriefReading } from "../components/brief-reading";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { ExternalLinkIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  meta,
  kinds,
  references,
  citedBy,
  getRecord,
  knowledge,
  coverage,
  type CorpusRecord,
  type Json,
} from "../corpus";
import { shell } from "../components/shell";
import { displayText, label, link } from "../components/format";
import { intersperse } from "../components/content";
import { RecordRow } from "../components/record-row";
import { Button } from "../components/ui/button";
const skippedKeys = new Set([
  "id",
  "kind",
  "title",
  "name",
  "term",
  "label",
  "summary",
  "description",
  "definition",
  "version",
  "record_version",
  "record_updated_at",
  "source_ids",
  "related_ids",
  "source_type",
  "owner",
  "canonical_source_url",
  "source_rights",
  "source_license",
  "source_license_url",
  "metadata_rights",
  "annotation_rights",
  "topic",
  "family_name",
  "jurisdiction",
]);
function structured(value: Json, depth = 0): ReactNode {
  if (value === null)
    return (
      <>
        <span className="text-sm text-muted-foreground">{"Not recorded"}</span>
      </>
    );
  if (typeof value === "string") {
    const r = getRecord(value);
    if (r) return link(`/records/${r.id}`, r.title);
    if (
      /^https?:\/\//.test(value) ||
      /^\/(?:records|api|downloads|coverage|schemas|releases)(?:[/?#]|$)/.test(
        value,
      )
    )
      return link(value, value);
    return <span className="whitespace-pre-line">{String(value)}</span>;
  }
  if (typeof value !== "object") return displayText(value);
  if (Array.isArray(value))
    return value.length ? (
      <>
        <ul>
          {value.map((v) => (
            <>
              <li>{structured(v, depth + 1)}</li>
            </>
          ))}
        </ul>
      </>
    ) : (
      <>
        <span className="text-sm text-muted-foreground">{"None recorded"}</span>
      </>
    );
  if (typeof value.href === "string" && typeof value.label === "string")
    return link(value.href, value.label);
  if (
    typeof value.url === "string" &&
    typeof value.title === "string" &&
    Object.keys(value).length === 2
  )
    return link(value.url, value.title);
  return (
    <>
      <dl className={"structured " + (depth > 1 ? "nested" : "")}>
        {Object.entries(value).map(([k, v]) => (
          <>
            <div>
              <dt>{displayText(label(k))}</dt>
              <dd>{structured(v, depth + 1)}</dd>
            </div>
          </>
        ))}
      </dl>
    </>
  );
}
function sourceEvidence(r: CorpusRecord) {
  const profile = knowledge.profile(r.id)!;
  const claims = profile.evidence.claims.filter(
    (c) => c.classification !== "record-summary",
  );
  const urls = [
    ...new Set(claims.map((c) => c.source_url).filter((u): u is string => !!u)),
  ];
  const fields = [
    "jurisdictions",
    "frameworks",
    "entities",
    "products",
  ] as const;
  const known = fields.filter((k) => profile.scope[k].length);
  const unknown = fields.filter((k) => !profile.scope[k].length).map(label);
  const period = profile.scope.period;
  const dates = Object.entries(period).filter(([, v]) => !!v);
  return (
    <>
      <section id="evidence">
        <h2>{"What this source establishes"}</h2>
        {claims.length ? (
          <>
            <ul className="claims">
              {claims.map((c) => (
                <>
                  <li>
                    <span className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      {displayText(label(c.classification))}
                    </span>
                    <p>{displayText(c.text)}</p>
                    {urls.length > 1 && c.source_url
                      ? link(c.source_url, "View supporting source ↗")
                      : ""}
                  </li>
                </>
              ))}
            </ul>
            {urls.length === 1 ? (
              <>
                <p className="text-sm font-medium">
                  {link(urls[0], "Read the supporting publisher material ↗")}
                </p>
              </>
            ) : (
              ""
            )}
          </>
        ) : (
          <>
            <p>
              {
                "No separate findings have been annotated. The overview above is editorial metadata; consult the original source before relying on it."
              }
            </p>
          </>
        )}
        <p className="text-sm text-muted-foreground">
          Source rights: {displayText(r.rights.source_status || "unknown")}. {displayText(r.rights.source_permission_scope || "External publisher terms apply; public access is not reuse permission.")}
        </p>
        <p className="text-sm text-muted-foreground">
          {"These are recorded annotations. "}
          {r.review_status.startsWith("inherited")
            ? "Inherited claims have not been reverified."
            : "The recorded review scope applies; this is not professional verification."}
        </p>
      </section>
      {"\n  "}
      <section id="applicability">
        <h2>{"Applicability"}</h2>
        <dl className="scope-grid">
          {known.map((k) => (
            <>
              <div>
                <dt>{label(k)}</dt>
                <dd>{profile.scope[k].map(displayText).join(" · ")}</dd>
              </div>
            </>
          ))}
          {dates.map(([k, v]) => (
            <>
              <div>
                <dt>{displayText(label(k))}</dt>
                <dd>{displayText(v)}</dd>
              </div>
            </>
          ))}
        </dl>
        {unknown.length ? (
          <>
            <p className="text-sm text-muted-foreground">
              <strong>{"Unknown / not recorded:"}</strong>{" "}
              {displayText(unknown.join(", "))}
              {!dates.length ? "; publication and effective period" : ""}
              {". Unknown does not mean not applicable."}
            </p>
          </>
        ) : !dates.length ? (
          <>
            <p>{"Publication and effective period: not recorded."}</p>
          </>
        ) : (
          ""
        )}
        <details>
          <summary>{"How scope was derived"}</summary>
          <dl className="structured">
            {Object.entries(profile.scope.basis).map(([field, b]) => (
              <>
                <div>
                  <dt>{displayText(label(field))}</dt>
                  <dd>
                    {displayText(b.status)}
                    {" · "}
                    {intersperse(
                      b.pointers.map((p) => (
                        <>
                          <code>{displayText(p)}</code>
                        </>
                      )),
                      ", ",
                    ) || "No recorded basis"}
                  </dd>
                </div>
              </>
            ))}
          </dl>
        </details>
      </section>
      {"\n  "}
      <section id="limitations">
        <h2>{"Limitations and unknowns"}</h2>
        {profile.evidence.limitations.length ? (
          <>
            <ul>
              {profile.evidence.limitations.map((v) => (
                <>
                  <li>{displayText(v)}</li>
                </>
              ))}
            </ul>
          </>
        ) : (
          <>
            <p>
              {
                "No specific limitations have been recorded. This is a coverage gap, not evidence of unrestricted applicability."
              }
            </p>
          </>
        )}
      </section>
    </>
  );
}
export function recordPage(r: CorpusRecord) {
  const cited = references(r),
    inbound = citedBy(r);
  const fields = Object.entries(r.data).filter(
    ([key]) => !skippedKeys.has(key),
  );
  const brief = r.data.editorial_brief;
  const edited = editedBrief(brief);
  const researchQuestions = Array.isArray(r.data.research_questions)
    ? r.data.research_questions
    : [];
  const workedBranches =
    r.id === "example-construction-contract-ledger" &&
    Array.isArray(r.data.examples)
      ? (r.data.examples as Record<string, Json>[])
      : [];
  const constructionSections = constructionSectionLinks(r);
  const edges = knowledge
    .relations(r.id)
    .filter((e) => !["cites", "cited_by"].includes(e.type));
  const sections = recordSectionLinks(r);
  const contents = <PageOutline sections={sections} />;
  const mobileOutline = <details className="my-5 lg:hidden"><summary>On this page</summary>{contents}</details>;
  const citation = `Accounting Agents contributors. “${r.title}.” Accounting Agents research corpus, version ${meta.corpus_version}. ${meta.site_url}/records/${r.id}`;
  const body = (
    /* HTML */ <>
      <div className="grid items-start gap-10 pt-8 lg:grid-cols-4 lg:gap-12">
        {"\n    "}
        <article className="reading min-w-0 lg:col-span-3">
          {"\n      "}
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Corpus</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={"/?kind=" + r.kind}>
                  {kinds[r.kind]}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {"\n      "}
          {!edited && (
            <div className="mb-4">
              <Badge variant="secondary">
                {displayText(r.source_type || kinds[r.kind])}
              </Badge>
            </div>
          )}
          <h1>{edited?.question || displayText(r.title)}</h1>
          {"\n      "}
          <>
            {edited ? (
              renderBrief(brief, r.id, true, mobileOutline)
            ) : (
              <p className="mb-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                {displayText(r.summary)}
              </p>
            )}
          </>
          {"\n      "}
          {!edited && !(brief && !researchQuestions.length) ? mobileOutline : null}
          {r.kind === "source" ? sourceEvidence(r) : ""}
          {"\n      "}
          {r.data.source_review || r.data.supplemental_reviews ? (
            <>
              <details>
                <summary>
                  {"Source access, editions and review locators"}
                </summary>
                {r.data.source_review ? structured(r.data.source_review) : ""}
                {r.data.supplemental_reviews
                  ? structured(r.data.supplemental_reviews)
                  : ""}
              </details>
            </>
          ) : (
            ""
          )}
          {"\n      "}
          {researchQuestions.length ? (
            <>
              <section id="research-questions">
                <h2>{"Research questions"}</h2>
                <p>
                  {
                    "Answers apply only to their stated scope. Controls and worked material may be original proposals; no professional sign-off is implied."
                  }
                </p>
                {researchQuestions.map((value) => {
                  const q = value as Record<string, Json>;
                  return (
                    <>
                      <article
                        className="research-question"
                        id={displayText(q.id)}
                      >
                        <h3>{displayText(q.question)}</h3>
                        <p className="mt-1 block text-xs font-normal text-muted-foreground">
                          {displayText(
                            q.answer_status || "Bounded research answer",
                          )}
                        </p>
                        <p>{displayText(q.answer)}</p>
                        <p>
                          <strong>{"Scope:"}</strong>{" "}
                          {displayText(q.scope || r.data.scope || r.summary)}
                        </p>
                        {q.source_ids ? (
                          <>
                            <div>
                              <strong>{"Sources:"}</strong>{" "}
                              {structured(q.source_ids)}
                            </div>
                          </>
                        ) : (
                          ""
                        )}
                        <details>
                          <summary>
                            {"Evidence, inputs, controls and remaining gaps"}
                          </summary>
                          {structured(
                            Object.fromEntries(
                              Object.entries(q).filter(
                                ([k]) =>
                                  ![
                                    "id",
                                    "question",
                                    "answer",
                                    "scope",
                                    "source_ids",
                                  ].includes(k),
                              ),
                            ),
                          )}
                        </details>
                      </article>
                    </>
                  );
                })}
              </section>
              {r.data.worked_examples ? (
                <>
                  <section>
                    <h2>{"Original worked material"}</h2>
                    {structured(r.data.worked_examples)}
                  </section>
                </>
              ) : (
                ""
              )}
              {r.data.worked_record_id ? (
                <>
                  <p>
                    {"Connected worked reference: "}
                    {structured(r.data.worked_record_id)}
                  </p>
                </>
              ) : (
                ""
              )}
            </>
          ) : brief && !edited ? (
            renderBrief(brief, r.id, false, mobileOutline)
          ) : (
            ""
          )}
          {"\n      "}
          <FamilyOfficeReference record={r} />
          {r.kind === "collection" && !r.data.family_office_reference ? (
            <>
              <section>
                <h2>{"In this collection"}</h2>
                {cited.map((r) => (
                  <RecordRow record={r} />
                ))}
              </section>
            </>
          ) : (
            ""
          )}
          {"\n      "}
          <div
            id="record-actions"
            className="my-6 flex flex-wrap items-center gap-5 text-sm"
          >
            {"\n        "}
            {r.source_url ? (
              <>
                <Button asChild>
                  <a href={displayText(r.source_url)} rel="noreferrer">
                    Read the original source
                    <ExternalLinkIcon data-icon="inline-end" />
                  </a>
                </Button>
              </>
            ) : (
              ""
            )}
            {["guide", "workflow", "example", "source"].includes(r.kind) ? <a href={`/connections?${new URLSearchParams({ focus: r.id })}`}>Explore connections</a> : null}
            <a href={"/records/" + r.id + ".md"}>{"Markdown"}</a>
            <a href={"/api/v1/records/" + r.id}>{"JSON"}</a>
            {r.kind === "collection" ? (
              <>
                <a href={"/api/v1/collections/" + r.id}>
                  {"Download bibliography"}
                </a>
              </>
            ) : (
              ""
            )}
            {"\n      "}
          </div>
          {"\n      "}
          <Alert role="note" aria-label="Review and rights">
            <AlertTitle>Review and rights</AlertTitle>
            <AlertDescription>
              {"\n        "}
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <span>
                  <strong>{displayText(label(r.review_status))}</strong>
                  {r.reviewed_at
                    ? ` · ${displayText(r.reviewed_at)}`
                    : " · Review date unknown"}
                </span>
                <span>
                  {"Source rights: "}
                  <strong>
                    {displayText(
                      r.rights.source_status ||
                        (r.kind === "source"
                          ? "unknown"
                          : "publisher terms apply"),
                    )}
                  </strong>
                  {r.rights.source_license
                    ? ` · ${displayText(r.rights.source_license)}`
                    : ""}
                </span>
              </div>
              {"\n        "}
              <details>
                <summary>{"Review scope and reuse details"}</summary>
                <p>
                  {displayText(
                    r.provenance.scope ||
                      r.provenance.review_scope ||
                      r.provenance.note ||
                      "Review scope not recorded.",
                  )}
                </p>
                {r.provenance.reviewer ? (
                  <>
                    <p>
                      {"Reviewer: "}
                      {displayText(r.provenance.reviewer)}
                    </p>
                  </>
                ) : (
                  ""
                )}
                <p>{displayText(r.provenance.outcome || "")}</p>
                <p>
                  {"Project metadata: "}
                  {displayText(r.rights.metadata)}
                  {"; editorial content: "}
                  {displayText(r.rights.content)}
                  {". External full text is not included."}
                </p>
              </details>
              {"\n      "}
            </AlertDescription>
          </Alert>
          {"\n      "}

          {"\n      "}
          <div className="min-w-0" id="record-content">
            {"\n        "}
            <details>
              <summary>{"Complete record details"}</summary>
              {"\n        "}
              {fields.map(([key, value]) =>
                key === "examples" && workedBranches.length ? (
                  <section id="detail-examples">
                    <h2>Calculations and branches</h2>
                    <p>
                      Each branch states its own assumptions. Follow one branch
                      at a time; the original closes remain separate.
                    </p>
                    <nav aria-label="Worked branches">
                      <ul>
                        {workedBranches.map((branch) => (
                          <li>
                            <a href={"#" + displayText(branch.id)}>
                              {displayText(branch.title)}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </nav>
                    {workedBranches.map((branch) => (
                      <section id={displayText(branch.id)}>
                        <h3>{displayText(branch.title)}</h3>
                        {structured(
                          Object.fromEntries(
                            Object.entries(branch).filter(
                              ([k]) => !["id", "title"].includes(k),
                            ),
                          ),
                        )}
                      </section>
                    ))}
                  </section>
                ) : key === "paragraphs" && Array.isArray(value) ? (
                  <>
                    <section>
                      <h2>{"Reference text"}</h2>
                      {value.map((p) => (
                        <>
                          <p>{structured(p)}</p>
                        </>
                      ))}
                    </section>
                  </>
                ) : (
                  <>
                    <section>
                      <h2
                        id={
                          constructionSections.some(([id]) => id === key)
                            ? "detail-" + key
                            : undefined
                        }
                      >
                        {displayText(label(key))}
                      </h2>
                      {structured(value)}
                    </section>
                  </>
                ),
              )}
              {"\n        "}
            </details>
            {"\n      "}
          </div>
          {"\n      "}
          {edges.length ? (
            <>
              <section id="relationships">
                <h2>{"Evidence relationships"}</h2>
                <p>
                  {
                    "Typed editorial links with a recorded reason. A link is not independent verification."
                  }
                </p>
                <ul>
                  {edges.slice(0, 24).map((e) => (
                    <>
                      <li>
                        <strong>{displayText(label(e.type))}</strong>
                        {" · "}
                        {link(
                          `/records/${e.from === r.id ? e.to : e.from}`,
                          getRecord(e.from === r.id ? e.to : e.from)?.title ||
                            e.to,
                        )}
                        {e.to === r.id ? " (inbound)" : ""}
                        <p>{displayText(e.provenance.reason)}</p>
                      </li>
                    </>
                  ))}
                </ul>
                {edges.length > 24 ? (
                  <>
                    <p>
                      {edges.length - 24}
                      {
                        " further links available through agent get with include_relations=true."
                      }
                    </p>
                  </>
                ) : (
                  ""
                )}
              </section>
            </>
          ) : (
            ""
          )}
          {"\n      "}
          {cited.length && r.kind !== "collection" ? (
            <>
              <section id="sources">
                <h2>{"Cited sources"}</h2>
                <p>
                  {
                    "Follow the source record to assess its scope, evidence, and rights."
                  }
                </p>
                {cited.map((r) => (
                  <RecordRow record={r} />
                ))}
              </section>
            </>
          ) : (
            ""
          )}
          {"\n      "}
          <section id="coverage">
            <h2>{"Coverage mapping"}</h2>
            <p>
              {
                "Proposed associations with the research topology. These links do not assess whether this record answers the question."
              }
            </p>
            {(() => {
              const profile = coverage.profiles.get(r.id)!;
              return (
                <>
                  <dl className="structured">
                    <div>
                      <dt>{"Question families"}</dt>
                      <dd>
                        {profile.question_mappings.length
                          ? intersperse(
                              profile.question_mappings.map((q) =>
                                link(
                                  `/coverage?view=questions&question=${q.question_id}`,
                                  coverage.questionById.get(q.question_id)
                                    ?.title || q.question_id,
                                ),
                              ),
                              " · ",
                            )
                          : "Not yet assigned"}
                      </dd>
                    </div>
                    <div>
                      <dt>{"Industry scope"}</dt>
                      <dd>
                        {profile.industry_mappings.length
                          ? intersperse(
                              profile.industry_mappings.map((i) =>
                                link(
                                  `/coverage?industry=${i.industry_code}`,
                                  `${i.industry_code} · ${coverage.nodeByCode.get(i.industry_code)?.title}`,
                                ),
                              ),
                              " · ",
                            )
                          : displayText(
                              profile.industry_scope.replaceAll("-", " "),
                            )}
                      </dd>
                    </div>
                  </dl>
                  <p>
                    <a href={"/api/v1/coverage/records/" + displayText(r.id)}>
                      {"Mapping fields and provenance (JSON)"}
                    </a>
                  </p>
                </>
              );
            })()}
          </section>
          {"\n      "}
          <section id="citation">
            {"\n        "}
            <h2>{"Cite this record"}</h2>
            {"\n        "}
            <Alert role="note">
              <AlertTitle>Reuse and interpretation</AlertTitle>
              <AlertDescription>{displayText(citation)}</AlertDescription>
            </Alert>
            {"\n        "}
            <p>
              {
                "\n          The citation identifies this project record. Cite the original\n          publisher separately when relying on its work.\n        "
              }
            </p>
            {"\n      "}
          </section>
          {"\n      "}
          <section id="record-information">
            <h2>{"Record information"}</h2>
            <p>
              <a href={"/records/" + r.id + "/history"}>{"Record history →"}</a>
            </p>
            <details>
              <summary>{"Identifier, version and recorded scope"}</summary>
              <dl className="structured">
                <div>
                  <dt>{"Stable ID"}</dt>
                  <dd>
                    <code>{displayText(r.id)}</code>
                  </dd>
                </div>
                <div>
                  <dt>{"Publisher"}</dt>
                  <dd>{displayText(r.publisher)}</dd>
                </div>
                <div>
                  <dt>{"Corpus version"}</dt>
                  <dd>{meta.corpus_version}</dd>
                </div>
                <div>
                  <dt>{"Recorded scope (original)"}</dt>
                  <dd>{displayText(r.jurisdiction || "Not recorded")}</dd>
                </div>
                <div>
                  <dt>{"Topics"}</dt>
                  <dd>
                    {intersperse(
                      r.topics.map((t) =>
                        link(`/?topic=${encodeURIComponent(t)}`, t),
                      ),
                      " · ",
                    )}
                  </dd>
                </div>
              </dl>
            </details>
          </section>
          {"\n      "}
          <section id="rights">
            {"\n        "}
            <h2>{"Rights and provenance"}</h2>
            {"\n        "}
            <p>{displayText(meta.rights_note)}</p>
            {"\n        "}
            <details>
              {"\n          "}
              <summary>{"Record rights"}</summary>
              {"\n          "}
              {structured(r.rights)}
              {"\n        "}
            </details>
            {"\n        "}
            <details>
              {"\n          "}
              <summary>{"Import and review history"}</summary>
              {"\n          "}
              {structured(r.provenance)}
              {"\n        "}
            </details>
            {"\n      "}
          </section>
          {"\n      "}
          {inbound.length ? (
            <>
              <section>
                <h2>
                  {"Referenced by "}
                  {inbound.length}
                  {" records"}
                </h2>
                <details>
                  <summary>{"Explore related context and collections"}</summary>
                  <ul>
                    {inbound.map((x) => (
                      <>
                        <li>
                          <a href={"/records/" + x.id}>
                            {displayText(x.title)}
                          </a>
                        </li>
                      </>
                    ))}
                  </ul>
                </details>
              </section>
            </>
          ) : (
            ""
          )}
          {"\n    "}
        </article>
        {"\n    "}
        <aside data-record-outline-rail="true" className="sticky top-8 hidden border-l border-border pl-6 text-sm lg:block">
          <h2 className="mb-4 font-sans text-xs font-semibold tracking-wider uppercase">
            On this page
          </h2>
          {contents}
          <p className="mt-6 border-t border-border pt-5 text-xs text-muted-foreground">
            {displayText(r.publisher)}
          </p>
          <a href={"/records/" + r.id + "/history"}>{"Record history →"}</a>
        </aside>
        {"\n  "}
      </div>
    </>
  );
  return shell(
    r.title,
    r.summary,
    body,
    r.kind === "source"
      ? "sources"
      : r.kind === "collection"
        ? "collections"
        : "context",
    `/records/${r.id}`,
  );
}
function renderBrief(value: Json, ownerId: string, answerFirst = false, outline?: ReactNode) {
  const edited = editedBrief(value);
  const b = value as {
    [key: string]: Json;
  };
  const findings = (items: Json) =>
    Array.isArray(items)
      ? items.map((item) => {
          const f = item as {
            [key: string]: Json;
          };
          return (
            <>
              <article className="my-5 border-l-2 border-border pl-5">
                <p className="text-sm text-muted-foreground">
                  {displayText(f.classification || "Recorded synthesis")}
                </p>
                <p>{displayText(f.claim)}</p>
                {Array.isArray(f.source_ids) && f.source_ids.length ? <span data-evidence-preview={JSON.stringify(buildEvidencePreview(ownerId, meta.corpus_version, f, getRecord))} /> : null}
                <p className="text-sm text-muted-foreground">
                  {displayText(f.qualification)}
                </p>
                <p>
                  {displayText(
                    f.locator ||
                      "Precise passage locator not recorded in this brief; inspect the canonical source review.",
                  )}{" "}
                  {Array.isArray(f.source_ids)
                    ? intersperse(
                        f.source_ids.map((id) =>
                          link(
                            `/records/${id}`,
                            getRecord(String(id))?.title || String(id),
                          ),
                        ),
                        " · ",
                      )
                    : ""}
                </p>
              </article>
            </>
          );
        })
      : "";
  return (
    <>
      {answerFirst && edited ? (
        <BriefReading brief={edited} afterAnswer={outline} />
      ) : (
        <section id="answer">
          <Card>
            <CardHeader>
              <CardTitle role="heading" aria-level={2}>
                Answer in context
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{displayText(b.answer)}</p>
            </CardContent>
          </Card>
        </section>
      )}
      {!answerFirst ? outline : null}
      <section id="findings">
        <h2>{"Findings across sources"}</h2>
        {findings(b.findings)}
      </section>
      <section id="qualifications">
        <h2>{"Differences and qualifications"}</h2>
        <p>
          {
            "Differences in scope or evidence do not necessarily mean the authors disagree."
          }
        </p>
        {findings(b.disagreements)}
      </section>
      <section id="unknowns">
        <h2>{"What remains unknown"}</h2>
        {structured(b.unknowns)}
      </section>
      <section id="suggested-reading">
        <h2>{"Suggested reading order"}</h2>
        {edited?.reading_notes && (
          <ol>
            {edited.reading_notes.map((n) => (
              <li key={n.record_id}>
                <a href={`/records/${n.record_id}`}>
                  {getRecord(n.record_id)?.title || n.record_id}
                </a>
                : {n.reason}
              </li>
            ))}
          </ol>
        )}
        {edited ? (
          <details>
            <summary>Complete reading order</summary>
            {structured(b.reading_order)}
          </details>
        ) : (
          structured(b.reading_order)
        )}
      </section>
    </>
  );
}
