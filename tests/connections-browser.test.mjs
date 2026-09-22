import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { productionBrowser } from './browser-support/production.mjs';
const pilots=['wf-r2r-bank-reconciliations','guide-construction-connected-close'];
const positions=async page=>Object.fromEntries(JSON.parse(await page.locator('.connection-canvas').getAttribute('data-positions')).map(({id,x,y})=>[id,{x,y}]));

test('graph and native List share provenance, portable state and stable interaction across desktop and mobile', {timeout:240000}, async t=>{
 const {browser,origin,directory,receipt}=await productionBrowser(t,'connections');
 for(const[name,viewport]of[['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,hasTouch:name==='mobile',reducedMotion:name==='mobile'?'reduce':'no-preference'}),page=await context.newPage();
  const errors=[],requests=[];page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>requests.push(request.url()));
  const journey={name,viewport,status:'running',errors,requests,measurements:[]};receipt.journeys.push(journey);
  try{
   for(const focus of pilots){
    await page.goto(origin+'/connections?'+new URLSearchParams({focus,mode:'graph'}));
    const canvas=page.locator('.connection-canvas');await canvas.waitFor();await page.waitForFunction(()=>document.querySelector('.connection-canvas')?.dataset.positions);
    const before=await positions(page);const initialCount=Object.keys(before).length;
    assert.ok(initialCount<=25);assert.equal(await page.locator('#connection-list [data-connection-node-id]').count(),initialCount);
    await page.getByRole('button',{name:'Recenter focus',exact:true}).click();await canvas.scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>{const node=document.querySelector('.connection-canvas');if(!node)return false;const box=node.getBoundingClientRect();return Math.abs(Number(node.dataset.focusX)-box.width/2)<3&&Math.abs(Number(node.dataset.focusY)-box.height/2)<3;});
    const point=await canvas.evaluate(node=>{
     node.pointerTrace=[];for(const type of ['pointerdown','pointerup','mousedown','mouseup','click','touchstart','touchend'])node.addEventListener(type,event=>{const r=node.getBoundingClientRect();node.pointerTrace.push({type,x:event.clientX??event.changedTouches?.[0]?.clientX,y:event.clientY??event.changedTouches?.[0]?.clientY,target:event.target.tagName,rect:r.toJSON(),focusX:node.dataset.focusX,focusY:node.dataset.focusY});},{capture:true,once:true});
     return {x:Number(node.dataset.focusX),y:Number(node.dataset.focusY)};
    });
    // Locator pointer actions wait for a stable, unobscured element and resolve its
    // current viewport position, rather than reusing an earlier absolute box.
    if(name==='mobile')await canvas.tap({position:point});else await canvas.click({position:point});
    try{await page.waitForURL(url=>url.searchParams.get('selected')==='node:'+focus);}
    catch(error){journey.pointer_failure={focus,point,url:page.url(),trace:await canvas.evaluate(node=>node.pointerTrace)};throw error;}
    assert.deepEqual(await positions(page),before,'Selecting a node must not move any node');
    if(name==='mobile'){const sheet=page.getByRole('dialog',{name:'Connection inspector'});await sheet.waitFor();assert.equal(await sheet.evaluate(node=>getComputedStyle(node).animationName),'none');await page.keyboard.press('Escape');await sheet.waitFor({state:'hidden'});await page.waitForFunction(()=>document.activeElement?.textContent==='Inspect selected item');assert.equal(new URL(page.url()).searchParams.get('selected'),'node:'+focus);}
    const edgeLink=page.locator('#connection-list [data-connection-edge-id] > a').first();await edgeLink.focus();await page.keyboard.press('Enter');
    await page.getByText('Recorded reason 1',{exact:true}).waitFor();assert.ok(requests.some(url=>url.includes('/api/v1/connections/edge?')));
    assert.deepEqual(await positions(page),before,'Inspecting edge provenance must preserve positions');
    if(name==='mobile') await page.getByRole('dialog',{name:'Connection inspector'}).evaluate(async node=>{await Promise.all(node.getAnimations().map(animation=>animation.finished.catch(()=>{})));});
    await (name==='mobile'?page.getByRole('dialog',{name:'Connection inspector'}):page.locator('#connection-graph')).screenshot({path:path.join(directory,`${name}-${focus}-inspector.png`)});
    if(name==='mobile'){await page.keyboard.press('Escape');await page.getByRole('dialog',{name:'Connection inspector'}).waitFor({state:'hidden'});}
    const focusRow=page.locator('#connection-list [data-connection-node-id]').filter({has:page.locator(`a[href="/records/${focus}"]`)});
    await focusRow.getByRole('link',{name:'Expand by up to 10 records',exact:true}).click();await page.waitForURL(url=>url.searchParams.has('expanded'));
    await page.waitForFunction(()=>document.querySelector('#connection-list')?.textContent.includes('Collapse this expansion'));
    const expanded=await positions(page);for(const[id,point]of Object.entries(before))assert.deepEqual(expanded[id],point,`${id}: expansion moved an existing node`);
    assert.ok(Object.keys(expanded).length<=80);if(focus==='guide-construction-connected-close')assert.ok(Object.keys(expanded).length>initialCount);
    const expandedURL=page.url();await focusRow.getByRole('link',{name:'Collapse this expansion',exact:true}).click();await page.waitForURL(url=>!url.searchParams.has('expanded'));
    await page.waitForFunction(count=>Number(document.querySelector('.connection-canvas')?.dataset.nodes)===count,initialCount);
    await page.goBack();await page.waitForURL(expandedURL);await page.waitForFunction(()=>document.querySelector('#connection-list')?.textContent.includes('Collapse this expansion'));
    await page.goForward();await page.waitForURL(url=>!url.searchParams.has('expanded'));
    await page.waitForFunction(count=>Number(document.querySelector('.connection-canvas')?.dataset.nodes)===count,initialCount);
    if(name==='desktop'){
     const separator=page.getByRole('separator',{name:'Resize graph and inspector'}),width=(await canvas.boundingBox()).width;
     await separator.focus();await page.keyboard.press('ArrowLeft');await page.waitForFunction(previous=>document.querySelector('.connection-canvas').getBoundingClientRect().width!==previous,width);
     assert.deepEqual(await positions(page),before);await page.getByRole('button',{name:'Reset panel widths'}).click();
     await page.setViewportSize({width:700,height:900});const resizedInspector=page.getByRole('dialog',{name:'Connection inspector'});await resizedInspector.waitFor();await page.keyboard.press('Escape');await resizedInspector.waitFor({state:'hidden'});await page.getByRole('button',{name:'Inspect selected item'}).waitFor();await page.waitForFunction(()=>document.querySelector('.connection-canvas')?.dataset.positions);assert.deepEqual(await positions(page),before,'Responsive remount must retain model positions');
     await page.setViewportSize(viewport);await page.getByRole('separator',{name:'Resize graph and inspector'}).waitFor();
    }
    await page.getByRole('button',{name:'Fit visible graph',exact:true}).click();
    await page.locator('#connection-graph').screenshot({path:path.join(directory,`${name}-${focus}-graph.png`)});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    journey.measurements.push({focus,...await canvas.evaluate(node=>({layout_ms:Number(node.dataset.layoutMs),selection_ms:Number(node.dataset.selectionMs),nodes:Number(node.dataset.nodes),edges:Number(node.dataset.edges)}))});
    const copied=await context.newPage();await copied.goto(page.url());await copied.locator('.connection-canvas').waitFor();await copied.waitForFunction(count=>Number(document.querySelector('.connection-canvas')?.dataset.nodes)===count,initialCount);assert.equal(await copied.locator('#connection-list [data-connection-edge-id]').count(),await page.locator('#connection-list [data-connection-edge-id]').count());await copied.close();
   }
   assert.deepEqual(errors,[]);assert.ok(requests.every(url=>new URL(url).origin===origin));journey.status='passed';
  }catch(error){journey.status='failed';journey.failure=error.message;receipt.status='failed';await page.screenshot({path:path.join(directory,`${name}-failure.png`)}).catch(()=>{});throw error;}
  finally{await context.close();}
  const native=await browser.newContext({viewport,javaScriptEnabled:false});
  try{const page=await native.newPage();for(const focus of pilots){await page.goto(origin+'/connections?'+new URLSearchParams({focus,mode:'graph'}));assert.ok(await page.locator('#connection-list [data-connection-node-id]').count());await page.locator('#connection-list [data-connection-edge-id] > a').first().click();await page.getByText('Recorded reason 1',{exact:true}).waitFor();await page.screenshot({path:path.join(directory,`${name}-${focus}-nojs.png`)});}}
  finally{await native.close();}
 }
 receipt.status='passed';
});
