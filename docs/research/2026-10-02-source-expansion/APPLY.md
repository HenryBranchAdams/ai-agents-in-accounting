# Corpus integration record

The 198 source records and 22 collections in this research package are included in canonical edition `2026-10-02.6`. The edition also updates coverage metadata, the preserved snapshot, release files, and the README overview. It retains the prior 920 sources and 38 collections.

`corpus-integration.patch.gz` is the original transfer artifact, preserved for provenance. It was generated from local commit `83961a70e71cbbe80f65e19622356ad6f79f7472` against base `9aff4d23b7daf9e47d1638948937a0388e2aee84`. Its SHA-256 and affected paths are in `integration-manifest.json`. The patch has already been applied; do not apply it again to a checkout containing edition `2026-10-02.6`.

The original integration attempt in a shallow clone passed type checking, corpus validation, release-overview parity, UI lint, design-lint probes, and a production build of 1,785 records and 41 downloads. Its full `npm run check` did not pass because history-dependent and browser checks failed and the workspace ran out of disk space. That attempt is historical evidence, not qualification of the integrated branch.

Source review is limited to the scope in `review.json`. Structural checks do not verify accounting conclusions, source currency, professional review, external reuse rights, or deployment.
