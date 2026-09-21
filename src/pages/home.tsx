import { meta, getRecord } from "../corpus";
import { editedBrief } from "../editorial";
import { shell } from "../components/shell";
import { Button } from "../components/ui/button";
import { Field, FieldGroup, FieldLabel } from "../components/ui/field";
import { Input } from "../components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../components/ui/card";
export function homePage() {
  return shell(
    "Understand an accounting workflow",
    meta.mission,
    <>
      <section className="max-w-reading pt-8 pb-6 md:pt-12">
        <h1>What should an accounting agent do?</h1>
        <p className="text-lg text-muted-foreground">
          Read worked examples of bank reconciliation and construction WIP.
          Check the proposed work, review decisions and supporting sources.
        </p>
        <form action="/library" method="get" role="search">
          <FieldGroup>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="q" className="sr-only">
                Search the research library
              </FieldLabel>
              <Input
                id="q"
                name="q"
                type="search"
                maxLength={240}
                placeholder="Find a task, standard, or source"
              />
              <Button type="submit">Search</Button>
            </Field>
          </FieldGroup>
        </form>
        <p>
          <a href="/library">Research library: browse all records</a> ·{" "}
          <a href="/briefs">All research briefs</a>
        </p>
      </section>
      <section
        aria-label="Understand a workflow"
        className="grid items-start gap-6 pb-8 lg:grid-cols-2"
      >
        {[
          "wf-r2r-bank-reconciliations",
          "guide-construction-connected-close",
        ].map((id) => {
          const r = getRecord(id)!;
          const b = editedBrief(r.data.editorial_brief)!;
          return (
            <Card key={id}>
              <CardHeader>
                <CardTitle role="heading" aria-level={2}>
                  <a href={`/records/${id}`}>{b.question}</a>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{b.answer}</p>
                <p className="text-sm">
                  <strong>Limit: </strong>
                  {b.reading.critical_limitation}
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline">
                  <a href={`/records/${id}`}>Read the worked explanation</a>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </section>
      <p className="text-sm text-muted-foreground">
        The complete library contains {meta.record_count.toLocaleString()}{" "}
        records. Coverage varies by task and source. <a href="/coverage">Inspect coverage and gaps</a>.
      </p>
    </>,
    "home",
    "/",
  );
}
