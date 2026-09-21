import { kinds, type CorpusRecord } from "../corpus";
import { Badge } from "./ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "./ui/card";
export function RecordRow({ record: r }: { record: CorpusRecord }) {
  const status =
    r.review_status === "source-checked"
      ? "AI-assisted source check"
      : r.review_status === "editorially-reviewed"
        ? "Editorial review"
        : "Inherited · not reverified";
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="max-w-full">
            <span className="whitespace-normal">{r.kind === "source" ? r.source_type : kinds[r.kind]}</span>
          </Badge>
          <span>
            {r.kind === "source"
              ? r.publisher
              : r.topics[0] || "Accounting Agents"}
          </span>
        </div>
        <CardTitle role="heading" aria-level={3}>
          <a href={`/records/${r.id}`}>{r.title}</a>
        </CardTitle>
        <CardDescription>{r.summary}</CardDescription>
      </CardHeader>
      <CardFooter>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          {r.kind === "source" ? (
            <>
              <span>{r.jurisdiction || "Scope varies"}</span>
              <span aria-hidden="true">·</span>
              <span>
                {String(
                  r.data.published_or_status || "Publication date not recorded",
                )}
              </span>
              <span aria-hidden="true">·</span>
              <span>{status}</span>
            </>
          ) : (
            <>
              <span>{r.source_ids.length} cited sources</span>
              <span aria-hidden="true">·</span>
              <span>{r.id}</span>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
