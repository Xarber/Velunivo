import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import {useSyncExternalStore} from 'react';
import {bundledPlugins} from './examples';
import {InstalledPlugin,parsePlugin,packageUrl} from './model';
const key='app-plugins-v1';
type State={ready:boolean;showMenu:boolean;installed:InstalledPlugin[]};
let state:State={ready:false,showMenu:false,installed:[]},loading:Promise<void>|undefined,queue=Promise.resolve();
const listeners=new Set<()=>void>();
function emit(){for(const f of listeners)f();}
function save(){const body=JSON.stringify(state);queue=queue.catch(()=>{}).then(()=>AsyncStorage.setItem(key,body));return queue;}
export const pluginStore={
 async reset(){await queue.catch(()=>{});state={ready:false,showMenu:false,installed:[]};loading=undefined;emit();await AsyncStorage.removeItem(key);},
 subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};},get:()=>state,
 load(){return loading??=(async()=>{try{const raw=JSON.parse(await AsyncStorage.getItem(key)||'{}'),installed:InstalledPlugin[]=[];for(const item of Array.isArray(raw.installed)?raw.installed.slice(0,30):[]){try{const pkg=parsePlugin(item.package);if(installed.some(p=>p.package.id===pkg.id))continue;installed.push({package:pkg,enabled:item.enabled===true,bundled:bundledPlugins.some(p=>p.id===pkg.id)&&item.bundled===true,source:String(item.source||'').slice(0,2000),digest:String(item.digest||''),installedAt:Number(item.installedAt)||0});}catch{/* A corrupt plugin cannot prevent startup. */}}for(const pkg of bundledPlugins)if(!installed.some(p=>p.package.id===pkg.id))installed.push({package:pkg,enabled:false,bundled:true,source:'bundled',digest:'bundled',installedAt:0});state={ready:true,showMenu:raw.showMenu===true,installed};}catch{state={ready:true,showMenu:false,installed:bundledPlugins.map(pkg=>({package:pkg,enabled:false,bundled:true,source:'bundled',digest:'bundled',installedAt:0}))};}emit();})();},
 async install(pkg:unknown,source:string){const parsed=parsePlugin(pkg);if(state.installed.some(p=>p.package.id===parsed.id&&p.bundled))throw new Error('Bundled example IDs cannot be replaced.');if(state.installed.length>=30&&!state.installed.some(p=>p.package.id===parsed.id))throw new Error('Plugin storage limit reached.');const digest=await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,JSON.stringify(parsed));state={...state,installed:[...state.installed.filter(p=>p.package.id!==parsed.id),{package:parsed,source,digest,enabled:false,bundled:false,installedAt:Date.now()}]};emit();await save();},
 async enable(id:string,enabled:boolean){if(enabled&&state.installed.filter(p=>p.enabled).length>=8)throw new Error('Enable up to eight plugins at a time.');state={...state,installed:state.installed.map(p=>p.package.id===id?{...p,enabled}:p)};emit();await save();},
 async remove(id:string){state={...state,installed:state.installed.filter(p=>p.package.id!==id||p.bundled)};emit();await save();await AsyncStorage.removeItem('plugin-data-v1:'+id);},
 async showMenu(showMenu:boolean){state={...state,showMenu};emit();await save();},
};
export function usePlugins(){return useSyncExternalStore(pluginStore.subscribe,pluginStore.get,pluginStore.get);}
export async function downloadPlugin(input:string){const url=packageUrl(input),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const response=await fetch(url,{signal:controller.signal,credentials:'omit',headers:{Accept:'application/json'}});if(!response.ok)throw new Error('Could not download plugin.');if(response.url&&new URL(response.url).protocol!=='https:')throw new Error('Use an HTTPS plugin package URL.');if(Number(response.headers.get('content-length'))>512000)throw new Error('Plugin package is too large.');let text='';if(response.body?.getReader){const reader=response.body.getReader(),decoder=new TextDecoder();let bytes=0;for(;;){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>512000){await reader.cancel();throw new Error('Plugin package is too large.');}text+=decoder.decode(chunk.value,{stream:true});}text+=decoder.decode();}else{text=await response.text();if(text.length>512000)throw new Error('Plugin package is too large.');}return {package:parsePlugin(JSON.parse(text)),source:url};}finally{clearTimeout(timer);}}
