# Authoritative main artifact

This describes the authoritative artifact and authenticated staging path for issue #176. Native publication, final environment cleanup and browser/live acceptance remain separate required gates. An extracted artifact is not a deployment.

The existing read-only `verify` job runs preflight, lint, one primary build, every
test and qualification on PRs and main. The shared phase runner binds results to
source revision, complete source digest, lockfile, toolchain and generated build
digest. Any source or built-file change invalidates downstream evidence. A failed
check retains diagnostic artifacts but never produces a publishable release.

Successful main pushes additionally run `npm run release:package`, producing
`corpus-release-<sha>-attempt-<attempt>`. This includes the complete server modules,
all runtime data and client chunks, both hosting descriptors, qualification,
source-input inventory and download manifests. Every required compressed storage
object appears once. Expanded logical downloads/history are not duplicated in the
application. Private corpus data and the lazy connection index are logical `/_runtime/` files in the sealed storage sidecar. They are excluded from the public static application even when a host serves matching assets before the Worker. The entrypoint rejects public requests for these paths and reads them internally through the same verified object manifest. Preview fixtures may hold these files locally; that does not make them publication assets. The existing exact-source diagnostic artifact remains retained.

The package validates object hashes and reconstructs every logical file digest
with bounded decompression. No installed dependency or source cache is needed in
the extraction directory. Upload uses no additional ZIP compression because the
storage objects are already compressed. Measure these additional transfer/storage
costs separately; this is portable evidence, not eliminated work.

From a reviewed tooling checkout, run:

```sh
npm run release:consume -- RUN_ID RUN_ATTEMPT FULL_MAIN_SHA /fresh/destination
```

The consumer authenticates GitHub using `gh` and independently reads repository,
workflow, main commit, run event/revision/attempt, jobs, every required step and
artifact identity/expiry/digest. It refuses PR/fork artifacts, stale main, failed,
skipped or missing checks, another workflow or attempt, and absent/expired objects.
It downloads the exact platform archive, checks its digest, extracts only declared
regular files with safe paths, then checks every package byte and logical storage
file. It never executes downloaded code. Main/run state is checked again after the
transfer. A JSON receipt alone cannot replace these authenticated platform reads.

An unchanged cached ZIP can be reused by `stage-release.mjs` without downloading it
again. The staging path still authenticates current GitHub state, hashes that ZIP
against the platform digest, compares its package manifest with the extracted one,
and validates the actual application and storage bytes. A forged local manifest or
receipt cannot substitute for that binding. If main advanced, stop and select the
new intended artifact. Staging also checks main again after import.

The extracted `application/` is the Sites packaging input; `storage/` is the complete
sidecar for staged import. Native Sites source ancestry is distinct from the GitHub
source SHA in the tested application. Use the installed source workflow opening,
then save/package the verified bytes without another app build or test suite.
The source wrapper and any packaging transformation require explicit verification.
Do not activate until all storage objects and the manifest seal are checked, the
current live baseline has been reconciled, and the public audience is preserved.

Failed and uncertain remote operations require read-back before retry. If the
GitHub artifact expires, rerun verification on the still-intended main revision or
verify a newer main revision; never promote the diagnostic artifact or a stale local
build. Retain the prior saved Sites version and immutable objects for recovery.

## Live verification after activation and cleanup

The manual `Published corpus verification` workflow runs `scripts/verify-live.mjs`
against the fixed existing public origin. It checks out the exact dispatched verifier revision and requires the published source
revision to be that commit or its ancestor. The receipt records both identities and the
release lockfile; comparison records are read from the published source commit. This
allows a read-only verifier fix to be tried before another publication. A candidate
verifier run does not substitute for the final combined-source run. Supply the exact source, corpus, connection-index, whole-library map,
sealed storage-manifest and download-manifest identities from the authenticated
main artifact, plus a JSON array of its private runtime paths and any previously exposed asset paths. It installs the pinned browser but performs no app build, package,
import, environment mutation or publication.

The script checks release identities before and after the run, actual desktop/mobile
reading, research limitations, previews, search, Graph/List navigation and native
fallback. It records browser-observed JavaScript URLs and hashes separate public readbacks after navigation, avoiding browser response-body lifetime races. It checks PR #181 family-office reading and requires every artifact private path to return 404. It streams every current download against
the artifact-bound manifest. Screenshots and a receipt are retained even on failure.
Native deployment success and secret removal still require separate connector
readback. An unauthenticated import-route404 alone does not prove secret removal.
A green live workflow cannot substitute for human acceptance or artifact provenance.

## Live hosting correction

The first integrated publication, version33 from GitHub `5c662e0`, revealed that Sites served `/assets/connections/` directly despite the emitted `run_worker_first: true`. This is public corpus material, but serving the full internal index bypassed the bounded browser interface contract. Publication now omits private runtime files from the static asset directory and carries them only in the authenticated, sealed storage package. A production-built test simulates asset-first hosting, proves ordinary reading does not fetch graph objects, and checks missing private objects fail visibly. The live workflow checks the actual private paths after deployment. The prior failed live run remains evidence, not acceptance.

On macOS, invoke native packaging with `COPYFILE_DISABLE=1` to avoid AppleDouble metadata members. Compare every packaged runtime member to the authenticated CI package before native save. This container-only setting does not rebuild application bytes. Native save may normalize the tar container; retain its returned archive identity separately from the local tar and CI ZIP digests.

The live check also authenticates the complete library-map projection against its
artifact-derived identity and exercises the reusable full-library desktop/mobile
journeys. New `/_runtime/library-map/` objects join the private-path deny checks.
