"""Verify real startup on fresh installed Simulators; never download runtimes."""
import argparse
import json
import os
import re
import shutil
import subprocess
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
    return max(candidates, key=lambda item: tuple(map(int, re.findall(r'\d+', item[0]))))


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
                       '--style', 'compact', '--predicate', 'process == "Velunivo"', timeout=20)
    (ARTIFACTS / f'{family}-launch.log').write_text(logs or 'Optional Simulator log collection failed or timed out.\n')
    for folder in [Path.home() / 'Library/Logs/DiagnosticReports',
                   Path.home() / f'Library/Developer/CoreSimulator/Devices/{udid}/data/Library/Logs/DiagnosticReports']:
        if folder.exists():
            for report in folder.glob('*Velunivo*.ips'):
                shutil.copy(report, ARTIFACTS / report.name)


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
        launch = run('xcrun', 'simctl', 'launch', udid, BUNDLE)
        match = re.search(r':\s*(\d+)', launch)
        if not match:
            raise RuntimeError(f'Launch did not report an app PID: {launch}')
        pid = int(match.group(1))
        time.sleep(15)
        os.kill(pid, 0)
        run('xcrun', 'simctl', 'io', udid, 'screenshot', str(ARTIFACTS / f'{family}.png'))
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
