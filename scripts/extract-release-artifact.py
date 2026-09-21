#!/usr/bin/env python3
"""Validate package bytes in a fresh directory. This does not establish CI trust.

The reviewed consumer must independently authenticate the GitHub run and pass
its artifact ZIP digest. No downloaded code is executed by this extractor.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import tempfile
import zipfile

MAX_BYTES = 2 * 1024 * 1024 * 1024
MAX_FILES = 10000

def digest(data):
    return hashlib.sha256(data).hexdigest()

def allowed(name):
    path = PurePosixPath(name)
    if not name or "\\" in name or name.startswith("/") or any(p in ("", ".", "..") for p in name.split("/")):
        return False
    if str(path) != name or "\x00" in name:
        return False
    return bool(
        name in {"application/.openai/hosting.json", "application/dist/.openai/hosting.json", "storage/manifest.json"}
        or re.fullmatch(r"application/dist/server/[A-Za-z0-9_.-]+\.(js|json)", name)
        or name.startswith("application/dist/client/")
        or re.fullmatch(r"storage/objects/[a-f0-9]{64}", name)
        or re.fullmatch(r"evidence/(qualification|release-meta|download-manifest|source-export-manifest|source-inputs)\.json", name)
    )

def extract(archive, destination, expected_digest):
    archive, destination = Path(archive), Path(destination)
    h = hashlib.sha256()
    with archive.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            h.update(block)
    if h.hexdigest() != expected_digest.removeprefix("sha256:"):
        raise ValueError("Artifact ZIP digest differs from authenticated platform digest")
    if destination.exists() or destination.is_symlink():
        raise ValueError("Use a fresh artifact destination")
    destination.parent.mkdir(parents=True, exist_ok=True)
    lock = destination.with_name(destination.name + ".lock")
    fd = os.open(lock, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    os.close(fd)
    temporary = Path(tempfile.mkdtemp(prefix=".release-extract-", dir=destination.parent))
    try:
        with zipfile.ZipFile(archive) as source:
            entries = source.infolist()
            if len(entries) > MAX_FILES or sum(e.file_size for e in entries) > MAX_BYTES:
                raise ValueError("Artifact exceeds extraction budget")
            names = [e.filename for e in entries]
            if len(set(names)) != len(names):
                raise ValueError("Duplicate ZIP members")
            for entry in entries:
                mode = entry.external_attr >> 16
                if entry.is_dir() or stat.S_ISLNK(mode) or (stat.S_IFMT(mode) not in (0, stat.S_IFREG)):
                    raise ValueError("Only regular file members are permitted")
                if entry.flag_bits & 1:
                    raise ValueError("Encrypted artifact member")
                if entry.filename != "release-package.json" and not allowed(entry.filename):
                    raise ValueError("Unexpected or unsafe artifact path")
            meta = source.getinfo("release-package.json")
            if meta.file_size > 8 * 1024 * 1024:
                raise ValueError("Oversized package manifest")
            manifest_body = source.read(meta)
            manifest = json.loads(manifest_body)
            if manifest.get("schema_version") != 1 or manifest.get("contract") != "accounting-agents-ci-release":
                raise ValueError("Unsupported release artifact contract")
            promised = manifest.get("files")
            if not isinstance(promised, list) or not promised:
                raise ValueError("Missing artifact file inventory")
            declared = [e.get("path") for e in promised]
            if len(set(declared)) != len(declared) or set(names) != {"release-package.json", *declared}:
                raise ValueError("Artifact membership differs from manifest")
            for item in promised:
                name = item["path"]
                if not allowed(name) or type(item.get("bytes")) is not int or not 0 <= item["bytes"] <= MAX_BYTES:
                    raise ValueError("Invalid member contract")
                entry = source.getinfo(name)
                if entry.file_size != item["bytes"]:
                    raise ValueError("Member size differs from manifest")
                if item.get("mode") not in (0o644, 0o755):
                    raise ValueError("Unsupported member mode")
                target = temporary / name
                target.parent.mkdir(parents=True, exist_ok=True)
                h = hashlib.sha256()
                with source.open(entry) as reader, target.open("xb") as writer:
                    for block in iter(lambda: reader.read(1024 * 1024), b""):
                        h.update(block)
                        writer.write(block)
                if h.hexdigest() != item.get("sha256"):
                    raise ValueError("Member SHA-256 differs from manifest")
                target.chmod(item["mode"])
            (temporary / "release-package.json").write_bytes(manifest_body)
        if destination.exists() or destination.is_symlink():
            raise ValueError("Artifact destination changed during extraction")
        temporary.rename(destination)
        return {"directory": str(destination), "artifact_sha256": expected_digest.removeprefix("sha256:"), "package_sha256": digest(manifest_body), "files": len(promised), "provenance_verified": False}
    finally:
        if temporary.exists():
            shutil.rmtree(temporary)
        lock.unlink()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive")
    parser.add_argument("destination")
    parser.add_argument("--sha256", required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(extract(args.archive, args.destination, args.sha256)))
    except (ValueError, OSError, KeyError, TypeError, zipfile.BadZipFile) as error:
        parser.exit(1, f"Artifact extraction refused: {error}\n")
