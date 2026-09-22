import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
const extractor=path.resolve("scripts/extract-release-artifact.py");

test("artifact extraction validates every byte and refuses hostile members without executing code",()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),"aa-artifact-"));
 try {
  for(const mode of ["valid","traversal","symlink","duplicate","hash","extra","size","mode"]){
   const zip=path.join(root,mode+".zip"),out=path.join(root,mode);
   execFileSync("python3",["-c",`
import zipfile,json,hashlib,sys,stat
file,mode=sys.argv[1:]
name='application/dist/server/index.js'
if mode=='traversal':name='application/dist/client/../../escape'
body=b'throw new Error("must never execute artifact code")'
entry={'path':name,'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest(),'mode':420}
if mode=='hash':entry['sha256']='0'*64
if mode=='size':entry['bytes']+=1
if mode=='mode':entry['mode']=4095
manifest={'schema_version':1,'contract':'accounting-agents-ci-release','files':[entry]}
with zipfile.ZipFile(file,'w') as z:
 z.writestr('release-package.json',json.dumps(manifest))
 if mode=='symlink':
  i=zipfile.ZipInfo(name);i.create_system=3;i.external_attr=(stat.S_IFLNK|511)<<16;z.writestr(i,body)
 else:z.writestr(name,body)
 if mode=='duplicate':z.writestr(name,body)
 if mode=='extra':z.writestr('surprise.sh',b'echo unsafe')
`,zip,mode],{stdio:"pipe"});
   const hash=createHash("sha256").update(fs.readFileSync(zip)).digest("hex");
   const run=()=>execFileSync("python3",[extractor,zip,out,"--sha256",hash],{encoding:"utf8",stdio:["ignore","pipe","pipe"]});
   if(mode==="valid"){
    const result=JSON.parse(run());assert.equal(result.provenance_verified,false);
    assert.equal(fs.readFileSync(path.join(out,"application/dist/server/index.js"),"utf8"),'throw new Error("must never execute artifact code")');
    assert.throws(run,/fresh artifact destination/);
    const rebind=()=>JSON.parse(execFileSync('python3',[path.resolve('scripts/verify-release-archive.py'),zip,out,hash],{encoding:'utf8',stdio:'pipe'}));
    assert.equal(rebind().artifact_sha256,hash);
    fs.writeFileSync(path.join(out,'release-package.json'),'{}');
    assert.throws(rebind,/manifest differs/);
   }else{assert.throws(run);assert.equal(fs.existsSync(out),false);}
   assert.equal(fs.existsSync(out+".lock"),false);
   assert.throws(()=>execFileSync("python3",[extractor,zip,path.join(root,"wrong-digest"),"--sha256","0".repeat(64)],{stdio:"pipe"}),/digest differs/);
  }
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
