import json, subprocess, time, os
from pathlib import Path
run=lambda *args: subprocess.check_output(args,text=True)
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
    run('xcrun','simctl','launch',udid,'app.velunivo.mobile');time.sleep(12)
    run('xcrun','simctl','io',udid,'screenshot',f'artifacts/{family}.png')
    run('xcrun','simctl','shutdown',udid)
