import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const read = f => JSON.parse(fs.readFileSync(f, "utf8"));
const write = (f, x) => fs.writeFileSync(f, JSON.stringify(x, null, 2) + "\n");
const hash = x => createHash("sha256").update(JSON.stringify(x)).digest("hex");
const ledger = read("data/reviews/editorial-reviews.json");
const files = fs.readdirSync("data/corpus").filter(f => f.endsWith(".json"));
const batches = new Map(files.map(f => [f, read(`data/corpus/${f}`)]));
const records = new Map([...batches.values()].flat().map(r => [r.id, r]));
const topology = read("data/coverage/topology.json");
const questions = new Set(topology.question_families.map(q => q.id));
const overrides = read("data/coverage/mapping-overrides.json");
assert.equal(new Set(ledger.reviews.map(r => r.record_id)).size, ledger.reviews.length);
for (const review of ledger.reviews) {
  const record = records.get(review.record_id);
  assert.ok(record && record.kind !== "source", `Unknown editorial record ${review.record_id}`);
  assert.ok(review.review_summary && review.remaining_limits.length);
  for (const id of review.question_ids) assert.ok(questions.has(id), id);
  if (!record.data.editorial_review) assert.equal(hash(record), review.input_sha256, `Changed input ${record.id}`);
  const previous = record.data.editorial_review?.previous_review || {review_status: record.review_status, reviewed_at: record.reviewed_at};
  record.data.editorial_review = {...review, reviewed_at: ledger.reviewed_at, reviewer: ledger.reviewer, previous_review: previous};
  record.review_status = "editorially-reviewed";
  record.reviewed_at = ledger.reviewed_at;
  record.provenance.editorial_review_pointer = "/data/editorial_review";
  record.provenance.editorial_review_scope = "Editorial content and mapping disposition; supporting source access, currency, rights and unresolved claims remain separate.";
  overrides.records[record.id] = {
    replace_question_ids: true, question_ids: review.question_ids,
    industry_codes: review.industry_codes, industry_scope: review.industry_codes.length ? "specific" : review.shared ? "shared-context" : "unassigned",
    basis_field: "/data/editorial_review/review_summary", reason: review.review_summary,
    reviewed_question_ids: review.question_ids, reviewed_industry_codes: review.industry_codes,
    reviewed_at: ledger.reviewed_at,
    review_note: "Reviewed association with the original editorial content. This does not validate accounting treatment or the adequacy of its external references.",
  };
}
for (const [file, rows] of batches) write(`data/corpus/${file}`, rows);
write("data/coverage/mapping-overrides.json", overrides);
console.log({editorial_dispositions: ledger.reviews.length});
