import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { pathToFileURL } from "node:url";

export const packetFiles = [
  "data/research/professional-services-2026-09-19.json",
  "data/research/arts-recreation-2026-09-19.json",
  "data/research/other-services-2026-09-19.json",
];
export const integratedVersion = "2026-09-19.12426";
const corpusKinds = ["source", "guide", "workflow", "control", "example"];
const read = (root, file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const clone = value => structuredClone(value);
const same = (left, right) => isDeepStrictEqual(left, right);
const json = value => JSON.stringify(value, null, 2) + "\n";
const resolvePointer = (value, pointer) => pointer.split("/").slice(1).reduce((current, key) => current?.[key.replaceAll("~1", "/").replaceAll("~0", "~")], value);

const stageJson = (root, staged, file, value) => {
  const original = fs.readFileSync(path.join(root, file), "utf8");
  let body = json(value);
  if (!/[^\x00-\x7f]/.test(original) && /\\u[0-9a-f]{4}/i.test(original)) {
    body = body.replace(/[\u007f-\uFFFF]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
  }
  staged.set(file, body);
};

const packetMapping = packet => packet.mapping_overrides?.records || packet.mapping_overrides || {};
const packetPrefix = file => file.includes("professional") ? "professional-services" : file.includes("arts") ? "arts-recreation" : "other-services";

function assertQuestionParity(question, embedded) {
  assert.ok(embedded, `${question.id}: embedded question is missing`);
  const normalized = embedded.assessment
    ? {
        ...embedded,
        assessment_status: embedded.assessment.status,
        professional_review: embedded.assessment.professional_review,
        empirical_support: embedded.assessment.empirical_support,
        dimensions: embedded.assessment.dimensions,
        dimension_basis: embedded.assessment.basis,
      }
    : embedded;
  for (const key of ["id", "question", "answer", "answer_status", "source_ids", "source_locators", "inputs", "workflow", "controls", "exceptions", "remaining_gaps", "professional_review", "empirical_support", "dimensions", "dimension_basis", "family_ids", "example_id", "assessment_status"]) {
    if (question[key] !== undefined && normalized[key] !== undefined) assert.deepEqual(normalized[key], question[key], `${question.id}: embedded ${key} differs`);
  }
}

function addExact(rows, incoming, target) {
  const byId = new Map(rows.map(row => [row.id, row]));
  for (const row of incoming) {
    const prior = byId.get(row.id);
    if (prior && !same(prior, row)) throw new Error(`${target}:${row.id}: existing object differs; refusing overwrite`);
    if (!prior) {
      rows.push(clone(row));
      byId.set(row.id, row);
    }
  }
}

export function retrievalRows(packet, file) {
  const prefix = packetPrefix(file);
  const fixtures = packet.retrieval_fixtures || {};
  const scope = packet.scope || {};
  const scopeLimits = scope.exclusions || scope.excluded || [];
  const scopeText = [scope.jurisdiction, scope.framework, scope.named_outcome, ...scopeLimits].filter(Boolean).join("; ");
  const userQuestions = {
    "professional-services": [
      "How does California Rule 1.15 govern disputed and undisputed client funds?",
      "How do engineering, accounting and staffing contracts differ from California legal client-money arrangements?",
    ],
    "arts-recreation": [
      "How should live-event advance ticketing and refunds flow to the ledger?",
      "How do museum memberships differ from donor-restricted contributions?",
      "How do gaming receipts, prizes and funds held for others reconcile?",
    ],
    "other-services": [
      "How do repair work orders separate service warranties and customer-owned equipment?",
      "How should funeral pre-need deposits follow the selected service milestone?",
      "How do member dues, donor restrictions and household payroll retain separate accounting treatment?",
    ],
  }[prefix];
  assert.equal(userQuestions.length, (fixtures.search || []).length, `${prefix}: curate each search question`);
  const rows = [];
  let index = 0;
  for (const fixture of fixtures.search || []) {
    const expected = fixture.expected_record_ids || fixture.expected_ids || [];
    const excluded = fixture.excluded_record_ids || fixture.excluded_ids || [];
    rows.push({
      id: `rq-${prefix}-retrieval-${index}`,
      user_question: userQuestions[index++],
      search_query: fixture.query,
      ...(fixture.kind ? { kind: fixture.kind } : {}),
      filters: fixture.filters || {},
      expected_ids: expected,
      excluded_ids: excluded,
      expected_scope: fixture.scope_assertion || scopeText || `Selected ${prefix} retrieval fixture; source and role limits remain explicit.`,
      required_citations: Array.isArray(fixture.required_citations) ? fixture.required_citations.length : fixture.required_citations || Math.max(2, expected.length),
      claims_assert_only_supported: excluded.length
        ? excluded.map(id => `This scoped query must not transfer the role or result represented by ${id}.`)
        : scopeLimits.slice(0, 2).map(limit => `The selected result remains bounded by this recorded limit: ${limit}`),
    });
  }
  return rows;
}

function packets(root) {
  return packetFiles.map(file => ({ file, packet: read(root, file) }));
}

function currentCorpus(root) {
  const corpus = Object.fromEntries(corpusKinds.map(kind => [kind, read(root, `data/corpus/${kind}.json`)]));
  const index = new Map();
  for (const [kind, rows] of Object.entries(corpus)) for (const row of rows) {
    if (index.has(row.id)) throw new Error(`Duplicate stable record in current corpus: ${row.id}`);
    index.set(row.id, { kind, row });
  }
  return { corpus, index };
}

function validatePackets(root, packetSet, index) {
  const sourceUrls = new Map();
  for (const { row } of index.values()) if (row.kind === "source" && row.source_url) sourceUrls.set(row.source_url, row.id);
  for (const { file, packet } of packetSet) {
    assert.equal(packet.status, "source-only-pending-integration", `${file}: source package status changed`);
    assert.notEqual(packet.package_version, packet.current_corpus_version, `${file}: package and corpus versions must stay distinct`);
    for (const row of [...packet.sources, ...packet.records]) {
      assert.ok(corpusKinds.includes(row.kind), `${file}:${row.id}: unsupported record kind`);
      if (row.data?.id !== undefined) assert.equal(row.data.id, row.id, `${file}:${row.id}: primary data.id mismatch`);
      const prior = index.get(row.id);
      if (prior && (!same(prior.row, row) || prior.kind !== row.kind)) throw new Error(`${file}:${row.id}: record conflict before writes`);
      if (row.kind === "source") {
        assert.ok(row.source_url, `${row.id}: source URL required`);
        const priorUrl = sourceUrls.get(row.source_url);
        if (priorUrl && priorUrl !== row.id) throw new Error(`${file}:${row.id}: publisher URL belongs to ${priorUrl}`);
        sourceUrls.set(row.source_url, row.id);
        for (const locator of row.data?.locators || []) if (locator.url) assert.equal(locator.url, row.source_url, `${row.id}: locator URL identity`);
      }
      index.set(row.id, { kind: row.kind, row });
    }
    for (const row of [...packet.sources, ...packet.records]) {
      for (const sourceId of row.source_ids || []) assert.equal(index.get(sourceId)?.kind, "source", `${row.id}: missing source ${sourceId}`);
      for (const relatedId of row.related_ids || []) assert.ok(index.has(relatedId), `${row.id}: missing related record ${relatedId}`);
    }
    const examples = new Set(packet.records.filter(row => row.kind === "example").map(row => row.id));
    for (const question of packet.question_rows) {
      const guide = index.get(question.record_id)?.row;
      assert.ok(guide, `${question.id}: missing guide record`);
      if (question.pointer) assertQuestionParity(question, resolvePointer(guide, question.pointer));
      else assertQuestionParity(question, guide.data?.research_questions?.find(candidate => candidate.id === question.id));
      if (question.example_id) assert.ok(examples.has(question.example_id), `${question.id}: missing packet example`);
      for (const locator of question.source_locators || []) {
        const source = index.get(locator.source_id)?.row;
        assert.equal(source?.kind, "source", `${question.id}: missing locator source`);
        assert.equal(locator.url, source.source_url, `${question.id}: locator URL identity`);
        assert.ok(locator.locator && (locator.effective_period || locator.source_period), `${question.id}: incomplete locator evidence`);
      }
    }
    for (const assessment of packet.assessments) {
      assert.equal(assessment.status, "partial", `${assessment.id}: source assessment must remain partial`);
      assert.ok(assessment.source_currency, `${assessment.id}: source currency must remain explicitly recorded`);
      for (const id of assessment.evidence_record_ids || []) assert.ok(index.has(id), `${assessment.id}: missing evidence ${id}`);
    }
  }
}

export function applyToRoot(root = process.cwd(), { currentMode = false, dryRun = false } = {}) {
  const catalog = read(root, "data/catalog.json");
  assert.ok(["2026-09-19.12425", integratedVersion].includes(catalog.corpus_version), `Refuse unexpected current edition ${catalog.corpus_version}`);
  const packetSet = packets(root);
  const { corpus, index } = currentCorpus(root);
  validatePackets(root, packetSet, index);
  const staged = new Map();
  const incomingRecords = Object.fromEntries(corpusKinds.map(kind => [kind, []]));
  const incomingQuestions = [], incomingAssessments = [], incomingMappings = {}, retrieval = [];
  for (const { file, packet } of packetSet) {
    incomingRecords.source.push(...packet.sources);
    for (const row of packet.records) incomingRecords[row.kind].push(row);
    incomingQuestions.push(...packet.question_rows);
    incomingAssessments.push(...packet.assessments);
    Object.assign(incomingMappings, packetMapping(packet));
    retrieval.push(...retrievalRows(packet, file));
  }
  for (const kind of corpusKinds) {
    addExact(corpus[kind], incomingRecords[kind], `data/corpus/${kind}.json`);
    stageJson(root, staged, `data/corpus/${kind}.json`, corpus[kind]);
  }
  const questions = read(root, "data/coverage/research-questions.json");
  addExact(questions.questions, incomingQuestions, "research questions");
  questions.corpus_version = integratedVersion;
  questions.question_set_version = integratedVersion;
  stageJson(root, staged, "data/coverage/research-questions.json", questions);
  const assessments = read(root, "data/coverage/assessments.json");
  addExact(assessments.assessments, incomingAssessments, "assessments");
  assessments.assessment_version = integratedVersion;
  stageJson(root, staged, "data/coverage/assessments.json", assessments);
  const mappings = read(root, "data/coverage/mapping-overrides.json");
  for (const [id, incoming] of Object.entries(incomingMappings)) {
    const prior = mappings.records[id];
    if (prior && !same(prior, incoming)) throw new Error(`mapping-overrides:${id}: existing mapping differs; refusing overwrite`);
    if (!prior) mappings.records[id] = clone(incoming);
  }
  mappings.mapping_version = integratedVersion;
  mappings.updated_at = "2026-09-19";
  stageJson(root, staged, "data/coverage/mapping-overrides.json", mappings);
  const criteria = read(root, "data/coverage/research-criteria.json");
  criteria.population.named_research_questions = questions.questions.length;
  stageJson(root, staged, "data/coverage/research-criteria.json", criteria);
  for (const file of ["data/coverage/subsector-profiles.json", "data/coverage/subsector-screening.json"]) {
    const value = read(root, file);
    value.corpus_version = integratedVersion;
    stageJson(root, staged, file, value);
  }
  const retrievalRowsExisting = read(root, "data/research-questions.json");
  addExact(retrievalRowsExisting, retrieval, "data/research-questions.json");
  stageJson(root, staged, "data/research-questions.json", retrievalRowsExisting);
  if (currentMode) {
    const note = ` Edition ${integratedVersion} adds bounded professional-services, arts and recreation, and other-services research with role-specific source limits and connected synthetic examples.`;
    const review = ` Edition ${integratedVersion} preserves prior records, coverage history and source rights; the three source packages remain partial and source currency, professional review and operational completeness are not established.`;
    if (!catalog.coverage_note.includes(note)) catalog.coverage_note += note;
    if (!catalog.review_note.includes(review)) catalog.review_note += review;
    catalog.corpus_version = integratedVersion;
    catalog.updated_at = "2026-09-19";
    stageJson(root, staged, "data/catalog.json", catalog);
  }
  if (!dryRun) {
    for (const [file, body] of staged) {
      if (fs.readFileSync(path.join(root, file), "utf8") !== body) fs.writeFileSync(path.join(root, file), body);
    }
  }
  return {
    dryRun,
    currentMode,
    version: integratedVersion,
    files: [...staged.keys()],
    records_added: incomingRecords.source.length + corpusKinds.filter(kind => kind !== "source").reduce((n, kind) => n + incomingRecords[kind].length, 0),
    sources_added: incomingRecords.source.length,
    questions_added: incomingQuestions.length,
    assessments_added: incomingAssessments.length,
    retrieval_fixtures_added: retrieval.length,
    named_questions: questions.questions.length,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const mode = process.argv[2];
  console.log(JSON.stringify(applyToRoot(process.cwd(), { currentMode: mode === "--current", dryRun: mode === "--dry-run" }), null, 2));
}
