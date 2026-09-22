import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {productionBrowser} from './browser-support/production.mjs';

// A 320 CSS-pixel viewport exercises reflow; it is not a claim of device or OS keyboard testing.
test('reading reflows at 320 CSS pixels and keeps active outlines and search focus usable', {timeout:180000}, async t=>{
 const {browser,origin,directory,receipt}=await productionBrowser(t,'reading-reflow');
 const context=await browser.newContext({viewport:{width:320,height:720},reducedMotion:'reduce'}),page=await context.newPage();
 t.after(()=>context.close());
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const journey={status:'running',viewport:{width:320,height:720},reduced_motion:true,pages:[],limits:'Chromium CSS reflow and reduced visual viewport; no physical on-screen keyboard, WebKit or browser zoom claim.'};receipt.journeys.push(journey);
 try{
  for(const id of ['wf-r2r-bank-reconciliations','guide-construction-connected-close','src_stripe_balance_reporting','collection-accounting-failure-casebook']){
   await page.goto(origin+'/records/'+id);
   await page.waitForFunction(()=>document.querySelector('[data-section-link][aria-current="location"]'));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+': horizontal overflow');
   const targets=await page.locator('[data-section-link]').evaluateAll(nodes=>[...new Set(nodes.map(n=>n.dataset.sectionLink))]);
   const target=targets.find(id=>id==='record-content')||targets[Math.floor(targets.length/2)];
   const before=page.url();await page.locator(`[id="${target}"]`).evaluate(node=>{for(let p=node.parentElement;p;p=p.parentElement)if(p instanceof HTMLDetailsElement)p.open=true;node.scrollIntoView();});
   await page.waitForFunction(id=>[...document.querySelectorAll('[data-section-link][aria-current="location"]')].some(n=>n.dataset.sectionLink===id),target);
   assert.equal(page.url(),before,'Scrolling must not replace the reading URL');
   const resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>({url:r.name,bytes:r.encodedBodySize,duration_ms:r.duration})));
   assert.ok(!resources.some(r=>/connections-|\/connections\/|search-suggestions/.test(r.url)),'Ordinary reading must not load graph or suggestions');
   journey.pages.push({id,active_section:target,resources});
  }
  await page.getByRole('link',{name:'Search',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Search the corpus'});await dialog.waitFor();
  const input=page.getByRole('combobox',{name:'Search every corpus record'});await input.fill('construction');await dialog.getByText(/^Showing/).waitFor();
  // Reduced viewport models the available layout area, without pretending to invoke a device keyboard.
  await page.setViewportSize({width:320,height:400});
  // Dynamic viewport units settle on a rendering frame after the emulated resize.
  // Require actual bounds, not a fixed delay; retain computed geometry if it fails.
  try{await page.waitForFunction(()=>{const node=document.querySelector('[role="dialog"]');if(!node)return false;const r=node.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight+1;},{},{timeout:5000,polling:'raf'});}
  catch(error){journey.dialog_geometry=await dialog.evaluate(node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node);return {rect:r.toJSON(),innerWidth,innerHeight,visualHeight:visualViewport?.height,maxHeight:s.maxHeight,height:s.height,minHeight:s.minHeight,top:s.top,transform:s.transform,translate:s.translate,classes:node.className};});throw error;}
  for(let i=0;i<16;i++){await page.keyboard.press('Tab');assert.ok(await dialog.evaluate(node=>node.contains(document.activeElement)),'Focus escaped the open search dialog');}
  await page.screenshot({path:path.join(directory,'320-search-reduced-viewport.png')});
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
  assert.equal(await page.getByRole('link',{name:'Search',exact:true}).evaluate(node=>document.activeElement===node),true);
  assert.deepEqual(errors,[]);journey.status='passed';receipt.status='passed';
 }catch(error){journey.status='failed';journey.failure=error.message;receipt.status='failed';await page.screenshot({path:path.join(directory,'failure.png')}).catch(()=>{});throw error;}
});
