"""Verify real startup on fresh installed Simulators; never download runtimes."""
import argparse
import json
import plistlib
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
ORIENTATION_HELP = None
ATTEMPT_DEADLINE = None


def run(*args, timeout=60):
    if ATTEMPT_DEADLINE is not None and not any(command in args for command in ('shutdown','delete')):
        remaining=ATTEMPT_DEADLINE-time.monotonic()
        if remaining<=0: raise subprocess.TimeoutExpired(args,0)
        timeout=min(timeout,remaining)
    print('+ ' + ' '.join(args), flush=True)
    started = time.monotonic()
    process = subprocess.Popen(args, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, start_new_session=True)
    try:
        try:
            output, diagnostics = process.communicate(timeout=timeout)
            if diagnostics: print(diagnostics[-6000:], flush=True)
        except subprocess.TimeoutExpired:
            # simctl children can inherit stdout, keeping communicate blocked after
            # killing only its parent. Kill our owned process group, then bound draining.
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except (ProcessLookupError, PermissionError):
                # CoreSimulator can attach protected helper children. Still kill
                # our own command and bound draining instead of aborting cleanup.
                try: process.kill()
                except (ProcessLookupError, PermissionError): pass
            try:
                process.communicate(timeout=2)
            except subprocess.TimeoutExpired:
                process.stdout.close()
            raise subprocess.TimeoutExpired(args, timeout)
        if process.returncode:
            print(output[-6000:], flush=True)
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
    # Use regular Pro devices for consistent gallery and onboarding frames.
    def rank(item):
        runtime, device = item
        name = device['name'].lower()
        return (tuple(map(int, re.findall(r'\d+', runtime))),
                1 if 'pro' in name and ('11-inch' in name if family == 'ipad' else 'max' not in name) else 0,
                1 if '13-inch' not in name and 'max' not in name else 0)
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


def orientation_supported():
    global ORIENTATION_HELP
    if ORIENTATION_HELP is None:
        ORIENTATION_HELP = '' if os.environ.get('VELUNIVO_CAPTURE_HEADLESS')=='1' else best_effort('xcrun','devicectl','help','device','orientation','set',timeout=20) or ''
    return 'landscapeLeft' in ORIENTATION_HELP


def boot_and_install(udid, family):
    app = simulator_app()
    if os.environ.get('VELUNIVO_CAPTURE_HEADLESS')=='1':
        run('xcrun','simctl','boot',udid,timeout=60)
    elif app is not None and app.name == 'Simulator.app':
        # Select our fresh device before it boots, so the GUI neither shows a
        # different default device nor re-boots an already-running device.
        open_simulator(udid, select=True)
        best_effort('xcrun','simctl','boot',udid,timeout=30)
    else:
        run('xcrun','simctl','boot',udid,timeout=30)
        if app is None: open_simulator(udid)
        else: open_simulator(udid)
    # bootstatus waits for *all* system apps, which can stall on small hosts.
    # A timeout here does not prove the app is unusable: install, launch, PID
    # survival and framebuffer capture provide the required verification.
    best_effort('xcrun', 'simctl', 'bootstatus', udid, '-b', timeout=int(os.environ.get('VELUNIVO_CAPTURE_BOOT_TIMEOUT','30')))
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


def open_simulator(udid, select=False):
    app = simulator_app()
    if app is None:
        print('::warning::No installed Device Hub or Simulator UI found; using headless capture.', flush=True)
        return False
    if app.name == 'Simulator.app':
        # Always select the owned UUID. Opening without it can boot another
        # default device, rotate the wrong window and exhaust runner memory.
        run('open','-a',str(app),'--args','-CurrentDeviceUDID',udid,timeout=30)
    else:
        # Device Hub ignores the legacy launch argument. Target the owned
        # simulated device window using its registered devices URL scheme.
        run('open', '-a', str(app), f'devices://device/open?id={udid}', timeout=30)
    return True


def device_is_landscape(udid):
    image=ARTIFACTS/f'orientation-{udid}.png'
    try:
        run('xcrun','simctl','io',udid,'screenshot',str(image),timeout=25)
        if not image.exists(): return False
        header=image.read_bytes()[:24]
        return len(header)==24 and header[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',header[16:24])[0]>struct.unpack('>II',header[16:24])[1]
    except (subprocess.SubprocessError,OSError): return False
    finally: image.unlink(missing_ok=True)


def landscape(udid):
    if device_is_landscape(udid): return
    # Xcode 27 has a supported headless orientation API. No Accessibility
    # permission, menu traversal or image rotation is necessary on that path.
    if orientation_supported():
        try:
            run('xcrun', 'devicectl', 'device', 'orientation', 'set', '--device', udid,
                'landscapeLeft', '--timeout', '20', timeout=25)
            time.sleep(3)
            return
        except (subprocess.SubprocessError, OSError) as error:
            print(f'::warning::Orientation API rejected this simulated device; using its real UI: {error}', flush=True)
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
        rotate = 'tell application "System Events" to tell process "Simulator" to key code 123 using {command down}'
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


def seed_gallery(udid):
    app = ARTIFACTS / 'Velunivo-simulator.app'
    info = plistlib.loads((app / 'Info.plist').read_bytes())
    if not info.get('VelunivoCaptureFixtures'):
        raise RuntimeError('Gallery needs a Simulator QA build with EXPO_PUBLIC_CAPTURE_FIXTURES=1')
    container = Path(run('xcrun', 'simctl', 'get_app_container', udid, BUNDLE, 'data', timeout=60))
    directory = container / 'Library/Application Support' / BUNDLE / 'RCTAsyncLocalStorage_V1'
    directory.mkdir(parents=True, exist_ok=True)
    route = json.loads((Path(__file__).parent / 'screenshot-route.json').read_text())
    profile = dict(id='default-scooter', kind='escooter', name='City scooter', maxSpeed=25, ridingLimit=25,
                   cruiseFactor=.8, acceleration=.8, stopDelay=12, voice=False, motion=False,
                   rangeKm=35, rangeUnit='km', icon='🛴', photo=None, photos=[])
    bike = dict(profile, id='screenshot-bike', kind='ebike', name='City e-bike', rangeKm=60, icon='🚲')
    places = [dict(id='screenshot-duomo', name='Duomo', address='Piazza del Duomo, Milano, Italia', coordinate=[9.1901,45.4642]),
              dict(id='screenshot-park', name='Parco Sempione', address='Parco Sempione, Milano, Italia', coordinate=[9.1756,45.4738]),
              dict(id='screenshot-theatre', name='Teatro alla Scala', address='Piazza della Scala, Milano, Italia', coordinate=[9.1895,45.4675])]
    entries = {'ui-language-v1':'en','welcome-seen-v1':'true', 'release-seen-v1':json.dumps([info['CFBundleShortVersionString']]),
               'vehicles-v1':json.dumps(dict(vehicles=[profile,bike],activeId=profile['id'])),
               'navigation-v1':json.dumps(dict(voice=False,volume='off',liveActivities=False,recordRides=False,tilted=True)),
               'places-v1':json.dumps(places),'route-library-ids-v2':json.dumps([route['id']]),
               'route-library-v2:'+route['id']:json.dumps(route)}
    # Only this run's disposable device. No existing app/user data is read.
    (directory / 'manifest.json').write_text(json.dumps(entries))


def parse_screenshot_text(output):
    # Vision/CoreML can print framework diagnostics before osascript's result.
    # Accept only an actual bounded JSON string array, never a log as page proof.
    for line in reversed(output.splitlines()):
        try: value=json.loads(line)
        except ValueError: continue
        if isinstance(value,list) and len(value)<=1000 and all(isinstance(v,str) for v in value):return value
    raise RuntimeError('Screenshot OCR returned no text array: '+output[-2000:])


def screenshot_text(path):
    output=run('osascript','-l','JavaScript',str(Path(__file__).parent/'screenshot-text.js'),str(path),timeout=20)
    (ARTIFACTS / (path.stem+'-ocr.log')).write_text(output)
    return parse_screenshot_text(output)


def verify_screen_text(text, screen):
    if any(re.search(r'Open in.+Velunivo', value, re.I) for value in text):
        raise RuntimeError('Screenshot captured the system Open URL dialog, not an app page')
    if screen == 'library' and 'Library' not in text[:8]:
        raise RuntimeError('Library screenshot did not show the Library header')
    if screen == 'vehicles' and 'Vehicles' not in text[:8]:
        raise RuntimeError('Vehicles screenshot did not show the Vehicles header')
    if screen == 'navigation' and not any(re.search(r'Simulation|Stop ride|End ride|Simulated', value, re.I) for value in text):
        raise RuntimeError('Navigation screenshot did not show active simulation controls')


def dismiss_owned_url_prompt(udid, family):
    # Legacy Simulator openurl can ask for system confirmation. Only touch our
    # isolated QA window and only after OCR proves that exact dialog is present.
    probe=ARTIFACTS/f'{family}-url-probe.png'
    try:
        run('xcrun','simctl','io',udid,'screenshot',str(probe),timeout=20)
        if not any(re.search(r'Open in.+Velunivo', value, re.I) for value in screenshot_text(probe)):return
        open_simulator(udid)
        run('osascript','-e','tell application "Simulator" to activate',timeout=20)
        # System Events cannot reliably enumerate the embedded iOS alert. Use
        # its visible host-frame Open label, only on the disposable CI machine.
        run('xcrun','swift',str(Path(__file__).parent/'confirm-simulator-url.swift'),str(ARTIFACTS/f'{family}-url-host.png'),timeout=45)
        time.sleep(2)
    finally:
        probe.unlink(missing_ok=True)


def capture_gallery(udid, family, pid):
    shutil.copy(ARTIFACTS / f'{family}.png', ARTIFACTS / f'{family}-explore.png')
    screens = ['explore']
    for name, url in [('library','velunivo:///offline'),('vehicles','velunivo:///scooter'),('navigation','velunivo:///?capture=navigation')]:
        launched=False
        if orientation_supported():
            try:
                run('xcrun','devicectl','device','process','launch','--device',udid,'--payload-url',url,BUNDLE,timeout=30)
                launched=True
            except (subprocess.SubprocessError,OSError) as error:
                print(f'::warning::Device URL API unavailable; using simctl: {error}',flush=True)
        if not launched:
            run('xcrun','simctl','openurl',udid,url,timeout=20)
            time.sleep(2)
            dismiss_owned_url_prompt(udid,family)
        time.sleep({'library':8,'vehicles':6,'navigation':25}[name])
        os.kill(pid,0)
        image = ARTIFACTS / f'{family}-{name}.png'
        run('xcrun','simctl','io',udid,'screenshot',str(image),timeout=30)
        if family=='ipad': verify_landscape(image)
        verify_screen_text(screenshot_text(image),name)
        os.kill(pid,0)
        screens.append(name)
    return screens


def capture_once(devices, family, gallery=False):
    global ATTEMPT_DEADLINE
    ATTEMPT_DEADLINE=time.monotonic()+max(240,int(os.environ.get('VELUNIVO_CAPTURE_BOOT_TIMEOUT','30'))+240)
    runtime, template = select_device(devices, family)
    device_type = template.get('deviceTypeIdentifier')
    if not device_type:
        types = json.loads(run('xcrun', 'simctl', 'list', 'devicetypes', '--json'))['devicetypes']
        device_type = next((d['identifier'] for d in types if d['name'] == template['name']), None)
    if not device_type:
        raise RuntimeError(f'Cannot resolve installed device type for {template["name"]}')
    name = f'Velunivo-QA-{family}-{uuid.uuid4().hex[:8]}'
    udid = None
    # A shutdown template is not a clean OS image. Its cloned launchd/service
    # state stalled installation on the hosted beta image. Create owned data
    # from the installed runtime instead; never alter a runner template.
    udid = run('xcrun', 'simctl', 'create', name, device_type, runtime)
    append_log(family, f'Owned fresh Simulator {udid}; type {device_type}; runtime {runtime}')
    try:
        boot_and_install(udid, family)
        if gallery: seed_gallery(udid)
        # Public fixture, on this run's disposable Simulator only.
        best_effort('xcrun', 'simctl', 'privacy', udid, 'grant', 'location', BUNDLE, timeout=10)
        best_effort('xcrun', 'simctl', 'location', udid, 'set', '45.4642,9.1900', timeout=10)
        if family == 'ipad':
            landscape(udid)
        launch = run('xcrun', 'simctl', 'launch', udid, BUNDLE, timeout=90)
        match = re.search(r':\s*(\d+)', launch)
        if not match:
            raise RuntimeError(f'Launch did not report an app PID: {launch}')
        pid = int(match.group(1))
        # A successful slow first boot must not expire the app's own startup budget.
        ATTEMPT_DEADLINE=time.monotonic()+180
        time.sleep(55)
        os.kill(pid, 0)
        best_effort('xcrun', 'simctl', 'status_bar', udid, 'override', '--time', '9:41',
                    '--batteryState', 'charged', '--batteryLevel', '100', timeout=10)
        if family == 'ipad':
            landscape(udid)
        run('xcrun', 'simctl', 'io', udid, 'screenshot', str(ARTIFACTS / f'{family}.png'), timeout=30)
        if family == 'ipad':
            verify_landscape(ARTIFACTS / 'ipad.png')
        startup=ARTIFACTS/f'{family}.png'
        if startup.exists():
            shutil.copy(startup,ARTIFACTS/f'proof-startup-{family}.png')
            (ARTIFACTS/f'proof-startup-{family}.json').write_text(json.dumps({'status':'fresh-startup','device':template['name'],'runtime':runtime,'pid':pid}))
        # Startup and gallery have separate budgets: first-boot indexing must
        # not consume the verified app's entire screen-navigation allowance.
        if gallery: ATTEMPT_DEADLINE=time.monotonic()+240
        screens = capture_gallery(udid,family,pid) if gallery else []
        os.kill(pid, 0)
        append_log(family, f'Verified app PID {pid} survived launch and screenshot capture.')
        return screens
    except Exception as error:
        append_log(family, f'Required verification failed: {error}')
        ATTEMPT_DEADLINE=None
        diagnostics(udid, family)
        raise
    finally:
        ATTEMPT_DEADLINE=None
        best_effort('xcrun', 'simctl', 'shutdown', udid, timeout=15)
        best_effort('xcrun', 'simctl', 'delete', udid, timeout=15)


def capture(devices, family, gallery=False):
    # Two complete attempts cover installation, launch, rotation and screenshot.
    image = ARTIFACTS / f'{family}.png'
    for attempt in (1, 2):
        image.unlink(missing_ok=True)
        for partial in ARTIFACTS.glob(f'{family}-*.png'): partial.unlink()
        try:
            screens = capture_once(devices, family, gallery=True) if gallery else capture_once(devices,family)
            (ARTIFACTS / f'{family}-screenshot.json').write_text(json.dumps({'status': 'fresh', 'attempt': attempt, 'screens': screens or [], 'appVersion':plistlib.loads((ARTIFACTS/'Velunivo-simulator.app/Info.plist').read_bytes()).get('CFBundleShortVersionString') if (ARTIFACTS/'Velunivo-simulator.app/Info.plist').exists() else None}))
            return
        except Exception as error:
            append_log(family, f'Capture attempt {attempt}/2 failed: {error}')
            if attempt == 2:
                image.unlink(missing_ok=True)
                for partial in ARTIFACTS.glob(f'{family}-*.png'): partial.unlink()
                raise


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--family', choices=['iphone', 'ipad'])
    parser.add_argument('--gallery',action='store_true')
    args = parser.parse_args(argv)
    ARTIFACTS.mkdir(exist_ok=True)
    if not (ARTIFACTS/'Velunivo-simulator.app').is_dir(): raise SystemExit('Compiled Simulator app is missing; download the ios-simulator workflow artifact first.')
    orientation_supported() # Every family: probe before boot/memory pressure, including phone galleries.
    host = {}
    for label, command in [('disk', ('df', '-h')), ('memory', ('vm_stat',)), ('tools', ('xcodebuild', '-version')), ('runtimes', ('xcrun', 'simctl', 'list', 'runtimes', '--json'))]:
        host[label] = best_effort(*command, timeout=15)
    (ARTIFACTS/'capture-host.json').write_text(json.dumps(host, indent=2))
    devices = json.loads(run('xcrun', 'simctl', 'list', 'devices', 'available', '--json'))['devices']
    for family in ([args.family] if args.family else ['iphone', 'ipad']):
        if args.gallery: capture(devices,family,gallery=True)
        else: capture(devices,family)


if __name__ == '__main__':
    main()
