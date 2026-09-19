import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const packageName = "data/research/education-completion-2026-09-19.json";
const inventoryName = "data/research/education-completion-inventory-2026-09-19.json";
const corpusKinds = ["source", "guide", "workflow", "control", "example"];
const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const json = value => JSON.stringify(value, null, 2) + "\n";
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const rootOf = () => path.resolve(process.env.EDUCATION_COMPLETION_ROOT || process.cwd());
const rel = (root, file) => path.join(root, file);
const packageAt = root => read(rel(root, packageName));
const fail = message => { throw new Error(message); };
const clone = value => JSON.parse(JSON.stringify(value));

function assertGitWorktree(root) {
  const inside = execFileSync("git", ["-C", root, "rev-parse", "--is-inside-work-tree"], { encoding: "utf8" }).trim();
  assert.equal(inside, "true", `${root}: applied validation requires a Git worktree`);
}

function assertHead(root, pkg) {
  const head = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  assert.equal(head, pkg.base_commit, `Expected exact package base ${pkg.base_commit}, found ${head}`);
}

function appendExact(records, incoming, target) {
  const current = new Map(records.map(record => [record.id, record]));
  for (const record of incoming) {
    const prior = current.get(record.id);
    if (prior && !same(prior, record)) fail(`${target}:${record.id}: existing record differs; refusing overwrite`);
    if (!prior) { records.push(clone(record)); current.set(record.id, record); }
  }
}

function applySourceRevisions(records, revisions, target) {
  const positions = new Map(records.map((record, index) => [record.id, index]));
  for (const revision of revisions) {
    const index = positions.get(revision.id);
    assert.notEqual(index, undefined, `${target}:${revision.id}: expected existing source is absent`);
    const current = records[index];
    if (same(current, revision.after)) continue;
    if (!same(current, revision.before)) fail(`${target}:${revision.id}: current source is neither exact before nor exact accepted after; refusing overwrite`);
    records[index] = clone(revision.after);
  }
}

function sourceRecords(root) {
  const records = read(rel(root, "data/corpus/source.json"));
  return Array.isArray(records) ? records : records.records;
}

function assertDependencies(root, pkg) {
  const ids = new Set(sourceRecords(root).map(record => record.id));
  for (const id of pkg.dependencies?.required_existing_source_ids || []) {
    assert.ok(ids.has(id), `${id}: required shared nonprofit source dependency is absent; refusing staged write`);
  }
}

function assertSourceUrlBoundary(root, pkg) {
  const existing = new Map(sourceRecords(root).filter(record => record.source_url).map(record => [record.source_url, record.id]));
  const incoming = new Map();
  for (const record of pkg.records.source || []) {
    if (!record.source_url) continue;
    const duplicateIncoming = incoming.get(record.source_url);
    if (duplicateIncoming && duplicateIncoming !== record.id) fail(`source URL ${record.source_url} is duplicated by ${duplicateIncoming} and ${record.id}`);
    incoming.set(record.source_url, record.id);
    const existingId = existing.get(record.source_url);
    if (existingId && existingId !== record.id) fail(`${record.id}: publisher URL already belongs to ${existingId}; reuse that source ID instead of duplicating it`);
  }
}

function applyToRoot(root, { currentMode = false, dryRun = false } = {}) {
  const pkg = packageAt(root);
  assert.equal(pkg.schema_version, "1.0.0");
  const catalog=read(rel(root,'data/catalog.json')),version='2026-09-19.12420';
  if(currentMode)assert.ok(['2026-09-19.12419',version].includes(catalog.corpus_version),'Refuse unknown education integration edition before writes');
  else {assertGitWorktree(root);assertHead(root,pkg);}

  // All guards run before a planned file is written.
  assertDependencies(root, pkg);
  assertSourceUrlBoundary(root, pkg);
  const sourceIndex=new Map(read(rel(root,'data/corpus/source.json')).map(s=>[s.id,s]));
  for(const source of pkg.records.source||[])sourceIndex.set(source.id,source);
  for(const revision of pkg.source_revisions||[])sourceIndex.set(revision.id,revision.after);
  const sourceUrls=new Map();for(const source of sourceIndex.values())if(source.source_url){const existing=sourceUrls.get(source.source_url);if(existing&&existing!==source.id&&(pkg.records.source||[]).some(s=>s.id===source.id||s.id===existing))fail(`Duplicate proposed publisher URL ${source.source_url}`);sourceUrls.set(source.source_url,source.id);}
  const resolvePointer=(object,pointer)=>pointer.split('/').slice(1).reduce((v,k)=>v?.[k.replaceAll('~1','/').replaceAll('~0','~')],object);
  for(const question of pkg.questions)for(const locator of question.source_locators||[]){const source=sourceIndex.get(locator.source_id);assert.ok(source,`${question.id}: unknown locator source ${locator.source_id}`);for(const pointer of [locator.period_pointer,...(locator.locator_pointers||[])].filter(Boolean))assert.notEqual(resolvePointer(source,pointer),undefined,`${question.id}: missing source pointer ${locator.source_id}${pointer}`);}
  const planned = new Map();
  const planJson = (file, value) => {const original=fs.readFileSync(rel(root,file),'utf8');let body=json(value);if(!/[^\x00-\x7f]/.test(original)&&/\\u[0-9a-f]{4}/i.test(original))body=body.replace(/[\u007f-\uFFFF]/g,c=>`\\u${c.charCodeAt(0).toString(16).padStart(4,'0')}`);planned.set(file,body);};
  if(currentMode){const note=` Edition ${version} adds selected nonprofit and education completion research with separate FASB, GASB and federal-award routes.`;if(!catalog.coverage_note.includes(note))catalog.coverage_note+=note;const review=` Edition ${version} records bounded nonprofit and education source reviews, synthetic examples and unresolved applicability.`;if(!catalog.review_note.includes(review))catalog.review_note+=review;catalog.corpus_version=version;planJson('data/catalog.json',catalog);}

  for (const kind of corpusKinds) {
    const file = `data/corpus/${kind}.json`;
    const raw = read(rel(root, file));
    const records = Array.isArray(raw) ? raw : raw.records;
    appendExact(records, pkg.records[kind] || [], file);
    if (kind === "source") applySourceRevisions(records, pkg.source_revisions || [], file);
    planJson(file, Array.isArray(raw) ? records : { ...raw, records });
  }

  const questionsFile = "data/coverage/research-questions.json";
  const questions = read(rel(root, questionsFile));
  const beforeQuestionCount=questions.questions.length;
  appendExact(questions.questions, pkg.questions, `${questionsFile}.questions`);
  if(currentMode){questions.question_set_version=version;questions.corpus_version=version;}
  planJson(questionsFile, questions);

  const assessmentsFile = "data/coverage/assessments.json";
  const assessments = read(rel(root, assessmentsFile));
  appendExact(assessments.assessments, pkg.assessments, `${assessmentsFile}.assessments`);
  if(currentMode)assessments.assessment_version=version;
  planJson(assessmentsFile, assessments);

  const overridesFile = "data/coverage/mapping-overrides.json";
  const overrides = read(rel(root, overridesFile));
  for (const [id, incoming] of Object.entries(pkg.mapping_overrides)) {
    const current = overrides.records[id];
    if (current && !same(current, incoming)) fail(`${overridesFile}.records.${id}: existing override differs; refusing overwrite`);
    if (!current) overrides.records[id] = clone(incoming);
  }
  if(currentMode){overrides.mapping_version=version;overrides.updated_at=pkg.reviewed_at;}
  planJson(overridesFile, overrides);

  const criteriaFile = "data/coverage/research-criteria.json";
  const criteria = read(rel(root, criteriaFile));
  const patch = pkg.criteria_patch;
  assert.equal(criteria.population.named_research_questions, currentMode?beforeQuestionCount:patch.expected_named_research_questions, `${criteriaFile}: named-question denominator changed unexpectedly`);
  if(!currentMode)assert.equal(questions.questions.length, patch.result_named_research_questions, `${criteriaFile}: package question count mismatch`);
  criteria.population.named_research_questions = questions.questions.length;
  planJson(criteriaFile, criteria);

  if(currentMode){for(const file of ['data/coverage/subsector-profiles.json','data/coverage/subsector-screening.json']){const v=read(rel(root,file));v.corpus_version=version;planJson(file,v);}const file='data/research-questions.json',fixtures=read(rel(root,file));appendExact(fixtures,read(rel(root,'data/research/education-retrieval-2026-09-19.json')),file);planJson(file,fixtures);}
  if(!dryRun)for (const [file, body] of planned) {
    const existing = fs.existsSync(rel(root, file)) ? fs.readFileSync(rel(root, file), "utf8") : null;
    if (existing !== body) fs.writeFileSync(rel(root, file), body);
  }
  return { files: [...planned.keys()], added_records: Object.values(pkg.records).reduce((n, records) => n + records.length, 0), revised_sources: (pkg.source_revisions || []).length, named_questions: questions.questions.length, assessments: assessments.assessments.length, required_dependencies: pkg.dependencies?.required_existing_source_ids || [] };
}

function seedPendingNonprofitSources(sourceRoot, targetRoot) {
  const dependencyRoot = process.env.EDUCATION_NONPROFIT_ROOT || sourceRoot;
  const pending = read(path.join(dependencyRoot, "data/research/nonprofit-completion-2026-09-19.json"));
  // The disposable validation copy receives the whole pending package so that
  // its source related_ids resolve. The author checkout is never changed.
  for (const kind of corpusKinds) {
    const file = `data/corpus/${kind}.json`;
    const raw = read(rel(targetRoot, file));
    const records = Array.isArray(raw) ? raw : raw.records;
    appendExact(records, pending.records[kind] || [], `${file} disposable nonprofit seed`);
    if(kind==='source')applySourceRevisions(records,pending.source_revisions||[],file);
    fs.writeFileSync(rel(targetRoot, file), json(Array.isArray(raw) ? records : { ...raw, records }));
  }
}

function copyPackageAndScript(sourceRoot, targetRoot) {
  for (const file of [packageName, inventoryName, "scripts/integrate-education-completion.mjs"]) {
    const destination = rel(targetRoot, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(rel(sourceRoot, file), destination);
  }
  const modules = path.join(sourceRoot, "node_modules");
  if (fs.existsSync(modules) && !fs.existsSync(rel(targetRoot, "node_modules"))) fs.symlinkSync(modules, rel(targetRoot, "node_modules"), "dir");
}

function runAppliedValidation(sourceRoot) {
  assertGitWorktree(sourceRoot);
  const pkg = packageAt(sourceRoot);
  // The disposable copy is pinned to the package base; the source checkout may be a later integration.
  const tempRoot = path.join(os.tmpdir(), `aa-i111-applied-${process.pid}-${Date.now()}`);
  try {
    execFileSync("git", ["clone", "--local", "--no-hardlinks", sourceRoot, tempRoot], { stdio: "pipe" });
    execFileSync("git", ["-C", tempRoot, "checkout", "--detach", pkg.base_commit], { stdio: "pipe" });
    copyPackageAndScript(sourceRoot, tempRoot);
    seedPendingNonprofitSources(sourceRoot, tempRoot);
    const before = execFileSync("git", ["-C", sourceRoot, "status", "--porcelain"], { encoding: "utf8" });
    const result = applyToRoot(tempRoot);
    execFileSync(process.execPath, ["scripts/coverage-mappings.mjs"], { cwd: tempRoot, stdio: "pipe" });
    const validated = execFileSync(process.execPath, ["scripts/validate.mjs"], { cwd: tempRoot, encoding: "utf8" });
    const catalog = read(rel(tempRoot, "data/catalog.json"));
    const currentRelease = rel(tempRoot, `data/releases/${catalog.corpus_version}`);
    assert.ok(fs.existsSync(currentRelease), `expected preserved current release input: ${catalog.corpus_version}`);
    fs.rmSync(currentRelease, { recursive: true, force: true });
    execFileSync(process.execPath, ["scripts/build.mjs"], { cwd: tempRoot, stdio: "pipe" });
    const retrieval = execFileSync(process.execPath, ["--input-type=module", "-e", `import { executeAgent } from './dist/internal/agent.mjs';\nconst ids=['guide-us-education-auxiliary-services','guide-us-education-federal-grants','guide-us-education-public-appropriations','guide-us-education-endowment-routing'];\nfor (const id of ids) { const got=executeAgent('get',{id,limit:20}); if (got.record.id !== id) throw new Error('guide get failed: '+id); }\nconst search=executeAgent('search',{q:'auxiliary services',limit:20});\nif (!search.results.some(r => r.id === 'guide-us-education-auxiliary-services')) throw new Error('auxiliary guide search failed');\ntry { executeAgent('search',{q:'education',limit:21}); throw new Error('limit 21 unexpectedly accepted'); } catch (error) { if (!String(error.message).match(/limit|20|maximum/i)) throw error; }\nconsole.log(JSON.stringify({search:search.results.length,got:ids.length}));`], { cwd: tempRoot, encoding: "utf8" }).trim();
    const after = execFileSync("git", ["-C", sourceRoot, "status", "--porcelain"], { encoding: "utf8" });
    assert.equal(after, before, "applied validation changed the source worktree");
    return { temp_git_worktree: true, applied: result, validator_output: validated.trim(), build: true, retrieval_output: retrieval };
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

export { applyToRoot, runAppliedValidation, assertDependencies, assertSourceUrlBoundary };

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const root = rootOf();
  const mode = process.argv[2] || "--describe";
  if (mode === "--current") console.log(JSON.stringify(applyToRoot(root,{currentMode:true,dryRun:process.argv.includes('--dry-run')}),null,2));
  else if (mode === "--apply") console.log(JSON.stringify(applyToRoot(root), null, 2));
  else if (mode === "--validate-applied") console.log(JSON.stringify(runAppliedValidation(root), null, 2));
  else if (mode === "--describe") console.log(JSON.stringify({ package: packageName, inventory: inventoryName, base_commit: packageAt(root).base_commit, dependencies: packageAt(root).dependencies, write_mode: "--apply only; source checkout is never mutated by default" }, null, 2));
  else fail("Usage: node scripts/integrate-education-completion.mjs --describe|--apply|--validate-applied");
}
