import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { productionBrowser } from './browser-support/production.mjs';

const metadata=JSON.parse(fs.readFileSync('dist/internal/connections-index.json'));
const snapshot=JSON.parse(gunzipSync(fs.readFileSync('dist/client'+metadata.path)));
const connected=new Set(snapshot.edges.flatMap(edge=>[edge.from,edge.to]));
const isolate=snapshot.nodes.find(node=>!connected.has(node.id));
const shared='src_roadmap_naics2022_manual';
const sharedIncoming=snapshot.edges.filter(edge=>edge.to===shared&&edge.type==='cites');

test('real shared-source exploration, empty and stale states, failed chunks and late responses remain recoverable', {timeout:180000}, async t=>{
 const{browser,origin,directory,receipt}=await productionBrowser(t,'connections-recovery');
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const journey={name:'desktop-recovery',status:'running',shared_source:shared,actual_incoming_citations:sharedIncoming.length,isolate:isolate?.id??null,errors};receipt.journeys.push(journey);
 try{
  const ordinaryRequests=[];page.on('request',r=>ordinaryRequests.push(r.url()));
  await page.goto(origin+'/records/wf-r2r-bank-reconciliations');await page.getByRole('link',{name:'Explore connections',exact:true}).waitFor();
  assert.ok(!ordinaryRequests.some(url=>url.includes('/assets/connections-')||url.includes('/api/v1/connections')));
  await page.getByRole('link',{name:'Explore connections',exact:true}).click();await page.waitForURL(url=>url.pathname==='/connections'&&url.searchParams.get('focus')==='wf-r2r-bank-reconciliations');
  assert.ok(await page.locator('#connection-list [data-connection-node-id]').count());
  await page.getByRole('link',{name:'Graph',exact:true}).click();await page.locator('.connection-canvas').waitFor();
  await page.goto(origin+'/connections?'+new URLSearchParams({focus:shared,direction:'in',types:'cites',mode:'graph'}));await page.locator('.connection-canvas').waitFor();
  assert.ok(sharedIncoming.length>25);
  const data=await(await page.request.get(origin+'/api/v1/connections?'+new URLSearchParams({focus:shared,direction:'in',types:'cites'}))).json();
  assert.equal(data.counts.matching_edges,sharedIncoming.length);assert.ok(data.counts.omitted_by_budget>0);
  assert.equal(await page.locator('#connection-list [data-connection-edge-id]').count(),data.edges.length);
  await page.locator('#connection-list [data-connection-edge-id] > a').first().click();await page.getByText('Recorded reason 1',{exact:true}).waitFor();assert.ok((await page.locator('#connection-inspector').innerText()).includes('citation is not validation'));
  const originalFocus=new URL(page.url()).searchParams.get('focus');
  const other=data.nodes.find(node=>node.id!==shared);
  await page.locator('#connection-list [data-connection-node-id]').filter({has:page.locator(`a[href="/records/${other.id}"]`)}).getByRole('link',{name:'Refocus here',exact:true}).click();
  await page.waitForURL(url=>url.searchParams.get('focus')===other.id);await page.goBack();await page.waitForURL(url=>url.searchParams.get('focus')===originalFocus);
  await page.goto(origin+'/connections?'+new URLSearchParams({focus:shared,types:'',mode:'graph'}));await page.locator('.connection-canvas').waitFor();await page.getByText('No recorded relationships match this neighborhood and its filters.').waitFor();assert.equal(await page.locator('#connection-list [data-connection-node-id]').count(),1);
  if(isolate){await page.goto(origin+'/connections?'+new URLSearchParams({focus:isolate.id,mode:'graph'}));await page.locator('.connection-canvas').waitFor();assert.equal(await page.locator('#connection-list [data-connection-edge-id]').count(),0);}
  const stale=await page.goto(origin+'/connections?'+new URLSearchParams({focus:shared,index:'old-index',mode:'graph'}));assert.equal(stale.status(),409);await page.getByRole('link',{name:'Reload against the current corpus edition'}).click();await page.locator('.connection-canvas').waitFor();
  await page.goto(origin+'/connections?'+new URLSearchParams({focus:shared,selected:'edge:missing',mode:'graph'}));await page.getByText('The selected item is outside this visible neighborhood. Focus is unchanged.').waitFor();
  await page.goto(origin+'/connections?'+new URLSearchParams({focus:'guide-construction-connected-close',mode:'graph'}));await page.locator('.connection-canvas').waitFor();
  const view=await(await page.request.get(origin+'/api/v1/connections?focus=guide-construction-connected-close')).json();
  const targets=view.nodes.filter(node=>node.id!==view.state.focus).slice(0,2);
  const refocus=id=>page.locator('#connection-list [data-connection-node-id]').filter({has:page.locator(`a[href="/records/${id}"]`)}).getByRole('link',{name:'Refocus here',exact:true});
  let release,held,finished;const gate=new Promise(resolve=>release=resolve),started=new Promise(resolve=>held=resolve),settled=new Promise(resolve=>finished=resolve);
  await page.route('**/api/v1/connections?*',async route=>{
   if(new URL(route.request().url()).searchParams.get('focus')!==targets[0].id){await route.continue();return;}
   const response=await route.fetch();held();await gate;
   try{await route.fulfill({response});}catch{/* The superseded request is deliberately aborted. */}finally{finished();}
  });
  await refocus(targets[0].id).click();await started;await refocus(targets[1].id).click();await page.waitForURL(url=>url.searchParams.get('focus')===targets[1].id);release();await settled;
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));assert.equal(new URL(page.url()).searchParams.get('focus'),targets[1].id);
  await page.unroute('**/api/v1/connections?*');
  await page.goto(origin+'/connections?focus=guide-construction-connected-close&mode=graph');await page.locator('.connection-canvas').waitFor();
  await page.route('**/api/v1/connections?*',route=>route.abort());await refocus(targets[0].id).click();await page.getByText('This connection state could not be loaded. Use a native link or reload the page.').waitFor();assert.ok(await page.locator('#connection-list [data-connection-node-id]').count());
  await page.unroute('**/api/v1/connections?*');
  await page.route('**/api/v1/connections?*',route=>route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'Fixture edition mismatch'})}));await refocus(targets[0].id).click();await page.getByText('The corpus snapshot changed. Reload this page before continuing.').waitFor();assert.equal(new URL(page.url()).searchParams.get('focus'),'guide-construction-connected-close');await page.unroute('**/api/v1/connections?*');
  await page.locator('#connections-explorer').screenshot({path:path.join(directory,'recoverable-edition-mismatch.png')});
  await Promise.all([page.waitForEvent('framenavigated',{predicate:frame=>frame===page.mainFrame()}),page.getByRole('link',{name:'Reload against the current corpus edition'}).click()]);await page.locator('.connection-canvas').waitFor();
  assert.deepEqual(errors,[]);journey.status='passed';
 }catch(error){journey.status='failed';journey.failure=error.message;receipt.status='failed';await page.screenshot({path:path.join(directory,'failure.png')}).catch(()=>{});throw error;}
 finally{await context.close();}
 const failed=await browser.newContext({viewport:{width:390,height:844}});try{
  const page=await failed.newPage();await page.route('**/assets/connections-*.js',route=>route.abort());await page.goto(origin+'/connections?focus=guide-construction-connected-close&mode=graph');
  assert.ok(await page.locator('#connection-list [data-connection-node-id]').count());assert.equal(await page.locator('.connection-canvas').count(),0);
  await page.locator('#connection-list [data-connection-edge-id] > a').first().click();await page.getByText('Recorded reason 1',{exact:true}).waitFor();await page.locator('#connection-inspector').screenshot({path:path.join(directory,'mobile-failed-chunk-native-inspector.png')});
 }finally{await failed.close();}
 receipt.status='passed';
});
