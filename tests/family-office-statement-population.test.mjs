import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';import {editorialHash} from '../scripts/editorial-review.mjs';import {validateSchema} from '../scripts/validate.mjs';
const id='example-family-office-statement-population',examples=JSON.parse(readFileSync(new URL('../data/corpus/example.json',import.meta.url))),record=examples.find(r=>r.id===id),fixture=record.data.statement_population;
// Test-side set derivation only; this corpus contains no statement ingestion engine.
function derive(f,scenario){
 const expected=f.expected_inventory.accounts.map(a=>a.id),byId=new Map(f.statements.map(s=>[s.id,s]));
 const deliveries=f.deliveries.filter(d=>scenario.delivery_ids.includes(d.id));assert.equal(deliveries.length,scenario.delivery_ids.length);
 const unique=[...new Set(deliveries.map(d=>d.statement_id))].map(id=>{assert.ok(byId.has(id));return byId.get(id);});
 const current=s=>s.period_start===f.target_period_start&&s.period_end===f.target_period_end;
 const selected=unique.filter(s=>current(s)&&expected.includes(s.account_id));assert.equal(new Set(selected.map(s=>s.account_id)).size,selected.length,'only one current statement per expected account in this fixture');
 const matched=expected.filter(a=>selected.some(s=>s.account_id===a));
 const absent=expected.filter(a=>!unique.some(s=>s.account_id===a));
 const staleOnly=expected.filter(a=>unique.some(s=>s.account_id===a)&&!selected.some(s=>s.account_id===a));
 const missing=expected.filter(a=>!matched.includes(a));const subtotal=selected.reduce((sum,s)=>sum+s.cash_cents,0);
 return {included:selected.map(s=>s.id).sort(),matched,absent,staleOnly,missing,unexpected:[...new Set(unique.filter(s=>!expected.includes(s.account_id)).map(s=>s.account_id))].sort(),stale:unique.filter(s=>!current(s)).map(s=>s.id).sort(),duplicates:deliveries.filter(d=>d.duplicate_of_delivery_id).map(d=>d.id).sort(),cash:Object.fromEntries(expected.map(a=>[a,selected.find(s=>s.account_id===a)?.cash_cents??null])),subtotal,total:missing.length?null:subtotal,raw:deliveries.reduce((sum,d)=>sum+byId.get(d.statement_id).cash_cents,0)};
}

test('statement population appends one original example and preserves every existing example',()=>{
 const prior=JSON.parse(execFileSync('git',['show','630e6e4:data/corpus/example.json'],{encoding:'utf8',maxBuffer:32*1024*1024}));assert.equal(examples.length,prior.length+1);assert.deepEqual(examples.filter(r=>r.id!==id),prior);
 validateSchema(record,JSON.parse(readFileSync('schemas/record.schema.json','utf8')),id);
 assert.deepEqual(record.source_ids,[]);assert.equal(record.rights.full_text_stored,false);assert.equal(fixture.classification,'original-synthetic');assert.match(fixture.scope,/independent fictional/);
 const self=record.data.editorial_brief.reading.review.dependencies.find(d=>d.record_id===id);assert.ok(self);assert.equal(self.sha256,editorialHash(record));
});

test('statement population derives missing, stale, duplicate and unexpected sets and scoped totals',()=>{
 for(const scenario of fixture.scenarios){const d=derive(fixture,scenario);
  assert.deepEqual(d.included,[...scenario.included_statement_ids].sort());assert.deepEqual(d.matched,scenario.current_expected_account_ids);
  assert.deepEqual(d.absent,scenario.absent_account_ids);assert.deepEqual(d.staleOnly,scenario.stale_only_account_ids);assert.deepEqual(d.missing,scenario.missing_current_account_ids);
  assert.deepEqual(d.unexpected,scenario.unexpected_account_ids);assert.deepEqual(d.stale,scenario.stale_statement_ids);assert.deepEqual(d.duplicates,scenario.duplicate_delivery_ids);assert.deepEqual(d.cash,scenario.account_current_cash_cents);
  assert.equal(d.subtotal,scenario.observed_current_expected_subtotal_cents);assert.equal(d.total,scenario.supplied_expected_set_total_cents);assert.equal(d.raw,scenario.raw_delivery_amount_sum_cents);
  assert.equal(d.matched.length,scenario.coverage.current_expected_accounts);assert.equal(fixture.expected_inventory.accounts.length,scenario.coverage.supplied_expected_accounts);
  assert.deepEqual(derive({...fixture,deliveries:[...fixture.deliveries].reverse()},scenario),d);
 }
 assert.equal(fixture.scenarios[0].observed_current_expected_subtotal_cents,5000000);assert.equal(fixture.scenarios[0].supplied_expected_set_total_cents,null);assert.equal(fixture.scenarios[0].raw_delivery_amount_sum_cents,12800000);
 assert.equal(fixture.scenarios[1].supplied_expected_set_total_cents,6600000);
});

test('statement population mutation checks expose missing current evidence without inflating amounts',()=>{
 const initial=fixture.scenarios[0];const removed={...initial,delivery_ids:initial.delivery_ids.filter(id=>id!=='DEL-B')};const less=derive(fixture,removed);
 assert.equal(less.subtotal,2000000);assert.deepEqual(less.missing,['I-CUSTODY','T-RESERVE','P-SAVINGS']);assert.equal(less.total,null);
 const duplicate=structuredClone(fixture);duplicate.deliveries.push({id:'DEL-A-THIRD',statement_id:'A',received_on:'2026-10-04',duplicate_of_delivery_id:'DEL-A'});
 const extra=derive(duplicate,{...initial,delivery_ids:[...initial.delivery_ids,'DEL-A-THIRD']});assert.equal(extra.subtotal,5000000);assert.equal(extra.total,null);assert.equal(extra.raw,14800000);
 const changed=structuredClone(fixture);changed.statements.find(s=>s.id==='X').cash_cents=99900000;const x=derive(changed,initial);assert.equal(x.subtotal,5000000);assert.deepEqual(x.unexpected,['X-UNKNOWN']);
 const wrongStart=structuredClone(fixture);wrongStart.statements.find(s=>s.id==='B').period_start='2026-08-01';assert.ok(derive(wrongStart,initial).missing.includes('I-CUSTODY'));
});

test('statement coverage cannot close inventory, ownership or permission questions and all references resolve',()=>{
 assert.equal(fixture.expected_inventory.independently_verified_complete,false);
 const later=fixture.scenarios[1];assert.equal(later.coverage.current_expected_accounts,later.coverage.supplied_expected_accounts);
 for(const scenario of fixture.scenarios){assert.equal(scenario.inventory_completeness,'not-established');for(const key of ['unexpected_account_membership','unexpected_account_owner','permission_to_spend'])assert.equal(scenario[key],null,key);assert.ok(scenario.open_questions.length>=3);assert.deepEqual(scenario.unexpected_account_ids,['X-UNKNOWN']);}
 const evidence=new Set(fixture.evidence_register.map(e=>e.id));assert.equal(evidence.size,fixture.evidence_register.length);assert.ok(fixture.evidence_register.every(e=>e.synthetic));assert.ok(evidence.has(fixture.expected_inventory.evidence_id));
 const statements=new Map(fixture.statements.map(s=>[s.id,s])),deliveries=new Map(fixture.deliveries.map(d=>[d.id,d]));assert.equal(statements.size,fixture.statements.length);assert.equal(deliveries.size,fixture.deliveries.length);
 for(const s of statements.values()){assert.ok(evidence.has(s.evidence_id));assert.equal(s.currency,fixture.currency);assert.equal(s.measure,'cash-component-only');assert.ok(Number.isSafeInteger(s.cash_cents));}
 for(const d of deliveries.values()){assert.ok(statements.has(d.statement_id));if(d.duplicate_of_delivery_id){const original=deliveries.get(d.duplicate_of_delivery_id);assert.ok(original);assert.equal(original.statement_id,d.statement_id);assert.equal(original.duplicate_of_delivery_id,null);assert.notEqual(original.id,d.id);}}
 const rows=record.data.editorial_brief.reading.example.rows;assert.deepEqual(rows.map(r=>r[0]),[...fixture.expected_inventory.accounts.map(a=>a.id),'X-UNKNOWN']);assert.ok(rows.every(r=>r.length===3));
});

test('statement population native exports and bounded retrieval preserve partial-total and inventory limits',async()=>{
 const [{getRecord,recordMarkdown,records},{executeAgent},{default:worker}]=await Promise.all([import('../dist/internal/corpus.mjs'),import('../dist/internal/agent.mjs'),import('./worker-fixture.mjs')]);const built=getRecord(id);assert.deepEqual(built,record);const byId=new Map(records.map(r=>[r.id,r]));for(const dep of built.data.editorial_brief.reading.review.dependencies){assert.ok(byId.has(dep.record_id));assert.equal(dep.sha256,editorialHash(byId.get(dep.record_id)),dep.record_id);}
 const response=await worker.fetch(new Request(`https://corpus.example/records/${id}`));assert.equal(response.status,200);const html=await response.text(),md=recordMarkdown(built);for(const marker of ['$50,000','$66,000','4/4','supplied inventory','Missing; unknown']){assert.ok(html.includes(marker),marker);assert.ok(md.includes(marker),marker);}
 const anchor=built.data.editorial_brief.reading.example.anchor;assert.ok(html.includes(`id="${anchor}"`));assert.ok(html.includes(`/records/${id}#${anchor}`));const directory=executeAgent('get',{id,limit:1});assert.ok(directory.sections.some(s=>s.id==='data.statement_population'));
 const passages=[],seen=new Set();let cursor;do{const result=executeAgent('get',{id,section:'data.statement_population',limit:3,...(cursor?{cursor}:{})});passages.push(...result.passages);cursor=result.next_cursor;if(cursor){assert.ok(!seen.has(cursor));seen.add(cursor);assert.ok(seen.size<100);}}while(cursor);
 const text=passages.map(p=>p.text).join('\n');for(const marker of ['not-established','X-UNKNOWN','missing_current_account_ids','supplied_expected_set_total_cents','permission_to_spend'])assert.ok(text.includes(marker),marker);assert.ok(passages.some(p=>p.source_pointers.some(s=>s.startsWith('/data/statement_population/'))));
});
