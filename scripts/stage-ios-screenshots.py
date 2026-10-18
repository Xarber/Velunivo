"""Refresh welcome-tour previews only from a complete genuine native gallery."""
import argparse, importlib.util, json, shutil
from pathlib import Path
spec=importlib.util.spec_from_file_location('gallery_ready',Path(__file__).with_name('gallery-ready.py'))
gallery=importlib.util.module_from_spec(spec);spec.loader.exec_module(gallery)
def stage(source:Path,root:Path,build_run=''):
    version=json.loads((root/'package.json').read_text())['version']
    tag,reason=gallery.ready_gallery(source,{'apps':[{'bundleIdentifier':'app.velunivo.mobile','versions':[{'version':version}]}]})
    if not tag: raise ValueError(reason)
    target=root/'assets/onboarding';target.mkdir(parents=True,exist_ok=True)
    metadata=target/'provenance.json'
    provenance=json.loads(metadata.read_text()) if metadata.exists() else {}
    for family,device in [('iphone','iPhone 17 Pro'),('ipad','iPad Pro 11-inch')]:
        for screen in sorted(gallery.SCREENS):shutil.copyfile(source/f'{family}-{screen}.png',target/f'{family}-{screen}.png')
        provenance[family]={'platform':'ios','device':device,'version':version,'orientation':'portrait' if family=='iphone' else 'landscape','source':'Verified native Simulator gallery','buildRun':build_run}
    metadata.write_text(json.dumps(provenance,indent=2)+'\n')
    return tag
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('source',type=Path);parser.add_argument('--root',type=Path,default=Path('.'));parser.add_argument('--build-run',default='');args=parser.parse_args()
    print(stage(args.source,args.root,args.build_run))
