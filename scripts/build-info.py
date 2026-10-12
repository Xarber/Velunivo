"""Consolidate public release data while leaving download assets uncluttered."""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path

BINARIES = ('Velunivo.ipa', 'Velunivo.apk', 'Velunivo-simulator.app.zip')

def build_info(folder, repo, tag, sha, run_id):
    metadata = json.loads((folder / 'ios-metadata.json').read_text())
    if tag != 'v' + metadata['version']:
        raise ValueError('Release tag does not match the compiled IPA version')
    binaries = []
    for name in BINARIES:
        path = folder / name
        if not path.is_file() or path.stat().st_size == 0:
            raise ValueError(f'Missing release binary: {name}')
        with path.open('rb') as stream:
            digest = hashlib.file_digest(stream, 'sha256').hexdigest()
        binaries.append({'name': name, 'size': path.stat().st_size, 'sha256': digest,
                         'url': f'https://github.com/{repo}/releases/download/{tag}/{name}'})
    details = {}
    # Retain all build records and verification diagnostics. Images/binaries remain
    # workflow artifacts; screenshots are published only to the mutable AltSource.
    for path in sorted(folder.rglob('*')):
        if path.is_file() and path.suffix in ('.txt', '.json', '.md', '.log', '.ips') and path.name != 'build_info.json':
            content = path.read_text(errors='replace')
            try:
                value = json.loads(content) if path.suffix in ('.json', '.ips') else content
            except ValueError:
                value = content
            details[str(path.relative_to(folder))] = value
    web = folder / 'web.zip'
    web_hash = None
    if web.exists():
        with web.open('rb') as stream:
            web_hash = hashlib.file_digest(stream, 'sha256').hexdigest()
    return {'schemaVersion': 1, 'version': metadata['version'], 'tag': tag, 'repository': repo,
            'sourceCommit': sha, 'createdAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'workflow': {'runId': run_id, 'url': f'https://github.com/{repo}/actions/runs/{run_id}'},
            'binaries': binaries, 'ios': metadata, 'details': details,
            'web': {'distribution': 'GitHub Actions web artifact', 'name': 'web',
                    'filename': 'web.zip', 'size': web.stat().st_size if web.exists() else None,
                    'sha256': web_hash}}

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--assets', default='artifacts'); p.add_argument('--repo', required=True)
    p.add_argument('--tag', required=True); p.add_argument('--sha', default=os.getenv('GITHUB_SHA', ''))
    p.add_argument('--run-id', default=os.getenv('GITHUB_RUN_ID', ''))
    args = p.parse_args(); folder = Path(args.assets)
    info = build_info(folder, args.repo, args.tag, args.sha, args.run_id)
    (folder / 'build_info.json').write_text(json.dumps(info, indent=2, ensure_ascii=False) + '\n')

if __name__ == '__main__':
    main()
