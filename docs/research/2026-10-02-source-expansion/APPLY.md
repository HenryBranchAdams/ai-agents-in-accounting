# Applying the corpus expansion

The research files contain 198 source additions and 22 collections. The draft research PR does not change the live corpus. The complete canonical integration is supplied as `corpus-integration.patch.gz` because GitHub's connector rejected the generated `corpus.json` upload at its 16 MiB request limit.

The patch contains the canonical source additions, collection additions, coverage metadata, generated edition `2026-10-02.6`, and its README overview. It was generated from local commit `83961a70e71cbbe80f65e19622356ad6f79f7472` against repository base `9aff4d23b7daf9e47d1638948937a0388e2aee84`. It excludes these research documents so it can be applied after the research PR is merged. `integration-manifest.json` records the compressed SHA-256 and affected paths.

Use a full-history clone and a clean review branch. If another content edition has landed, reconcile the canonical records and generate the next edition through the repository's edition workflow rather than overwriting newer release history.

```bash
gzip -dc docs/research/2026-10-02-source-expansion/corpus-integration.patch.gz > /tmp/accounting-corpus-integration.patch
git apply --check /tmp/accounting-corpus-integration.patch
git apply --index /tmp/accounting-corpus-integration.patch
git diff --cached --stat
npm ci
git commit -m "Integrate 198 accounting-agent sources and edition 2026-10-02.6"
npm run check
```

Commit the reviewed integration before running the repository's committed-release qualification and normal CI workflow. This patch grants no deployment or merge approval.

## Verification retained from the local integration

- All 920 existing source records and 38 existing collections were preserved byte-for-byte at the JSON value level.
- Official edition preparation and finalization succeeded for `2026-10-02.6`.
- Type checking, corpus validation, release-overview parity, UI lint and design-lint probes passed.
- The production build succeeded with 1,785 records and 41 downloads.
- Full `npm run check` was attempted and failed. History-dependent tests failed in the shallow clone, browser-related verification reported failures, and verification exhausted the workspace disk. No CI or deployment success is claimed.

Source review is limited to the scope in `review.json`; passing structural checks does not verify accounting conclusions or external reuse rights.
