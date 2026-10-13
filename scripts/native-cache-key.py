"""Reuse native dependency caches across version-only releases; keep real inputs."""
import hashlib
import json
from pathlib import Path

def cache_key(lock, app, modules):
    lock = json.loads(json.dumps(lock))
    lock.pop('version', None)
    lock.get('packages', {}).get('', {}).pop('version', None)
    app = json.loads(json.dumps(app))
    expo = app.get('expo', {})
    expo.pop('version', None)
    expo.get('ios', {}).pop('buildNumber', None)
    expo.get('android', {}).pop('versionCode', None)
    return hashlib.sha256(json.dumps({'lock': lock, 'app': app, 'modules': modules}, sort_keys=True, separators=(',', ':')).encode()).hexdigest()

if __name__ == '__main__':
    root = Path(__file__).resolve().parents[1]
    modules = {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((root / 'modules').rglob('*')) if p.is_file() and 'build' not in p.parts}
    for folder in ['native', 'plugins']:
        for p in sorted((root / folder).rglob('*')):
            if p.is_file(): modules[str(p.relative_to(root))] = hashlib.sha256(p.read_bytes()).hexdigest()
    patch = root / 'scripts/patch-widgets.mjs'
    modules[str(patch.relative_to(root))] = hashlib.sha256(patch.read_bytes()).hexdigest()
    print('NATIVE_DEPENDENCY_KEY=' + cache_key(json.loads((root / 'package-lock.json').read_text()), json.loads((root / 'app.json').read_text()), modules))
