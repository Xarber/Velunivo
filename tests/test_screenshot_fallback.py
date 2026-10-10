import importlib.util
import json
import struct
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


def load(name):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).parents[1] / f'scripts/{name}.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


fallback = load('screenshot-fallback')
notes = load('screenshot-notes')


class ScreenshotFallbackTests(unittest.TestCase):
    def test_latest_real_published_image_is_reused_and_disclosed(self):
        releases = [{'tagName': '1.0', 'isDraft': False, 'publishedAt': '2026-10-10'},
                    {'tagName': 'v0.1.2', 'isDraft': False, 'publishedAt': '2026-10-09'}]
        def command(*args):
            if args[1] == 'list':
                return json.dumps(releases)
            image = Path(args[args.index('--dir') + 1]) / 'ipad.png'
            image.write_bytes(b'\x89PNG\r\n\x1a\n' + b'\0' * 8 + struct.pack('>II', 2048, 2732))
            self.assertEqual(args[2], 'v0.1.2')
            return ''
        with tempfile.TemporaryDirectory() as folder, patch.object(fallback, 'gh', side_effect=command):
            root = Path(folder)
            status = fallback.reuse('Xarber/Velunivo', 'ipad', root)
            self.assertEqual(status['status'], 'reused')
            self.assertEqual(fallback.dimensions(root / 'ipad.png'), (2048, 2732))
            release_notes = root / 'release-notes.md'
            release_notes.write_text('Changes')
            notes.append_notes(root, release_notes)
            self.assertIn('reused portrait screenshot from v0.1.2', release_notes.read_text())
            self.assertIn('could not complete Simulator verification', release_notes.read_text())

    def test_lookup_failure_is_nonfatal_and_never_reuses_partial_current_frame(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(fallback, 'gh', side_effect=subprocess.TimeoutExpired('gh', 30)):
            root = Path(folder)
            (root / 'iphone.png').write_bytes(b'partial current frame')
            self.assertEqual(fallback.reuse('Xarber/Velunivo', 'iphone', root)['status'], 'unavailable')
            self.assertFalse((root / 'iphone.png').exists())
            self.assertTrue((root / 'iphone-screenshot.json').exists())

    def test_source_preserves_previous_images_when_new_images_are_missing(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            meta = {'version': '0.1.11', 'buildVersion': '1', 'bundleIdentifier': 'app.velunivo.mobile', 'size': 100, 'minOSVersion': '16.4', 'appPermissions': {}}
            (root / 'ios-metadata.json').write_text(json.dumps(meta))
            previous = {'apps': [{'bundleIdentifier': meta['bundleIdentifier'], 'versions': [], 'screenshots': {'ipad': [{'imageURL': 'https://example.com/old-ipad.png', 'width': 2048, 'height': 2732}]}}], 'news': []}
            (root / 'old.json').write_text(json.dumps(previous))
            script = Path(__file__).parents[1] / 'scripts/update-source.py'
            subprocess.check_call(['python3', str(script), '--repo', 'Xarber/Velunivo', '--tag', 'v0.1.11', '--assets', folder, '--existing', str(root / 'old.json'), '--output', str(root / 'new.json')])
            result = json.loads((root / 'new.json').read_text())
            self.assertEqual(result['apps'][0]['screenshots'], previous['apps'][0]['screenshots'])
            self.assertEqual(result['apps'][0]['versions'][0]['version'], '0.1.11')


    def test_source_refreshes_both_icons_and_exposes_tablet_in_phone_gallery(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            meta = {'version':'0.1.13','buildVersion':'23','bundleIdentifier':'app.velunivo.mobile','size':100,'minOSVersion':'16.4','appPermissions':{}}
            (root/'ios-metadata.json').write_text(json.dumps(meta))
            shots = {'iphone':[{'imageURL':'https://example.com/phone.png','width':1206,'height':2622}], 'ipad':[{'imageURL':'https://example.com/tablet.png','width':2360,'height':1640}]}
            source = {'name':'Old','iconURL':'https://example.com/old.png','apps':[{'bundleIdentifier':meta['bundleIdentifier'],'versions':[],'screenshots':shots}],'news':[]}
            result_path=root/'feed.json'; result_path.write_text(json.dumps(source))
            script=Path(__file__).parents[1]/'scripts/update-source.py'
            args=['python3',str(script),'--repo','Xarber/Velunivo','--tag','v0.1.13','--assets',folder,'--existing',str(result_path),'--output',str(result_path)]
            subprocess.check_call(args)
            result=json.loads(result_path.read_text())
            self.assertEqual(result['iconURL'],result['apps'][0]['iconURL'])
            self.assertIn('/icon-',result['iconURL'])
            self.assertTrue((root/result['iconURL'].split('/')[-1]).exists())
            gallery=result['apps'][0]['screenshots']
            self.assertEqual(gallery['iphone'],shots['iphone']+shots['ipad'])
            self.assertEqual(gallery['ipad'],shots['ipad'])
            subprocess.check_call(args)
            again=json.loads(result_path.read_text())
            self.assertEqual(again['apps'][0]['screenshots'],gallery)
            self.assertEqual(again['apps'][0]['versions'][0]['date'],result['apps'][0]['versions'][0]['date'])
            self.assertEqual(again['website'],'https://github.com/Xarber/Velunivo')


if __name__ == '__main__':
    unittest.main()
