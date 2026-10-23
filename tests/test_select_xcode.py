import importlib.util
import plistlib
import tempfile
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('select_xcode',Path(__file__).parents[1]/'scripts/select-xcode.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)


class SelectXcodeTests(unittest.TestCase):
    def app(self,root,name,version):
        path=Path(root)/name
        (path/'Contents').mkdir(parents=True)
        (path/'Contents/Info.plist').write_bytes(plistlib.dumps({'CFBundleShortVersionString':version}))
        return path

    def test_release_candidate_remains_a_prerelease(self):
        with tempfile.TemporaryDirectory() as root:
            self.app(root,'Xcode_27.1.app','27.1')
            rc=self.app(root,'Xcode_27.2_Release_Candidate.app','27.2')
            self.assertEqual(module.select_xcode(root),rc)

    def test_metadata_ranks_unversioned_beta_and_ignores_aliases(self):
        with tempfile.TemporaryDirectory() as root:
            rc=self.app(root,'Xcode_27.2_Release_Candidate.app','27.2')
            beta=self.app(root,'Xcode-beta.app','27.3')
            (Path(root)/'Xcode_99_beta.app').symlink_to(rc)
            self.assertEqual(module.select_xcode(root),beta)

    def test_stable_fallback_must_be_explicit(self):
        with tempfile.TemporaryDirectory() as root:
            stable=self.app(root,'Xcode_27.1.app','27.1')
            with self.assertRaisesRegex(RuntimeError,'stable fallback is disabled'):
                module.select_xcode(root)
            self.assertEqual(module.select_xcode(root,True),stable)
