import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
const digest = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const httpUrl = value => typeof value === "string" && /^https?:\/\//.test(value);

export function applySourceReview(record, review, batch) {
  assert.equal(record.id, review.record_id);
  assert.equal(record.kind, "source");
  assert.ok(httpUrl(review.checked_url), `${record.id}: checked URL missing`);
  assert.ok((review.source_locator || review.review_level === "attempted-unresolved") && review.evidence_summary?.length >= 80, `${record.id}: substantive disposition missing`);
  assert.ok(review.checks?.length && review.limitations?.length, `${record.id}: check scope and limitations required`);
  assert.ok(["substantive-excerpt", "abstract-or-landing", "attempted-unresolved"].includes(review.review_level));
  assert.ok(["supported-scope", "corrected-association", "superseded-source", "unresolved-access", "unresolved-identity", "unresolved-currency", "unsupported-claim"].includes(review.disposition));
  const inputHash = digest(review);
  if (record.data.source_review?.input_sha256 === inputHash) return record;
  const updated = structuredClone(record);
  const corrections = review.corrections || {};
  // Missing/null proposed fields do not erase canonical publisher identity.
  for (const field of ["title", "summary", "source_url", "publisher", "source_type", "jurisdiction"]) {
    if (typeof corrections[field] === "string" && corrections[field].trim()) updated[field] = corrections[field];
  }
  if (corrections.source_url) assert.ok(httpUrl(corrections.source_url));
  if (corrections.data) for (const [key, value] of Object.entries(corrections.data)) {
    if (value !== null && value !== undefined) updated.data[key] = value;
  }
  for (const key of ["title", "summary"]) if (Object.hasOwn(updated.data, key)) updated.data[key] = updated[key];
  const previous = updated.data.source_review?.previous_review || {
    review_status: record.review_status, reviewed_at: record.reviewed_at,
  };
  const evidence = { ...review, reviewed_at: batch.reviewed_at, reviewer: batch.reviewer, previous_review: previous, input_sha256: inputHash };
  updated.data.source_review = evidence;
  updated.data.limitations = [...new Set([...(Array.isArray(updated.data.limitations) ? updated.data.limitations : []), ...review.limitations])];
  if (review.frameworks?.length) updated.data.frameworks = review.frameworks;
  const checked = ["supported-scope", "corrected-association", "superseded-source"].includes(review.disposition)
    && review.review_level !== "attempted-unresolved";
  if (checked) {
    updated.review_status = "source-checked";
    updated.reviewed_at = batch.reviewed_at;
  }
  updated.provenance = {
    ...record.provenance,
    reviewer: batch.reviewer,
    review_scope: `${review.review_level}: ${review.source_locator || "No substantive locator was accessible"}. ${review.evidence_summary}`,
    outcome: `${review.disposition}. Source currency, accounting applicability, professional review and reuse permission are not inferred from this check.`,
    source_review_attempted_at: batch.reviewed_at,
    source_review_evidence_pointer: "/data/source_review",
  };
  const rights = review.rights_review;
  if (rights?.status === "confirmed-license") {
    assert.ok(rights.license && httpUrl(rights.license_url) && rights.scope, `${record.id}: license claim lacks evidence`);
    updated.rights.source_status = "license-evidence-recorded";
    updated.rights.source_license = rights.license;
    updated.rights.source_license_url = rights.license_url;
    updated.rights.source_permission_scope = rights.scope;
  }
  updated.data.record_updated_at = batch.reviewed_at;
  return updated;
}

export function importSourceReviews(files) {
  const sources = read("data/corpus/source.json");
  const byId = new Map(sources.map(r => [r.id, r]));
  const topology = read("data/coverage/topology.json");
  const questions = new Set(topology.question_families.map(q => q.id));
  const industries = new Set(topology.industry_backbone.nodes.map(n => n.code));
  const overrides = read("data/coverage/mapping-overrides.json");
  const ledgerFile = "data/reviews/source-reviews.json";
  const ledger = fs.existsSync(ledgerFile) ? read(ledgerFile) : { schema_version: "1.0.0", review_version: "2026-09-11.1", reviews: [] };
  const reviews = new Map(ledger.reviews.map(r => [r.record_id, r]));
  const seen = new Set();
  for (const file of files) {
    const batch = read(file);
    assert.match(batch.reviewed_at, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(batch.reviewer);
    for (const review of batch.records) {
      assert.ok(!seen.has(review.record_id), `Duplicate input review: ${review.record_id}`); seen.add(review.record_id);
      assert.ok(byId.has(review.record_id), `Unknown source: ${review.record_id}`);
      for (const id of review.question_ids) assert.ok(questions.has(id), `Unknown question ${id}`);
      for (const code of review.industry_codes) assert.ok(industries.has(code), `Unknown industry ${code}`);
      assert.equal(review.industry_scope === "specific", review.industry_codes.length > 0);
      const updated = applySourceReview(byId.get(review.record_id), review, batch);
      byId.set(updated.id, updated);
      reviews.set(updated.id, updated.data.source_review);
      const checkedMapping = review.review_level !== "attempted-unresolved" && ["supported-scope", "corrected-association", "superseded-source"].includes(review.disposition);
      overrides.records[updated.id] = {
        replace_question_ids: true, question_ids: review.question_ids,
        industry_codes: review.industry_codes, industry_scope: review.industry_scope,
        basis_field: "/data/source_review/mapping_rationale", reason: review.mapping_rationale,
        reviewed_question_ids: checkedMapping ? review.question_ids : [],
        reviewed_industry_codes: checkedMapping ? review.industry_codes : [],
        reviewed_at: batch.reviewed_at,
        review_note: `${review.mapping_rationale} Association review scope: ${review.review_level}; ${review.disposition}. This does not establish accounting adequacy.`,
      };
    }
  }
  // Preflight every batch before writing any canonical file.
  fs.mkdirSync("data/reviews", { recursive: true });
  write("data/corpus/source.json", sources.map(r => byId.get(r.id)));
  write(ledgerFile, { ...ledger, reviews: [...reviews.values()].sort((a,b) => a.record_id.localeCompare(b.record_id)) });
  write("data/coverage/mapping-overrides.json", { ...overrides, mapping_version: "2026-09-11.3", updated_at: "2026-09-11" });
  return { records_with_dispositions: reviews.size, imported: seen.size };
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  assert.ok(process.argv.length > 2, "Provide reviewed source batch JSON paths.");
  console.log(importSourceReviews(process.argv.slice(2)));
}
