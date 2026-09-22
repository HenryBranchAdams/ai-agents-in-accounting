import type { CorpusRecord } from "./corpus";
import type { EvidencePreview } from "./evidence-preview-contract";
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown, fallback = "Unknown or not recorded") => typeof value === "string" && value.trim() ? value : fallback;
const values = (value: unknown): string[] => Array.isArray(value) ? value.flatMap(values) : typeof value === "string" && value.trim() ? [value] : [];
export function safeOriginalUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

// Pure server-side projection. The resolver makes source ownership explicit;
// the browser receives this DTO, never the source records or corpus module.
export function buildEvidencePreview(ownerId: string, edition: string, finding: unknown, resolve: (id: string) => CorpusRecord | undefined): EvidencePreview {
  const f = object(finding);
  const ids = [...new Set(values(f.source_ids))];
  return {
    owner_id: ownerId, owner_href: `/records/${encodeURIComponent(ownerId)}`, corpus_version: edition,
    claim: text(f.claim, "Finding text unavailable"), classification: text(f.classification, "Recorded synthesis"),
    qualification: text(f.qualification, "Qualification not recorded; inspect the owner record before relying on this finding."),
    locator: text(f.locator, "Precise finding locator not recorded. Inspect each source record for its separate review locators."),
    locator_scope: "finding",
    sources: ids.map(id => {
      const source = resolve(id), data = object(source?.data), review = object(data.source_review);
      const rights = Object.entries(object(source?.rights)).map(([label, value]) => ({
        label: label.replaceAll("_", " "), value: value === null || value === undefined ? "Unknown or not recorded" : typeof value === "string" ? value : JSON.stringify(value),
      }));
      return {
        id, href: `/records/${encodeURIComponent(id)}`, available: !!source, title: source ? text(source.title, "Title unavailable") : null,
        publisher: text(source?.publisher), summary: text(source?.summary, "Source summary unavailable"),
        original_url: safeOriginalUrl(source?.source_url), review_status: text(source?.review_status), reviewed_at: text(source?.reviewed_at),
        review_scope: text(review.review_scope || review.review_level), review_locator: text(review.source_locator),
        access: [data.access, data.access_note].flatMap(values).join(" · ") || "Access unknown or not recorded",
        rights: rights.length ? rights : [{ label: "Source permissions", value: "Unknown or not recorded" }],
        limitations: [...new Set([...values(data.limitations), ...values(review.limitations)])],
      };
    }),
  };
}
