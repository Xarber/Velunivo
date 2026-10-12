import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
spec = importlib.util.spec_from_file_location('build_info', Path(__file__).parents[1] / 'scripts/build-info.py')
module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
class BuildInfoTests(unittest.TestCase):
    def test_consolidates_metadata_and_checksums_without_images(self):
        with tempfile.TemporaryDirectory() as temp:
            folder = Path(temp)
            (folder/'ios-metadata.json').write_text(json.dumps({'version':'1.0.4','buildVersion':'123'}))
            for name in module.BINARIES: (folder/name).write_bytes(b'binary')
            (folder/'ios-build.txt').write_text('Xcode beta details')
            (folder/'iphone.png').write_bytes(b'picture')
            (folder/'iphone-screenshot.json').write_text('{"status":"fresh"}')
            (folder/'release-notes.md').write_text('feat: new feature')
            (folder/'web.zip').write_bytes(b'web')
            info=module.build_info(folder,'Xarber/Velunivo','v1.0.4','commit','123')
            self.assertEqual(len(info['binaries']),3)
            self.assertEqual(info['ios']['buildVersion'],'123')
            self.assertEqual(info['details']['iphone-screenshot.json']['status'],'fresh')
            self.assertEqual(info['details']['ios-build.txt'],'Xcode beta details')
            self.assertNotIn('iphone.png',info['details'])
            self.assertEqual(info['web']['size'],3)
            self.assertTrue(all(len(x['sha256'])==64 for x in info['binaries']))
            with self.assertRaises(ValueError): module.build_info(folder,'r','v1.0.5','c','1')
