import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {productionBrowser} from './browser-support/production.mjs';
const ids=['guide-xero-ledger-completeness','guide-qbo-ledger-completeness','guide-connected-close-review','guide-independent-deployment-evidence','guide-select-accounting-evaluations','collection-accounting-failure-casebook','guide-accounting-action-boundaries','guide-accounting-claim-counterexamples','collection-usable-accounting-research-assets'];
test('research reading journeys preserve qualifications and source navigation on desktop/mobile with and without JavaScript',{timeout:240000},async t=>{
 const{browser,origin,directory,receipt}=await productionBrowser(t,'research-depth');
 const records=['guide','collection'].flatMap(kind=>JSON.parse(fs.readFileSync(`data/corpus/${kind}.json`)));
 for(const[label,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]])for(const javaScriptEnabled of [true,false]){
  const name=`${label}-${javaScriptEnabled?'js':'nojs'}`,context=await browser.newContext({viewport,javaScriptEnabled});
  const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(['error','warning'].includes(message.type()))errors.push(message.text());});
  page.on('request',request=>requests.push(request.url()));page.on('response',response=>{if(response.status()>=400)errors.push(`HTTP ${response.status()} ${response.url()}`);});
  const journey={name,viewport,javaScriptEnabled,status:'running',records:[],errors,requests};receipt.journeys.push(journey);
  try{
   await page.goto(origin+'/library');const search=page.getByLabel('Search the corpus',{exact:true});await search.fill('QuickBooks recovery');await search.press('Enter');await page.waitForURL(url=>url.searchParams.has('q'));
   await page.locator('main a[href="/records/guide-qbo-ledger-completeness"]').first().click();await page.waitForURL(origin+'/records/guide-qbo-ledger-completeness');
   for(const id of ids){
    const route='/records/'+id,r=records.find(r=>r.id===id),brief=r.data.editorial_brief;
    await page.goto(origin+route);await page.getByRole('heading',{name:brief.question,exact:true}).waitFor({state:'visible'});
    assert.ok((await page.locator('main').innerText()).includes(brief.reading.critical_limitation),id);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${id} overflows viewport`);
    const sourceId=brief.findings.flatMap(f=>f.source_ids)[0];
    if(sourceId){const link=page.locator(`main a[href="/records/${sourceId}"]`).first();await link.focus();await page.keyboard.press('Enter');await page.waitForURL(origin+'/records/'+sourceId);assert.ok((await page.locator('main').innerText()).length>100);await page.goBack();await page.waitForURL(origin+route);await page.getByRole('heading',{name:brief.question,exact:true}).waitFor({state:'visible'});}
    if(['guide-qbo-ledger-completeness','guide-connected-close-review','collection-usable-accounting-research-assets'].includes(id))await page.screenshot({path:path.join(directory,`${name}-${id}.png`)});
    journey.records.push(id);
   }
   assert.deepEqual(errors,[]);assert.ok(requests.every(url=>new URL(url).origin===origin),'Only same-origin browser requests');journey.status='passed';
  }catch(error){receipt.status='failed';journey.status='failed';journey.failure=error.message;await page.screenshot({path:path.join(directory,`${name}-failure.png`)}).catch(()=>{});throw error;}
  finally{await context.close();}
 }
 receipt.status='passed';
});
