"""Reuse a real published screenshot after both live capture attempts fail."""
import argparse
import json
import shutil
import struct
import subprocess
import tempfile
from pathlib import Path


def gh(*args):
    return subprocess.check_output(['gh', *args], text=True, timeout=30)


def dimensions(image):
    data = image.read_bytes()
    if len(data) < 24 or data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('Invalid historical PNG')
    width, height = struct.unpack('>II', data[16:24])
    if not width or not height:
        raise ValueError('Invalid historical dimensions')
    return width, height


def reuse(repo, family, folder):
    target = folder / f'{family}.png'
    target.unlink(missing_ok=True)
    status = {'status': 'unavailable', 'reason': 'Live capture failed twice; no usable published screenshot found.'}
    try:
        releases = json.loads(gh('release', 'list', '--repo', repo, '--limit', '30', '--json', 'tagName,isDraft,publishedAt'))
        releases = sorted((r for r in releases if not r['isDraft'] and r['tagName'].startswith('v')), key=lambda r: r['publishedAt'], reverse=True)
        for release in releases[:5]:
            try:
                with tempfile.TemporaryDirectory() as temp:
                    gh('release', 'download', release['tagName'], '--repo', repo, '--pattern', target.name, '--dir', temp)
                    image = Path(temp) / target.name
                    width, height = dimensions(image)
                    shutil.copyfile(image, target)
                status = {'status': 'reused', 'sourceTag': release['tagName'], 'width': width, 'height': height,
                          'reason': 'Live capture failed twice; this screenshot shows an earlier app version.'}
                print(f'::warning::Reused {family} screenshot from {release["tagName"]}; current Simulator verification failed.')
                break
            except (subprocess.SubprocessError, OSError, ValueError):
                continue
    except (subprocess.SubprocessError, OSError, ValueError) as error:
        print(f'::warning::Historical screenshot lookup failed: {error}')
    (folder / f'{family}-screenshot.json').write_text(json.dumps(status, indent=2) + '\n')
    if status['status'] == 'unavailable':
        print(f'::warning::{family}: no replacement screenshot; preserve existing source images where available.')
    return status


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', required=True)
    parser.add_argument('--family', choices=['iphone', 'ipad'], required=True)
    parser.add_argument('--folder', type=Path, default=Path('artifacts'))
    args = parser.parse_args()
    args.folder.mkdir(exist_ok=True)
    reuse(args.repo, args.family, args.folder)


if __name__ == '__main__':
    main()
