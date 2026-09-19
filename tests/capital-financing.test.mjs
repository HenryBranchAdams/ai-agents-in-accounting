import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { executeAgent } from "../dist/internal/agent.mjs";
import { meta, records } from "../dist/internal/corpus.mjs";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const packet = read("data/research/capital-financing-2026-09-18.json");
const byId = new Map(records.map((record) => [record.id, record]));

test("AA-I121 integrates seven US capital-financing families without dropping inherited questions", () => {
  assert.equal(meta.corpus_version, read("data/catalog.json").corpus_version);
  assert.equal(packet.families.length, 7);
  assert.equal(packet.families.reduce((count, family) => count + family.questions.length, 0), 14);
  for (const family of packet.families) {
    const guide = byId.get(`guide-${family.family_id}`);
    assert.ok(guide, `${family.family_id}: guide missing`);
    assert.ok(guide.data.research_questions.some((question) => question.id.startsWith("rq-") && !question.id.startsWith("rq-aa-i121-")));
    for (const question of family.questions) {
      const actual = guide.data.research_questions.find((candidate) => candidate.id === question.id);
      assert.ok(actual, `${question.id}: named question missing`);
      assert.equal(actual.family_id, family.family_id);
      assert.ok(actual.answer && actual.remaining_gaps.length);
      assert.equal(actual.assessment.professional_review, "not-performed");
      assert.equal(actual.assessment.empirical_support, "not-established");
      assert.ok(actual.source_locators.length >= 1);
    }
  }
});

test("AA-I121 source records preserve official locators, periods and unknown external rights", () => {
  for (const source of packet.sources) {
    const actual = byId.get(source.id);
    assert.ok(actual, `${source.id}: source missing`);
    assert.equal(actual.source_url, source.source_url);
    const review = actual.data.supplemental_reviews.find(item => item.batch === "AA-I121");
    assert.ok(review, `${source.id}: scoped review missing`);
    assert.equal(review.source_locator || review.locator, source.source_locator);
    assert.equal(review.effective_period, source.effective_period);
    assert.equal(actual.rights.full_text_stored, false);
    assert.equal(actual.rights.source_status, "unknown");
    assert.equal(actual.rights.source_license, null);
  }
  const custody = byId.get("guide-q-digital-assets").data.research_questions.find((question) => question.id === "rq-aa-i121-digital-custody");
  assert.equal(custody.assessment.status, "evidence-gap");
  assert.ok(custody.remaining_gaps.some((gap) => /customer contract|legal ownership/i.test(gap)));
  assert.ok(byId.get("guide-q-digital-assets").source_ids.includes("src_roadmap_ifric_crypto_2019"));
});

test("AA-I121 retrieval returns US authority and keeps custody ownership unresolved", () => {
  const crypto = executeAgent("search", { q: "ASU 2023-08 crypto assets fair value", kind: "source", limit: 10 });
  assert.ok(crypto.results.some((record) => record.id === "src_asu202308"));
  const custody = executeAgent("search", { q: "SAB 122 crypto safeguarding", kind: "source", limit: 10 });
  assert.ok(custody.results.some((record) => record.id === "src_secsab122"));
  const debt = executeAgent("search", { q: "debt issuance costs covenant", kind: "source", limit: 10 });
  assert.ok(debt.results.some((record) => record.id === "src_fasb_asu_201503_debt_costs"));

  const example = executeAgent("get", { id: "example-capital-financing-evidence", limit: 20 });
  assert.equal(example.record.citation.record_id, "example-capital-financing-evidence");
  assert.equal(example.record.rights.full_text_stored, false);
  assert.ok(example.passages.some((passage) => passage.text.includes("private key access proves ownership")));
  assert.ok(example.passages.every((passage) => passage.source_pointers.length > 0));

  const context = executeAgent("context", { ids: ["guide-q-digital-assets", "example-capital-financing-evidence"], include_sources: true, max_chars: 40000 });
  const contextIds = new Set(context.records.map((entry) => entry.record.id));
  assert.ok(contextIds.has("guide-q-digital-assets"));
  assert.ok(contextIds.has("example-capital-financing-evidence"));
  assert.ok(context.records.some((entry) => entry.record.source_ids.includes("src_secsab122")));
});

test("AA-I121 synthetic cases reconcile and do not authorize executed actions", () => {
  const cases = byId.get("example-capital-financing-evidence").data.examples;
  const debt = cases.find((item) => item.id === "capital-financing--debt-effective-interest");
  assert.equal(debt.reference_expectations.closing_carrying_amount, debt.input.opening_carrying_amount + debt.reference_expectations.amortization_of_issuance_cost);
  const award = cases.find((item) => item.id === "capital-financing--share-award");
  assert.equal(award.reference_expectations.cumulative_expense_after_four_months, 13333.33);
  const custody = cases.find((item) => item.id === "capital-financing--owned-vs-custody-crypto");
  assert.equal(custody.reference_expectations.private_key_access_proves_ownership, false);
  assert.equal(custody.reference_expectations.custody_gross_balance_sheet_asset, "unresolved");
  assert.ok(cases.every((item) => item.reference_expectations.executed_actions_must_be_empty));
});

test("AA-I121 correction preserves adoption cohorts and accurate source identity", () => {
  const credit = byId.get('src_fasb_asu_201613_credit_losses');
  const hedge = byId.get('src_fasb_asu_201712_hedging');
  const convertible = byId.get('src_fasb_asu_202006_convertibles');
  assert.match(credit.data.source_review.effective_period, /all others after 2022-12-15/);
  assert.match(hedge.data.source_review.effective_period, /2020-12-15; interim years after 2021-12-15/);
  for (const record of [credit, hedge]) {
    assert.equal(record.reviewed_at, '2026-09-19');
    assert.ok(record.data.effective_period_sources.some(ref => ref.source_id === 'src_fasb_asu_201910_effective_dates'));
    assert.ok(record.data.source_review.checks.some(check => check.url === 'https://storage.fasb.org/ASU%202019-10.pdf' && check.checked_at === '2026-09-19'));
  }
  assert.match(convertible.data.source_review.effective_period, /including interim periods/);
  assert.match(convertible.data.source_review.effective_period, /early adoption after 2020-12-15 at the annual period start/);
  assert.match(byId.get('src_fasb_asu_202502_crypto_safeguarding').title, /Liabilities \(Topic 405\).*Bulletin No\. 122/);
  assert.match(byId.get('src_sec_sab120_awards').data.source_review.publication_or_edition, /November 24, 2021/);
  const equity = read('data/coverage/assessments.json').assessments.find(assessment => assessment.id === 'coverage-aa-i121-equity-2026-09-18.121');
  assert.equal(equity.effective_from, null);
  assert.ok(equity.gaps.some(gap => gap.includes('mandatory SEC-filer') && gap.includes('early adoption')));
});
