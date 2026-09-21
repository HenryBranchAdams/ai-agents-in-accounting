import type { EditedBrief, BriefSection } from "../editorial";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "./ui/table";
function ExplanationSection({ section }: { section: BriefSection }) {
  return (
    <section>
      <h2>{section.title}</h2>
      {section.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
    </section>
  );
}
export function BriefReading({ brief }: { brief: EditedBrief }) {
  const r = brief.reading;
  return (
    <>
      <section id="answer" className="mt-4 border-0 pt-0">
        <p className="text-lg leading-relaxed">{brief.answer}</p>
        <p>
          <strong>Key limitation: </strong>
          {r.critical_limitation}
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Scope: </strong>
          {r.scope}
        </p>
      </section>
      <div id="worked-explanation">
        {r.sections.map((section) => (
          <ExplanationSection key={section.title} section={section} />
        ))}
        <section id="worked-example">
          <h2>{r.example.title}</h2>
          <p>
            <strong>Original synthetic example. </strong>
            {r.example.assumptions}
          </p>
          <Table aria-label={r.example.title}>
            <TableHeader>
              <TableRow>
                {r.example.columns.map((c) => (
                  <TableHead key={c} scope="col">
                    {c}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.example.rows.map((row) => (
                <TableRow key={row[0]}>
                  {row.map((cell, i) =>
                    i === 0 ? (
                      <TableHead key={i} scope="row">
                        {cell}
                      </TableHead>
                    ) : (
                      <TableCell key={i}>{cell}</TableCell>
                    ),
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {r.example.record_id && (
            <p>
              <a
                href={`/records/${r.example.record_id}#${r.example.anchor || "record-content"}`}
              >
                Inspect the complete example and its independent branches
              </a>
            </p>
          )}
        </section>
        <section id="responsibility">
          <h2>Who does what</h2>
          <p>Project-proposed responsibility boundaries.</p>
          <Table aria-label="Work and authorization boundaries">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Role</TableHead>
                <TableHead scope="col">Work</TableHead>
                <TableHead scope="col">Boundary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.responsibilities.map((x) => (
                <TableRow key={x.role}>
                  <TableHead scope="row">
                    <span className="block min-w-32 whitespace-normal">
                      {x.role}
                    </span>
                  </TableHead>
                  <TableCell>
                    <span className="block min-w-48 whitespace-normal">
                      {x.task}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block min-w-48 whitespace-normal">
                      {x.boundary}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
        <ExplanationSection section={r.exception} />
        {r.gap_url && (
          <p>
            <a href={r.gap_url}>
              Issue 100: four unresolved evidence dependencies
            </a>
          </p>
        )}
      </div>
    </>
  );
}
