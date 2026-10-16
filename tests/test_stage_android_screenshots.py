import importlib.util,json,struct,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('stage_android',Path(__file__).parents[1]/'scripts/stage-android-screenshots.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class AndroidGalleryTests(unittest.TestCase):
 def gallery(self,root):
  for family,prefix in [('phone','android'),('tablet','android-tablet')]:
   (root/f'{prefix}-capture.json').write_text(json.dumps(dict(status='fresh',api=37,family=family,appVersion='2.4.0',screens=[{'screen':s} for s in module.SCREENS])))
   for name in module.SCREENS:
    size=(2560,1600) if family=='tablet' else (1280,2856)
    (root/f'{prefix}-{name}.png').write_bytes(b'\x89PNG\r\n\x1a\n'+b'\0'*8+struct.pack('>II',*size))
 def test_complete_native_pair_populates_phone_and_tablet_metadata(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);source=root/'capture';source.mkdir();self.gallery(source);module.stage(source,root)
   for locale in ['en-US','it-IT']:
    for kind in ['phoneScreenshots','tenInchScreenshots']:self.assertEqual(len(list((root/'fastlane/metadata/android'/locale/'images'/kind).glob('*.png'))),4)
 def test_partial_or_old_runtime_never_changes_metadata(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);source=root/'capture';source.mkdir();self.gallery(source)
   manifest=source/'android-tablet-capture.json';data=json.loads(manifest.read_text());data['api']=36;manifest.write_text(json.dumps(data))
   with self.assertRaises(ValueError):module.stage(source,root)
   self.assertFalse((root/'fastlane').exists())
