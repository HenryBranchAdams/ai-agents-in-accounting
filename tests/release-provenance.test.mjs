import test from 'node:test';
import assert from 'node:assert/strict';
import {validateProvenance,requiredSteps,repositoryId,workflowId} from '../scripts/consume-release.mjs';
import {repository,workflowPath} from '../scripts/release-package.mjs';
const revision='a'.repeat(40);
function fixture(){return {
 revision,attempt:2,
 run:{id:10,run_attempt:2,repository:{id:repositoryId,full_name:repository},head_repository:{id:repositoryId,full_name:repository},workflow_id:workflowId,path:workflowPath,event:'push',head_branch:'main',head_sha:revision,status:'completed',conclusion:'success',run_started_at:'2026-09-21T10:00:00Z',updated_at:'2026-09-21T10:10:00Z'},
 jobs:[{id:20,run_id:10,head_sha:revision,name:'verify',status:'completed',conclusion:'success',steps:requiredSteps.map(name=>({name,status:'completed',conclusion:'success'}))}],
 artifact:{id:30,name:`corpus-release-${revision}-attempt-2`,expired:false,digest:'sha256:'+'b'.repeat(64),size_in_bytes:200,created_at:'2026-09-21T10:09:00Z',workflow_run:{id:10,head_sha:revision,head_branch:'main',repository_id:repositoryId,head_repository_id:repositoryId}},
 main:{sha:revision},commit:{sha:revision,tree:{sha:'c'.repeat(40)}}
};}
test('authoritative release provenance rejects forks, PRs, stale main, wrong workflow/attempt, absent or failed checks and untrusted artifacts',()=>{
 assert.equal(validateProvenance(fixture()).artifact_id,30);
 const mutations=[
  x=>x.run.repository.id++,x=>x.run.head_repository.id++,x=>x.run.event='pull_request',x=>x.run.head_branch='candidate',x=>x.run.workflow_id++,x=>x.run.path='.github/workflows/other.yml',x=>x.run.head_sha='d'.repeat(40),x=>x.main.sha='e'.repeat(40),x=>x.commit.tree.sha='bad',x=>x.run.run_attempt++,x=>x.run.conclusion='failure',x=>x.run.status='in_progress',x=>x.jobs=[],x=>x.jobs[0].conclusion='cancelled',x=>x.jobs[0].head_sha='f'.repeat(40),x=>x.jobs[0].steps.pop(),x=>x.jobs[0].steps[0].conclusion='skipped',x=>x.jobs.push({...x.jobs[0],name:'other',conclusion:'failure'}),x=>x.artifact.expired=true,x=>delete x.artifact.digest,x=>x.artifact.name='corpus-verification-'+revision,x=>x.artifact.workflow_run.id++,x=>x.artifact.workflow_run.repository_id++,x=>x.artifact.created_at='2026-09-21T09:59:00Z',x=>x.artifact.created_at='invalid',x=>x.artifact.size_in_bytes=3*1024**3,
 ];
 for(const mutate of mutations){const input=fixture();mutate(input);assert.throws(()=>validateProvenance(input),mutate.toString());}
});
