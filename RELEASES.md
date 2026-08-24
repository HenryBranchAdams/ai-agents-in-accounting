# Releases

Each public release has an immutable ID, publication time, compatibility note, record counts, rights summary, asset list, corpus digest, change entry, and machine-readable manifest. Stable IDs persist across compatible releases. Breaking API or schema changes require a new major version and migration notes.

Patch releases correct text, links, metadata, fixtures, or code without intentionally breaking consumers. Minor releases add compatible records or fields. Major releases may change required schemas, authority semantics, or identifier contracts.

Release gates include schema validation, generated-artifact parity, source-link integrity, benchmark hard-gate validation, accessibility checks, lint, rendered-route tests, rights review, and source-archive checksums.
