import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { applyToRoot, runAppliedValidation } from "../scripts/integrate-nonprofit-completion.mjs";

const root = process.cwd();
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const pkg = read("data/research/nonprofit-completion-2026-09-19.json");
const source = read("data/corpus/source.json");
const byId = records => new Map(records.map(record => [record.id, record]));

const newIds = Object.values(pkg.records).flat().map(record => record.id);

test("package is source-only, stable-ID preserving, and carries original i117 criteria", () => {
  assert.equal(pkg.issue_id, 117);
  assert.equal(pkg.base_commit, "f393fd5a451bbfda6251be55dd420f03eddf3b3d");
  assert.deepEqual(pkg.preservation.history, "No catalog, release, snapshot, or existing historical object is changed by this source-only package.");
  assert.equal(new Set(newIds).size, newIds.length);
  assert.equal(pkg.questions.length, 4);
  assert.equal(pkg.assessments.length, 4);
  assert.ok(pkg.mapping_overrides.src_cfr200grants);
  assert.equal(pkg.issue_111_disposition.status, "partial-bounded-disposition");
  assert.ok(pkg.issue_111_disposition.remaining_routes.includes("auxiliary services such as housing and dining"));
});

test("authority records preserve locators, effective periods, source URLs and unresolved rights", () => {
  const records = byId(source);
  const fasb = byId(pkg.records.source).get("src_nonprofit_fasb_2020_07");
  const upmifa = byId(pkg.records.source).get("src_nonprofit_illinois_upmifa_2009");
  assert.equal(fasb.source_url, "https://storage.fasb.org/ASU%202020-07.pdf");
  assert.equal(fasb.rights.source_status, "unknown");
  assert.equal(fasb.rights.full_text_stored, false);
  assert.equal(fasb.data.effective_period.annual_periods_beginning_after, "2021-06-15");
  assert.ok(fasb.data.locators.some(locator => locator.paragraph === "958-605-45-7A"));
  assert.equal(upmifa.source_url, "https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=3093&ChapterID=61&Print=True");
  assert.equal(upmifa.rights.source_status, "unknown");
  for (const section of ["760 ILCS 51/2", "760 ILCS 51/3", "760 ILCS 51/6", "760 ILCS 51/7", "760 ILCS 51/11"])
    assert.ok(upmifa.data.locators.some(locator => locator.section === section), section);
  const before=pkg.source_revisions.find(revision=>revision.id==='src_cfr200grants').before;
  assert.deepEqual(records.get("src_cfr200grants").data.supplemental_reviews.find(review=>review.batch==='AA-I125'),before.data.supplemental_reviews.find(review=>review.batch==='AA-I125'));
  const cfrAfter = pkg.source_revisions.find(revision => revision.id === "src_cfr200grants").after;
  assert.ok(cfrAfter.data.supplemental_reviews.some(review => review.batch === "AA-I125"));
  assert.ok(cfrAfter.data.supplemental_reviews.some(review => review.batch === "AA-I117"));
});

test("synthetic fixtures reconcile and include explicit counterexamples", () => {
  const examples = byId(pkg.records.example);
  const endowment = examples.get("example-us-nonprofit-endowment-rollforward");
  const donated = examples.get("example-us-nonprofit-contributed-nonfinancial-assets");
  const federal = examples.get("example-us-nonprofit-federal-reporting-bridge");
  for (const example of [endowment, donated, federal]) {
    assert.ok(Array.isArray(example.data.examples) && example.data.examples.length);
    assert.ok(example.data.limitations.some(text => text.includes("Synthetic")));
  }
  assert.equal(endowment.data.calculation.journal_balance_difference, 0);
  assert.equal(endowment.data.calculation.underwater_deficiency_independent_branch, 30000);
  assert.equal(donated.data.calculation.journal_balance_difference, 0);
  assert.equal(donated.data.calculation.unrecognized_volunteer_service, 4000);
  assert.equal(federal.data.calculation.journal_balance_difference, 0);
  assert.equal(federal.data.calculation.award_threshold_from_current_source_display, 1000000);
});

test("four named questions have dimensions, locators, limits and partial assessments", () => {
  for (const question of pkg.questions) {
    assert.equal(question.assessment_status, "partial");
    assert.ok(question.pointer.startsWith("/data/research_questions/"));
    assert.ok(question.source_locators.length);
    assert.ok(question.source_locators.every(locator => locator.period_pointer && locator.locator_pointers?.length));
    assert.equal(question.professional_review, "not-performed");
    assert.equal(question.empirical_support, "not-established");
    assert.ok(Object.values(question.dimensions).includes("partial"));
  }
  for (const assessment of pkg.assessments) {
    assert.equal(assessment.status, "partial");
    assert.equal(assessment.scope_kind, "industry");
    assert.equal(assessment.industry_code, "813");
    assert.ok(assessment.gaps.length && assessment.evidence_record_ids.length);
  }
});

test("APPLIED package validates in a disposable detached Git worktree and does not modify this worktree", () => {
  const before = execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" });
  const proof = runAppliedValidation(root);
  assert.equal(proof.temp_git_worktree, true);
  assert.ok(proof.snapshot_count >= 1);
  assert.match(proof.validator_output, /Corpus integrity verified/);
  assert.match(proof.retrieval_output, /search/);
  assert.equal(execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }), before);
});

test("AA-I125 preservation is a hard conflict boundary", () => {
  const tempRoot = path.join(os.tmpdir(), `aa-i117-conflict-${process.pid}-${Date.now()}`);
  let cloned = false;
  try {
    execFileSync("git", ["clone", "--local", "--no-hardlinks", root, tempRoot], { stdio: "pipe" });
    cloned = true;
    execFileSync("git", ["-C", tempRoot, "checkout", "--detach", pkg.base_commit], { stdio: "pipe" });
    for (const file of ["data/research/nonprofit-completion-2026-09-19.json", "scripts/integrate-nonprofit-completion.mjs"]) {
      const destination = path.join(tempRoot, file);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(path.join(root, file), destination);
    }
    execFileSync(process.execPath, ["scripts/integrate-nonprofit-completion.mjs", "--apply"], { cwd: tempRoot, stdio: "pipe" });
    const sourcePath = path.join(tempRoot, "data/corpus/source.json");
    const applied = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
    const cfr = applied.find(record => record.id === "src_cfr200grants");
    cfr.data.supplemental_reviews = cfr.data.supplemental_reviews.filter(review => review.batch !== "AA-I125");
    fs.writeFileSync(sourcePath, JSON.stringify(applied, null, 2) + "\n");
    assert.throws(() => execFileSync(process.execPath, ["scripts/integrate-nonprofit-completion.mjs", "--apply"], { cwd: tempRoot, stdio: "pipe" }), /refusing overwrite/);
  } finally {
    if (cloned) fs.rmSync(tempRoot, { recursive: true, force: true });
    else fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("amended Illinois and federal locators propagate through guide, registry and inventory",()=>{const inventory=read('data/research/nonprofit-completion-inventory-2026-09-19.json'),source=pkg.records.source.find(s=>s.id==='src_nonprofit_illinois_upmifa_2009'),guide=pkg.records.guide.find(g=>g.id==='guide-us-nonprofit-endowment-spending');assert.match(source.data.locators[5].section,/760 ILCS 51\/4/);assert.ok(guide.data.source_periods.find(s=>s.source_id===source.id).locator_pointers.includes('/data/locators/5'));const question=pkg.questions.find(q=>q.source_locators.some(l=>l.source_id===source.id));assert.ok(question.source_locators.find(l=>l.source_id===source.id).locator_pointers.includes('/data/locators/5'));const row=inventory.source_inventory.find(s=>s.id==='src_cfr200grants'),review=pkg.source_revisions.find(r=>r.id==='src_cfr200grants').after.data.supplemental_reviews.find(r=>r.batch==='AA-I117');assert.equal(row.locators[0].locator,review.locator);assert.match(row.locators[0].locator,/200\.331\(a\)-\(b\)/);assert.equal(row.effective_period,review.effective_period);assert.equal(row.review_level,review.review_level);});
