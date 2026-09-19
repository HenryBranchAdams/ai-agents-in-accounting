import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const packageName = "data/research/nonprofit-completion-2026-09-19.json";
const inventoryName = "data/research/nonprofit-completion-inventory-2026-09-19.json";
const corpusKinds = ["source", "guide", "workflow", "control", "example"];
const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const json = value => JSON.stringify(value, null, 2) + "\n";
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const rootOf = () => path.resolve(process.env.NONPROFIT_COMPLETION_ROOT || process.cwd());
const rel = (root, file) => path.join(root, file);
const packageAt = root => read(rel(root, packageName));
const fail = message => { throw new Error(message); };

function assertGitWorktree(root) {
  const inside = execFileSync("git", ["-C", root, "rev-parse", "--is-inside-work-tree"], { encoding: "utf8" }).trim();
  assert.equal(inside, "true", `${root}: applied validation requires a Git worktree`);
}

function assertHead(root, pkg) {
  const head = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  assert.equal(head, pkg.base_commit, `Expected exact package base ${pkg.base_commit}, found ${head}`);
}

function clone(value) { return JSON.parse(JSON.stringify(value)); }

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

function applyToRoot(root, { currentMode = false, dryRun = false } = {}) {
  const pkg = packageAt(root);
  assert.equal(pkg.schema_version, "1.0.0");
  const catalog=read(rel(root,'data/catalog.json')),version='2026-09-19.12420';
  if(currentMode)assert.ok(['2026-09-19.12419',version].includes(catalog.corpus_version),'Refuse unknown nonprofit integration edition before writes');
  else {assertGitWorktree(root);assertHead(root,pkg);}
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
    const records = read(rel(root, file));
    appendExact(records, pkg.records[kind] || [], file);
    if (kind === "source") applySourceRevisions(records, pkg.source_revisions, file);
    planJson(file, records);
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

  if(currentMode){for(const file of ['data/coverage/subsector-profiles.json','data/coverage/subsector-screening.json']){const v=read(rel(root,file));v.corpus_version=version;planJson(file,v);}const file='data/research-questions.json',fixtures=read(rel(root,file));appendExact(fixtures,read(rel(root,'data/research/nonprofit-retrieval-2026-09-19.json')),file);planJson(file,fixtures);}
  if(!dryRun)for (const [file, body] of planned) {
    const existing = fs.existsSync(rel(root, file)) ? fs.readFileSync(rel(root, file), "utf8") : null;
    if (existing !== body) fs.writeFileSync(rel(root, file), body);
  }
  return { files: [...planned.keys()], added_records: Object.values(pkg.records).reduce((n, records) => n + records.length, 0), revised_sources: pkg.source_revisions.length, named_questions: questions.questions.length, assessments: assessments.assessments.length };
}

function assertSnapshotSelfMetadata(root) {
  const manifest = read(rel(root, "data/coverage/snapshots.json"));
  const entries = manifest.snapshots || [];
  assert.ok(entries.length > 0, "snapshot history is empty");
  for (const entry of entries) {
    const snapshot = read(rel(root, `data/coverage/${entry.path}`));
    assert.equal(snapshot.id, entry.id);
    assert.ok(snapshot.assessment_version, `${entry.id}: historical snapshot must retain its own assessment version`);
    assert.ok(snapshot.corpus_version, `${entry.id}: historical snapshot must retain its own corpus version`);
    assert.ok(snapshot.topology_version, `${entry.id}: historical snapshot must retain its own topology version`);
  }
  return entries.length;
}

function copyPackageAndScript(sourceRoot, targetRoot) {
  for (const file of [packageName, inventoryName, "scripts/integrate-nonprofit-completion.mjs"]) {
    const destination = rel(targetRoot, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(rel(sourceRoot, file), destination);
  }
  const candidates = [
    process.env.NONPROFIT_NODE_MODULES,
    path.join(sourceRoot, "node_modules"),
  ].filter(Boolean);
  const modules = candidates.find(candidate => fs.existsSync(candidate));
  if (modules && !fs.existsSync(rel(targetRoot, "node_modules"))) fs.symlinkSync(modules, rel(targetRoot, "node_modules"), "dir");
}

function runAppliedValidation(sourceRoot) {
  assertGitWorktree(sourceRoot);
  const pkg = packageAt(sourceRoot);
  // The disposable copy is pinned to the package base; the source checkout may be a later integration.
  const tempRoot = path.join(os.tmpdir(), `aa-i117-applied-${process.pid}-${Date.now()}`);
  let cloned = false;
  try {
    execFileSync("git", ["clone", "--local", "--no-hardlinks", sourceRoot, tempRoot], { stdio: "pipe" });
    cloned = true;
    execFileSync("git", ["-C", tempRoot, "checkout", "--detach", pkg.base_commit], { stdio: "pipe" });
    copyPackageAndScript(sourceRoot, tempRoot);
    const before = execFileSync("git", ["-C", sourceRoot, "status", "--porcelain"], { encoding: "utf8" });
    const result = applyToRoot(tempRoot);
    execFileSync(process.execPath, ["scripts/coverage-mappings.mjs"], { cwd: tempRoot, stdio: "pipe" });
    const validated = execFileSync(process.execPath, ["scripts/validate.mjs"], { cwd: tempRoot, encoding: "utf8" });
    assertSnapshotSelfMetadata(tempRoot);
    const corpusVersion = read(rel(tempRoot, "data/catalog.json")).corpus_version;
    const currentRelease = rel(tempRoot, `data/releases/${corpusVersion}`);
    assert.ok(fs.existsSync(currentRelease), `expected preserved current release input: ${corpusVersion}`);
    fs.rmSync(currentRelease, { recursive: true, force: true });
    execFileSync(process.execPath, ["scripts/build.mjs"], { cwd: tempRoot, stdio: "pipe" });
    const lint = execFileSync("npm", ["run", "lint"], { cwd: tempRoot, encoding: "utf8" });
    const retrieval = execFileSync(process.execPath, ["--input-type=module", "-e", `import { executeAgent } from './dist/internal/agent.mjs';\nconst search=executeAgent('search',{q:'nonprofit endowment spending',limit:20});\nif(!search.results.some(r=>r.id==='guide-us-nonprofit-endowment-spending')) throw new Error('new guide not retrievable');\nconst got=executeAgent('get',{id:'guide-us-nonprofit-endowment-spending',limit:20});\nif(got.record.id!=='guide-us-nonprofit-endowment-spending') throw new Error('new guide get failed');\nif(!got.passages.some(p=>p.text.includes('underwater'))) throw new Error('expected passage missing');\ntry { executeAgent('search',{q:'nonprofit',limit:21}); throw new Error('limit 21 unexpectedly accepted'); } catch (error) { if (!String(error.message).match(/limit|20|maximum/i)) throw error; }\nconsole.log(JSON.stringify({search:search.results.length,passages:got.passages.length}));`], { cwd: tempRoot, encoding: "utf8" }).trim();
    const after = execFileSync("git", ["-C", sourceRoot, "status", "--porcelain"], { encoding: "utf8" });
    assert.equal(after, before, "applied validation changed the source worktree");
    return { temp_git_worktree: true, applied: result, validator_output: validated.trim(), lint_output: lint.trim(), snapshot_count: assertSnapshotSelfMetadata(tempRoot), build_staging: `removed only disposable current release ${corpusVersion}`, retrieval_output: retrieval };
  } finally {
    if (cloned) fs.rmSync(tempRoot, { recursive: true, force: true });
    else fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

export { applyToRoot, assertSnapshotSelfMetadata, runAppliedValidation };

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const root = rootOf();
  const mode = process.argv[2] || "--describe";
  if (mode === "--current") console.log(JSON.stringify(applyToRoot(root,{currentMode:true,dryRun:process.argv.includes('--dry-run')}),null,2));
  else if (mode === "--apply") console.log(JSON.stringify(applyToRoot(root), null, 2));
  else if (mode === "--validate-applied") console.log(JSON.stringify(runAppliedValidation(root), null, 2));
  else if (mode === "--describe") console.log(JSON.stringify({ package: packageName, inventory: inventoryName, base_commit: packageAt(root).base_commit, write_mode: "--apply only; source checkout is never mutated by default" }, null, 2));
  else fail("Usage: node scripts/integrate-nonprofit-completion.mjs --describe|--apply|--validate-applied");
}
