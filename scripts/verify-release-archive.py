#!/usr/bin/env python3
"""Bind an existing extracted package to an independently authenticated ZIP.

No downloaded code is run and no files are extracted. The caller separately
validates every existing package byte against this authenticated manifest.
"""
import hashlib
import json
from pathlib import Path
import stat
import sys
import zipfile


def verify(archive, directory, expected):
    h = hashlib.sha256()
    with Path(archive).open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            h.update(block)
    if h.hexdigest() != expected.removeprefix('sha256:'):
        raise ValueError('Cached ZIP differs from authenticated platform digest')
    with zipfile.ZipFile(archive) as source:
        entries = source.infolist()
        names = [entry.filename for entry in entries]
        if len(entries) > 10000 or len(set(names)) != len(names):
            raise ValueError('Invalid archive member count or duplicates')
        if sum(entry.file_size for entry in entries) > 2 * 1024 ** 3:
            raise ValueError('Archive exceeds size budget')
        for entry in entries:
            mode = entry.external_attr >> 16
            if entry.is_dir() or entry.flag_bits & 1 or stat.S_IFMT(mode) not in (0, stat.S_IFREG):
                raise ValueError('Nonregular or encrypted archive member')
        metadata = source.getinfo('release-package.json')
        if metadata.file_size > 8 * 1024 * 1024:
            raise ValueError('Manifest exceeds size budget')
        body = source.read(metadata)
        manifest = json.loads(body)
        declared = [item['path'] for item in manifest['files']]
        if len(set(declared)) != len(declared) or set(names) != {'release-package.json', *declared}:
            raise ValueError('Archive membership differs from manifest')
        if Path(directory, 'release-package.json').read_bytes() != body:
            raise ValueError('Extracted package manifest differs from authenticated archive')
        return {'package_sha256': hashlib.sha256(body).hexdigest(), 'artifact_sha256': h.hexdigest()}


if __name__ == '__main__':
    try:
        if len(sys.argv) != 4:
            raise ValueError('Expected archive, package directory and authenticated digest')
        print(json.dumps(verify(*sys.argv[1:])))
    except (ValueError, OSError, KeyError, TypeError, zipfile.BadZipFile) as error:
        sys.exit(f'Cached artifact verification refused: {error}')
