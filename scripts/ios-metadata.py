import argparse, json, plistlib
from pathlib import Path
p = argparse.ArgumentParser(); p.add_argument('--app', required=True); p.add_argument('--ipa', required=True); p.add_argument('--native', default='ios'); p.add_argument('--output', default='artifacts/ios-metadata.json'); a = p.parse_args()
app = Path(a.app); info = plistlib.loads((app/'Info.plist').read_bytes())
privacy = {}; entitlements = set()
for plist in [app/'Info.plist', *app.glob('PlugIns/*.appex/Info.plist')]:
    data = plistlib.loads(plist.read_bytes())
    privacy.update({k: v for k, v in data.items() if k.endswith('UsageDescription')})
for plist in Path(a.native).rglob('*.entitlements'):
    data = plistlib.loads(plist.read_bytes()); entitlements.update(data.keys())
entitlements -= {'application-identifier', 'com.apple.developer.team-identifier'}
result = {'version': str(info['CFBundleShortVersionString']), 'buildVersion': str(info['CFBundleVersion']), 'bundleIdentifier': info['CFBundleIdentifier'], 'minOSVersion': info['MinimumOSVersion'], 'size': Path(a.ipa).stat().st_size, 'appPermissions': {'entitlements': sorted(entitlements), 'privacy': privacy}}
Path(a.output).write_text(json.dumps(result, indent=2)+'\n')
