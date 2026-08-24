import {
  buildContextBundleMarkdown,
  publicResponse,
} from "../../agent-interface";
import { shiftMarkdownHeadings } from "../../domain-interface";
import { renderBenchmarkMarkdown, renderPacksMarkdown } from "../../platform-data";

export async function GET(request: Request) {
  return publicResponse(
    request,
    `${buildContextBundleMarkdown().trimEnd()}\n\n## Portable workflow packs\n\n${shiftMarkdownHeadings(renderPacksMarkdown(), 2).trimEnd()}\n\n## Accounting Agent Bench\n\n${shiftMarkdownHeadings(renderBenchmarkMarkdown(), 2).trimEnd()}\n`,
    "text/markdown; charset=utf-8",
    { headers: { "Content-Language": "en" } },
  );
}

export const HEAD = GET;
