# Research-question fixtures

`data/research-questions.json` is a small, maintained set of realistic retrieval questions. It tests whether the corpus can lead a reader to relevant records while preserving scope boundaries.

Each fixture keeps the user's natural-language question (`user_question`) separate from the lexical retrieval query (`search_query`). The query is a search input, not a claim and not a substitute for a question-answering model. `expected_ids` are records expected in the first five results for the stated filters. `excluded_ids` capture jurisdiction or scope counterexamples that should not appear in a correctly filtered result.

The fixtures do not assert that a search result is authoritative, current, complete, professionally reviewed, or legally reusable. `required_citations` and `claims_assert_only_supported` define the minimum evidence discipline for a later answer evaluator. Source records retain their own rights and review status; these fixtures are project-owned CC-BY metadata.

The fixture tests exercise the retrieval contract as a small evidence loop: search expected records, call `get` for bounded passages and section metadata, assemble `context` with linked sources, and verify that citations, rights, review status, and scope terms survive. Negative claims are checked against the fixture's excluded IDs as well as retrieved evidence. The newcomer MCP walkthrough follows the same path through `describe`, the `bank rec` alias, `get` sections and relationships, bounded context, and original-source citation extraction.

When ranking changes, update a fixture only when the result is more useful for the question and preserve the reason in the change review. Do not pad expected IDs to make a weak search pass.

The September 11 construction expansion adds four cases for WIP workflow/brief retrieval, tax-transition qualifications and multistate boundaries. The existing record-to-report close question now explicitly filters its named topic while keeping both expected records. This scopes the query to its question as construction-close material enters the corpus; it does not change ranking weights. These tests check retrieval and the survival of citations and selected scope terms, not the substantive truth of an accounting conclusion.
