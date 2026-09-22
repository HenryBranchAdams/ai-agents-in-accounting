import test from 'node:test';import assert from 'node:assert/strict';import path from 'node:path';
import {productionBrowser} from './browser-support/production.mjs';
test('combined native filters remain understandable and reproducible with and without JavaScript',{timeout:120000},async t=>{
 const {browser,origin,directory,receipt}=await productionBrowser(t,'reading-filters');
 for(const javaScriptEnabled of[true,false])for(const[width,height]of[[1440,1000],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},javaScriptEnabled}),page=await context.newPage();const journey={width,javaScriptEnabled,status:'running'};receipt.journeys.push(journey);
  try{
   await page.goto(origin+'/library?q=bank&kind=source&jurisdiction=United+States&limit=1');
   assert.equal(await page.locator('#library-filters').getAttribute('open'),null);
   await page.getByRole('navigation',{name:'Active filters'}).getByText('Type: Sources',{exact:false}).waitFor();
   await page.getByRole('link',{name:'Go to next page',exact:true}).click();await page.waitForURL(u=>u.searchParams.get('page')==='2');
   await page.getByRole('link',{name:'Remove Jurisdiction: United States'}).click();await page.waitForURL(u=>!u.searchParams.has('jurisdiction'));
   const url=new URL(page.url());assert.equal(url.searchParams.get('q'),'bank');assert.equal(url.searchParams.get('kind'),'source');assert.equal(url.searchParams.has('page'),false);
   await page.getByRole('link',{name:'Clear filters',exact:true}).click();await page.waitForURL(u=>!u.searchParams.has('kind'));assert.equal(new URL(page.url()).searchParams.get('q'),'bank');
   const copied=page.url();await page.goto(copied);await page.locator('#results-heading').waitFor();
   await page.locator('#library-filters > summary').click();await page.getByText('Filter by topic and scope',{exact:true}).click();
   await page.getByLabel('Products',{exact:true}).waitFor({state:'visible'});await page.getByLabel('Exact NAICS-US 2022 code').fill('236');await page.getByRole('button',{name:'Apply filters'}).click();await page.waitForURL(u=>u.searchParams.get('naics')==='236');
   assert.equal(new URL(page.url()).searchParams.get('q'),'bank');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:path.join(directory,`${width}-${javaScriptEnabled?'js':'nojs'}.png`)});journey.status='passed';
  }catch(error){journey.status='failed';journey.failure=error.message;receipt.status='failed';throw error;}finally{await context.close();}
 }
 receipt.status='passed';
});
