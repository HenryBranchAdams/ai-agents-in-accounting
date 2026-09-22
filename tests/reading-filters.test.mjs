import test from 'node:test';import assert from 'node:assert/strict';
import worker from './worker-fixture.mjs';
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&quot;','"');
test('filter chips name fields and preserve query, other restrictions and page-size when removing one',async()=>{
 const params=new URLSearchParams({q:'bank',kind:'source',jurisdiction:'United States',framework:'US GAAP',limit:'1',page:'2'});
 const html=await(await worker.fetch(new Request('https://corpus.example/library?'+params))).text();
 assert.match(html,/Type: Sources/);assert.match(html,/Framework: US GAAP/);assert.match(html,/total · Showing/);assert.match(html,/<details id="library-filters">/);assert.match(html,/whole corpus before filters/);
 const links=[...html.matchAll(/<a\b([^>]+)>/g)].map(m=>m[1]);
 const remove=links.find(s=>s.includes('aria-label="Remove Framework: US GAAP"'));assert.ok(remove);
 const url=new URL(decode(remove.match(/href="([^"]+)"/)[1]),'https://corpus.example');
 assert.equal(url.pathname,'/library');assert.equal(url.searchParams.get('q'),'bank');assert.equal(url.searchParams.get('kind'),'source');assert.equal(url.searchParams.get('jurisdiction'),'United States');assert.equal(url.searchParams.get('limit'),'1');assert.equal(url.searchParams.has('framework'),false);assert.equal(url.searchParams.has('page'),false);
 const clear=html.match(/href="([^"]+)"[^>]*>Clear filters/);assert.ok(clear);
 const cleared=new URL(decode(clear[1]),'https://corpus.example');assert.equal(cleared.searchParams.get('q'),'bank');assert.equal(cleared.searchParams.get('limit'),'1');assert.equal(cleared.searchParams.size,2);
});
test('native filter form retains less common fields and selected unknown facet values',async()=>{
 const html=await(await worker.fetch(new Request('https://corpus.example/library?entity=Unlisted+entity&product=Unlisted+product'))).text();
 for(const name of ['topic','jurisdiction','source_type','industry','framework','entity','product','naics','question_family','as_of'])assert.ok(html.includes(`name="${name}"`),name);
 for (const value of ["Unlisted entity", "Unlisted product"]) { const option = [...html.matchAll(/<option\b[^>]*>/g)].map(m=>m[0]).find(tag=>tag.includes(`value="${value}"`)); assert.ok(option, value); assert.ok(option.includes('selected=""'), value); }
});
