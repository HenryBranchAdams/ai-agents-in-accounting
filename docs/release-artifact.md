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
application. The existing exact-source diagnostic artifact remains retained.

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
