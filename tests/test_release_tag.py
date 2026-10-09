import os
import subprocess
import tempfile
import unittest
from pathlib import Path

SCRIPT = str(Path(__file__).parents[1] / 'scripts/pin-release-tag.sh')
class ReleaseTagTests(unittest.TestCase):
    def test_tag_pins_build_commit_and_refuses_version_reuse(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            def git(*args, cwd=None):
                return subprocess.check_output(['git', *args], cwd=cwd or root, stderr=subprocess.STDOUT, text=True).strip()
            git('init', '--bare', str(root / 'remote'))
            git('clone', str(root / 'remote'), str(root / 'checkout'))
            checkout = root / 'checkout'
            git('config', 'user.name', 'CI Test', cwd=checkout); git('config', 'user.email', 'ci@example.invalid', cwd=checkout)
            (checkout / 'example.md').write_text('one')
            git('add', 'example.md', cwd=checkout); git('-c', 'commit.gpgsign=false', 'commit', '--no-gpg-sign', '-m', 'feat: Example', cwd=checkout)
            first = git('rev-parse', 'HEAD', cwd=checkout); git('push', 'origin', 'HEAD', cwd=checkout)
            environment = {**os.environ, 'RELEASE_TAG': 'v0.1.0', 'GITHUB_SHA': first}
            subprocess.run(['bash', SCRIPT], cwd=checkout, env=environment, check=True, capture_output=True)
            subprocess.run(['bash', SCRIPT], cwd=checkout, env=environment, check=True, capture_output=True)
            self.assertEqual(git('rev-parse', 'refs/tags/v0.1.0', cwd=root / 'remote'), first)
            (checkout / 'example.md').write_text('two'); git('add', 'example.md', cwd=checkout)
            git('-c', 'commit.gpgsign=false', 'commit', '--no-gpg-sign', '-m', 'fix: Example', cwd=checkout)
            environment['GITHUB_SHA'] = git('rev-parse', 'HEAD', cwd=checkout)
            result = subprocess.run(['bash', SCRIPT], cwd=checkout, env=environment, capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('different commit', result.stdout)
            self.assertEqual(git('rev-parse', 'refs/tags/v0.1.0', cwd=root / 'remote'), first)
