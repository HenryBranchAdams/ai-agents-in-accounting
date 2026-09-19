import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { applyToRoot, runAppliedValidation } from "../scripts/integrate-education-completion.mjs";

const root = process.cwd();
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const pkg = read("data/research/education-completion-2026-09-19.json");
const byId = records => new Map(records.map(record => [record.id, record]));

function allCorpusIds() {
  return ["source", "guide", "workflow", "control", "example"].flatMap(kind => {
    const value = read(`data/corpus/${kind}.json`);
    const records = Array.isArray(value) ? value : value.records;
    return records.map(record => record.id);
  });
}

test("package preserves the accepted baseline and declares the four bounded completion routes", () => {
  assert.equal(pkg.issue_id, 111);
  assert.equal(pkg.base_commit, "66b0eda121cd9aee40857a2d691e25b18737f63e");
  assert.deepEqual(pkg.baseline.accepted_existing_record_ids.guide, ["guide-us-education-tuition-aid"]);
  assert.equal(pkg.questions.length, 4);
  assert.equal(pkg.assessments.length, 4);
  assert.equal(pkg.records.guide.length, 4);
  assert.equal(pkg.records.workflow.length, 4);
  assert.equal(pkg.records.control.length, 4);
  assert.equal(pkg.records.example.length, 4);
  assert.deepEqual(pkg.preservation.history, "No catalog, release, snapshot, or existing historical corpus object is changed by this source-only package.");
  assert.deepEqual(pkg.dependencies.required_existing_source_ids, ["src_nonprofit_fasb_2016_14", "src_nonprofit_illinois_upmifa_2009"]);
});

test("new source rights, original locators and shared-source boundaries are explicit", () => {
  const source = byId(pkg.records.source);
  const irs = source.get("src_education_irs_p598_auxiliary");
  assert.equal(irs.source_url, "https://www.irs.gov/publications/p598");
  assert.equal(irs.rights.source_status, "unknown");
  assert.equal(irs.rights.full_text_stored, false);
  assert.equal(irs.data.locators.length, 5);
  assert.ok(irs.data.locators.some(locator => locator.section.includes("Not substantially related")));
  assert.equal(pkg.source_revisions.length, 1);
  const gasb = pkg.source_revisions[0];
  assert.equal(gasb.id, "src_education_gasb35");
  assert.ok(gasb.after.data.locators.some(locator => locator.locator.includes("Paragraphs 50-52")));
  assert.ok(gasb.after.data.supplemental_reviews.some(review => review.batch === "AA-I111-education-completion"));
  assert.equal(pkg.records.source.some(record => record.source_url === "https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200"), false);
});

test("questions and assessments remain partial with source periods, limits and role boundaries", () => {
  for (const question of pkg.questions) {
    assert.equal(question.assessment_status, "partial");
    assert.ok(question.source_locators.length >= 2);
    assert.ok(question.source_locators.every(locator => locator.period_pointer));
    assert.equal(question.professional_review, "not-performed");
    assert.equal(question.empirical_support, "not-established");
    assert.ok(Object.values(question.dimensions).includes("partial"));
  }
  for (const assessment of pkg.assessments) {
    assert.equal(assessment.status, "partial");
    assert.equal(assessment.industry_code, "611");
    assert.ok(assessment.gaps.length);
    assert.ok(assessment.evidence_record_ids.length);
  }
});

test("synthetic bridges reconcile and include counterexamples", () => {
  const examples = byId(pkg.records.example);
  for (const id of ["example-us-education-auxiliary-services-bridge","example-us-education-federal-grant-bridge","example-us-education-public-appropriation-routing","example-us-education-endowment-rollforward"]) {
    const example = examples.get(id);
    assert.ok(example.data.origin.includes("Original synthetic"));
    assert.equal(example.data.calculation.journal_balance_difference, 0, id);
    assert.ok(example.data.counterexamples.length >= 2, id);
    assert.ok(example.data.limitations.some(text => text.includes("Synthetic")), id);
  }
  assert.equal(examples.get("example-us-education-auxiliary-services-bridge").data.calculation.deferred_revenue, 64000);
  assert.equal(examples.get("example-us-education-federal-grant-bridge").data.calculation.unrecognized_conditional_balance, 80000);
  assert.equal(examples.get("example-us-education-public-appropriation-routing").data.calculation.appropriation, 1200000);
  assert.equal(examples.get("example-us-education-endowment-rollforward").data.calculation.donor_restricted_ending, 1020000);
});

test("disposable applied validation stages shared nonprofit dependencies and leaves source checkout unchanged", () => {
  const before = execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" });
  const proof = runAppliedValidation(root);
  assert.equal(proof.temp_git_worktree, true);
  assert.match(proof.validator_output, /Corpus integrity verified/);
  assert.match(proof.retrieval_output, /search/);
  assert.equal(execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }), before);
});

test("staged application refuses an altered existing record before writing", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "aa-i111-conflict-"));
  try {
    execFileSync("git", ["clone", "--local", "--no-hardlinks", root, tempRoot], { stdio: "pipe" });
    execFileSync("git", ["-C", tempRoot, "checkout", "--detach", pkg.base_commit], { stdio: "pipe" });
    for (const file of ["data/research/education-completion-2026-09-19.json", "data/research/education-completion-inventory-2026-09-19.json", "scripts/integrate-education-completion.mjs"]) {
      const dest = path.join(tempRoot, file);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(path.join(root, file), dest);
    }
    const source = JSON.parse(fs.readFileSync(path.join(tempRoot, "data/corpus/source.json"), "utf8"));
    const nonprofit = JSON.parse(fs.readFileSync(path.join(root,"data/research/nonprofit-completion-2026-09-19.json"), "utf8"));
    for (const record of nonprofit.records.source.filter(record => pkg.dependencies.required_existing_source_ids.includes(record.id))) source.push(record);
    for(const revision of nonprofit.source_revisions){const index=source.findIndex(s=>s.id===revision.id);assert.deepEqual(source[index],revision.before);source[index]=revision.after;}
    fs.writeFileSync(path.join(tempRoot, "data/corpus/source.json"), JSON.stringify(source, null, 2) + "\n");
    execFileSync(process.execPath, ["scripts/integrate-education-completion.mjs", "--apply"], { cwd: tempRoot, stdio: "pipe" });
    const guidePath = path.join(tempRoot, "data/corpus/guide.json");
    const guides = JSON.parse(fs.readFileSync(guidePath, "utf8"));
    const guide = Array.isArray(guides) ? guides : guides.records;
    guide.find(record => record.id === "guide-us-education-auxiliary-services").summary = "tampered";
    fs.writeFileSync(guidePath, JSON.stringify(Array.isArray(guides) ? guide : { ...guides, records: guide }, null, 2) + "\n");
    assert.throws(() => execFileSync(process.execPath, ["scripts/integrate-education-completion.mjs", "--apply"], { cwd: tempRoot, stdio: "pipe" }), /refusing overwrite/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("endowment dependency locators resolve through the shared nonprofit records",()=>{const nonprofit=read('data/research/nonprofit-completion-2026-09-19.json'),sources=new Map([...read('data/corpus/source.json'),...nonprofit.records.source,...nonprofit.source_revisions.map(r=>r.after)].map(s=>[s.id,s]));const q=pkg.questions.find(q=>q.id==='rq-us-education-endowment-routing'),g=pkg.records.guide.find(g=>g.id===q.record_id);assert.deepEqual(g.data.source_locators,q.source_locators);for(const l of q.source_locators){assert.ok(l.locator_pointers.length);assert.deepEqual(g.data.source_periods.find(s=>s.source_id===l.source_id).locator_pointers,l.locator_pointers);for(const pointer of [l.period_pointer,...l.locator_pointers])assert.notEqual(pointer.split('/').slice(1).reduce((v,k)=>v?.[k],sources.get(l.source_id)),undefined,`${l.source_id}${pointer}`);}const il=q.source_locators.find(l=>l.source_id==='src_nonprofit_illinois_upmifa_2009');assert.ok(il.locator_pointers.includes('/data/locators/5'));assert.match(il.locator,/4\(a\)-\(c\)/);});
