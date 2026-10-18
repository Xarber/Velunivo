import importlib.util,json,struct,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('stage_ios',Path(__file__).parents[1]/'scripts/stage-ios-screenshots.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class IOSPreviewTests(unittest.TestCase):
 def fixture(self,root):
  source=root/'capture';source.mkdir();(root/'package.json').write_text('{"version":"2.6.1"}')
  for family in ['iphone','ipad']:
   (source/f'{family}-screenshot.json').write_text(json.dumps({'status':'fresh','appVersion':'2.6.1','screens':list(module.gallery.SCREENS)}))
   for screen in module.gallery.SCREENS:
    size=(1206,2622) if family=='iphone' else (2420,1668)
    (source/f'{family}-{screen}.png').write_bytes(b'\x89PNG\r\n\x1a\n'+b'\0'*8+struct.pack('>II',*size))
  return source
 def test_both_native_families_refresh_without_losing_android_provenance(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);source=self.fixture(root);target=root/'assets/onboarding';target.mkdir(parents=True);(target/'provenance.json').write_text('{"android":{"api":37}}')
   self.assertEqual(module.stage(source,root,'123'),'v2.6.1');data=json.loads((target/'provenance.json').read_text());self.assertEqual(data['android']['api'],37);self.assertEqual(data['iphone']['buildRun'],'123');self.assertEqual(len(list(target.glob('*.png'))),8)
 def test_partial_reused_or_wrong_version_is_rejected_before_writing(self):
  for invalid in [{'status':'reused'},{'appVersion':'2.6.0'},{'screens':['explore']}]:
   with self.subTest(invalid=invalid),tempfile.TemporaryDirectory() as tmp:
    root=Path(tmp);source=self.fixture(root);file=source/'ipad-screenshot.json';data=json.loads(file.read_text());data.update(invalid);file.write_text(json.dumps(data))
    with self.assertRaises(ValueError):module.stage(source,root)
    self.assertFalse((root/'assets').exists())
