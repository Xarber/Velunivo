"""Publish image assets before the mutable feed and verify the uploaded JSON."""
import argparse, json, subprocess, tempfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--repo',required=True);p.add_argument('--source',default='work/source');a=p.parse_args()
root=Path(__file__).resolve().parents[1];folder=Path(a.source)
images=sorted(folder.glob('icon-*.png'))+[root/'assets/icon.png',root/'docs/brand/banner.png',root/'docs/brand/social-preview.png']
if not list(folder.glob('icon-*.png')):raise SystemExit('Missing content-addressed source icon')
subprocess.run(['gh','release','upload','1.0','-R',a.repo,*map(str,images),'--clobber'],check=True)
subprocess.run(['gh','release','upload','1.0','-R',a.repo,str(folder/'apps.json'),'--clobber'],check=True)
with tempfile.TemporaryDirectory() as temp:
    subprocess.run(['gh','release','download','1.0','-R',a.repo,'--pattern','apps.json','--dir',temp],check=True)
    if json.loads((Path(temp)/'apps.json').read_text())!=json.loads((folder/'apps.json').read_text()):raise SystemExit('Published AltSource verification failed')
print('Published and verified AltSource metadata and images.')
