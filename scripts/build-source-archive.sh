#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="${SOURCE_ARCHIVE_PROJECT_ROOT:-$(cd "${script_dir}/.." && pwd)}"

archive_paths=(
  .github .gitignore .npmrc .openai
  app benchmark bin build clients data db docs drizzle examples packs public scripts tests worker
  AGENTS.md ATTRIBUTION.md BENCHMARK_SUBMISSIONS.md CITATION.cff CODE_OF_CONDUCT.md
  CONTRIBUTING.md CORRECTIONS.md design-qa.md EDITORIAL_POLICY.md GOVERNANCE.md LICENSE
  LICENSE-CONTENT.md LICENSE-DATA.md LICENSES LICENSE_POLICY.md NOTICE.md README.md
  RELEASES.md SECURITY.md SOURCE_ARCHIVE_NOTICE.md TESTING.md cloudflare-env.d.ts
  drizzle.config.ts eslint.config.mjs next.config.ts package-lock.json package.json
  postcss.config.mjs tsconfig.json vite.config.ts
)
archive_excludes=(
  ':(exclude,glob)public/downloads/**'
  ':(exclude,glob).git/**'
  ':(exclude,glob)dist/**'
  ':(exclude,glob).next/**'
  ':(exclude,glob)out/**'
  ':(exclude,glob).wrangler/**'
  ':(exclude,glob).sites-runtime/**'
  ':(exclude,glob)node_modules/**'
  ':(exclude,glob)coverage/**'
  ':(exclude,glob)**/.env*'
  ':(exclude,glob)**/*.pem'
  ':(exclude,glob)**/*.key'
  ':(exclude,glob)**/*.p12'
  ':(exclude,glob)**/*.pfx'
  ':(exclude,glob)**/.DS_Store'
)

archive_files=()
while IFS= read -r -d '' path; do
  archive_files+=("${path}")
done < <(git -C "${project_root}" ls-files -z -- "${archive_paths[@]}" "${archive_excludes[@]}")

if (( ${#archive_files[@]} == 0 )); then
  echo "No tracked source files matched the source-archive allowlist." >&2
  exit 1
fi

case "${1:-}" in
  "") ;;
  --list)
    printf '%s\0' "${archive_files[@]}"
    exit 0
    ;;
  *)
    echo "Usage: ${BASH_SOURCE[0]} [--list]" >&2
    exit 2
    ;;
esac

downloads="${SOURCE_ARCHIVE_DOWNLOADS:-${project_root}/public/downloads}"
source_archive="${downloads}/accounting-agents-source.zip"

mkdir -p "${downloads}"
rm -f "${source_archive}"

staging="$(mktemp -d "${TMPDIR:-/tmp}/accounting-agents-source.XXXXXX")"
cleanup() {
  rm -rf "${staging}"
}
trap cleanup EXIT

staged_files=()
for path in "${archive_files[@]}"; do
  source_path="${project_root}/${path}"
  staged_path="${staging}/${path}"
  if [[ ! -e "${source_path}" && ! -L "${source_path}" ]]; then
    echo "Tracked source file is missing from the working tree: ${path}" >&2
    exit 1
  fi
  mkdir -p "$(dirname "${staged_path}")"
  cp -pP "${source_path}" "${staged_path}"
  staged_files+=("${staged_path}")
done

# Normalize archive member timestamps so rebuilding unchanged inputs is byte-stable.
for staged_path in "${staged_files[@]}"; do
  if [[ ! -L "${staged_path}" ]]; then
    touch -t 198001020000 "${staged_path}"
  fi
done

(cd "${staging}" && zip -q -X -y "${source_archive}" "${archive_files[@]}")

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
  await writeFile("archive-digests.json", `${JSON.stringify({ generated_at: "2026-08-27T00:00:00.000Z", assets }, null, 2)}\n`);
'

printf 'Built source archive and SHA-256 manifest.\n'
