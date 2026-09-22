import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// A read-only verifier fix can be tried against an already published ancestor.
// Record both revisions and read comparison records from the published source,
// never silently use changed records from the verifier's own checkout.
export function readLiveSource(revision,{cwd=process.cwd()}={}) {
 assert.match(revision,/^[a-f0-9]{40}$/);
 const git=args=>execFileSync('git',args,{cwd,encoding:'utf8',maxBuffer:64*1024*1024,stdio:['ignore','pipe','pipe']});
 const verifier_revision=git(['rev-parse','HEAD']).trim();
 git(['merge-base','--is-ancestor',revision,verifier_revision]);
 const records=['guide','collection','workflow'].flatMap(kind=>JSON.parse(git(['show',`${revision}:data/corpus/${kind}.json`])));
 return {verifier_revision,source_revision:revision,release_lockfile_sha256:createHash('sha256').update(git(['show',`${revision}:package-lock.json`])).digest('hex'),records};
}
export function firstSuggestionHref(result) {
 const first=result.items?.[0];assert.ok(first,'Canonical search returned no selectable result');
 assert.match(first.id,/^[A-Za-z0-9_-]+$/);assert.equal(first.href,`/records/${first.id}`);
 return first.href;
}
