import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {observeAssetResponse,readPublicAssets} from './live-assets.mjs';

const origin='https://accounting-agents.madebyhenry.chatgpt.site';
const directory=path.resolve('outputs/live-verification');fs.mkdirSync(directory,{recursive:true});
const expected={source_revision:process.env.EXPECTED_SOURCE_REVISION,corpus_version:process.env.EXPECTED_CORPUS_VERSION,index_version:process.env.EXPECTED_INDEX_VERSION,storage_manifest:process.env.EXPECTED_STORAGE_MANIFEST,download_manifest_sha256:process.env.EXPECTED_DOWNLOAD_MANIFEST_SHA256};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const receipt={status:'running',origin,expected,node:process.version,lockfile_sha256:hash(fs.readFileSync('package-lock.json')),journeys:[],downloads:[],assets:[],limitations:'Read-only public Chromium verification. Native deployment status, final environment readback and authoritative artifact authentication are separate required evidence.'};
let browser;
async function get(route){const response=await fetch(origin+route,{redirect:'error',signal:AbortSignal.timeout(60000)});assert.equal(response.status,200,route);return response;}
async function release(){const body=await(await get('/api/v1/release')).json();for(const key of ['source_revision','corpus_version','storage_manifest'])assert.equal(body[key],expected[key],key);return body;}
try{
 assert.match(expected.source_revision||'',/^[a-f0-9]{40}$/);assert.match(expected.corpus_version||'',/^\d{4}-\d{2}-\d{2}\.\d+$/);
 for(const key of ['index_version','storage_manifest','download_manifest_sha256'])assert.match(expected[key]||'',/^[a-f0-9]{64}$/);
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),expected.source_revision,'Live verifier checkout must match the intended published main');
 receipt.release_before=await release();
 assert.equal((await(await get('/api/v1/meta')).json()).corpus_version,expected.corpus_version);
 const overview=await(await get('/api/v1/connections?focus=guide-construction-connected-close')).json();assert.equal(overview.corpus_version,expected.corpus_version);assert.equal(overview.index_version,expected.index_version);
 const privatePaths=JSON.parse(process.env.EXPECTED_PRIVATE_PATHS_JSON||'null');assert.ok(Array.isArray(privatePaths)&&privatePaths.length>0&&privatePaths.length<=100,'Artifact private paths are required');
 for(const route of privatePaths){assert.match(route,/^\/(?:_runtime|assets)\/(?:data|connections)\/[a-f0-9]{64}\.(?:json\.)?gz$/);const response=await fetch(origin+route,{redirect:'error',signal:AbortSignal.timeout(60000)});assert.equal(response.status,404,'Internal asset is public: '+route);await response.body?.cancel();}receipt.private_paths=privatePaths;
 const manifestBytes=Buffer.from(await(await get('/downloads/manifest.json')).arrayBuffer());assert.equal(hash(manifestBytes),expected.download_manifest_sha256,'Download manifest differs from authoritative package');const manifest=JSON.parse(manifestBytes);assert.equal(manifest.corpus_version,expected.corpus_version);
 assert.equal((await fetch(origin+'/_release/manifests/'+expected.storage_manifest,{method:'HEAD'})).status,404,'Import route must reject unauthenticated access');
 browser=await chromium.launch();receipt.browser=browser.version();
 const ids=['guide-xero-ledger-completeness','guide-qbo-ledger-completeness','guide-connected-close-review','guide-independent-deployment-evidence','guide-select-accounting-evaluations','collection-accounting-failure-casebook','guide-accounting-action-boundaries','guide-accounting-claim-counterexamples','collection-usable-accounting-research-assets'];
 const records=['guide','collection','workflow'].flatMap(kind=>JSON.parse(fs.readFileSync(`data/corpus/${kind}.json`)));
 for(const[name,viewport]of[['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport}),page=await context.newPage();page.setDefaultTimeout(20000);
  const errors=[],requests=[],assetURLs=new Set();
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));page.on('response',r=>{if(r.status()>=400)errors.push(`HTTP ${r.status()} ${r.url()}`);observeAssetResponse(r,origin,assetURLs);});
  const journey={name,viewport,status:'running',records:[],errors};receipt.journeys.push(journey);
  try{
   await page.goto(origin+'/records/collection-family-office-reference');await page.getByRole('heading',{name:'Find guidance for your question',exact:true}).waitFor();await page.getByText('All 112 source-discovery annotations',{exact:true}).click();
   for(const number of ['13','22','27']){const record=records.find(r=>r.id===`guide-fo-reference-fo-${number}`);await page.goto(origin+'/records/'+record.id);await page.getByRole('heading',{name:record.data.family_office_reference.framing_question,exact:true}).waitFor();assert.ok((await page.locator('#family-office-reference').innerText()).includes(record.data.family_office_reference.boundary));journey.records.push(record.id);}
   for(const id of ids){await page.goto(origin+'/records/'+id);const brief=records.find(r=>r.id===id).data.editorial_brief;await page.getByRole('heading',{name:brief.question,exact:true}).waitFor();assert.ok((await page.locator('main').innerText()).includes(brief.reading.critical_limitation),id);journey.records.push(id);}
   const pilot=records.find(r=>r.id==='wf-r2r-bank-reconciliations'),finding=pilot.data.editorial_brief.findings.find(f=>f.source_ids.length);
   const response=await page.goto(origin+'/records/'+pilot.id);for(const directive of ["default-src 'none'","connect-src 'self'","script-src 'self'","base-uri 'none'","frame-ancestors 'none'","form-action 'self'"])assert.ok(response.headers()['content-security-policy'].includes(directive),directive);assert.equal(response.headers()['x-content-type-options'],'nosniff');
   const preview=page.getByRole('button',{name:/Inspect .*referenced source/}).first();await preview.click();const popup=page.getByRole('dialog',{name:'Recorded evidence connection'});await popup.waitFor();assert.ok((await popup.innerText()).includes(finding.qualification));await popup.locator(`a[href="/records/${finding.source_ids[0]}"]`).click();await page.waitForURL(origin+'/records/'+finding.source_ids[0]);await page.goBack();
   if(name==='mobile')await page.locator('summary:visible').filter({hasText:/^On this page$/}).click();await page.locator('a[data-section-link="worked-example"]:visible').click();await page.waitForURL(url=>url.hash==='#worked-example');await page.goBack();
   await page.getByRole('link',{name:'Search',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Search the corpus'});await dialog.waitFor();await page.getByRole('combobox',{name:'Search every corpus record'}).fill('QuickBooks recovery');await dialog.getByText(/^Showing/).waitFor();await dialog.locator('[cmdk-item][aria-selected="true"]').waitFor();await page.keyboard.press('Enter');await page.waitForURL(url=>url.pathname.startsWith('/records/guide-qbo-'));
   await page.goto(origin+'/library?q=bank&kind=source&jurisdiction=United+States&limit=1');await page.getByRole('link',{name:'Go to next page',exact:true}).click();await page.waitForURL(url=>url.searchParams.get('page')==='2');await page.getByRole('link',{name:'Remove Jurisdiction: United States'}).click();await page.waitForURL(url=>!url.searchParams.has('jurisdiction'));assert.equal(new URL(page.url()).searchParams.get('kind'),'source');await page.getByRole('link',{name:'Clear filters',exact:true}).click();await page.waitForURL(url=>!url.searchParams.has('kind'));assert.equal(new URL(page.url()).searchParams.get('q'),'bank');
   await page.goto(origin+'/connections?focus=guide-construction-connected-close&mode=graph');await page.locator('.connection-canvas').waitFor();await page.waitForFunction(()=>document.querySelector('.connection-canvas')?.dataset.positions);
   const edge=page.locator('#connection-list [data-connection-edge-id]').filter({hasText:': qualifies'}).first();await edge.locator(':scope > a').click();await page.getByText('Recorded reason 1',{exact:true}).waitFor();
   if(name==='mobile')await page.getByRole('dialog',{name:'Connection inspector'}).evaluate(async node=>{await Promise.all(node.getAnimations().map(a=>a.finished.catch(()=>{})));});
   await page.screenshot({path:path.join(directory,name+'-connections.png')});
   if(name==='mobile')await page.keyboard.press('Escape');
   const focusRow=page.locator('#connection-list [data-connection-node-id="guide-construction-connected-close"]');await focusRow.getByRole('link',{name:'Expand by up to 10 records',exact:true}).click();await page.waitForURL(url=>url.searchParams.has('expanded'));await focusRow.getByRole('link',{name:'Collapse this expansion',exact:true}).click();await page.waitForURL(url=>!url.searchParams.has('expanded'));
   await page.getByRole('link',{name:'List',exact:true}).click();await page.waitForURL(url=>url.searchParams.get('mode')!=='graph');assert.ok(await page.locator('#connection-list [data-connection-edge-id]').count());await page.goBack();await page.locator('.connection-canvas').waitFor();
   assert.deepEqual(errors,[]);assert.ok(requests.every(url=>new URL(url).origin===origin));receipt.assets.push(...await readPublicAssets(assetURLs,origin));journey.status='passed';
  }catch(error){journey.status='failed';journey.error=error.message;await page.screenshot({path:path.join(directory,name+'-failure.png')}).catch(()=>{});throw error;}finally{await context.close();}
 }
 const native=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});try{const page=await native.newPage();await page.goto(origin+'/connections?focus=guide-construction-connected-close&mode=graph');await page.locator('#connection-list [data-connection-edge-id] > a').first().click();await page.getByText('Recorded reason 1',{exact:true}).waitFor();receipt.journeys.push({name:'native-list',status:'passed'});}finally{await native.close();}
 // Stream every declared current download. Manifest identity comes from the verified package,
 // not from trusting a live server's self-reported hashes. No accounting systems are contacted.
 for(const file of manifest.files){assert.match(file.path,/^\/downloads\/[A-Za-z0-9_.-]+$/);assert.ok(Number.isSafeInteger(file.bytes)&&file.bytes>=0);assert.match(file.sha256,/^[a-f0-9]{64}$/);const response=await get(file.path),digest=createHash('sha256');let bytes=0;for await(const chunk of response.body){bytes+=chunk.length;assert.ok(bytes<=file.bytes,file.path+' exceeds declared size');digest.update(chunk);}assert.equal(bytes,file.bytes,file.path);assert.equal(digest.digest('hex'),file.sha256,file.path);receipt.downloads.push({path:file.path,bytes,sha256:file.sha256});}
 receipt.release_after=await release();receipt.status='passed';
}catch(error){receipt.status='failed';receipt.error=error.stack||error.message;process.exitCode=1;console.error(error.message);}
finally{await browser?.close();fs.writeFileSync(path.join(directory,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');}
