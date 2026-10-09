"""Update an existing AltStore Classic source from a successfully built IPA.
Never manufacture a downloadURL, size, OS floor or permissions before a build.
"""
import argparse, json, datetime, struct
from pathlib import Path
p=argparse.ArgumentParser(); p.add_argument('--repo',required=True); p.add_argument('--tag',required=True); p.add_argument('--assets',default='artifacts'); p.add_argument('--existing',default='apps.json'); p.add_argument('--output',default='apps.json'); a=p.parse_args()
folder=Path(a.assets); meta=json.loads((folder/'ios-metadata.json').read_text()); tag=a.tag
if tag != 'v'+meta['version']: raise SystemExit('Tag does not match the built IPA version')
base=f'https://github.com/{a.repo}/releases/download/{tag}/'; stable=f'https://github.com/{a.repo}/releases/download/1.0/'
source=json.loads(Path(a.existing).read_text()) if Path(a.existing).exists() else {'name':'Velunivo','subtitle':'Routes for small electric wheels','description':'The official Velunivo source for e-scooter and e-bike navigation. AltStore Classic / SideStore.','iconURL':stable+'icon.png','tintColor':'007F6D','website':f'https://github.com/{a.repo}','apps':[],'news':[]}
app=next((x for x in source['apps'] if x['bundleIdentifier']==meta['bundleIdentifier']),None)
if app is None:
    app={'bundleIdentifier':meta['bundleIdentifier'],'versions':[]};source['apps'].append(app)
app.update({'name':'Velunivo','developerName':a.repo.split('/')[0],'subtitle':'Your route. Your riding speed.','localizedDescription':'Compare bicycle and car-road candidates with saved e-scooter/e-bike profiles, distinct icons, custom pictures and approximate trip battery use from your entered range. Search addresses or choose either endpoint on the map. Apple Maps on iPhone/iPad, key-free OpenFreeMap on Android/web, and downloadable-map support. Compass/travel-direction navigation, optional tilted perspective, a temporary full-route overview, persistent speed/road-limit badges, a compact arrival/time-left/distance-left card and global km/miles settings, practical and minimum ETAs, native date/time pickers and depart-at/arrive-by planning without traffic simulation, GPX import/export and route comparison between track endpoints, foreground GPS guidance, spoken turn instructions, local saved routes, optional licensed offline map packs, motion readings and an optional live traffic layer. Fullscreen map with expandable phone controls and floating iPad/desktop planning panels. Address search and live routing use public Photon/Valhalla providers by default; an optional server supports GraphHopper. Traffic needs TomTom. Scooter access is unverified; inspect signs and local rules. Offline maps do not include an offline routing engine.','iconURL':stable+'icon.png','tintColor':'007F6D','category':'utilities'})
shots={}
for device in ['iphone','ipad']:
    image=folder/f'{device}.png'
    w,h=struct.unpack('>II',image.read_bytes()[16:24]);shots[device]=[{'imageURL':base+image.name,'width':w,'height':h}]
app['screenshots']=shots;app['appPermissions']=meta['appPermissions']
notes=(folder/'release-notes.md').read_text() if (folder/'release-notes.md').exists() else f'Velunivo {meta["version"]}'
version={k:meta[k] for k in ['version','buildVersion','size','minOSVersion']};version.update({'date':datetime.datetime.now(datetime.timezone.utc).isoformat(),'downloadURL':base+'Velunivo.ipa','localizedDescription':notes})
app['versions']=[version]+[v for v in app['versions'] if (v['version'],v.get('buildVersion'))!=(version['version'],version['buildVersion'])]
source['news']=[{'title':f'Velunivo {meta["version"]}','identifier':tag+'-'+meta['buildVersion'],'caption':'A new build for your next ride.','date':version['date'],'tintColor':'007F6D','imageURL':stable+'icon.png','notify':True,'url':f'https://github.com/{a.repo}/releases/tag/{tag}','appID':meta['bundleIdentifier']}]+[n for n in source.get('news',[]) if n['identifier'] != tag+'-'+meta['buildVersion']]
source['news']=source['news'][:20]
Path(a.output).write_text(json.dumps(source,indent=2)+'\n')
