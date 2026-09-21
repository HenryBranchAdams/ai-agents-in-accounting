import { SearchXIcon } from "lucide-react";
import { Button } from "./ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "./ui/empty";
export function NoResults({
  title = "No records match these filters.",
  description = "Try fewer words or broaden the topic and source filters.",
  href = "/library",
  action = "Browse all records",
}: {
  title?: string;
  description?: string;
  href?: string;
  action?: string;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle role="heading" aria-level={3}>
          {title}
        </EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild variant="outline">
          <a href={href}>{action}</a>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
