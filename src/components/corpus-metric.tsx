import type { ReactNode } from "react";
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
export function CorpusMetric({
  title,
  value,
  total,
  note,
  href,
}: {
  title: string;
  value: number;
  total?: number;
  note: ReactNode;
  href?: string;
}) {
  return (
    <Card>
      <CardHeader className="min-h-20">
        <CardDescription>
          {href ? <a href={href}>{title}</a> : title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <span className="font-serif text-4xl tabular-nums">
          {value.toLocaleString("en-US")}
        </span>
        {total !== undefined && (
          <span className="ml-2 text-lg text-muted-foreground">/ {total}</span>
        )}
      </CardContent>
      <CardFooter className="mt-auto">
        <span className="text-xs text-muted-foreground">{note}</span>
      </CardFooter>
    </Card>
  );
}
