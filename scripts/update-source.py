"""Update an existing AltStore Classic source from a successfully built IPA.
Never manufacture a downloadURL, size, OS floor or permissions before a build.
"""
import argparse, json, datetime, struct, hashlib
from pathlib import Path
p=argparse.ArgumentParser(); p.add_argument('--repo',required=True); p.add_argument('--tag',required=True); p.add_argument('--assets',default='artifacts'); p.add_argument('--existing',default='apps.json'); p.add_argument('--output',default='apps.json'); a=p.parse_args()
folder=Path(a.assets); meta=json.loads((folder/'ios-metadata.json').read_text()); tag=a.tag
if tag != 'v'+meta['version']: raise SystemExit('Tag does not match the built IPA version')
base=f'https://github.com/{a.repo}/releases/download/{tag}/'; stable=f'https://github.com/{a.repo}/releases/download/1.0/'
source=json.loads(Path(a.existing).read_text()) if Path(a.existing).exists() else {'name':'Velunivo','subtitle':'Routes for small electric wheels','description':'The official Velunivo source for e-scooter and e-bike navigation. AltStore Classic / SideStore.','iconURL':stable+'icon.png','tintColor':'007F6D','website':f'https://github.com/{a.repo}','apps':[],'news':[]}
icon=Path(__file__).resolve().parents[1]/'assets/icon.png'
icon_name='icon-'+hashlib.sha256(icon.read_bytes()).hexdigest()[:12]+'.png'
icon_url=stable+icon_name
branding=json.loads((Path(__file__).resolve().parents[1]/'.github/source-metadata.json').read_text())
source.update({**branding['source'],'website':f'https://github.com/{a.repo}','iconURL':icon_url})
Path(a.output).parent.mkdir(parents=True,exist_ok=True)
(Path(a.output).parent/icon_name).write_bytes(icon.read_bytes())
app=next((x for x in source['apps'] if x['bundleIdentifier']==meta['bundleIdentifier']),None)
if app is None:
    app={'bundleIdentifier':meta['bundleIdentifier'],'versions':[]};source['apps'].append(app)
app.update({**branding['app'],'developerName':a.repo.split('/')[0],'iconURL':icon_url})
shots=dict(app.get('screenshots', {}))
previous_tablet_urls={shot['imageURL'] for shot in shots.get('ipad',[])}
for device in ['iphone','ipad']:
    image=folder/f'{device}.png'
    if image.exists():
        w,h=struct.unpack('>II',image.read_bytes()[16:24]);shots[device]=[{'imageURL':base+image.name,'width':w,'height':h}]
    # If capture and historical lookup failed, retain the previous source URL.

# Show tablet imagery in the phone gallery too; clients choose one device gallery.
if shots.get('iphone') and shots.get('ipad'):
    tablet_urls=previous_tablet_urls | {shot['imageURL'] for shot in shots['ipad']}
    shots['iphone']=[shot for shot in shots['iphone'] if shot.get('width',0)<shot.get('height',0) and shot['imageURL'] not in tablet_urls]+shots['ipad']
app['screenshots']=shots;app['appPermissions']=meta['appPermissions']
notes=(folder/'release-notes.md').read_text() if (folder/'release-notes.md').exists() else f'Velunivo {meta["version"]}'
previous_version=next((v for v in app['versions'] if (v['version'],v.get('buildVersion'))==(meta['version'],meta['buildVersion'])),None)
version={k:meta[k] for k in ['version','buildVersion','size','minOSVersion']};version.update({'date':previous_version['date'] if previous_version else datetime.datetime.now(datetime.timezone.utc).isoformat(),'downloadURL':base+'Velunivo.ipa','localizedDescription':notes})
app['versions']=[version]+[v for v in app['versions'] if (v['version'],v.get('buildVersion'))!=(version['version'],version['buildVersion'])]
source['news']=[{'title':f'Velunivo {meta["version"]}','identifier':tag+'-'+meta['buildVersion'],'caption':'A new build for your next ride.','date':version['date'],'tintColor':'007F6D','imageURL':icon_url,'notify':True,'url':f'https://github.com/{a.repo}/releases/tag/{tag}','appID':meta['bundleIdentifier']}]+[n for n in source.get('news',[]) if n['identifier'] != tag+'-'+meta['buildVersion']]
source['news']=source['news'][:20]
Path(a.output).write_text(json.dumps(source,indent=2)+'\n')
