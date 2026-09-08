import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { executeAgent } from "../dist/internal/agent.mjs";

const fixtures = JSON.parse(fs.readFileSync("data/research-questions.json", "utf8"));

test("research-question fixtures are unique, bounded, and distinguish questions from search queries", () => {
  assert.ok(fixtures.length >= 20);
  assert.equal(new Set(fixtures.map((f) => f.id)).size, fixtures.length);
  for (const fixture of fixtures) {
    assert.ok(fixture.user_question.endsWith("?") || fixture.user_question.includes("?"));
    assert.ok(fixture.search_query && !fixture.search_query.endsWith("?"));
    assert.ok(fixture.expected_ids.length > 0);
    assert.ok(fixture.required_citations >= 1);
    assert.ok(fixture.expected_scope.length > 20);
    assert.ok(fixture.claims_assert_only_supported.length > 0);
    assert.equal(new Set(fixture.expected_ids).size, fixture.expected_ids.length);
    assert.equal(new Set(fixture.excluded_ids).size, fixture.excluded_ids.length);
    assert.equal(fixture.expected_ids.some((id) => fixture.excluded_ids.includes(id)), false);
  }
});

test("research questions retrieve expected records in the first five results and respect exclusions", () => {
  for (const fixture of fixtures) {
    const args = {
      q: fixture.search_query,
      limit: 5,
      ...(fixture.kind && fixture.kind !== "context" ? { kind: fixture.kind } : {}),
      ...fixture.filters,
    };
    const result = executeAgent("search", args);
    const ids = result.results.map((r) => r.id);
    for (const expected of fixture.expected_ids)
      assert.ok(ids.includes(expected), `${fixture.id}: expected ${expected} in first five results; got ${ids.join(", ")}`);
    for (const excluded of fixture.excluded_ids)
      assert.ok(!ids.includes(excluded), `${fixture.id}: excluded ${excluded} appeared in first five results`);
  }
});

const meaningfulTerms = (text) =>
  [...new Set(text.toLowerCase().match(/[a-z][a-z0-9-]{4,}/g) || [])].filter(
    (term) => !["which", "should", "where", "what", "does", "this", "that", "with", "from", "only"].includes(term),
  );

test("research questions retain citable records, rights, review state, and scoped evidence", () => {
  for (const fixture of fixtures) {
    const searchArgs = {
      q: fixture.search_query,
      limit: 5,
      ...(fixture.kind && fixture.kind !== "context" ? { kind: fixture.kind } : {}),
      ...fixture.filters,
    };
    const search = executeAgent("search", searchArgs);
    const expected = fixture.expected_ids.map((id) => {
      const hit = search.results.find((record) => record.id === id);
      assert.ok(hit, `${fixture.id}: expected record ${id} disappeared from search`);
      assert.ok(hit.citation.record_id === id);
      assert.ok(Object.hasOwn(hit, "rights"));
      assert.ok(Object.hasOwn(hit, "review_status"));
      return id;
    });
    const context = executeAgent("context", {
      ids: expected,
      max_chars: 40000,
      include_sources: true,
    });
    const contextIds = new Set(context.records.map((entry) => entry.record.id));
    for (const id of expected) {
      assert.ok(contextIds.has(id), `${fixture.id}: context omitted expected record ${id}`);
      const entry = context.records.find((candidate) => candidate.record.id === id);
      assert.ok(entry.record.rights);
      assert.ok(entry.record.review_status);
      assert.ok(entry.passages.length > 0, `${fixture.id}: no evidence passage for ${id}`);
      assert.ok(entry.record.citation.record_id === id);
    }
    const citedSourceCount = context.records.filter(
      (entry) => entry.record.kind === "source" && entry.record.citation.original_source_url,
    ).length;
    assert.ok(
      citedSourceCount >= Math.min(fixture.required_citations, context.records.length),
      `${fixture.id}: context exposed ${citedSourceCount} citable source records, required ${fixture.required_citations}`,
    );
    const expanded = context.records.map((entry) =>
      executeAgent("get", { id: entry.record.id, limit: 20 }),
    );
    const evidenceText = expanded
      .flatMap((entry) => [
        entry.record.title,
        entry.record.summary,
        entry.record.jurisdiction || "",
        entry.record.source_type || "",
        ...entry.passages.map((passage) => passage.text),
      ])
      .join(" ")
      .toLowerCase();
    const scopeTerms = meaningfulTerms(fixture.expected_scope);
    assert.ok(
      scopeTerms.some((term) => evidenceText.includes(term)),
      `${fixture.id}: expected scope has no supporting retrieved passage`,
    );
    for (const claim of fixture.claims_assert_only_supported) {
      const claimTerms = meaningfulTerms(claim);
      const boundaryClaim = /\b(?:not|no|exclude|does not|must not|without|cannot|separate|distinct)\b/i.test(claim);
      const excludedBoundaryHeld = boundaryClaim && fixture.excluded_ids.every((id) => !contextIds.has(id));
      assert.ok(
        claimTerms.some((term) => evidenceText.includes(term)) || excludedBoundaryHeld,
        `${fixture.id}: no retrieved evidence token supports claim boundary: ${claim}`,
      );
    }
  }
});
