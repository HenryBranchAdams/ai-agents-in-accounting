# Immutable publication and recovery

Git is the authoritative source for records, stable IDs, relationships, coverage inputs, snapshots, rights and provenance. Storage is a reproducible publication derivative, not a second editorial database. No accounting review status changes with this infrastructure work.

## Ownership and layout

- Current structured data is compiled to immutable, content-addressed compressed static assets. Executable modules load these assets when the application is first requested. Agent passage generation is deferred to the selected records instead of retaining passages for the whole corpus. Current records and indexes remain in isolate memory after initialization.
- D1 is not introduced. The current 1,328-record corpus has no public writes or transactional editorial workflow, and retaining its existing retrieval implementation avoids changing search semantics. This choice must be revisited if measured current-data/index memory exceeds the runtime envelope.
- R2 stores content-addressed compressed chunks of historical releases, complete coverage history, portable downloads and the complete source export. Existing logical paths, file bytes and SHA-256 contracts are preserved. Content-defined boundaries allow unchanged archive tails to deduplicate even when earlier source entries change size.
- The application embeds only the small immutable file manifest. It streams bounded chunks with backpressure. HEAD and conditional requests use build-time metadata, avoiding reads of download bodies. Full history is never imported into executable modules; only the summary used by the coverage page is bundled.
- Local `dist/client/downloads` and `dist/client/releases` retain logical output for verification. They are excluded from deployment staging, together with upload objects and internal development bundles. They are not deployment inputs.

## Publication sequence

1. Finish the source and commit it. Run `npm run check` on that revision. Builds generate the source export, data assets, object manifest, runtime bundle and source-revision metadata together.
2. Run the representative runtime and browser checks. Node memory and timings are diagnostic evidence, not proof of hosted Workers behavior.
3. Configure `RELEASE_IMPORT_TOKEN` as a Sites secret. The public corpus remains GET/HEAD/OPTIONS only. The narrow `/_release/objects/<sha256>` and `/_release/manifests/<sha256>` import paths require the secret, reject oversized or checksum-invalid bodies, and expose no delete or mutable activation operation.
4. Run `RELEASE_IMPORT_TOKEN=... node scripts/import-release.mjs https://accounting-agents.madebyhenry.chatgpt.site`. Supply the secret through the process environment, never a tracked file. Import is content-addressed and retryable. The manifest seal is written only after every referenced object exists with its expected size. Object writes validate SHA-256 both in the importer and server.
5. Run `npm run qualify`, then `node scripts/stage-release.mjs outputs/release-<revision>`. Staging requires a matching import receipt and qualification report. Package only that stage with the native Sites helper. Push the exact source revision to the existing Sites repository; save that revision and archive, then deploy with the existing public audience.
6. Poll to terminal success. Verify `/api/v1/release`, metadata, record IDs, family-office search/browsing, coverage history, historical and current exports and source-export parts on the live URL. A saved version or local test is not a completed publication.
7. Remove the import secret from Sites and redeploy the same saved version to apply that environment revision when no more imports are needed.

## Failure and rollback

A failed upload cannot change the live manifest: there is no mutable current-data pointer. Partial content-addressed objects remain inert and can be reused by retry. Staging rejects stale import receipts. A release refuses to serve from an unsealed R2 manifest. A missing object returns unavailable or terminates an incomplete stream; it never falls back to bytes from another edition. Retain all older objects and saved application versions. Roll back by deploying the prior saved version, preserving the same audience. Do not delete storage as part of routine release cleanup.

The initial transition deploy retains the previously live corpus while adding the authenticated import endpoint and R2 binding. Only after import validation does the new application become eligible for activation.

## Qualification and constraints

Cloudflare's [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) document 128 MB isolate memory, a 64 MiB Worker module limit, 25 MiB per static asset and a one-second startup limit. These are underlying platform limits, not proof of this Sites project's complete effective configuration. The old 256 MiB Sites expanded-archive limit appears only in earlier failure evidence. This repair uses the independently successful 237,793,280-byte transition archive as a conservative known-working packaging boundary, without claiming it is the current platform maximum.

`npm run check` includes deployment qualification. It rejects full snapshot/release imports, oversized Worker/static artifacts, loss of source/export record parity and package growth beyond the known-working boundary. Storage tests reconstruct every download, exercise missing objects, authenticated imports, incomplete seals, conditional reads and content-defined deduplication. Source-export tests verify complete source membership and deterministic bytes. Qualification is necessary but must be followed by native deployment success and live checks.

Remaining scaling tradeoff: current data and search indexes still reside in each initialized isolate. Historical growth no longer expands executable code or the application upload, but does consume storage. Source archive creation remains an offline operation proportional to the retained source history. No new paid service or different hosting audience is configured.
