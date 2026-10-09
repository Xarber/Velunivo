import importlib.util
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('simulator', Path(__file__).parents[1] / 'scripts/simulator-screenshots.py')
sim = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sim)


class SimulatorVerificationTests(unittest.TestCase):
    def devices(self):
        return {'com.apple.CoreSimulator.SimRuntime.iOS-26-4': [
            {'name': 'iPad Pro', 'isAvailable': True, 'deviceTypeIdentifier': 'ipad-type', 'udid': 'existing-ipad'}],
            'com.apple.CoreSimulator.SimRuntime.iOS-27-2': [
            {'name': 'iPad Pro', 'isAvailable': True, 'deviceTypeIdentifier': 'ipad-type', 'udid': 'newer-ipad'},
            {'name': 'iPhone', 'isAvailable': True, 'deviceTypeIdentifier': 'iphone-type', 'udid': 'existing-phone'}]}

    def test_newest_installed_family_and_missing_runtime(self):
        self.assertTrue(sim.select_device(self.devices(), 'ipad')[0].endswith('iOS-27-2'))
        with self.assertRaisesRegex(RuntimeError, 'does not download'):
            sim.select_device({}, 'iphone')

    def test_install_timeout_retries_once_after_owned_device_reset(self):
        calls = []
        def command(*args, **kwargs):
            calls.append(args)
            if args[2] == 'install' and sum(c[2] == 'install' for c in calls) == 1:
                raise subprocess.TimeoutExpired(args, 300, output=b'installd stalled')
            return ''
        with tempfile.TemporaryDirectory() as folder, patch.object(sim, 'ARTIFACTS', Path(folder)), patch.object(sim, 'run', side_effect=command):
            sim.boot_and_install('owned-device', 'ipad')
            self.assertEqual([c[2] for c in calls], ['boot', 'bootstatus', 'install', 'shutdown', 'erase', 'boot', 'bootstatus', 'install'])
            self.assertTrue(all(c[3] == 'owned-device' for c in calls))
            self.assertIn('installd stalled', (Path(folder) / 'ipad-simulator.log').read_text())

    def test_second_install_failure_remains_fatal(self):
        installs = []
        def command(*args, **kwargs):
            if args[2] == 'install':
                installs.append(args)
                raise subprocess.TimeoutExpired(args, 300)
            return ''
        with tempfile.TemporaryDirectory() as folder, patch.object(sim, 'ARTIFACTS', Path(folder)), patch.object(sim, 'run', side_effect=command):
            with self.assertRaises(subprocess.TimeoutExpired):
                sim.boot_and_install('owned-device', 'ipad')
            self.assertEqual(len(installs), 2)

    def test_process_exit_blocks_screenshot_and_cleans_only_fresh_device(self):
        calls = []
        def command(*args, **kwargs):
            calls.append(args)
            if args[2] == 'create': return 'owned-device'
            if args[2] == 'launch': return 'app.velunivo.mobile: 1234'
            return ''
        with tempfile.TemporaryDirectory() as folder, patch.object(sim, 'ARTIFACTS', Path(folder)), patch.object(sim, 'run', side_effect=command), patch.object(sim, 'diagnostics'), patch.object(sim.time, 'sleep'), patch.object(sim.os, 'kill', side_effect=ProcessLookupError):
            with self.assertRaises(ProcessLookupError):
                sim.capture(self.devices(), 'ipad')
        self.assertNotIn('io', [c[2] for c in calls])
        self.assertEqual(calls[-2:], [('xcrun', 'simctl', 'shutdown', 'owned-device'), ('xcrun', 'simctl', 'delete', 'owned-device')])

    def test_success_requires_survival_before_and_after_screenshot(self):
        def command(*args, **kwargs):
            if args[2] == 'create': return 'owned-device'
            if args[2] == 'launch': return 'app.velunivo.mobile: 1234'
            return ''
        with tempfile.TemporaryDirectory() as folder, patch.object(sim, 'ARTIFACTS', Path(folder)), patch.object(sim, 'run', side_effect=command) as commands, patch.object(sim, 'diagnostics'), patch.object(sim.time, 'sleep'), patch.object(sim.os, 'kill') as survival:
            sim.capture(self.devices(), 'iphone')
            self.assertEqual(survival.call_args_list, [unittest.mock.call(1234, 0), unittest.mock.call(1234, 0)])
            self.assertTrue(any(c.args[2] == 'io' for c in commands.call_args_list))


if __name__ == '__main__':
    unittest.main()
