"""Stage only a complete, verified Android 17 phone + tablet native gallery.

No screenshots are attached to binary releases or embedded in README. Obtainium
reads the GitHub APK; Fastlane supplies the repository's Android store metadata.
"""
import argparse,json,shutil,struct
from pathlib import Path
SCREENS=('explore','vehicles','library','settings')
def stage(source:Path,root:Path):
    accepted={}
    for family,prefix in [('phone','android'),('tablet','android-tablet')]:
        manifest=json.loads((source/f'{prefix}-capture.json').read_text())
        if manifest.get('status')!='fresh' or manifest.get('api')!=37 or manifest.get('family')!=family:
            raise ValueError('Fresh Android 17 '+family+' capture is required')
        if {s['screen'] for s in manifest.get('screens',[])}!=set(SCREENS) or not manifest.get('appVersion'):
            raise ValueError('Incomplete native gallery')
        for name in SCREENS:
            raw=(source/f'{prefix}-{name}.png').read_bytes()
            if len(raw)<24 or raw[:8]!=b'\x89PNG\r\n\x1a\n':raise ValueError('Invalid screenshot')
            width,height=struct.unpack('>II',raw[16:24])
            if min(width,height)<720 or (width>height)!=(family=='tablet'):raise ValueError('Wrong screenshot orientation or size')
        accepted[family]=manifest
    if accepted['phone']['appVersion']!=accepted['tablet']['appVersion']:raise ValueError('Phone and tablet app versions differ')
    # Validate every source before changing metadata; never stage a partial set.
    for family,prefix,category in [('phone','android','phoneScreenshots'),('tablet','android-tablet','tenInchScreenshots')]:
        for locale in ('en-US','it-IT'):
            target=root/'fastlane/metadata/android'/locale/'images'/category;target.mkdir(parents=True,exist_ok=True)
            for old in target.glob('*.png'):old.unlink()
            for index,name in enumerate(SCREENS,1):shutil.copyfile(source/f'{prefix}-{name}.png',target/f'{index:02d}-{name}.png')
        target=root/'assets/onboarding';target.mkdir(parents=True,exist_ok=True)
        for name in SCREENS:shutil.copyfile(source/f'{prefix}-{name}.png',target/f'{prefix}-{name}.png')
    provenance_file=root/'assets/onboarding/provenance.json'
    provenance=json.loads(provenance_file.read_text()) if provenance_file.exists() else {}
    provenance.update(android=accepted['phone'],androidTablet=accepted['tablet'])
    provenance_file.write_text(json.dumps(provenance,indent=2)+'\n')
    return accepted
if __name__=='__main__':
    args=argparse.ArgumentParser();args.add_argument('source',type=Path);args.add_argument('--root',type=Path,default=Path('.'));options=args.parse_args()
    print(json.dumps(stage(options.source,options.root),indent=2))
