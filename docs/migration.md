# Research corpus migration — September 7, 2026

The project has one mission: a public, read-only research corpus for building accounting agents. The corpus schema is now 2.0.0; the first refactored snapshot is 2026-09-07.1. This document describes local implementation, not a claim that it is published.

## Retained information

All 489 source IDs and 60 workflow IDs were retained. The corpus also contains 24 design references, 16 controls, 10 sensitive actions, six authority levels, 14 templates, 47 glossary entries, eight accounting processes, five interoperability references, ten guides, 21 bibliographies, and six synthetic example sets. The six examples retain 30 static scenarios and reference expectations without scoring or execution.

Twenty course readings became the foundations bibliography. Reading-room selections became topic collections. Seven rendered editorial guides were extracted as text and references. Rich source, workflow, and design data remains machine-readable. `data/migration.json` records the inventory.

Migration did not reverify sources. Earlier review dates and statuses remain historical provenance; current `reviewed_at` is null for inherited records. External full text remains excluded.

## Retired surfaces

The React, Next, Vinext, course, quiz, tutorial, lab, Atlas, practice-observatory interface, benchmark runner, LedgerBench program, database examples, old clients, and associated design and backlog plans were removed from the active project. Useful source references about education or evaluation remain ordinary research records.

The replacement uses a small Fetch handler with server-rendered HTML, canonical JSON data, and static exports. It has no database or runtime packages. CI checks every pull request and main-branch push, without the former benchmark-specific path filter.

## Compatibility

Stable record pages use `/records/{id}`. Source, workflow, design, and selected reference page URLs redirect through `data/redirects.json`. Former experimental surfaces return 410, with a route back to the corpus. Former specialized API families are retired; clients should use `/api/v1/records`, its filters, and `/api/v1/collections/{id}`. `/api/v1/meta` describes the current contract. `/openapi.json` is authoritative for the replacement retrieval API.

Downloads use a consistent schema and are regenerated with every build. They are the latest snapshot, not permanent version-addressed hosting. Preserve downloaded files and their manifest if you need immutable evidence. Publication and retained release hosting are separate maintainer actions.

## Recovery and local cleanup

Before deletion, a verified Git bundle, a complete source ZIP including uncommitted files, file hashes, branch/worktree inventories, and the prior corpus were saved under `outputs/recovery/2026-09-07-pre-corpus/`. The prior September 1 ZIP was moved into that recovery directory. Recovery files are ignored and are not distributed in the public source archive.

Superseded local topic branches can be recovered from the bundle; the source ZIP preserves the prior uncommitted state. Cleanup removed 15 superseded local topic branches, the nonexistent worktree entry, and five obsolete remote topic branches. Local branches are `main` and `codex/research-corpus`; GitHub retains `main`. Every removed tip was checked against the recovery bundle, and remote deletions were atomic and guarded against concurrent changes. The two old hardening branches contained superseded patch-staging work and remain recoverable from the bundle. The published site and remote main were not changed by this cleanup.
