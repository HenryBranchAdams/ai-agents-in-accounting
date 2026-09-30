import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
import {executeAgent} from '../dist/internal/agent.mjs';
import {search} from '../dist/internal/corpus.mjs';
// The helper has no separate production build artifact; compile its small module.
const bundled=buildSync({entryPoints:['src/knowledge.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {numericQuerySpecificity,numericTokens,expandQuery}=await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);

test('numeric specificity distinguishes whole numbers from longer, suffixed and decimal identifiers',()=>{
 for(const text of ['115','2015','15-T','15-A','15.2','1.15','p15','15a'])assert.equal(numericQuerySpecificity(numericTokens(text),['15']),0,text);
 for(const text of ['Publication 15 (2026)','section 15, appendix','15 / 30'])assert.equal(numericQuerySpecificity(numericTokens(text),['15']),1,text);
 assert.equal(numericQuerySpecificity(numericTokens('15 15 30'),['15','15','30']),2);
 assert.equal(numericQuerySpecificity(numericTokens('anything'),[]),0);
});

test('numeric ranking preserves substring candidates and complete pagination population',()=>{
 const q='Publication 15 payroll tax';
 const collect=limit=>{let cursor,total;const ids=[];do{const page=executeAgent('search',{q,limit,...(cursor?{cursor}:{})});total??=page.total;assert.equal(page.total,total);ids.push(...page.results.map(r=>r.id));cursor=page.next_cursor;}while(cursor);assert.equal(ids.length,total);assert.equal(new Set(ids).size,total);return ids;};
 const one=collect(1),many=collect(25);assert.deepEqual(one,many);
 for(const id of ['src_irs_pub15t_2026','src_professional_irs_pub15a_2026','src_aa_i115_irs_household_employer'])assert.ok(one.includes(id),`${id}: substring candidate retained`);
 assert.equal(one[0],'src_irs_pub15_2026');
 assert.ok(one.slice(0,5).includes('guide-q-indirect-tax'));
 assert.ok(one.slice(0,5).includes('guide-family-office-payroll-roles'));
});

test('queries without plain numeric terms retain zero specificity and specialist payroll route',()=>{
 for(const text of ['Publication 15','Publication 15-T','household payroll'])assert.equal(numericQuerySpecificity(numericTokens(text),[]),0);
 const payroll=executeAgent('search',{q:'US payroll employer benefits contribution FICA',limit:5}).results.map(r=>r.id);
 assert.ok(payroll.includes('guide-q-payroll'));
 assert.match(executeAgent('search',{q:'Publication 15',limit:5}).ranking,/exact plain-numeric query tokens first/);
});

test('quoted phrases and compound or decimal query terms keep existing expansion semantics',()=>{
 for(const q of ['"Publication 15"','Form 1042-S','Rule 1.15 45-day','704(c)','743(b)']){
  assert.deepEqual(expandQuery(q).filter(t=>/^\d+$/.test(t)),[],q);
 }
 assert.deepEqual(expandQuery('section 481').filter(t=>/^\d+$/.test(t)),['481']);
 const first=executeAgent('search',{q:'"Publication 15"',limit:5});
 const second=executeAgent('search',{q:'"Publication 15"',limit:5});
 assert.deepEqual(first.results.map(r=>r.id),second.results.map(r=>r.id));
});

test('full-record search shares numeric specificity while retaining substring candidates',()=>{
 const q='Publication 15 payroll tax';
 const result=search(new URLSearchParams({q,limit:'100'}));
 const ids=result.records.map(r=>r.id);
 assert.equal(ids[0],'src_irs_pub15_2026');
 for(const id of ['src_irs_pub15t_2026','src_professional_irs_pub15a_2026','src_aa_i115_irs_household_employer'])assert.ok(ids.includes(id));
 const pages=[];for(let page=1;page<=result.total;page++){
  const next=search(new URLSearchParams({q,limit:'1',page:String(page)}));assert.equal(next.total,result.total);pages.push(...next.records.map(r=>r.id));
 }
 assert.deepEqual(pages,ids);
 const specialist=executeAgent('search',{q:'payroll employer household processor',limit:5});
 assert.ok(specialist.results.some(r=>r.id==='guide-family-office-payroll-roles'));
});
