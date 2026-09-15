import { records } from "../corpus";
import { shell } from "../components/shell";
import { ReadingCard } from "../components/reading-card";
export function briefsPage() {
  return shell(
    "Research briefs",
    "Source-linked answers with qualifications and explicit unknowns.",
    <>
      <section className="max-w-3xl pt-10 pb-6 md:pt-14">
        <h1>Research briefs</h1>
        <p className="text-lg text-muted-foreground">
          Accounting questions answered through cited sources, with evidence
          boundaries and unresolved questions kept in view.
        </p>
      </section>
      <section className="grid gap-6 md:grid-cols-2">
        {records
          .filter((r) => r.data.editorial_brief)
          .map((r) => (
            <ReadingCard key={r.id} record={r} kind="brief" />
          ))}
      </section>
    </>,
    "briefs",
    "/briefs",
  );
}
export function collectionsPage() {
  const items = records
    .filter((r) => r.kind === "collection")
    .sort((a, b) => a.title.localeCompare(b.title));
  return shell(
    "Reading collections",
    "Editorial collections of sources for accounting agent builders.",
    <>
      <section className="max-w-3xl pt-10 pb-6 md:pt-14">
        <h1>Reading collections</h1>
        <p className="text-lg text-muted-foreground">
          Curated starting points across accounting, agent systems, evidence,
          and oversight. Each collection is a reusable bibliography.
        </p>
      </section>
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r) => (
          <ReadingCard key={r.id} record={r} kind="collection" />
        ))}
      </section>
    </>,
    "collections",
    "/collections",
  );
}
