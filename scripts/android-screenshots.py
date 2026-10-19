"""Capture real Android app pages from an existing APK on a disposable CI emulator."""
import json,os,re,struct,subprocess,time,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path('artifacts');APP='app.velunivo.mobile'
FAMILY=os.environ.get('CAPTURE_FAMILY','phone')
PREFIX='android-tablet' if FAMILY=='tablet' else 'android'
def adb(*args,timeout=45,binary=False):
    try:result=subprocess.check_output(['adb',*args],timeout=timeout,text=not binary,stderr=subprocess.STDOUT if not binary else subprocess.DEVNULL)
    except subprocess.CalledProcessError as error:
        message=error.output.decode(errors='replace') if isinstance(error.output,bytes) else error.output or ''
        print('adb failed: '+' '.join(args)+'\n'+message,flush=True)
        ROOT.mkdir(exist_ok=True);ROOT.joinpath(PREFIX+'-command-error.log').write_text(message)
        raise
    if not binary and args[:2]!=('shell','cat'):print('adb '+' '.join(args)+'\n'+result[-2000:],flush=True)
    return result
def nodes():
    adb('shell','uiautomator','dump','/sdcard/velunivo-qa.xml')
    text=adb('shell','cat','/sdcard/velunivo-qa.xml');return text,list(ET.fromstring(text).iter('node'))
def page_matches(name,elements):
    expected={'explore':'Your ride','library':'Library','vehicles':'Vehicles','settings':'Settings'}[name]
    if any(e.get('package') in ('com.google.android.permissioncontroller','com.google.android.gms') for e in elements):return False
    for e in elements:
        label=e.get('text') or e.get('content-desc','');bounds=list(map(int,re.findall(r'\d+',e.get('bounds',''))))
        if e.get('package')==APP and expected in label and (name=='explore' or len(bounds)==4 and bounds[1]<700):return True
    return False
def wait_for_page(name):
    deadline=time.monotonic()+150;returned=False
    while time.monotonic()<deadline:
        try:text,elements=nodes()
        except (subprocess.SubprocessError,ET.ParseError):
            # UIAutomator can be killed during initial OS/permission settling. Retry within the same deadline.
            time.sleep(3);continue
        ROOT.joinpath(PREFIX+'-intro.xml').write_text(text)
        accuracy=any(e.get('resource-id')=='com.google.android.gms:id/message' and 'Location Accuracy' in e.get('text','') for e in elements)
        system=any(e.get('package')=='com.google.android.permissioncontroller' for e in elements)
        choices=['Turn on'] if accuracy else ['While using the app','Only this time','Allow','Continue'] if system else ['Skip tour','Let’s ride',"Let's ride",'Continue']
        button=next((e for e in elements if (e.get('text') or e.get('content-desc','')).strip() in choices and e.get('clickable')=='true'),None)
        if button is not None:
            values=list(map(int,re.findall(r'\d+',button.get('bounds',''))))
            if len(values)==4:
                x1,y1,x2,y2=values;adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));time.sleep(3);continue
        if page_matches(name,elements):return
        launcher=any(e.get('package')=='com.google.android.apps.nexuslauncher' for e in elements)
        if launcher and not returned:
            adb('shell','am','start','-W','-n',APP+'/.MainActivity');returned=True
        time.sleep(3)
    raise RuntimeError('Android page did not finish loading: '+name)
def screenshot(name):
    raw=adb('exec-out','screencap','-p',binary=True);width,height=struct.unpack('>II',raw[16:24])
    if raw[:8]!=b'\x89PNG\r\n\x1a\n' or (width>height)!=(FAMILY=='tablet'):raise RuntimeError('Wrong native Android framebuffer orientation')
    ROOT.joinpath(PREFIX+'-'+name+'.png').write_bytes(raw)
    xml,elements=nodes();ROOT.joinpath(PREFIX+'-'+name+'.xml').write_text(xml)
    if not page_matches(name,elements):raise RuntimeError('Wrong Android page: '+name)
    return {'screen':name,'width':width,'height':height}
def launch_page(path):
    # API 37 can briefly drop its package service when display metrics change.
    # Verify the installed package and wait for ActivityManager to resolve it.
    for attempt in range(12):
        try:
            package=adb('shell','dumpsys','package',APP)
            if 'versionName=' not in package:
                if attempt==11:raise RuntimeError('Installed app not registered: '+package[-2000:])
                time.sleep(2);continue
            adb('shell','am','start','-W','-n',APP+'/.MainActivity','-a','android.intent.action.VIEW','-d','velunivo://'+path,APP)
            return
        except subprocess.CalledProcessError:
            if attempt==11:raise
            time.sleep(2)

def tap_node(node):
    values=list(map(int,re.findall(r'\d+',node.get('bounds',''))))
    if len(values)!=4:raise RuntimeError('Control has no native bounds')
    x1,y1,x2,y2=values;adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2))

def find_control(label,elements):
    matches=[e for e in elements if label in (e.get('text',''),e.get('content-desc',''))]
    return next((e for e in matches if e.get('checkable')=='true'),next((e for e in matches if e.get('clickable')=='true'),next(iter(matches),None)))

def control_visible(item,elements,height):
    def bounds(node):return list(map(int,re.findall(r'\d+',node.get('bounds',''))))
    tabs=[bounds(e)[1] for e in elements if len(bounds(e))==4 and bounds(e)[1]>height*.65 and any(name in (e.get('text',''),e.get('content-desc','')) or e.get('content-desc','').endswith(', '+name) for name in ('Explore','Library','Vehicles','Settings'))]
    limit=min(tabs,default=height*.94)
    rect=bounds(item) if item is not None else []
    return len(rect)==4 and rect[3]>rect[1] and rect[1]>40 and rect[3]<limit-8

def scroll_page_top():
    size=adb('shell','wm','size');w,h=map(int,re.findall(r'(\d+)x(\d+)',size)[-1])
    for _ in range(5):adb('shell','input','swipe',str(w//2),str(h//4),str(w//2),str(h*4//5),'200');time.sleep(.2)

def reachable_control(label,timeout=25):
    deadline=time.monotonic()+timeout
    while time.monotonic()<deadline:
        xml,elements=nodes();ROOT.joinpath(PREFIX+'-developer.xml').write_text(xml)
        item=find_control(label,elements)
        size=adb('shell','wm','size');w,h=map(int,re.findall(r'(\d+)x(\d+)',size)[-1])
        if control_visible(item,elements,h):return item
        adb('shell','input','swipe',str(w//2),str(h*4//5),str(w//2),str(h//3),'250');time.sleep(.5)
    raise RuntimeError('Native developer control is not reachable: '+label)

def enable_sample_data():
    launch_page('/settings');wait_for_page('settings')
    version=reachable_control('App version')
    for _ in range(3):tap_node(version)
    time.sleep(1)
    # The revealed controls sit below the version. Scroll them above the native
    # tab bar before tapping, and verify the actual Switch state.
    toggle=reachable_control('Developer Mode')
    if toggle.get('checked')!='true':tap_node(toggle)
    time.sleep(.5);toggle=reachable_control('Developer Mode')
    if toggle.get('checked')!='true':raise RuntimeError('Developer Mode did not enable')
    tap_node(reachable_control('Developer Options'));time.sleep(1)
    tap_node(reachable_control('Ride simulation'));time.sleep(1)
    toggle=reachable_control('Show sample data')
    if toggle.get('checked')!='true':tap_node(toggle)
    time.sleep(.5);toggle=reachable_control('Show sample data')
    if toggle.get('checked')!='true':raise RuntimeError('Sample data did not enable')
    tap_node(reachable_control('Show ghost riders'));time.sleep(.5)

def main():
    ROOT.mkdir(exist_ok=True)
    # sys.boot_completed can precede the package service settling on API 37.
    for attempt in range(3):
        try:adb('install','--no-streaming','-r','-g',str(ROOT/'Velunivo.apk'),timeout=120);break
        except subprocess.CalledProcessError as error:
            output=str(error.output)
            if attempt==2 or 'INSTALL_FAILED' in output or 'not enough space' in output:raise
            time.sleep(5)
    # Latest regular Pixel Pro canvas, captured natively rather than stretching a web view.
    adb('shell','wm','size',os.environ.get('CAPTURE_SIZE','1280x2856'));adb('shell','wm','density',os.environ.get('CAPTURE_DENSITY','480'))
    adb('shell','settings','put','system','accelerometer_rotation','0');adb('shell','settings','put','system','user_rotation','0')
    adb('emu','geo','fix','9.1900','45.4642');adb('logcat','-c');screens=[]
    if os.environ.get('VELUNIVO_CAPTURE_SAMPLE_DATA','1')=='1':enable_sample_data()
    for name,path in [('explore','/'),('library','/offline'),('vehicles','/scooter'),('settings','/settings')]:
        launch_page(path)
        time.sleep(15 if name=='explore' else 3)
        if name!='explore':scroll_page_top()
        wait_for_page(name)
        if name=='explore':
            # Deliver fixes after permissions and the app's watcher are ready.
            for _ in range(3):adb('emu','geo','fix','9.1900','45.4642');time.sleep(2)
        time.sleep(5)
        screens.append(screenshot(name))
    api=adb('shell','getprop','ro.build.version.sdk').strip()
    package=adb('shell','dumpsys','package',APP);version=re.search(r'versionName=([^\s]+)',package)
    if not version:raise RuntimeError('Installed app version could not be verified')
    if api!='37':raise RuntimeError('Android 17/API 37 is required; got '+api)
    ROOT.joinpath(PREFIX+'-capture.json').write_text(json.dumps({'platform':'android','status':'fresh','api':int(api),'appVersion':version.group(1),'family':FAMILY,'profile':os.environ.get('CAPTURE_PROFILE'),'screens':screens}))
if __name__=='__main__':
    try:main()
    finally:
        try:ROOT.joinpath('android-logcat.log').write_text(adb('logcat','-d',timeout=20))
        except (OSError,subprocess.SubprocessError):pass
