type Prompt = Event & {prompt():Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
type State={installed:boolean;prompt:Prompt|null;waiting:ServiceWorker|null;error:string};
const state:State={installed:false,prompt:null,waiting:null,error:''},listeners=new Set<()=>void>();
let started=false;
function refresh(){for(const listener of listeners)listener();}
export const pwaState=()=>({...state});
export function subscribePwa(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};}
export function startPwa(){if(started || typeof window==='undefined')return;started=true;
 const viewport=()=>{if(!window.visualViewport || window.visualViewport.scale!==1)return;document.documentElement.style.setProperty('--velunivo-visible-height',`${window.visualViewport.height}px`);};viewport();window.visualViewport?.addEventListener('resize',viewport);
 const installed=()=>{state.installed=window.matchMedia('(display-mode: standalone)').matches || !!(navigator as Navigator & {standalone?:boolean}).standalone;refresh();};installed();
 window.matchMedia('(display-mode: standalone)').addEventListener('change',installed);
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();state.prompt=event as Prompt;refresh();});
 window.addEventListener('appinstalled',()=>{state.installed=true;state.prompt=null;refresh();});
 if('serviceWorker' in navigator && window.isSecureContext && !__DEV__) {
   let applying=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(applying)window.location.reload();});
   navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(registration=>{
    const inspect=()=>{state.waiting=registration.waiting;refresh();};inspect();
    registration.addEventListener('updatefound',()=>registration.installing?.addEventListener('statechange',inspect));
    window.addEventListener('focus',()=>void registration.update().catch(()=>{}));
    window.addEventListener('velunivo-apply-update',()=>{if(registration.waiting){applying=true;registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});}});
   }).catch(()=>{state.error='Offline app storage unavailable. Online planning still works.';refresh();});
 }
}
export async function installPwa(){const prompt=state.prompt;if(!prompt)return;await prompt.prompt();const choice=await prompt.userChoice;state.prompt=null;if(choice.outcome==='accepted')state.installed=true;refresh();}
export function applyPwaUpdate(){window.dispatchEvent(new Event('velunivo-apply-update'));}
