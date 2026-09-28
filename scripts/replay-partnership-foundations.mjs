import fs from 'node:fs';
import assert from 'node:assert/strict';
import {executeAgent} from '../dist/internal/agent.mjs';
import {getRecord,knowledge} from '../dist/internal/corpus.mjs';
const fixtures=JSON.parse(fs.readFileSync('data/research/partnership-foundations-retrieval-2026-09-27.json'));
const guide='guide-us-partnership-capital-basis';
const results=[];
for(const f of fixtures){
  const found=executeAgent('search',{q:f.search_query,kind:'guide',limit:5});
  const rank=found.results.findIndex(r=>r.id===guide)+1;
  assert.ok(rank>0,`${f.id}: guide missed`);
  const evidence=executeAgent('get',{id:guide,section:'data.research_questions',limit:20});
  const question=getRecord(guide).data.research_questions.find(q=>q.id===f.expected_question_id);
  // A gold passage is recovered only if the actual answer and exact source URL
  // are present in returned passages, not merely a matching token or fixture ID.
  const answerRecovered=evidence.passages.some(p=>p.text.includes(question.answer));
  const urlsRecovered=question.source_locators.filter(l=>evidence.passages.some(p=>p.text.includes(l.url))).length;
  const pointersRecovered=evidence.passages.some(p=>p.source_pointers.some(pointer=>pointer.startsWith(f.expected_pointer)));
  const citations=f.expected_source_ids.map(id=>executeAgent('get',{id,limit:1}).record.citation);
  for(const c of citations)assert.equal(c.original_source_url,getRecord(c.record_id).source_url);
  assert.ok(answerRecovered&&pointersRecovered);
  assert.equal(urlsRecovered,question.source_locators.length);
  results.push({id:f.id,rank,answer_recovered:answerRecovered,exact_locator_urls_recovered:urlsRecovered,expected_locator_urls:question.source_locators.length,question_pointer_recovered:pointersRecovered,unique_source_citations:citations.length,search_calls:1,guide_get_calls:1,source_get_calls:citations.length,repeated_source_gets:0,has_more_passages:Boolean(evidence.next_cursor)});
}
const negatives=[{q:'hospital Medicare cost report',kind:'guide',limit:5},{q:'partnership capital',kind:'guide',framework:'US GAAP',limit:5}].map(args=>{
  const ids=executeAgent('search',args).results.map(r=>r.id);assert.ok(!ids.includes(guide));return {args,unexpected_foundations_hit:false,ids};
});
const entityResult=executeAgent('search',{q:'partnership capital',kind:'guide',entity:'Partnership',limit:5});
assert.ok(entityResult.results.some(r=>r.id===guide));
const defaultPacket=executeAgent('get',{id:guide});
const scoped=executeAgent('get',{id:guide,section:'data.research_questions',limit:20});
const report={scope:'Deterministic local retrieval replay and authored counterfactual review; no hosted generator or empirical model-quality measurement.',positive_queries:results,negative_queries:negatives,default_packet:{passages:defaultPacket.passages.length,has_next_cursor:Boolean(defaultPacket.next_cursor),question_answers_recovered:getRecord(guide).data.research_questions.filter(q=>defaultPacket.passages.some(p=>p.text.includes(q.answer))).length,total_question_answers:4},gold_packet:{passages:scoped.passages.length,has_next_cursor:Boolean(scoped.next_cursor)},entity_filter_observation:{raw_scope:getRecord(guide).data.entity_scope,normalized_entities:knowledge.profile(guide).scope.entities,filtered_ids:entityResult.results.map(r=>r.id),before_fix:'Explicit record metadata dropped by the normalized index; agent filter rejected with INVALID_FILTER. No silent broadening.',disposition:'Explicit-only Partnership facet now retained and filter works. Roles and prose mentions do not infer this facet.'},counterfactual_output_review:[{candidate:'K-1 capital is 50000, therefore outside basis is 50000.',disposition:'unsupported despite gold evidence',reason:'The recovered capital answer requires liability and partner history; this is a reasoning/context-use defect if produced, not a retrieval miss.'},{candidate:'No section 754 election means no basis adjustment.',disposition:'contradicted despite gold evidence',reason:'Recovered transfer and distribution answers separately require statutory mandatory tests.'},{candidate:'The section 704(c) book schedule proves GAAP equity and the section 743(b) layer raises common basis.',disposition:'contradicted despite gold evidence',reason:'Recovered answers explicitly bar both inferences.'}],limits:['Counterfactual outputs were authored to probe boundaries; they are not observed model outputs.','Exact answer recovery tests text delivery, not correct professional interpretation.','Source get calls establish canonical citation identity; they do not refetch publishers.','The five queries are replayed independently; a shared session could reuse the same guide packet and deduplicate source fetches.']};
console.log(JSON.stringify(report,null,2));
