import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {loadPacket, planIntegration, applyIntegration, normalizedUrl, overlay, digest, packetPath} from '../scripts/integrate-family-office-reference.mjs';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fo-reference-'));
  const copy = p => { fs.mkdirSync(path.dirname(path.join(root, p)), {recursive: true}); fs.cpSync(p, path.join(root, p), {recursive: true}); };
  for (const p of ['data/corpus', packetPath, 'schemas/record.schema.json', 'data/catalog.json', 'data/coverage/mapping-overrides.json', 'data/coverage/research-questions.json', 'data/coverage/subsector-profiles.json', 'data/coverage/subsector-screening.json', 'data/coverage/assessments.json']) copy(p);
  // The same tests work before import and against the integrated edition.
  return root;
}
const fileSnapshot = root => new Map(['source','guide','collection'].map(k => [`data/corpus/${k}.json`, fs.readFileSync(path.join(root, `data/corpus/${k}.json`))]));

test('reference packet reconstructs the exact original annotations and all reading paths', () => {
  const p = loadPacket();
  assert.equal(p.sources.length,112); assert.equal(p.topics.length,40); assert.equal(p.contexts.length,12); assert.equal(p.gaps.length,15);
  assert.equal(digest(p.sources),p.meta.sources_sha256);
  assert.equal(p.decisions.rows.filter(r=>r.disposition==='reuse').length,16);
  assert.equal(p.decisions.rows.filter(r=>r.disposition==='add').length,96);
  assert.equal(p.topics.flatMap(t=>t.questions).length,160);
  for (const s of p.sources) { assert.equal(s.verification.accounting_conclusions_validated,false); assert.equal(s.rights.external_full_text_stored,false); }
});
test('source identity retains meaningful fragment locators and rejects executable URLs', () => {
  assert.notEqual(normalizedUrl('https://asc.fasb.org/#topic-810'),normalizedUrl('https://asc.fasb.org/#topic-958'));
  assert.equal(normalizedUrl('https://example.com/a/?utm_source=x'),normalizedUrl('https://example.com/a'));
  assert.throws(()=>normalizedUrl('javascript:alert(1)'));
  assert.throws(()=>overlay({},JSON.parse('{"__proto__":{"x":1}}')));
});
test('planning validates all records and references without changing canonical bytes', () => {
  const root=fixture(); try {
    const before=fileSnapshot(root), p=planIntegration(root);
    assert.equal(p.counts.sources_added,96); assert.equal(p.counts.guides,54); assert.equal(p.additions.length,151);
    for (const [f,b] of before) assert.deepEqual(fs.readFileSync(path.join(root,f)),b);
    assert.equal(p.additions.filter(r=>r.data.family_office_reference?.type==='topic').flatMap(r=>r.data.family_office_reference.questions).every(q=>q.status==='discovery-question-not-answered'),true);
    assert.equal(p.additions.every(r=>r.reviewed_at===null),true);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('import preserves every existing record and named answer, then replays without changes', () => {
  const root=fixture(); try {
    const before=fileSnapshot(root), questions=read(path.join(root,'data/coverage/research-questions.json')).questions;
    const assessments=read(path.join(root,'data/coverage/assessments.json')).assessments;
    applyIntegration(root,{apply:true});
    for (const [f,b] of before) { const after=read(path.join(root,f)); for (const old of JSON.parse(b)) assert.deepEqual(after.find(r=>r.id===old.id),old,old.id); }
    assert.deepEqual(read(path.join(root,'data/coverage/research-questions.json')).questions,questions);
    assert.deepEqual(read(path.join(root,'data/coverage/assessments.json')).assessments,assessments);
    assert.equal(read(path.join(root,'data/coverage/assessments.json')).assessment_version,'2026-09-21.5');
    assert.equal(read(path.join(root,'data/coverage/research-questions.json')).question_set_version,'2026-09-21.5');
    const first=fileSnapshot(root), replay=applyIntegration(root,{apply:true});
    assert.equal(replay.changed.length,0); assert.equal(replay.written.length,0);
    for (const [f,b] of first) assert.deepEqual(fs.readFileSync(path.join(root,f)),b);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('a changed reused source fails before any canonical write', () => {
  const root=fixture(); try {
    const f=path.join(root,'data/corpus/source.json'), rows=read(f); rows.find(r=>r.id==='src_1os761s').summary+=' changed'; fs.writeFileSync(f,JSON.stringify(rows));
    const before=fileSnapshot(root); assert.throws(()=>applyIntegration(root,{apply:true}),/Reused source changed/);
    for (const [f,b] of before) assert.deepEqual(fs.readFileSync(path.join(root,f)),b);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('unexpected edition and a late mapping conflict fail before any write', () => {
  for (const mode of ['edition','mapping']) {
    const root=fixture(); try {
      const f=path.join(root,mode==='edition'?'data/catalog.json':'data/coverage/mapping-overrides.json'),v=read(f);
      if(mode==='edition')v.corpus_version='2099-01-01.1';else v.records['collection-family-office-reference']={note:'conflicting decision'};
      fs.writeFileSync(f,JSON.stringify(v)); const before=fileSnapshot(root);
      assert.throws(()=>applyIntegration(root,{apply:true}),mode==='edition'?/Unexpected corpus edition/:/Mapping conflict/);
      for(const[f,b]of before)assert.deepEqual(fs.readFileSync(path.join(root,f)),b);
    } finally {fs.rmSync(root,{recursive:true,force:true});}
  }
});
