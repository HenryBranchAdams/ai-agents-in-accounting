import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import {productionBrowser} from './browser-support/production.mjs';

// Flow: library search -> native collection -> topic/source/context -> Back/Forward.
// The same built pages must remain readable with JavaScript disabled.
test('family-office native reading works on desktop/mobile with and without JavaScript',{timeout:180000},async t=>{
 const {browser,origin,directory,receipt}=await productionBrowser(t,'family-office');
 const records=JSON.parse(fs.readFileSync('data/corpus/guide.json'));
 const entry='/records/collection-family-office-reference';
 for(const [label,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]])for(const javaScriptEnabled of [true,false]){
  const name=`${label}-${javaScriptEnabled?'js':'nojs'}`,context=await browser.newContext({viewport,javaScriptEnabled});
  const page=await context.newPage();page.setDefaultTimeout(15000);
  const errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(['error','warning'].includes(message.type()))errors.push(message.text());});
  page.on('request',request=>requests.push(request.url()));
  page.on('response',response=>{if(response.status()>=400)errors.push(`HTTP ${response.status()} ${response.url()}`);});
  const journey={name,viewport,javaScriptEnabled,status:'running',errors,requests};receipt.journeys.push(journey);
  try{
   await page.goto(origin+'/library');
   const query=page.getByLabel('Search the corpus',{exact:true});await query.fill('Family-office accounting reference library');
   await query.press('Enter');await page.waitForURL(url=>url.searchParams.has('q'));
   await page.locator(`main a[href="${entry}"]`).first().click();await page.waitForURL(origin+entry);
   assert.match(await page.title(),/Accounting Agents/);
   await page.getByRole('heading',{name:'Find guidance for your question',exact:true}).waitFor({state:'visible'});
   assert.equal(await page.locator('vite-error-overlay,nextjs-portal').count(),0);
   assert.ok(await page.locator('main').innerText());
   await page.screenshot({path:path.join(directory,`${name}-collection.png`)});
   const disclosure=page.getByText('All 112 source-discovery annotations',{exact:true});
   await disclosure.focus();await page.keyboard.press('Enter');
   assert.equal(await disclosure.evaluate(el=>el.parentElement.open),true);
   await page.keyboard.press('Enter');assert.equal(await disclosure.evaluate(el=>el.parentElement.open),false);
   for(const number of ['13','22','27']){
    const id=`guide-fo-reference-fo-${number}`,route='/records/'+id;
    await page.locator(`#family-office-reference a[href="${route}"]`).click();await page.waitForURL(origin+route);
    const value=records.find(r=>r.id===id).data.family_office_reference;
    await page.getByRole('heading',{name:value.framing_question,exact:true}).waitFor({state:'visible'});
    assert.ok((await page.locator('#family-office-reference').innerText()).includes(value.boundary));
    const sourceId=value.reading_path[0].annotation.record_id;
    const sourceLink=page.locator(`#family-office-reference a[href="/records/${sourceId}"]`).first();
    assert.ok(await sourceLink.isVisible());
    if(number==='13')await page.screenshot({path:path.join(directory,`${name}-topic.png`)});
    await sourceLink.click();await page.waitForURL(origin+'/records/'+sourceId);
    assert.ok((await page.locator('main').innerText()).length>100);
    await page.goBack();await page.waitForURL(origin+route);
    await page.goForward();await page.waitForURL(origin+'/records/'+sourceId);
    await page.goBack();await page.waitForURL(origin+route);
    const contextId=value.context_ids[0];
    assert.ok(contextId,'Representative topic must link private context');
    await page.locator(`#family-office-reference a[href="/records/${contextId}"]`).first().click();
    await page.waitForURL(origin+'/records/'+contextId);
    await page.getByRole('heading',{name:'Privacy boundary',exact:true}).waitFor({state:'visible'});
    await page.goBack();await page.waitForURL(origin+route);
    await page.locator(`#family-office-reference a[href="${entry}"]`).click();await page.waitForURL(origin+entry);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Page overflows viewport');
   }
   assert.deepEqual(errors,[],'Browser console/runtime/assets must be healthy');
   assert.ok(requests.every(url=>new URL(url).origin===origin),'Reading makes only same-origin requests');
   journey.status='passed';
  }catch(error){receipt.status='failed';journey.status='failed';journey.failure=error.message;await page.screenshot({path:path.join(directory,`${name}-failure.png`)}).catch(()=>{});throw error;}
  finally{await context.close();}
 }
 receipt.status='passed';
});
