"""Publish only complete, fresh native galleries for the current AltSource version."""
import argparse
import json
import re
import struct
import sys
from pathlib import Path

SCREENS = {'explore', 'library', 'vehicles', 'navigation'}


def ready_gallery(folder, source):
    app = next(a for a in source['apps'] if a['bundleIdentifier'] == 'app.velunivo.mobile')
    version = app['versions'][0]['version']
    if not re.fullmatch(r'\d+\.\d+\.\d+', version):
        raise ValueError('Invalid published source version')
    for family in ['iphone', 'ipad']:
        try:
            status = json.loads((folder / f'{family}-screenshot.json').read_text())
            if status.get('status') != 'fresh':
                return None, f'{family}: fresh capture unavailable; retaining existing screenshots.'
            if status.get('appVersion') != version:
                return None, 'A newer app is published; retaining its source metadata.'
            if set(status.get('screens', [])) != SCREENS:
                return None, f'{family}: incomplete gallery; retaining existing screenshots.'
            for scene in SCREENS:
                header = (folder / f'{family}-{scene}.png').read_bytes()[:24]
                if len(header) != 24 or header[:8] != b'\x89PNG\r\n\x1a\n':
                    return None, f'{family}: invalid screenshot; retaining existing screenshots.'
                width, height = struct.unpack('>II', header[16:24])
                if not width or not height or (family == 'ipad' and width <= height) or (family == 'iphone' and height <= width):
                    return None, f'{family}: incorrect orientation; retaining existing screenshots.'
        except (OSError, ValueError, TypeError):
            return None, f'{family}: missing capture evidence; retaining existing screenshots.'
    return 'v' + version, 'Both fresh native galleries verified.'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--assets', type=Path, default=Path('artifacts'))
    parser.add_argument('--source', type=Path, required=True)
    args = parser.parse_args()
    tag, reason = ready_gallery(args.assets, json.loads(args.source.read_text()))
    print('ready=' + str(tag is not None).lower())
    print('::notice::' + reason, file=sys.stderr)
    if tag:
        print('tag=' + tag)


if __name__ == '__main__':
    main()
