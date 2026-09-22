import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {authenticateExistingRelease,inspectProvenance} from './consume-release.mjs';
import {importStorage} from './import-release.mjs';
import {validatePackage,regularFiles} from './release-package.mjs';
import {sha256} from './release-inputs.mjs';

// The caller first reads the native Sites project/origin/audience and configures
// the import secret. This stage cannot activate a saved version or change env.
export async function stageRelease({runId,revision,attempt,directory,archive,destination,origin,projectId,token}={}, {authenticate=authenticateExistingRelease,importObjects=importStorage,inspect=inspectProvenance,validate=validatePackage}={}) {
  assert.ok(destination&&!fs.existsSync(destination)&&!fs.existsSync(`${destination}.stage.json`),'Use a fresh staging destination');
  const verified=await authenticate({runId,revision,attempt,directory,archive});
  const hosting=JSON.parse(fs.readFileSync(path.join(directory,'application/.openai/hosting.json')));
  assert.equal(hosting.project_id,projectId,'Artifact targets a different Sites project');
  assert.equal(hosting.r2,'BUCKET');
  const seal=await importObjects({origin,directory:path.join(directory,'storage'),token});
  assert.equal(seal.manifest,verified.storage.manifest);
  // Storage import can take minutes. Main/run/artifact identity is checked again
  // before assembling the stage; a resumed old candidate cannot replace main.
  const current=inspect({runId,revision,attempt});
  assert.deepEqual(current.proof,verified.proof,'Main or authoritative artifact changed during import');
  const checked=validate(directory);
  assert.equal(sha256(fs.readFileSync(path.join(directory,'release-package.json'))),verified.package_sha256,'Package changed during import');
  assert.equal(checked.storage.manifest,seal.manifest);
  const parent=path.dirname(path.resolve(destination));fs.mkdirSync(parent,{recursive:true});
  const temporary=fs.mkdtempSync(path.join(parent,'.release-stage-'));
  try{
    fs.cpSync(path.join(directory,'application'),temporary,{recursive:true,errorOnExist:true,force:false});
    const expected=checked.manifest.files.filter(f=>f.path.startsWith('application/'));
    assert.deepEqual(regularFiles(temporary),expected.map(f=>f.path.slice('application/'.length)).sort());
    for(const file of expected){
      const target=path.join(temporary,file.path.slice('application/'.length));
      assert.equal(sha256(fs.readFileSync(target)),file.sha256);assert.equal(fs.statSync(target).mode&0o777,file.mode);
    }
    assert.ok(!fs.existsSync(destination),'Staging destination changed');fs.renameSync(temporary,destination);
    const receipt={schema_version:1,status:'staged',project_id:projectId,origin,github:verified.proof,package_sha256:verified.package_sha256,storage:seal,staged_files:expected.map(f=>({path:f.path.slice('application/'.length),sha256:f.sha256,mode:f.mode})),activation_authority:false};
    fs.writeFileSync(`${destination}.stage.json`,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});
    return receipt;
  }catch(error){
    if(fs.existsSync(temporary))fs.renameSync(temporary,`${temporary}.failed`);
    throw error;
  }
}
if(import.meta.url===pathToFileURL(process.argv[1]||'').href){
  try{
    const [run,attempt,revision,directory,archive,destination,origin,projectId,...extra]=process.argv.slice(2);
    assert.ok(projectId&&!extra.length,'Usage: stage-release.mjs RUN ATTEMPT SHA PACKAGE ZIP DESTINATION HTTPS_ORIGIN PROJECT_ID; credential on stdin');
    let token='';for await(const chunk of process.stdin){token+=chunk;if(token.length>4097)throw new Error('Import credential too long');}
    console.log(JSON.stringify(await stageRelease({runId:Number(run),attempt:Number(attempt),revision,directory,archive,destination,origin,projectId,token:token.trim()}),null,2));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
