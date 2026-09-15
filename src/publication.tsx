import { FieldGroup } from "./components/ui/field";
import { SelectField } from "./components/corpus-fields";
import { ResultsPagination } from "./components/results-pagination";
import { NoResults } from "./components/no-results";
import { Badge } from "./components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import { meta, getRecord } from "./corpus";
import { shell } from "./components/shell";
import { displayText as esc, label } from "./components/format";
export type Change = {
  id: string;
  change: string;
  categories: string[];
};
type QueueRow = {
  id: string;
  title: string;
  kind: string;
  priority: string;
  reasons: string[];
  review_status: string;
  reviewed_at: string | null;
  observation: {
    checked_at: string | null;
    access: string | null;
    version_change_hint: string | null;
  } | null;
};
declare const PUBLICATION_DATA: {
  previous_version: string;
  versions: string[];
  changes: Change[];
  queue: QueueRow[];
};
export const publication = PUBLICATION_DATA;
const recordLink = (id: string) => (
  <>
    <a href={"/records/" + esc(id)}>{esc(getRecord(id)?.title || id)}</a>
  </>
);
export function changesPage() {
  return shell(
    "Release history",
    "Versioned corpus snapshots and record changes.",
    <>
      <article className="reading mx-auto max-w-reading py-10 md:py-14">
        <h1>{"Release history"}</h1>
        <p className="mb-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          {"Current corpus: "}
          {meta.corpus_version}
          {". Compare canonical records with "}
          {publication.previous_version}
          {"; source checks and professional verification remain separate."}
        </p>
        <h2>{"This release"}</h2>
        <p>
          {
            "Added normalized scope and vocabulary, source evidence views, three cross-source briefs, typed relationships, maintenance observations, and retrieval regression coverage. These derived views do not change inherited review status or publisher rights."
          }
        </p>
        <ul>
          {publication.changes.map((c) => (
            <>
              <li>
                {recordLink(c.id)}
                {" · "}
                {esc(c.change)}
                {c.categories.length
                  ? ` (${esc(c.categories.join(", "))})`
                  : ""}
                {". "}
                <a href={"/records/" + c.id + "/history"}>{"History"}</a>
              </li>
            </>
          ))}
        </ul>
        <h2>{"Portable snapshots"}</h2>
        <p>
          {
            "Historical snapshots identify stored bytes. Earlier history is unavailable unless explicitly preserved here."
          }
        </p>
        <ul>
          {publication.versions.map((v) => (
            <>
              <li>
                {esc(v)}
                {" · "}
                <a href={"/releases/" + v + "/corpus.json.gz"}>
                  {"Compressed JSON"}
                </a>
                {" · "}
                <a href={"/releases/" + v + "/manifest.json"}>
                  {"SHA-256 manifest"}
                </a>
                {v === meta.corpus_version ? (
                  <>
                    {" · "}
                    <a href={"/releases/" + v + "/changes.json"}>
                      {"Record changes"}
                    </a>
                  </>
                ) : (
                  ""
                )}
              </li>
            </>
          ))}
        </ul>
        <p>
          <a href="/downloads/knowledge.json">
            {"Knowledge profiles and typed relationships"}
          </a>
          {" · "}
          <a href="/downloads/maintenance.json">{"Maintenance queue"}</a>
        </p>
      </article>
    </>,
    "",
    "/changes",
  );
}
export function historyPage(id: string) {
  const r = getRecord(id)!;
  const c = publication.changes.find((c) => c.id === id);
  return shell(
    `${r.title}: history`,
    "Recorded changes and source review provenance.",
    <>
      <article className="reading mx-auto max-w-reading py-10 md:py-14">
        <h1>{esc(r.title)}</h1>
        <p>{recordLink(id)}</p>
        <h2>{meta.corpus_version}</h2>
        <p>
          {c
            ? `${esc(c.change)}${c.categories.length ? `: ${esc(c.categories.join(", "))}` : ""}.`
            : `Canonical record unchanged from ${esc(publication.previous_version)}.`}
        </p>
        <p>
          {"Review status: "}
          {label(r.review_status)}
          {". Review date: "}
          {esc(r.reviewed_at || "unknown")}
          {"."}
        </p>
        <p>
          {esc(
            r.provenance.scope ||
              r.provenance.review_scope ||
              r.provenance.note ||
              "Review scope unknown.",
          )}
        </p>
        <p>
          {
            "Generated knowledge profiles may evolve separately from canonical record text. "
          }
          <a href="/downloads/knowledge.json">
            {"Read the current versioned projection."}
          </a>
        </p>
        <h2>{"Available history"}</h2>
        <p>
          {"Compare this stable ID in the "}
          <a
            href={
              "/releases/" + publication.previous_version + "/corpus.json.gz"
            }
          >
            {"previous snapshot"}
          </a>
          {" and "}
          <a href="/downloads/corpus.json">{"current corpus"}</a>
          {
            ". Earlier source edits and publisher editions are not reconstructed."
          }
        </p>
        <a href="/changes">{"All release changes →"}</a>
      </article>
    </>,
    "",
    `/records/${id}/history`,
  );
}
export function maintenancePage(params: URLSearchParams) {
  const priority = params.get("priority") || "";
  const page = /^\d+$/.test(params.get("page") || "")
    ? Math.max(1, Number(params.get("page")))
    : 1;
  const rows = publication.queue.filter(
    (r) => !priority || r.priority === priority,
  );
  const pages = Math.max(1, Math.ceil(rows.length / 25));
  return shell(
    "Source maintenance",
    "A public queue of unresolved source checks and evidence gaps.",
    <>
      <article className="reading mx-auto max-w-reading py-10 md:py-14">
        <h1>{"Source maintenance"}</h1>
        <p className="mb-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          {rows.length}
          {
            " records need attention. Link and content-change observations are maintenance signals; they never promote a record to source-checked."
          }
        </p>
        <p>
          {
            "Unknown rights, inherited review and citation gaps remain visible. A content fingerprint change can reflect page furniture; it is not proof of a new edition. Live checks run separately from a build."
          }
        </p>
        <form action="/maintenance" method="get">
          <FieldGroup className="grid items-end sm:grid-cols-2">
            <SelectField
              name="priority"
              label="Priority"
              allLabel="All priorities"
              selected={priority}
              values={[
                ["urgent", "Urgent"],
                ["review", "Review"],
                ["routine", "Routine"],
              ]}
            />
            <Button type="submit">Filter queue</Button>
          </FieldGroup>
        </form>
        <section>
          {rows.length === 0 && (
            <NoResults
              title="No records match this priority."
              href="/maintenance"
              action="Show all priorities"
            />
          )}
          {rows.slice((page - 1) * 25, page * 25).map((r) => (
            <>
              <Card className="my-4">
                <CardHeader>
                  <Badge variant="outline">
                    {esc(r.priority)}
                    {" · "}
                    {label(r.review_status)}
                  </Badge>
                  <CardTitle role="heading" aria-level={2}>
                    {recordLink(r.id)}
                  </CardTitle>
                  <CardDescription>
                    {r.reasons
                      .map((x) => esc(x.replaceAll("-", " ")))
                      .join(" · ")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {r.observation
                      ? `Observed ${esc(r.observation.checked_at)}: ${esc(r.observation.access)}${r.observation.version_change_hint ? ` · ${esc(r.observation.version_change_hint)}` : ""}`
                      : "No automated source observation recorded."}
                  </p>
                </CardContent>
              </Card>
            </>
          ))}
        </section>
        <ResultsPagination
          page={page}
          pages={pages}
          label="Maintenance pages"
          previous={
            page > 1
              ? `?priority=${encodeURIComponent(priority)}&page=${page - 1}`
              : undefined
          }
          next={
            page < pages
              ? `?priority=${encodeURIComponent(priority)}&page=${page + 1}`
              : undefined
          }
        />
        <p>
          <a href="/downloads/maintenance.json">
            {"Download complete queue JSON"}
          </a>
        </p>
      </article>
    </>,
    "",
    "/maintenance",
  );
}
