import type { CorpusRecord } from "../corpus";
import { ArrowRightIcon, DownloadIcon } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "./ui/card";
export function ReadingCard({
  record,
  kind,
}: {
  record: CorpusRecord;
  kind: "collection" | "brief";
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <Badge variant="outline">
          {kind === "brief" ? "Research brief · " : ""}
          {record.source_ids.length} sources
        </Badge>
        <CardTitle role="heading" aria-level={2}>
          <a href={`/records/${record.id}`}>{record.title}</a>
        </CardTitle>
        <CardDescription>{record.summary}</CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto">
        <Button asChild variant="outline" size="sm">
          <a
            href={
              kind === "collection"
                ? `/api/v1/collections/${record.id}`
                : `/records/${record.id}`
            }
            aria-label={`${kind === "brief" ? "Read brief" : "Bibliography"}: ${record.title}`}
          >
            {kind === "collection" ? "Bibliography JSON" : "Read brief"}
            {kind === "collection" ? (
              <DownloadIcon data-icon="inline-end" />
            ) : (
              <ArrowRightIcon data-icon="inline-end" />
            )}
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
