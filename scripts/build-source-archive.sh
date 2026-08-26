#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "${script_dir}/.." && pwd)"
downloads="${project_root}/public/downloads"
source_archive="${downloads}/accounting-agents-source.zip"

mkdir -p "${downloads}"
rm -f "${source_archive}"

cd "${project_root}"
zip -qr "${source_archive}" \
  app benchmark bin clients data docs examples LICENSE LICENSE-* LICENSES \
  AGENTS.md ATTRIBUTION.md BENCHMARK_SUBMISSIONS.md CITATION.cff CODE_OF_CONDUCT.md \
  CONTRIBUTING.md CORRECTIONS.md EDITORIAL_POLICY.md GOVERNANCE.md NOTICE.md \
  README.md RELEASES.md SECURITY.md SOURCE_ARCHIVE_NOTICE.md packs public/images \
  scripts tests package.json package-lock.json tsconfig.json next.config.ts \
  eslint.config.mjs postcss.config.mjs vite.config.ts

cd "${downloads}"
sha256sum \
  accounting-agent-packs.zip \
  accounting-agent-packs.json \
  accounting-agent-bench.json \
  accounting-agents-source.zip > SHA256SUMS

node --input-type=module -e '
  import { createHash } from "node:crypto";
  import { readFile, stat, writeFile } from "node:fs/promises";
  const names = ["accounting-agent-packs.zip", "accounting-agent-packs.json", "accounting-agent-bench.json", "accounting-agents-source.zip"];
  const assets = {};
  for (const name of names) {
    const bytes = await readFile(name);
    assets[name] = { sha256: `sha256:${createHash("sha256").update(bytes).digest("hex")}`, bytes: (await stat(name)).size };
  }
  await writeFile("archive-digests.json", `${JSON.stringify({ generated_at: "2026-08-25T00:00:00.000Z", assets }, null, 2)}\n`);
'

printf 'Built source archive and SHA-256 manifest.\n'
