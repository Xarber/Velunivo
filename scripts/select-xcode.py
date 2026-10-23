"""Select an installed prerelease Xcode, including release candidates. No downloads."""
import argparse
import plistlib
import re
from pathlib import Path


def select_xcode(applications, allow_stable=False):
    candidates=[]
    for path in Path(applications).glob('Xcode*.app'):
        if path.is_symlink():
            continue
        name=path.name.lower()
        rc='release_candidate' in name or 'release candidate' in name or bool(re.search(r'[_ -]rc(?:[_ .-]|$)',name))
        prerelease='beta' in name or rc
        if not prerelease and not allow_stable:
            continue
        try:
            info=plistlib.loads((path/'Contents/Info.plist').read_bytes())
            version=str(info['CFBundleShortVersionString'])
        except (OSError,ValueError,KeyError):
            version=path.name
        numbers=tuple(map(int,re.findall(r'\d+',version)[:3]))
        candidates.append((prerelease,numbers,rc,path.name,path))
    if not candidates:
        raise RuntimeError('No installed Xcode beta or release candidate; stable fallback is disabled')
    return max(candidates)[-1]


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--applications',default='/Applications')
    parser.add_argument('--allow-stable',action='store_true')
    args=parser.parse_args()
    chosen=select_xcode(args.applications,args.allow_stable)
    print(f'DEVELOPER_DIR={chosen}/Contents/Developer')
    print(f'XCODE_CACHE_ID={chosen.name}')
