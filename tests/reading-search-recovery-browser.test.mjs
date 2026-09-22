import test from 'node:test';
import assert from 'node:assert/strict';
import {search} from '../dist/internal/corpus.mjs';
import {productionBrowser} from './browser-support/production.mjs';

test('search ignores delayed and closed requests and retains native recovery after a failed lazy chunk', {timeout:120000},async t=>{
 const{browser,origin,receipt}=await productionBrowser(t,'reading-search-recovery');
 const context=await browser.newContext(),page=await context.newPage();t.after(()=>context.close());
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/records/src_stripe_balance_reporting');
 const trigger=page.getByRole('link',{name:'Search',exact:true}),dialog=page.getByRole('dialog',{name:'Search the corpus'}),input=page.getByRole('combobox',{name:'Search every corpus record'});
 await trigger.click();await dialog.waitFor();
 let release,held,finished;const gate=new Promise(resolve=>release=resolve),started=new Promise(resolve=>held=resolve),settled=new Promise(resolve=>finished=resolve);
 await page.route('**/api/v1/search-suggestions?*',async route=>{
  if(new URL(route.request().url()).searchParams.get('q')!=='bank'){await route.continue();return;}
  const response=await route.fetch();held();await gate;try{await route.fulfill({response});}catch{/* Expected when the replaced request has been aborted. */}finally{finished();}
 });
 await input.fill('bank');await started;await input.fill('construction');
 const expected=search(new URLSearchParams({q:'construction',limit:'12'})).records.map(r=>r.id);
 await page.waitForFunction(ids=>JSON.stringify([...document.querySelectorAll('[role="dialog"] [cmdk-item]')].map(n=>n.dataset.value))===JSON.stringify(ids),expected);
 release();await settled;await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 assert.deepEqual(await dialog.locator('[cmdk-item]').evaluateAll(nodes=>nodes.map(n=>n.dataset.value)),expected);
 await page.unroute('**/api/v1/search-suggestions?*');
 let closeRelease,closeHeld;const closeGate=new Promise(resolve=>closeRelease=resolve),closeStarted=new Promise(resolve=>closeHeld=resolve);
 await page.route('**/api/v1/search-suggestions?*',async route=>{closeHeld();await closeGate;await route.abort().catch(()=>{});});
 await input.fill('closing request');await closeStarted;await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});closeRelease();await page.unrouteAll({behavior:'wait'});
 for(let i=0;i<3;i++){await trigger.click();await dialog.waitFor();assert.equal(await input.inputValue(),'');await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert.equal(await trigger.evaluate(n=>document.activeElement===n),true);}
 assert.deepEqual(errors,[]);receipt.journeys.push({name:'delayed-response-close-and-reopen',status:'passed'});
 const loading=await browser.newContext();try{
  const p=await loading.newPage();let releaseImport,importStarted;const gate=new Promise(resolve=>releaseImport=resolve),started=new Promise(resolve=>importStarted=resolve);
  await p.route('**/assets/search-palette-*.js',async route=>{const response=await route.fetch();importStarted(route.request().url());await gate;await route.fulfill({response});});
  await p.goto(origin+'/records/src_stripe_balance_reporting');const trigger=p.getByRole('link',{name:'Search',exact:true});await trigger.click();const moduleURL=await started;await p.keyboard.press('Escape');releaseImport();
  await p.evaluate(async url=>{await import(url);},moduleURL);await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert.equal(await p.getByRole('dialog',{name:'Search the corpus'}).count(),0,'Canceled module loading must not open a late dialog');assert.equal(new URL(p.url()).pathname,'/records/src_stripe_balance_reporting');
  await trigger.click();await p.getByRole('dialog',{name:'Search the corpus'}).waitFor();await p.keyboard.press('Escape');receipt.journeys.push({name:'cancel-and-reopen-during-module-load',status:'passed'});
 }finally{await loading.close();}
 const failed=await browser.newContext();try{
  const p=await failed.newPage();await p.route('**/assets/search-palette-*.js',route=>route.abort());await p.goto(origin+'/records/src_stripe_balance_reporting');await p.getByRole('link',{name:'Search',exact:true}).click();await p.waitForURL(origin+'/library');assert.ok(await p.locator('main').isVisible());receipt.journeys.push({name:'failed-lazy-chunk-native-library',status:'passed'});
 }finally{await failed.close();}
 receipt.status='passed';
});
