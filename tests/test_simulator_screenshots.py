import importlib.util
import subprocess
import tempfile
import sys
import time
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('simulator', Path(__file__).parents[1] / 'scripts/simulator-screenshots.py')
sim = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sim)


class SimulatorVerificationTests(unittest.TestCase):
    def test_landscape_verification_rejects_portrait_framebuffer(self):
        import struct
        with tempfile.TemporaryDirectory() as folder:
            image = Path(folder) / 'ipad.png'
            for width, height in [(2732, 2048), (2048, 2732)]:
                image.write_bytes(b'\x89PNG\r\n\x1a\n' + b'\0' * 8 + struct.pack('>II', width, height))
                if width > height:
                    sim.verify_landscape(image)
                else:
                    with self.assertRaisesRegex(RuntimeError, 'must be landscape'):
                        sim.verify_landscape(image)

    def test_landscape_opens_simulator_from_selected_beta_xcode(self):
        with tempfile.TemporaryDirectory() as folder:
            developer = Path(folder) / 'Xcode_beta.app/Contents/Developer'
            app = developer / 'Applications/Simulator.app'
            app.mkdir(parents=True)
            with patch.dict(sim.os.environ, {'DEVELOPER_DIR': str(developer)}), patch.object(sim, 'run') as commands, patch.object(sim.time, 'sleep'):
                sim.landscape('owned-device')
                self.assertEqual(commands.call_args_list[0].args, ('open', '-a', str(app), '--args', '-CurrentDeviceUDID', 'owned-device'))

    def test_missing_simulator_gui_does_not_block_headless_install(self):
        with patch.dict(sim.os.environ, {'DEVELOPER_DIR': '/missing/beta/Developer'}), patch.object(Path, 'is_dir', return_value=False):
            self.assertFalse(sim.open_simulator('owned-device'))
            with self.assertRaisesRegex(RuntimeError, 'rotate the iPad'):
                sim.landscape('owned-device')

    def devices(self):
        return {'com.apple.CoreSimulator.SimRuntime.iOS-26-4': [
            {'name': 'iPad Pro', 'isAvailable': True, 'deviceTypeIdentifier': 'ipad-type', 'udid': 'existing-ipad'}],
            'com.apple.CoreSimulator.SimRuntime.iOS-27-2': [
            {'name': 'iPad Pro', 'isAvailable': True, 'deviceTypeIdentifier': 'ipad-type', 'udid': 'newer-ipad'},
            {'name': 'iPhone', 'isAvailable': True, 'deviceTypeIdentifier': 'iphone-type', 'udid': 'existing-phone'}]}

    def test_family_argument_limits_work_to_one_device(self):
        import json
        with tempfile.TemporaryDirectory() as folder, patch.object(sim, 'ARTIFACTS', Path(folder)), patch.object(sim, 'run', return_value=json.dumps({'devices': self.devices()})), patch.object(sim, 'capture') as capture:
            sim.main(['--family', 'ipad'])
            capture.assert_called_once_with(self.devices(), 'ipad')

    def test_newest_installed_family_and_missing_runtime(self):
        self.assertTrue(sim.select_device(self.devices(), 'ipad')[0].endswith('iOS-27-2'))
        with self.assertRaisesRegex(RuntimeError, 'does not download'):
            sim.select_device({}, 'iphone')

    def test_prefers_regular_ipad_on_same_newest_runtime(self):
        devices = self.devices()
        devices['com.apple.CoreSimulator.SimRuntime.iOS-27-2'].append(
            {'name': 'iPad Air', 'isAvailable': True, 'deviceTypeIdentifier': 'air-type'})
        runtime, device = sim.select_device(devices, 'ipad')
        self.assertTrue(runtime.endswith('iOS-27-2'))
        self.assertEqual(device['deviceTypeIdentifier'], 'air-type')

    def test_full_capture_retries_once_and_removes_failed_frame(self):
        calls = []
        with tempfile.TemporaryDirectory() as folder:
            image = Path(folder) / 'ipad.png'
            def attempt(devices, family):
                calls.append((devices, family))
                if len(calls) == 1:
                    image.write_bytes(b'partial frame')
                    raise subprocess.TimeoutExpired('install', 60)
                self.assertFalse(image.exists())
                image.write_bytes(b'fresh frame')
            with patch.object(sim, 'ARTIFACTS', Path(folder)), patch.object(sim, 'capture_once', side_effect=attempt):
                sim.capture(self.devices(), 'ipad')
            self.assertEqual(len(calls), 2)
            self.assertIn('fresh', (Path(folder) / 'ipad-screenshot.json').read_text())

    def test_second_capture_failure_remains_fatal_for_fallback_step(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(sim, 'ARTIFACTS', Path(folder)), patch.object(sim, 'capture_once', side_effect=subprocess.TimeoutExpired('install', 60)) as attempts:
            with self.assertRaises(subprocess.TimeoutExpired):
                sim.capture(self.devices(), 'ipad')
            self.assertEqual(attempts.call_count, 2)
            self.assertFalse((Path(folder) / 'ipad.png').exists())

    def test_install_has_short_bounded_timeouts_and_opens_ui_before_readiness(self):
        calls = []
        with patch.object(sim, 'run', side_effect=lambda *args, **kw: calls.append((args, kw))), patch.object(sim, 'open_simulator', side_effect=lambda udid: calls.append(('UI', udid))):
            sim.boot_and_install('owned-device', 'ipad')
        self.assertEqual(calls[1], ('UI', 'owned-device'))
        self.assertEqual(calls[2][1]['timeout'], 150)
        self.assertEqual(calls[3][1]['timeout'], 60)

    def test_process_exit_blocks_screenshot_and_cleans_only_fresh_device(self):
        calls = []
        def command(*args, **kwargs):
            calls.append(args)
            if args[2] == 'create': return 'owned-device'
            if args[2] == 'launch': return 'app.velunivo.mobile: 1234'
            return ''
        with tempfile.TemporaryDirectory() as folder, patch.object(sim, 'ARTIFACTS', Path(folder)), patch.object(sim, 'open_simulator'), patch.object(sim, 'run', side_effect=command), patch.object(sim, 'diagnostics'), patch.object(sim, 'landscape'), patch.object(sim, 'verify_landscape'), patch.object(sim.time, 'sleep'), patch.object(sim.os, 'kill', side_effect=ProcessLookupError):
            with self.assertRaises(ProcessLookupError):
                sim.capture_once(self.devices(), 'ipad')
        self.assertNotIn('io', [c[2] for c in calls])
        self.assertEqual(calls[-2:], [('xcrun', 'simctl', 'shutdown', 'owned-device'), ('xcrun', 'simctl', 'delete', 'owned-device')])

    def test_success_requires_survival_before_and_after_screenshot(self):
        def command(*args, **kwargs):
            if args[2] == 'create': return 'owned-device'
            if args[2] == 'launch': return 'app.velunivo.mobile: 1234'
            return ''
        with tempfile.TemporaryDirectory() as folder, patch.object(sim, 'ARTIFACTS', Path(folder)), patch.object(sim, 'open_simulator'), patch.object(sim, 'run', side_effect=command) as commands, patch.object(sim, 'diagnostics'), patch.object(sim, 'landscape'), patch.object(sim, 'verify_landscape'), patch.object(sim.time, 'sleep'), patch.object(sim.os, 'kill') as survival:
            sim.capture_once(self.devices(), 'iphone')
            self.assertEqual(survival.call_args_list, [unittest.mock.call(1234, 0), unittest.mock.call(1234, 0)])
            self.assertTrue(any(c.args[2] == 'io' for c in commands.call_args_list))
            calls = [c.args for c in commands.call_args_list]
            self.assertIn(('xcrun', 'simctl', 'privacy', 'owned-device', 'grant', 'location', sim.BUNDLE), calls)
            self.assertIn(('xcrun', 'simctl', 'location', 'owned-device', 'set', '45.4642,9.1900'), calls)


class ProcessTimeoutTests(unittest.TestCase):
    def test_timeout_kills_child_that_inherits_stdout(self):
        started = time.monotonic()
        code = 'import subprocess,sys,time; subprocess.Popen([sys.executable,"-c","import time; time.sleep(20)"]); time.sleep(20)'
        with self.assertRaises(subprocess.TimeoutExpired):
            sim.run(sys.executable, '-c', code, timeout=.2)
        self.assertLess(time.monotonic() - started, 3)


if __name__ == '__main__':
    unittest.main()
