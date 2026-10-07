import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

export function privateNotices(root, expectedLockfileHash) {
  const lockfile = fs.readFileSync(path.join(root, 'package-lock.json'));
  if (hash(lockfile) !== expectedLockfileHash) throw Error('Private dependency lockfile differs from qualified artifact.');
  const lock = JSON.parse(lockfile), packages = new Map();
  function visit(name, base = root) {
    let location = base, folder;
    for (;;) {
      const candidate = path.join(location, 'node_modules', name);
      if (fs.existsSync(candidate)) { folder = candidate; break; }
      const parent = path.dirname(location);
      if (parent === location) throw Error(`Installed runtime dependency missing: ${name}`);
      location = parent;
    }
    if (packages.has(folder)) return;
    const info = JSON.parse(fs.readFileSync(path.join(folder, 'package.json')));
    const locked = lock.packages[path.relative(root, folder)];
    if (!locked || locked.version !== info.version) throw Error(`Installed dependency differs from lock: ${name}`);
    const files = fs.readdirSync(folder).filter(file => /^(?:licen[cs]e(?:[.-].*)?|notice(?:[.-].*)?)$/i.test(file)).sort();
    let texts = files.map(file => ({ file, text: fs.readFileSync(path.join(folder, file), 'utf8') }));
    if (!texts.length && info.name === 'react-remove-scroll-bar' && info.version === '2.3.8' && info.license === 'MIT') {
      const notice = fs.readFileSync(path.join(root, 'scripts/private-mcp/notices/react-remove-scroll-bar.LICENSE'));
      if (hash(notice) !== 'a79aae0c0f21990d9d963bb3c5a79cdcea9a46f8523ba55c58d7fe776b6ebc84') throw Error('Reviewed upstream permission notice differs.');
      texts = [{ file: 'Official upstream LICENSE', text: 'The installed 2.3.8 package declares MIT but omits a full license file. This official upstream permission text is pinned to commit 7301c160fda44cb8cf2b9fdfde61efad35736196 (2025-05-21): https://raw.githubusercontent.com/theKashey/react-remove-scroll-bar/7301c160fda44cb8cf2b9fdfde61efad35736196/LICENSE . This does not claim that the file shipped with version 2.3.8.\n\n' + notice }];
    }
    if (!texts.length) throw Error(`Full installed permission notice missing: ${name}@${info.version}`);
    packages.set(folder, { name: info.name, version: info.version, license: info.license,
      texts });
    for (const dependency of Object.keys(info.dependencies || {}).sort()) visit(dependency, folder);
  }
  const project = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
  for (const name of [...Object.keys(project.dependencies), '@modelcontextprotocol/server'].sort()) visit(name);
  const text = [...packages.values()].sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version))
    .map(info => `## ${info.name} ${info.version}\n\nDeclared license: ${info.license}\n\n${info.texts.map(({ file, text }) => `### ${file}\n\n${text.trim()}\n`).join('\n')}`).join('\n');
  const files = Object.fromEntries(['LICENSE', 'LICENSE-CONTENT.md', 'LICENSE-DATA.md', 'LICENSE_POLICY.md', 'NOTICE.md', 'ATTRIBUTION.md']
    .map(file => [file, fs.readFileSync(path.join(root, file))]));
  files['THIRD_PARTY_NOTICES.md'] = Buffer.from(`# Private derivative third-party notices\n\nRuntime dependencies and application primitives retain their original terms. Publisher sources remain outside these grants.\n\n${text}\n\n## shadcn/ui source\n\n${fs.readFileSync(path.join(root, 'LICENSES/shadcn-ui.txt'), 'utf8')}`);
  return files;
}
