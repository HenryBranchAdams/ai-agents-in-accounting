# AA-R138 final recovered-head review

Date: 2026-09-17

Repository: `https://github.com/HenryBranchAdams/ai-agents-in-accounting`

Review worktree: `/Users/henryadams/.codex/worktrees/5626/ai-agents-in-accounting` (existing exact-target worktree)

Review branch: `codex/aa-r138-independent-review`

Reviewed head: `25223de67fcbef936e83b4dd6922c1f03c629a49`

Reviewed delta: `9efe9b88e36f278e9c5af59d988c9232aeb9f861` -> `a769765` -> `25223de67fcbef936e83b4dd6922c1f03c629a49`

Prior receipt: `d210a15` on the same review branch

Disposition: **Conditional exact-head pass for the accounting, mapping, release, and portable-source behavior, with one P2 download-header finding.** The earlier P2 source-mapping finding is resolved. No merge, closure, deployment, or final publication approval is given by this receipt.

## Mapping correction accepted

The eight new source-to-question relationships now exactly equal the package's citation-derived relationships:

| Source | Reviewed question IDs |
|---|---|
| `src_fasb_201009` | `q-events-going-concern` |
| `src_fasb_201415` | `q-events-going-concern` |
| `src_fasb_201305` | `q-foreign-currency` |
| `src_fasb_201502` | `q-consolidation` |
| `src_fasb_fas52` | `q-foreign-currency` |
| `src_sec_regsx` | `q-presentation` |
| `src_fasb_202010` | `q-ledger-close`, `q-presentation`, `q-policy-changes-errors` |
| `src_fasb_202511` | `q-estimates`, `q-policy-changes-errors` |

Independent checks confirmed that each source's `data.source_review.question_ids`, `mapping-overrides.json.question_ids`, reviewed question IDs, and generated mapping rows agree exactly. All eight mappings are `reviewed`, shared-context only, have no industry descendants or speculative question IDs, and retain `source_status: unknown` and `full_text_stored: false`.

The fresh applicator path, byte-identical replay, newer mapping preservation, and conflicting-association failure all passed. A newer mapping with extra metadata was preserved byte-for-byte; a conflicting same-scope mapping failed before writing outputs.

## Portable source export

The exact-target build produced a deterministic multipart export:

- archive: 31,037,094 bytes, SHA-256 `cbc2a443c3f21cf1cf1ef8e84c20ad549a451ac1e3f54ea7f8115d607d85ecd6`;
- manifest: `275` promised files, `274` included files, and exactly one omitted file, `data/releases/2026-09-17.5/corpus.json.gz`;
- parts: `accounting-agents-source.zip.part-001` at 25,165,824 bytes and `part-002` at 5,871,270 bytes;
- both parts are at or below the 24 MiB part ceiling and at least 1 MiB below the 25 MiB host limit;
- outer `manifest.json` contains matching part paths, byte counts, SHA-256 hashes, mode, archive hash and source counts;
- every prior release gzip remains included byte-for-byte, while only the current release gzip uses the documented separate release-bundle exception.

Independent reconstruction succeeded in a clean temporary directory with 274 ZIP members and the manifest archive hash. Missing, corrupted, reordered, and traversal-named parts were rejected; a pre-existing output file was preserved on each failed reconstruction and temporary files were removed. Single-ZIP mode also reconstructed successfully with the same archive hash. The generated stale-part cleanup preserved unrelated files and removed only generated source-export names.

## Release and history preservation

Release `2026-09-17.5` contains 1,106 records, 1,106 JSONL rows, eight changes, eight history rows, five manifest files, and matching file hashes. Release `2026-09-17.4` is unchanged. Coverage snapshot `2026-09-17.7` is the only new snapshot; all 23 prior snapshot records remain unchanged, including candidate release `2026-09-17.4` and snapshot `2026-09-17.6` provenance. The source and release input hashes reconcile to the generated artifacts.

## Finding

### P2: Raw multipart parts use a text MIME type in the user-facing local server

The exact local HTTP server returns `Content-Type: text/plain; charset=utf-8` for both raw ZIP parts because `scripts/serve.mjs` falls back to text/plain for the `.part-###` suffix. `src/worker.ts` delegates these paths directly to the static asset response and does not provide an application-level binary-type override. `Content-Length`, ETag, cache behavior, links, and bytes are correct, but arbitrary ZIP bytes should be served as `application/octet-stream`.

Recommended correction: add an explicit source-part MIME mapping to the local server and guarantee the same `application/octet-stream` header for source-part paths in the Worker or host asset configuration. Add GET and HEAD assertions for the manifest and both parts.

## User-facing and agent surfaces

The server-rendered `/use` page exposes a native keyboard-focusable download link to the source-export manifest, says that ordered parts may be required, and has the expected single-column mobile and two-column `sm` layout classes. `/llms.txt` links to the manifest, and `/api/v1/agent/describe` exposes `source_export` rather than the obsolete single-ZIP link. The manifest and parts returned 200 with correct bytes, Content-Length, ETags, and conditional 304 behavior in the local route probe.

The Browser plugin was not available in this session and Playwright was not installed in the target worktree. Therefore no screenshot-backed desktop/mobile browser session or real browser keyboard traversal is claimed. Server-rendered semantics, responsive classes, route behavior, and the full presentation regression suite were checked instead.

## Checks

- `npm run check` — passed after the sandbox-only `dist/.openai/hosting.json` cleanup denial was rerun with the required filesystem allowance: 133/133 tests passed.
- Exact-target build — passed: `Built 1106 records, 29 downloads, and a 274-file multipart source export.`
- `npm run typecheck`, canonical validation, UI lint, design probes, retrieval, MCP stdio/HTTP, release, mapping, history, and source-export tests — passed within the full check.
- `git diff --check 9efe9b88e36f278e9c5af59d988c9232aeb9f861..25223de67fcbef936e83b4dd6922c1f03c629a49` — passed.
- Supplied hosted CI run `35300307093` — reported successful by the coordinator; no additional polling or deployment claim is made here.

The remaining P2 MIME issue and the browser-validation limit are the only material qualifications found at the recovered exact head.
