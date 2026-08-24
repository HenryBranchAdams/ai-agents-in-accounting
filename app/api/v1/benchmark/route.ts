import { benchmark, benchmarkCases, packs, renderBenchmarkMarkdown } from "../../../platform-data";
import { platformCollectionResponse, platformOptionsResponse } from "../../../platform-api";
import { problemResponse } from "../../../agent-interface";

const caseTypes = [...new Set(benchmarkCases.map((item) => item.case_type))];

export function OPTIONS() {
  return platformOptionsResponse();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim().toLowerCase() || "";
  const packId = url.searchParams.get("pack")?.trim() || "";
  const caseType = url.searchParams.get("case_type")?.trim() || "";
  if (query.length > 200) return problemResponse(request, 400, "Query too long", "The q parameter must contain 200 characters or fewer.");
  if (packId && !packs.some((pack) => pack.id === packId)) return problemResponse(request, 400, "Invalid pack", "Use one of the published workflow-pack IDs.", { allowed_values: packs.map((pack) => pack.id) });
  if (caseType && !caseTypes.includes(caseType)) return problemResponse(request, 400, "Invalid case type", "Use one of the published benchmark case types.", { allowed_values: caseTypes });
  const matches = benchmarkCases.filter((item) => {
    if (packId && item.pack_id !== packId) return false;
    if (caseType && item.case_type !== caseType) return false;
    return !query || JSON.stringify(item).toLowerCase().includes(query);
  });
  return platformCollectionResponse({
    request,
    collection: "benchmark_cases",
    allRecords: benchmarkCases,
    matches,
    renderMarkdown: renderBenchmarkMarkdown,
    filters: { q: query || null, pack: packId || null, case_type: caseType || null },
  });
}

export const HEAD = GET;

export const benchmarkMetadata = { benchmark, pack_count: packs.length };
