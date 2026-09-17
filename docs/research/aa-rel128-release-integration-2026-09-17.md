# AA-REL128 release integration receipt: 2026-09-17

This receipt records the release decision for the nonprofit batch only. It is release-preparation evidence, not a publication or deployment claim.

## Outgoing edition decision

The outgoing `2026-09-16.1` edition was generated from the original PR128 tree at commit `75e819205c72d07fe096b84eb33629200830faa6`. That tree did not contain a committed `data/releases/2026-09-16.1` directory, so the exact tree was built in an isolated checkout with the existing build and release mechanisms. Its generated six-file release set was then preserved byte-for-byte in `data/releases/2026-09-16.1`.

The corrected records from the merged PR130 tree were not used to reconstruct the outgoing edition. Existing `2026-09-14.3` artifacts were not regenerated or changed. The final current edition is `2026-09-17.1`, generated from the reconciled tree with the preserved `2026-09-16.1` export as its immediate predecessor.

## Historical artifact hashes

| Edition | File | Bytes | SHA-256 |
|---|---|---:|---|
| 2026-09-14.3 | `changes.json` | 752 | `cb22b4b516a656462e05ef8b0f08824389824eb8a15ba68e8b28a399a5815a32` |
| 2026-09-14.3 | `corpus.json` | 9500318 | `31a6a95a6b23f7e3cef116adecff37c28e8de1c5a739548666fb6306f4bd9d05` |
| 2026-09-14.3 | `corpus.json.gz` | 766994 | `a796ead4275fe5fedbbeb92fe848b588fa6d0927f3f9c882ac6bbe0ba4e7b44a` |
| 2026-09-14.3 | `corpus.jsonl` | 7482077 | `add7c59ce1fc4120e2640addb0672b75844a3081e41c82a6be11c5fe94c0fc40` |
| 2026-09-14.3 | `manifest.json` | 891 | `f6129498482daaa2fcd1702cf4689424b9b2b7e863ea656fedfaf426f9906510` |
| 2026-09-14.3 | `record-history.jsonl` | 557 | `f3a378e4f48321e55ffc72fd3800feba1f9f3aa6fc2cf8ea4afdaac666f1b9f9` |
| 2026-09-16.1 | `changes.json` | 631 | `8aab98123353bf9cdad3cc02ad2a986664c820025ae5a36c3fce36c4b5457936` |
| 2026-09-16.1 | `corpus.json` | 9524758 | `6dc3b531fe6eb3387c2847088e2358ef99b08c5e8a899a49b0e46b6164d2014c` |
| 2026-09-16.1 | `corpus.json.gz` | 771864 | `4fa90e11ce6ab78717755c2c0a775719c350f7e8817097514402e73c9c3ef562` |
| 2026-09-16.1 | `corpus.jsonl` | 7500396 | `771ca29e96d65e77d63b2f8ba9903e7a08aa4e979f68eaa13aab74985b98281e` |
| 2026-09-16.1 | `manifest.json` | 891 | `8d9b36fe63efd50e6f99803e83201bf4e382e064edde9fa5637f331512beec26` |
| 2026-09-16.1 | `record-history.jsonl` | 534 | `ab548114da5f7bdf3887bdd8f330298b314c373704355c13c5255703a962c3db` |

The source release files and generated `dist/client/releases/` files match these hashes. Regression tests assert the historical bytes for both editions.

## Final corrected edition

`2026-09-17.1` contains 1,072 records and 639 sources. The release script reports five modified records:

- `example-us-nonprofit-restricted-award-close`: editorial data
- `guide-us-nonprofit-contributions-close`: editorial data
- `src_nonprofit_fasb_2016_14`: source claims
- `src_nonprofit_fasb_2018_08`: provenance and source claims
- `src_nonprofit_irs_990_2025`: provenance and source claims

The final build produced 27 downloads and a 225-file source archive, including the preserved historical release artifacts. Coverage snapshot `2026-09-17.1283` records the final corpus version; assessment version remains `2026-09-17.1302`, mapping version remains `2026-09-16.1`, and prior coverage snapshots remain immutable.

Publication, deployment, merge and issue-state changes remain outside this release-preparation branch.
