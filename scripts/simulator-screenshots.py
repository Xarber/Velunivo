"""Verify real startup on fresh installed Simulators; never download runtimes."""
import argparse
import json
import os
import re
import shutil
import signal
import subprocess
import struct
import time
import uuid
from pathlib import Path

ARTIFACTS = Path('artifacts')
BUNDLE = 'app.velunivo.mobile'


def run(*args, timeout=60):
    print('+ ' + ' '.join(args), flush=True)
    started = time.monotonic()
    process = subprocess.Popen(args, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, start_new_session=True)
    try:
        try:
            output, _ = process.communicate(timeout=timeout)
        except subprocess.TimeoutExpired:
            # simctl children can inherit stdout, keeping communicate blocked after
            # killing only its parent. Kill our owned process group, then bound draining.
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            try:
                process.communicate(timeout=2)
            except subprocess.TimeoutExpired:
                process.stdout.close()
            raise subprocess.TimeoutExpired(args, timeout)
        if process.returncode:
            raise subprocess.CalledProcessError(process.returncode, args, output)
        return output.strip()
    finally:
        print(f'Completed after {time.monotonic() - started:.1f}s (limit {timeout}s)', flush=True)


def select_device(devices, family):
    candidates = [(runtime, device) for runtime, values in devices.items()
                  if 'SimRuntime.iOS-' in runtime for device in values
                  if device.get('isAvailable') and family in device['name'].lower()]
    if not candidates:
        raise RuntimeError(f'No installed {family} Simulator. This workflow does not download runtimes.')
    # Stay on the newest installed runtime, but prefer a regular/Air/mini iPad
    # over the first (often large Pro) template returned by CoreSimulator.
    def rank(item):
        runtime, device = item
        name = device['name'].lower()
        return (tuple(map(int, re.findall(r'\d+', runtime))),
                1 if family == 'ipad' and 'pro' not in name else 0,
                1 if family == 'ipad' and '13-inch' not in name else 0,
                1 if family == 'ipad' and name.startswith('ipad (') else 0)
    return max(candidates, key=rank)


def append_log(family, message):
    with (ARTIFACTS / f'{family}-simulator.log').open('a') as log:
        log.write(message + '\n')


def best_effort(*args, timeout=30):
    try:
        return run(*args, timeout=timeout)
    except (subprocess.SubprocessError, OSError) as error:
        print(f'Optional cleanup/diagnostic failed: {error}', flush=True)
        return None


def boot_and_install(udid, family):
    # Retry the whole capture on a fresh device, not a stalled installd instance.
    run('xcrun', 'simctl', 'boot', udid, timeout=30)
    app = simulator_app()
    if app is None or app.name == 'Simulator.app':
        open_simulator(udid)
    else:
        # Modern devicectl rotates headlessly; avoid spending the runner's
        # small memory budget on Device Hub's SwiftUI interface at startup.
        print('Using headless Device Hub capture.', flush=True)
    run('xcrun', 'simctl', 'bootstatus', udid, '-b', timeout=150)
    run('xcrun', 'simctl', 'install', udid, 'artifacts/Velunivo-simulator.app', timeout=90)


def diagnostics(udid, family):
    logs = best_effort('xcrun', 'simctl', 'spawn', udid, 'log', 'show', '--last', '2m',
                       '--style', 'compact', '--predicate', 'process == "Velunivo" OR process == "installd" OR process == "SpringBoard"', timeout=5)
    host_logs = best_effort('log', 'show', '--last', '2m', '--style', 'compact', '--predicate', 'process == "Simulator" OR process == "com.apple.CoreSimulator.CoreSimulatorService"', timeout=5)
    (ARTIFACTS / f'{family}-host.log').write_text(host_logs or 'Optional host log collection failed or timed out.\n')
    (ARTIFACTS / f'{family}-launch.log').write_text(logs or 'Optional Simulator log collection failed or timed out.\n')
    for folder in [Path.home() / 'Library/Logs/DiagnosticReports',
                   Path.home() / f'Library/Developer/CoreSimulator/Devices/{udid}/data/Library/Logs/DiagnosticReports']:
        if folder.exists():
            for report in folder.glob('*Velunivo*.ips'):
                shutil.copy(report, ARTIFACTS / report.name)


def simulator_app():
    developer = Path(os.environ.get('DEVELOPER_DIR') or run('xcode-select', '-p'))
    # Xcode 27 renamed Simulator to Device Hub. Prefer the selected toolchain,
    # including the executable inner app used by some beta distributions.
    names = ('DeviceHub.app', 'Device Hub.app', 'Simulator.app')
    roots = [developer.parent / 'Applications', developer / 'Applications', Path('/Applications')]
    roots.extend(sorted(Path('/Applications').glob('Xcode*.app/Contents/Applications'), reverse=True))
    roots.extend(sorted(Path('/Applications').glob('Xcode*.app/Contents/Developer/Applications'), reverse=True))
    for root in roots:
        for name in names:
            app = root / name
            if app.is_dir():
                return app
    return None


def open_simulator(udid):
    app = simulator_app()
    if app is None:
        print('::warning::No installed Device Hub or Simulator UI found; using headless capture.', flush=True)
        return False
    if app.name == 'Simulator.app':
        run('open', '-a', str(app), '--args', '-CurrentDeviceUDID', udid, timeout=30)
    else:
        # Device Hub ignores the legacy launch argument. Target the owned
        # simulated device window using its registered devices URL scheme.
        run('open', '-a', str(app), f'devices://device/open?id={udid}', timeout=30)
    return True


def landscape(udid):
    # Xcode 27 has a supported headless orientation API. No Accessibility
    # permission, menu traversal or image rotation is necessary on that path.
    help_text = best_effort('xcrun', 'devicectl', 'help', 'device', 'orientation', 'set', timeout=10)
    if help_text and 'landscapeLeft' in help_text:
        run('xcrun', 'devicectl', 'device', 'orientation', 'set', '--device', udid,
            'landscapeLeft', '--timeout', '20', timeout=25)
        time.sleep(3)
        return
    # Older toolchains use the real UI; never rotate a portrait output image.
    app = simulator_app()
    if app is None or not open_simulator(udid):
        raise RuntimeError('No installed Device Hub/Simulator UI is available to rotate the iPad into landscape')
    import plistlib
    with (app / 'Contents/Info.plist').open('rb') as plist:
        info = plistlib.load(plist)
    bundle_id = info['CFBundleIdentifier']
    time.sleep(3)
    activate = f'tell application id "{bundle_id}" to activate'
    if app.name != 'Simulator.app':
        # Apple's Xcode 27 documentation: Controls > Rotate Left.
        rotate = f'''tell application "System Events"
            set hub to first process whose bundle identifier is "{bundle_id}"
            tell hub to click menu item "Rotate Left" of menu 1 of menu bar item "Controls" of menu bar 1
        end tell'''
    else:
        rotate = 'tell application "System Events" to tell process "Simulator" to click menu item "Landscape Left" of menu 1 of menu item "Orientation" of menu 1 of menu bar item "Device" of menu bar 1'
    run('osascript', '-e', activate, '-e', rotate, timeout=30)
    time.sleep(3)


def verify_landscape(path):
    with path.open('rb') as image:
        header = image.read(24)
    if len(header) != 24 or header[:8] != b'\x89PNG\r\n\x1a\n':
        raise RuntimeError('Simulator did not produce a PNG screenshot')
    width, height = struct.unpack('>II', header[16:24])
    if width <= height:
        raise RuntimeError(f'iPad screenshot must be landscape; got {width} x {height}')


def capture_once(devices, family):
    runtime, template = select_device(devices, family)
    device_type = template.get('deviceTypeIdentifier')
    if not device_type:
        types = json.loads(run('xcrun', 'simctl', 'list', 'devicetypes', '--json'))['devicetypes']
        device_type = next((d['identifier'] for d in types if d['name'] == template['name']), None)
    if not device_type:
        raise RuntimeError(f'Cannot resolve installed device type for {template["name"]}')
    name = f'Velunivo-QA-{family}-{uuid.uuid4().hex[:8]}'
    udid = None
    # Hosted templates may already contain initialized OS data. Clone only
    # shutdown templates; cleanup always targets the new owned identifier.
    if template.get('state') == 'Shutdown' and template.get('udid'):
        udid = best_effort('xcrun', 'simctl', 'clone', template['udid'], name, timeout=60)
    if not udid:
        udid = run('xcrun', 'simctl', 'create', name, device_type, runtime)
    append_log(family, f'Owned fresh Simulator {udid}; type {device_type}; runtime {runtime}')
    try:
        boot_and_install(udid, family)
        run('xcrun', 'simctl', 'status_bar', udid, 'override', '--time', '9:41',
            '--batteryState', 'charged', '--batteryLevel', '100')
        # Public fixture, on this run's disposable Simulator only.
        run('xcrun', 'simctl', 'privacy', udid, 'grant', 'location', BUNDLE)
        run('xcrun', 'simctl', 'location', udid, 'set', '45.4642,9.1900')
        launch = run('xcrun', 'simctl', 'launch', udid, BUNDLE)
        match = re.search(r':\s*(\d+)', launch)
        if not match:
            raise RuntimeError(f'Launch did not report an app PID: {launch}')
        pid = int(match.group(1))
        time.sleep(15)
        os.kill(pid, 0)
        if family == 'ipad':
            landscape(udid)
        run('xcrun', 'simctl', 'io', udid, 'screenshot', str(ARTIFACTS / f'{family}.png'), timeout=30)
        if family == 'ipad':
            verify_landscape(ARTIFACTS / 'ipad.png')
        diagnostics(udid, family)
        os.kill(pid, 0)
        append_log(family, f'Verified app PID {pid} survived launch and screenshot capture.')
    except Exception as error:
        append_log(family, f'Required verification failed: {error}')
        diagnostics(udid, family)
        raise
    finally:
        best_effort('xcrun', 'simctl', 'shutdown', udid, timeout=15)
        best_effort('xcrun', 'simctl', 'delete', udid, timeout=15)


def capture(devices, family):
    # Two complete attempts cover installation, launch, rotation and screenshot.
    image = ARTIFACTS / f'{family}.png'
    for attempt in (1, 2):
        image.unlink(missing_ok=True)
        try:
            capture_once(devices, family)
            (ARTIFACTS / f'{family}-screenshot.json').write_text(json.dumps({'status': 'fresh', 'attempt': attempt}))
            return
        except Exception as error:
            append_log(family, f'Capture attempt {attempt}/2 failed: {error}')
            if attempt == 2:
                image.unlink(missing_ok=True)
                raise


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--family', choices=['iphone', 'ipad'])
    args = parser.parse_args(argv)
    ARTIFACTS.mkdir(exist_ok=True)
    devices = json.loads(run('xcrun', 'simctl', 'list', 'devices', 'available', '--json'))['devices']
    for family in ([args.family] if args.family else ['iphone', 'ipad']):
        capture(devices, family)


if __name__ == '__main__':
    main()
