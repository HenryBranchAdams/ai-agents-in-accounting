import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const records=kind=>JSON.parse(readFileSync(`data/corpus/${kind}.json`));
const fixture=records('guide').find(r=>r.id==='guide-accounting-action-boundaries').data.approval_fixture;
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
const hash=value=>createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
// An offline illustration of decision ordering, never imported by the application.
function illustrate(payload,{state='prepared',authorized=true,now=fixture.nominal_check_time}={}){
 if(state!=='prepared')return 'reconcile-existing-intent';
 if(!authorized)return 'refuse-current-authority';
 if(Date.parse(now)>=Date.parse(payload.expires_at))return 'refuse-expired';
 if(hash(payload)!==fixture.fictional_approval.approved_payload_digest)return 'renew-review';
 return 'illustrative-checks-satisfied-no-execution';
}
test('approval illustration binds actual synthetic case evidence and does not confer real authority',()=>{
 const c=records('example').find(r=>r.id===fixture.source_case_id);
 assert.equal(fixture.payload.evidence_digest,c.data.review_packets.stronger.case_input_sha256);
 for(const id of fixture.source_document_ids)assert.ok(c.data.documents.some(d=>d.id===id));
 assert.equal(hash(fixture.payload),fixture.payload_digest);
 assert.equal(fixture.fictional_approval.actual_human_approval,null);
 assert.equal(c.data.review_packets.stronger.execution_authority,false);
 assert.equal(illustrate(fixture.payload),'illustrative-checks-satisfied-no-execution');
 const reversed=Object.fromEntries(Object.entries(fixture.payload).reverse());
 assert.equal(hash(reversed),fixture.payload_digest,'JSON key ordering does not silently change identity');
});
test('amount, destination, entity, period, evidence, policy and identity drift invalidate the old illustrative approval',()=>{
 for(const key of Object.keys(fixture.payload)){
  const changed=structuredClone(fixture.payload);
  changed[key]=typeof changed[key]==='number'?changed[key]+1:key==='expires_at'?'2026-06-03T12:00:00Z':`${changed[key]}-CHANGED`;
  assert.equal(illustrate(changed),'renew-review',key);
 }
 assert.equal(illustrate(fixture.payload,{authorized:false}),'refuse-current-authority');
 assert.equal(illustrate(fixture.payload,{now:fixture.payload.expires_at}),'refuse-expired');
 for(const state of ['submitted','ambiguous','verified'])assert.equal(illustrate(fixture.payload,{state}),'reconcile-existing-intent');
});
