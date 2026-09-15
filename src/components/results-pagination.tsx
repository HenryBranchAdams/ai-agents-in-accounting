import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "./ui/pagination";
export function ResultsPagination({
  page,
  pages,
  previous,
  next,
  label = "Results pages",
}: {
  page: number;
  pages: number;
  previous?: string;
  next?: string;
  label?: string;
}) {
  return (
    <Pagination aria-label={label} className="my-6">
      <PaginationContent>
        {previous && (
          <PaginationItem>
            <PaginationPrevious href={previous} />
          </PaginationItem>
        )}
        <PaginationItem>
          <span className="px-3 text-sm text-muted-foreground">
            Page {page} of {Math.max(1, pages)}
          </span>
        </PaginationItem>
        {next && (
          <PaginationItem>
            <PaginationNext href={next} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
