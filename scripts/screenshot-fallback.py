"""Reuse a real published screenshot after both live capture attempts fail."""
import argparse
import json
import re
from urllib.parse import urlparse
import shutil
import struct
import subprocess
import tempfile
import time
from pathlib import Path

LOOKUP_DEADLINE = None

def gh(*args):
    timeout = 30 if LOOKUP_DEADLINE is None else min(30, LOOKUP_DEADLINE - time.monotonic())
    if timeout <= 0:
        raise subprocess.TimeoutExpired('gh historical screenshot lookup', 90)
    return subprocess.check_output(['gh', *args], text=True, timeout=timeout)


def dimensions(image):
    data = image.read_bytes()
    if len(data) < 24 or data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('Invalid historical PNG')
    width, height = struct.unpack('>II', data[16:24])
    if not width or not height:
        raise ValueError('Invalid historical dimensions')
    return width, height


def source_gallery(repo, family, folder):
    with tempfile.TemporaryDirectory() as temp:
        gh('release','download','1.0','--repo',repo,'--pattern','apps.json','--dir',temp)
        source=json.loads((Path(temp)/'apps.json').read_text())
        app=next(a for a in source.get('apps',[]) if a.get('bundleIdentifier')=='app.velunivo.mobile')
        images=[]
        for shot in app.get('screenshots',{}).get(family,[]):
            url=shot.get('imageURL','');name=urlparse(url).path.rsplit('/',1)[-1]
            match=re.fullmatch(r'screenshot-'+family+r'(?:-(navigation|explore|library|vehicles))?-[0-9a-f]{12}\.png',name)
            if url.startswith(f'https://github.com/{repo}/releases/download/1.0/') and match:
                images.append((name,match.group(1)))
        if not images: return None
        arguments=['release','download','1.0','--repo',repo,'--dir',temp]
        for name,_ in images: arguments+=['--pattern',name]
        gh(*arguments)
        verified=[(name,scene,dimensions(Path(temp)/name)) for name,scene in images]
        for name,scene,_ in verified:
            if scene: shutil.copyfile(Path(temp)/name,folder/f'{family}-{scene}.png')
        name,_,(width,height)=verified[0]
        shutil.copyfile(Path(temp)/name,folder/f'{family}.png')
        version=app.get('versions',[{}])[0].get('version','unknown')
        return {'status':'reused','sourceTag':'v'+version,'width':width,'height':height,
                'reason':'Live capture failed twice; gallery retained from the AltSource.'}


def reuse(repo, family, folder):
    global LOOKUP_DEADLINE
    LOOKUP_DEADLINE = time.monotonic() + 90
    target = folder / f'{family}.png'
    target.unlink(missing_ok=True)
    for partial in folder.glob(f'{family}-*.png'): partial.unlink()
    try:
        saved=source_gallery(repo,family,folder)
        if saved:
            (folder/f'{family}-screenshot.json').write_text(json.dumps(saved,indent=2)+'\n')
            print(f'::warning::Reused {family} AltSource gallery; current verification failed.')
            return saved
    except (subprocess.SubprocessError,OSError,ValueError,StopIteration,KeyError,IndexError,TypeError):
        pass
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
