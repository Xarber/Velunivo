"""Disclose reused screenshots and unverified startup in release notes."""
import argparse
import json
from pathlib import Path


def append_notes(assets, notes):
    warnings = []
    for family in ['iphone', 'ipad']:
        path = assets / f'{family}-screenshot.json'
        data = json.loads(path.read_text()) if path.exists() else {'status': 'unavailable'}
        if data['status'] == 'fresh':
            continue
        if data['status'] == 'reused':
            orientation = 'landscape' if data['width'] > data['height'] else 'portrait'
            warnings.append(f'- {family}: reused {orientation} screenshot from {data["sourceTag"]}; this build could not complete Simulator verification after two attempts.')
        else:
            warnings.append(f'- {family}: no new screenshot; previous AltSource images are retained where available. Simulator verification did not complete.')
    if warnings:
        with notes.open('a') as output:
            output.write('\n\nScreenshot verification\n\n' + '\n'.join(warnings) + '\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--assets', type=Path, required=True)
    parser.add_argument('--notes', type=Path, required=True)
    args = parser.parse_args()
    append_notes(args.assets, args.notes)


if __name__ == '__main__':
    main()
