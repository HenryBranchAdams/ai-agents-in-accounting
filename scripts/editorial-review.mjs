import { createHash } from "node:crypto";

// Hash the complete canonical dependency, excluding its edited brief to avoid
// self-reference. Object key order is immaterial; array order remains meaningful.
export function editorialHash(record) {
  const value = structuredClone(record);
  if (value.data) delete value.data.editorial_brief;
  const stable = (v) =>
    Array.isArray(v)
      ? v.map(stable)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.keys(v)
              .sort()
              .map((k) => [k, stable(v[k])]),
          )
        : v;
  return createHash("sha256")
    .update(JSON.stringify(stable(value)))
    .digest("hex");
}
export function editorialReviewReport(records) {
  const byId = new Map(records.map((r) => [r.id, r]));
  return records
    .filter((r) => r.data.editorial_brief?.reading)
    .map((r) => {
      const review = r.data.editorial_brief.reading.review;
      const changed = review.dependencies
        .filter(
          (d) =>
            !byId.has(d.record_id) ||
            editorialHash(byId.get(d.record_id)) !== d.sha256,
        )
        .map((d) => d.record_id);
      return {
        record_id: r.id,
        reviewed_at: review.reviewed_at,
        status: changed.length
          ? "editorial-review-needed"
          : "dependencies-unchanged",
        changed_dependencies: changed,
      };
    });
}
