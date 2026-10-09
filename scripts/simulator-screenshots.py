import json, subprocess, time, os, re, shutil
from pathlib import Path
run=lambda *args: subprocess.check_output(args,text=True,timeout=300)
devices=json.loads(run('xcrun','simctl','list','devices','available','--json'))['devices']
all_devices=[d for runtime,values in devices.items() if 'iOS' in runtime for d in values if d.get('isAvailable')]
for family in ['iphone','ipad']:
    matches=[d for d in all_devices if family.lower() in d['name'].lower()]
    if not matches: raise SystemExit(f'No installed {family} Simulator. This workflow does not download runtimes.')
    device=matches[-1];udid=device['udid']
    if device['state']!='Booted':run('xcrun','simctl','boot',udid)
    run('xcrun','simctl','bootstatus',udid,'-b')
    run('xcrun','simctl','install',udid,'artifacts/Velunivo-simulator.app')
    run('xcrun','simctl','status_bar',udid,'override','--time','9:41','--batteryState','charged','--batteryLevel','100')
    launch=run('xcrun','simctl','launch',udid,'app.velunivo.mobile');print(launch,flush=True);time.sleep(15)
    logs=subprocess.run(['xcrun','simctl','spawn',udid,'log','show','--last','2m','--style','compact','--predicate','process == "Velunivo"'],capture_output=True,text=True,timeout=45)
    Path(f'artifacts/{family}-launch.log').write_text(logs.stdout+logs.stderr)
    for folder in [Path.home()/'Library/Logs/DiagnosticReports',Path.home()/f'Library/Developer/CoreSimulator/Devices/{udid}/data/Library/Logs/DiagnosticReports']:
        if folder.exists():
            for report in folder.glob('*Velunivo*.ips'):shutil.copy(report,Path('artifacts')/report.name)
    run('xcrun','simctl','io',udid,'screenshot',f'artifacts/{family}.png')
    pid=int(re.search(r':\s*(\d+)',launch).group(1))
    try:os.kill(pid,0)
    except ProcessLookupError:raise SystemExit('Velunivo exited after launch. See Simulator diagnostics; do not publish this build.')
    run('xcrun','simctl','shutdown',udid)
