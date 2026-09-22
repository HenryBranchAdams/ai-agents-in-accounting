import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import {productionBrowser} from './browser-support/production.mjs';

test('real maximum neighborhoods keep bounded rendering and record cold and warm interaction cost', {timeout:180000},async t=>{
 const{browser,origin,receipt}=await productionBrowser(t,'connections-performance');
 receipt.environment={platform:os.platform(),arch:os.arch(),cpus:os.cpus().length,cpu:os.cpus()[0]?.model,throttling:'none',network:'hosted runner loopback, not production network',timing:'Two animation frames after state appears; includes paint opportunity, not display hardware latency.'};
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();t.after(()=>context.close());
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const budget of [25,80])for(let sample=0;sample<3;sample++){
  await page.goto(origin+'/connections?'+new URLSearchParams({focus:'src_roadmap_naics2022_manual',mode:'graph',budget:String(budget)}));
  await page.waitForFunction(()=>document.querySelector('.connection-canvas')?.dataset.positions);
  const initial=await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
   const n=document.querySelector('.connection-canvas');resolve({navigation_to_ready_ms:performance.now(),layout_effect_ms:Number(n.dataset.layoutMs),nodes:Number(n.dataset.nodes),edges:Number(n.dataset.edges),resources:performance.getEntriesByType('resource').map(r=>({url:r.name,bytes:r.encodedBodySize,duration_ms:r.duration}))});
  }))));
  assert.equal(initial.nodes,budget);assert.ok(initial.edges<=160);
  const selected=await page.evaluate(()=>new Promise((resolve,reject)=>{
   const anchor=document.querySelector('#connection-list [data-connection-node-id] > a');
   const id=anchor.parentElement.dataset.connectionNodeId,started=performance.now();
   const timer=setTimeout(()=>{observer.disconnect();reject(new Error('Selection did not reach inspector'));},5000);
   const observer=new MutationObserver(()=>{
    const announcement=document.querySelector('#connections-explorer [role="status"]');
    if(new URL(location.href).searchParams.get('selected')!=='node:'+id||!announcement?.textContent.startsWith('Selected node:'))return;
    observer.disconnect();clearTimeout(timer);requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(performance.now()-started)));
   });observer.observe(document.querySelector('#connections-explorer'),{subtree:true,childList:true,characterData:true,attributes:true});anchor.click();
  }));
  receipt.journeys.push({budget,sample,cache:sample===0&&budget===25?'new browser context, cold browser assets':'same context, reusable browser assets',...initial,selection_to_paint_opportunity_ms:selected,status:'passed'});
 }
 assert.deepEqual(errors,[]);receipt.status='passed';
});
