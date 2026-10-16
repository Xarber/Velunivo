"""Capture real Android app pages from an existing APK on a disposable CI emulator."""
import json,re,struct,subprocess,time,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path('artifacts');APP='app.velunivo.mobile'
def adb(*args,timeout=45,binary=False):
    result=subprocess.check_output(['adb',*args],timeout=timeout,text=not binary,stderr=subprocess.STDOUT if not binary else subprocess.DEVNULL)
    if not binary and args[:2]!=('shell','cat'):print('adb '+' '.join(args)+'\n'+result[-2000:],flush=True)
    return result
def nodes():
    adb('shell','uiautomator','dump','/sdcard/velunivo-qa.xml')
    text=adb('shell','cat','/sdcard/velunivo-qa.xml');return text,list(ET.fromstring(text).iter('node'))
def dismiss_intro():
    for _ in range(5):
        text,elements=nodes();ROOT.joinpath('android-intro.xml').write_text(text)
        button=next((e for e in elements if (e.get('text') or e.get('content-desc','')).strip() in ['Skip tour','Let’s ride',"Let's ride",'Continue']),None)
        if button is None:return
        values=list(map(int,re.findall(r'\d+',button.get('bounds',''))))
        if len(values)!=4:raise RuntimeError('Introduction button has no usable bounds')
        x1,y1,x2,y2=values;adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));time.sleep(2)
def screenshot(name):
    raw=adb('exec-out','screencap','-p',binary=True);width,height=struct.unpack('>II',raw[16:24])
    if raw[:8]!=b'\x89PNG\r\n\x1a\n' or width>=height:raise RuntimeError('Expected portrait native Android framebuffer')
    ROOT.joinpath('android-'+name+'.png').write_bytes(raw)
    xml,elements=nodes();ROOT.joinpath('android-'+name+'.xml').write_text(xml)
    labels=[e.get('text') or e.get('content-desc','') for e in elements]
    expected={'explore':'Your ride','library':'Library','vehicles':'Vehicles','settings':'Settings'}[name]
    if not any(expected in label for label in labels):raise RuntimeError('Wrong Android page: '+name)
    return {'screen':name,'width':width,'height':height}
def main():
    ROOT.mkdir(exist_ok=True);adb('install','-r','-g',str(ROOT/'Velunivo.apk'),timeout=120)
    # Latest regular Pixel Pro canvas, captured natively rather than stretching a web view.
    adb('shell','wm','size','1280x2856');adb('shell','wm','density','480')
    adb('shell','settings','put','system','accelerometer_rotation','0');adb('shell','settings','put','system','user_rotation','0')
    adb('emu','geo','fix','9.1900','45.4642');adb('logcat','-c');screens=[]
    for name,path in [('explore','/'),('library','/offline'),('vehicles','/scooter'),('settings','/settings')]:
        adb('shell','am','start','-W','-n',APP+'/.MainActivity','-a','android.intent.action.VIEW','-d','velunivo://'+path,APP)
        time.sleep(30 if name=='explore' else 5);dismiss_intro();time.sleep(3)
        screens.append(screenshot(name))
    ROOT.joinpath('android-capture.json').write_text(json.dumps({'platform':'android','status':'fresh','canvas':'Pixel 11 Pro','screens':screens}))
if __name__=='__main__':
    try:main()
    finally:
        try:ROOT.joinpath('android-logcat.log').write_text(adb('logcat','-d',timeout=20))
        except (OSError,subprocess.SubprocessError):pass
