import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {getRecord} from '../dist/internal/corpus.mjs';
import {productionBrowser} from './browser-support/production.mjs';
const pilots=['wf-r2r-bank-reconciliations','guide-construction-connected-close'];
test('evidence popovers and native outlines retain keyboard, touch, source and history paths', {timeout:180000},async t=>{
 const {browser,origin,directory,receipt}=await productionBrowser(t,'reading-evidence');
 for(const [name,viewport]of[['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,hasTouch:name==='mobile'}),page=await context.newPage();
  const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  const journey={name,status:'running',errors,requests};receipt.journeys.push(journey);
  try{
   for(const id of pilots){
    const record=getRecord(id),finding=record.data.editorial_brief.findings.find(f=>f.source_ids.length);
    await page.goto(origin+'/records/'+id);const button=page.getByRole('button',{name:/Inspect .*referenced source/}).first();await button.waitFor();await button.focus();await page.keyboard.press('Enter');
    const popup=page.getByRole('dialog',{name:'Recorded evidence connection'});await popup.waitFor();assert.ok((await popup.innerText()).includes(finding.qualification));
    assert.ok((await popup.innerText()).includes('Finding-level locator'));
    assert.ok(await popup.evaluate(node=>{const r=node.getBoundingClientRect();return r.width<=innerWidth&&r.height<=innerHeight;}));
    await page.screenshot({path:path.join(directory,`${name}-${id}-evidence.png`)});
    await page.keyboard.press('Escape');await popup.waitFor({state:'hidden'});assert.equal(await button.evaluate(node=>document.activeElement===node),true);
    if(name==='mobile')await button.tap();else await button.click();await popup.waitFor();
    await popup.locator(`a[href="/records/${finding.source_ids[0]}"]`).click();await page.waitForURL(origin+'/records/'+finding.source_ids[0]);await page.goBack();await page.waitForURL(origin+'/records/'+id);
    if(name==='mobile')await page.getByText('On this page',{exact:true}).click();
    await page.locator('a[data-section-link="worked-example"]:visible').click();await page.waitForURL(url=>url.hash==='#worked-example');
    const before=page.url();await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await page.waitForTimeout(100);assert.equal(page.url(),before,'Scroll must not rewrite fragment/history');
    await page.goBack();assert.equal(new URL(page.url()).hash,'');await page.goForward();await page.waitForURL(url=>url.hash==='#worked-example');
   }
   await page.goto(origin+'/records/example-construction-contract-ledger#detail-same_job_case');await page.locator('#detail-same_job_case').waitFor({state:'visible'});
   await page.setViewportSize({width:1100,height:650});assert.equal(new URL(page.url()).hash,'#detail-same_job_case');
   assert.deepEqual(errors,[]);assert.ok(requests.every(url=>new URL(url).origin===origin));journey.status='passed';
  }catch(error){journey.status='failed';journey.failure=error.message;receipt.status='failed';await page.screenshot({path:path.join(directory,`${name}-failure.png`)}).catch(()=>{});throw error;}
  finally{await context.close();}
  const native=await browser.newContext({viewport,javaScriptEnabled:false});try{
   const page=await native.newPage();for(const id of pilots){const finding=getRecord(id).data.editorial_brief.findings.find(f=>f.source_ids.length);await page.goto(origin+'/records/'+id);assert.equal(await page.getByRole('button',{name:/Inspect .*referenced source/}).count(),0);assert.ok((await page.locator('main').innerText()).includes(finding.qualification));await page.locator(`#findings a[href="/records/${finding.source_ids[0]}"]`).first().click();await page.waitForURL(origin+'/records/'+finding.source_ids[0]);await page.goBack();}
  }finally{await native.close();}
 }
 receipt.status='passed';
});
