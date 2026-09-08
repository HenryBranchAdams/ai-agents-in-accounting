# Maintenance and release history

The corpus is read-only. Maintenance checks produce review evidence and artifacts; they do not verify accounting claims, grant reuse rights, edit records, open issues, or commit changes.

Run `node scripts/maintenance.mjs` to print a deterministic review queue. Reasons are editorial maintenance prompts, not source quality scores. Inherited records are identified separately from records with an explicit review date. The queue also uses `data/source-observations.json` when present.

Run `node scripts/maintenance.mjs --check` for a bounded, read-only check of at most ten public HTTP(S) source URLs. Set `MAINTENANCE_OBSERVATIONS=path.json` to write an observation file. The checker rejects local hostnames, private IP literals, credential-bearing URLs, and unsafe literal redirect destinations; it is not a DNS-rebinding defense; records reachability, headers, a bounded content fingerprint, and a title hint, never publisher full text. HTTP errors, rate limits, and transport failures remain indeterminate when their cause is not established.

Release artifacts are generated with `node scripts/release-history.mjs CURRENT.json [PREVIOUS.json]`. Existing version directories are immutable: a changed artifact fails. `changes.json` and `record-history.jsonl` classify field changes as editorial, editorial-data, provenance, source-claims, rights, applicability, or relations. Categories are additive when several fields changed; they do not infer whether a claim is correct. Historical snapshots preserve the corpus export and its recorded version.

The weekly workflow uploads observations as an artifact; it does not automatically merge them into canonical data. A maintainer must inspect and incorporate observations before they appear in a published queue. The first local check observed three URLs (two HTTP 200 responses and one restricted HTTP 403 response); this is reachability evidence only.

Builds generate current snapshots under `dist/client/releases/` alongside all downloads. The baseline snapshot at `data/releases/2026-09-07.3/` is preserved in the source package. On a future release, preserve the outgoing version with the release script before updating the current version. Never overwrite an existing release artifact.
