import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { search } from '../dist/internal/corpus.mjs';
import { productionBrowser } from './browser-support/production.mjs';

test('lazy whole-corpus palette preserves canonical results, focus, native reading and failure states', {timeout:180000}, async t => {
  const {browser,origin,directory,receipt}=await productionBrowser(t,'reading-search');
  for(const [name,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]) {
    const context=await browser.newContext({viewport}); const page=await context.newPage();
    const errors=[],requests=[];page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>requests.push(request.url()));
    const journey={name,viewport,status:'running',errors,requests};receipt.journeys.push(journey);
    try {
      await page.goto(origin+'/library?kind=source&q=bank');
      await page.getByRole('link',{name:'Search',exact:true}).waitFor();
      await page.waitForTimeout(250);
      assert.equal(requests.filter(url=>url.includes('/search-suggestions')).length,0);
      const trigger=page.getByRole('link',{name:'Search',exact:true});await trigger.click();
      const dialog=page.getByRole('dialog',{name:'Search the corpus'});await dialog.waitFor();
      assert.equal(requests.filter(url=>url.includes('/search-suggestions')).length,0);
      for(const link of await dialog.locator('[cmdk-item]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')))) assert.equal((await page.request.get(origin+link)).status(),200);
      const input=page.getByRole('combobox',{name:'Search every corpus record'});
      for(const q of ['AP','"QuickBooks Online"','bank reconciliation']) {
        await input.fill(q);await page.waitForFunction(ids=>JSON.stringify([...document.querySelectorAll('[role="dialog"] [cmdk-item]')].map(node=>node.getAttribute('data-value')))===JSON.stringify(ids),search(new URLSearchParams({q,limit:'12'})).records.map(r=>r.id));
        const actual=await dialog.locator('[cmdk-item]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-value')));
        assert.deepEqual(actual,search(new URLSearchParams({q,limit:'12'})).records.map(r=>r.id));
      }
      await input.fill('unlikely-nonexistent-record-xyz');await dialog.getByText('No records match this search.').waitFor();
      await input.fill('"unclosed');await dialog.getByText('Close every quoted phrase.').waitFor();
      await input.fill('bank');await input.fill('QuickBooks recovery');await dialog.getByText(/^Showing/).waitFor();
      const expected=search(new URLSearchParams({q:'QuickBooks recovery',limit:'12'})).records;
      assert.deepEqual(await dialog.locator('[cmdk-item]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-value'))),expected.map(r=>r.id));
      await page.screenshot({path:path.join(directory,`${name}-palette.png`)});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert.equal(await trigger.evaluate(node=>node===document.activeElement),true);
      await page.keyboard.press('Control+k');await dialog.waitFor();await input.fill('QuickBooks recovery');await dialog.getByText(/^Showing/).waitFor();await input.press('Enter');
      await page.waitForURL(origin+'/records/'+expected[0].id);await page.goBack();await page.waitForURL(url=>url.pathname==='/library');
      await trigger.click();await dialog.waitFor();
      await page.route('**/api/v1/search-suggestions?*',route=>route.abort());
      await input.fill('network failure');await dialog.getByText(/Search is unavailable/).waitFor();
      assert.ok(await dialog.getByRole('link',{name:'Search all results'}).getAttribute('href'));
      await page.unroute('**/api/v1/search-suggestions?*');
      await page.route('**/api/v1/search-suggestions?*',async route=>{
        const response=await route.fetch();const body=await response.json();body.corpus_version='different-edition';await route.fulfill({response,json:body});
      });
      await input.fill('edition mismatch');await dialog.getByText(/The corpus has changed/).waitFor();assert.equal(await dialog.locator('[cmdk-item]').count(),0);
      assert.deepEqual(errors,[]);assert.ok(requests.every(url=>new URL(url).origin===origin));journey.status='passed';
    } catch(error) {journey.status='failed';journey.failure=error.message;receipt.status='failed';await page.screenshot({path:path.join(directory,`${name}-failure.png`)}).catch(()=>{});throw error;}
    finally {await context.close();}
    const native=await browser.newContext({viewport,javaScriptEnabled:false});
    try {const page=await native.newPage();await page.goto(origin+'/records/guide-qbo-ledger-completeness');await page.getByRole('link',{name:'Search',exact:true}).click();await page.waitForURL(origin+'/library');}
    finally {await native.close();}
  }
  receipt.status='passed';
});
