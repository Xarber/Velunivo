import importlib.util
import json
import struct
import tempfile
import unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location('gallery_ready',Path(__file__).parents[1]/'scripts/gallery-ready.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class GalleryReadyTests(unittest.TestCase):
    def source(self):
        return {'apps':[{'bundleIdentifier':'app.velunivo.mobile','versions':[{'version':'2.0.2'}]}]}

    def gallery(self,folder):
        for family in ['iphone','ipad']:
            (folder/f'{family}-screenshot.json').write_text(json.dumps({'status':'fresh','appVersion':'2.0.2','screens':list(module.SCREENS)}))
            for scene in module.SCREENS:
                size=(1600,1000) if family=='ipad' else (1000,1600)
                (folder/f'{family}-{scene}.png').write_bytes(b'\x89PNG\r\n\x1a\n'+b'\0'*8+struct.pack('>II',*size))

    def test_both_fresh_correctly_oriented_galleries_allow_publication(self):
        with tempfile.TemporaryDirectory() as temp:
            folder=Path(temp);self.gallery(folder)
            self.assertEqual(module.ready_gallery(folder,self.source())[0],'v2.0.2')

    def test_missing_reused_wrong_version_or_partial_capture_preserves_source(self):
        with tempfile.TemporaryDirectory() as temp:
            folder=Path(temp)
            self.assertIsNone(module.ready_gallery(folder,self.source())[0])
            for change in [{'status':'reused'},{'appVersion':'2.0.1'},{'screens':['explore']}]:
                self.gallery(folder);file=folder/'ipad-screenshot.json';data=json.loads(file.read_text());data.update(change);file.write_text(json.dumps(data))
                self.assertIsNone(module.ready_gallery(folder,self.source())[0])
            self.gallery(folder);(folder/'ipad-library.png').unlink()
            self.assertIsNone(module.ready_gallery(folder,self.source())[0])

    def test_portrait_ipad_is_never_published_as_landscape(self):
        with tempfile.TemporaryDirectory() as temp:
            folder=Path(temp);self.gallery(folder)
            (folder/'ipad-library.png').write_bytes(b'\x89PNG\r\n\x1a\n'+b'\0'*8+struct.pack('>II',1000,1600))
            self.assertIsNone(module.ready_gallery(folder,self.source())[0])

    def test_binary_release_does_not_depend_on_optional_screenshot_runners(self):
        root=Path(__file__).parents[1]
        release=(root/'.github/workflows/release.yml').read_text()
        self.assertNotIn('  verify-ios:',release)
        self.assertIn('needs: [prepare, web, android, ios, ios-simulator]',release)
        gallery=(root/'.github/workflows/gallery.yml').read_text()
        self.assertIn('for family in iphone ipad;',gallery)
        self.assertIn('scripts/screenshot-fallback.py',gallery)
        self.assertIn("if: steps.gallery.outputs.ready == 'true'",gallery)
