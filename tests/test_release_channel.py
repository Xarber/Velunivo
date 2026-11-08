import importlib.util
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('channel',Path(__file__).parents[1]/'scripts/release-channel.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class ReleaseChannelTests(unittest.TestCase):
    def test_stable_and_prerelease_defaults(self):
        self.assertEqual(module.release_channel('2.8.6','main','auto',False,'8'),{'tag':'v2.8.6','prerelease':'false','publish':'true'})
        self.assertEqual(module.release_channel('2.8.6','testing','auto',False,'8')['tag'],'v2.8.6-testing.8')
    def test_explicit_modes_and_no_stable_branch_bypass(self):
        self.assertEqual(module.release_channel('2.8.6','main','prerelease',False,'8')['prerelease'],'true')
        self.assertEqual(module.release_channel('2.8.6','testing','artifacts',False,'8')['publish'],'false')
        self.assertEqual(module.release_channel('2.8.6','development','stable',True,'8')['publish'],'false')
        with self.assertRaises(ValueError):module.release_channel('2.8.6','testing','stable',False,'8')
        with self.assertRaises(ValueError):module.release_channel('1.0','main','stable',False,'8')
