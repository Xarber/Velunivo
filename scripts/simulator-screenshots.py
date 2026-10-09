"""Verify real startup on fresh installed Simulators; never download runtimes."""
import argparse
import json
import os
import re
import shutil
import subprocess
import struct
import time
import uuid
from pathlib import Path

ARTIFACTS = Path('artifacts')
BUNDLE = 'app.velunivo.mobile'


def run(*args, timeout=300):
    print('+ ' + ' '.join(args), flush=True)
    return subprocess.check_output(args, text=True, stderr=subprocess.STDOUT, timeout=timeout).strip()


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
                1 if family == 'ipad' and 'pro' not in name else 0)
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
    # Retry a beta-runtime installd stall once on an erased, owned QA device.
    for attempt in (1, 2):
        try:
            run('xcrun', 'simctl', 'boot', udid)
            open_simulator(udid)
            run('xcrun', 'simctl', 'bootstatus', udid, '-b')
            run('xcrun', 'simctl', 'install', udid, 'artifacts/Velunivo-simulator.app')
            return
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as error:
            output = error.output or ''
            if isinstance(output, bytes):
                output = output.decode(errors='replace')
            append_log(family, f'Boot/install attempt {attempt} failed: {error}\n{output}')
            if attempt == 2:
                raise
            run('xcrun', 'simctl', 'shutdown', udid, timeout=60)
            run('xcrun', 'simctl', 'erase', udid, timeout=60)


def diagnostics(udid, family):
    logs = best_effort('xcrun', 'simctl', 'spawn', udid, 'log', 'show', '--last', '2m',
                       '--style', 'compact', '--predicate', 'process == "Velunivo" OR process == "installd" OR process == "SpringBoard"', timeout=20)
    host_logs = best_effort('log', 'show', '--last', '2m', '--style', 'compact', '--predicate', 'process == "Simulator" OR process == "com.apple.CoreSimulator.CoreSimulatorService"', timeout=20)
    (ARTIFACTS / f'{family}-host.log').write_text(host_logs or 'Optional host log collection failed or timed out.\n')
    (ARTIFACTS / f'{family}-launch.log').write_text(logs or 'Optional Simulator log collection failed or timed out.\n')
    for folder in [Path.home() / 'Library/Logs/DiagnosticReports',
                   Path.home() / f'Library/Developer/CoreSimulator/Devices/{udid}/data/Library/Logs/DiagnosticReports']:
        if folder.exists():
            for report in folder.glob('*Velunivo*.ips'):
                shutil.copy(report, ARTIFACTS / report.name)


def open_simulator(udid):
    # Attach the selected Xcode UI before boot readiness/install, rather than
    # leaving the beta iPad headless until after app launch.
    developer = Path(os.environ.get('DEVELOPER_DIR') or run('xcode-select', '-p'))
    simulator = developer / 'Applications/Simulator.app'
    if not simulator.is_dir():
        raise RuntimeError(f'Simulator is missing from selected Xcode: {simulator}')
    run('open', '-a', str(simulator), '--args', '-CurrentDeviceUDID', udid)


def landscape(udid):
    # Rotate the actual Simulator/UI, not the output image.
    open_simulator(udid)
    time.sleep(3)
    run('osascript', '-e', 'tell application "Simulator" to activate', '-e',
        'tell application "System Events" to tell process "Simulator" to click menu item "Landscape Left" of menu 1 of menu item "Orientation" of menu 1 of menu bar item "Device" of menu bar 1', timeout=30)
    time.sleep(3)


def verify_landscape(path):
    with path.open('rb') as image:
        header = image.read(24)
    if len(header) != 24 or header[:8] != b'\x89PNG\r\n\x1a\n':
        raise RuntimeError('Simulator did not produce a PNG screenshot')
    width, height = struct.unpack('>II', header[16:24])
    if width <= height:
        raise RuntimeError(f'iPad screenshot must be landscape; got {width} x {height}')


def capture(devices, family):
    runtime, template = select_device(devices, family)
    device_type = template.get('deviceTypeIdentifier')
    if not device_type:
        types = json.loads(run('xcrun', 'simctl', 'list', 'devicetypes', '--json'))['devicetypes']
        device_type = next((d['identifier'] for d in types if d['name'] == template['name']), None)
    if not device_type:
        raise RuntimeError(f'Cannot resolve installed device type for {template["name"]}')
    udid = run('xcrun', 'simctl', 'create', f'Velunivo-QA-{family}-{uuid.uuid4().hex[:8]}', device_type, runtime)
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
        run('xcrun', 'simctl', 'io', udid, 'screenshot', str(ARTIFACTS / f'{family}.png'))
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
        best_effort('xcrun', 'simctl', 'shutdown', udid, timeout=60)
        best_effort('xcrun', 'simctl', 'delete', udid, timeout=60)


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
