#!/usr/bin/env python3
"""Bounded allowlisted source export. Not a release/secret-audit certificate."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
FORBIDDEN = {'.git', 'node_modules', 'var', 'piers', '.urb', 'private-prep',
             'evidence', 'artifacts', 'private-release', 'deployment', 'research', '__pycache__'}
# Values are constructed to keep the scanner's own patterns non-matching.
RULES = {
    'personal-path': re.compile(r'/(?:Users|home)/[^\s<>"\x27]+'),
    'private-host': re.compile(r'\b[a-z0-9.-]+\.(?:local|ts\.net)\b'),
    'private-key': re.compile(r'-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----'),
    'github-credential': re.compile(r'(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})'),
    'aws-access-id': re.compile(r'\bAKIA[A-Z0-9]{16}\b'),
    'urbit-login-code': re.compile(r'\b[a-z]{6}(?:-[a-z]{6}){3}\b'),
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def require(condition, message):
    if not condition:
        raise ValueError(message)


def source_path(name):
    rel = PurePosixPath(name)
    require(not rel.is_absolute() and '..' not in rel.parts and str(rel) == name,
            'Invalid manifest path')
    require(not FORBIDDEN.intersection(rel.parts) and not rel.name.startswith('.env'),
            'Forbidden manifest path: ' + name)
    current = ROOT
    for part in rel.parts:
        current = current / part
        require(not current.is_symlink(), 'Symlink refused: ' + name)
    require(current.is_file(), 'Missing prerequisite: ' + name)
    return current


def inspect():
    manifest = json.loads((ROOT / 'public-export.json').read_text())
    paths = manifest['files']
    require(paths and len(paths) == len(set(paths)), 'Empty/duplicate allowlist')
    require(paths == sorted(paths), 'Allowlist must be sorted')
    required = {'LICENSE', 'LICENSE-STATUS.md', 'THIRD-PARTY-NOTICES.txt',
                'site/licenses.html', 'tools/license-payload-test.py',
                'tools/build-native.py', 'native/desk/desk.docket-0.example',
                'site/GLYPH-LICENSE.txt', 'native/URBIT-LICENSE.txt', 'native/ARVO-LICENSE.txt'}
    require(required.issubset(paths), 'Required licensing/build closure missing from allowlist')
    rows, findings = [], []
    for name in paths:
        data = source_path(name).read_bytes()
        text = data.decode('utf-8')
        for category, regex in RULES.items():
            count = len(regex.findall(text))
            if count:
                findings.append({'path': name, 'category': category, 'count': count})
        rows.append({'path': name, 'bytes': len(data), 'sha256': digest(data)})
    require(not findings, 'Sensitive-content findings (values suppressed): ' + json.dumps(findings))
    art = json.loads((ROOT / 'site/provenance.json').read_text())
    require(art['generator'] == '@urbit/sigil-js@2.2.0', 'Unexpected artwork origin')
    require(len(art['manifest']) == 1024, 'Artwork manifest must cover 1024 SVGs')
    declared_art = set()
    for item in art['manifest']:
        name = 'site/assets/glyphs/' + item['file']
        require(name in paths, 'Missing glyph allowlist entry')
        require(digest(source_path(name).read_bytes()) == item['sha256'], 'Glyph hash mismatch: ' + name)
        declared_art.add(name)
    require(len(declared_art) == 1024, 'Duplicate artwork paths')
    require(declared_art == {p for p in paths if p.startswith('site/assets/glyphs/')},
            'Undeclared artwork')
    provenance = json.loads((ROOT / 'third-party-source.json').read_text())
    for item in provenance['files']:
        require(item['path'] in paths, 'Provenance path absent from allowlist')
        require(digest(source_path(item['path']).read_bytes()) == item['sha256'],
                'Retained upstream content drift: ' + item['path'])
    for item in provenance['deskCopies']:
        require(source_path(item['desk']).read_bytes() == source_path(item['reference']).read_bytes(),
                'Support source/reference mismatch: ' + item['desk'])
    require((ROOT / 'native/desk/sys.kelvin').read_text().strip() == '[%zuse 408]', 'Kelvin drift')
    lock = json.loads((ROOT / 'package-lock.json').read_text())
    require(lock['packages']['node_modules/@urbit/http-api']['version'] == '2.3.0', 'HTTP client drift')
    require('native/desk/desk.docket-0' not in paths,
            'Owner-bound descriptor must be separately reviewed; only template is allowed here')
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['check', 'export'])
    parser.add_argument('--dest', type=Path)
    args = parser.parse_args()
    try:
        rows = inspect()
        if args.action == 'export':
            require(args.dest is not None, 'export requires --dest')
            dest = args.dest.absolute()
            require(not dest.exists() and not dest.is_symlink(), 'Destination must be absent')
            require(ROOT not in dest.parents or ROOT / 'private-prep' in dest.parents or ROOT / 'private-release' in dest.parents,
                    'Nested destination must be under excluded private-prep/ or private-release/')
            require(dest.parent.is_dir() and not dest.parent.is_symlink(), 'Destination parent must exist and not be a symlink')
            dest.mkdir()
            for row in rows:
                target = dest / row['path']
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source_path(row['path']), target)
                require(digest(target.read_bytes()) == row['sha256'], 'Export byte verification failed')
            require(sorted(p.relative_to(dest).as_posix() for p in dest.rglob('*') if p.is_file()) ==
                    [r['path'] for r in rows], 'Export path set mismatch')
        seal = digest(json.dumps(rows, sort_keys=True, separators=(',', ':')).encode())
        print(json.dumps({'status': 'passed', 'action': args.action, 'files': len(rows),
                          'sourceSeal': seal, 'artworkHashes': 1024,
                          'releaseApproved': False, 'nativeQualificationRun': False}))
    except (OSError, ValueError, KeyError) as error:
        print(json.dumps({'status': 'failed', 'error': str(error)}), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
