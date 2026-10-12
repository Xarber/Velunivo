import AsyncStorage from '@react-native-async-storage/async-storage';
import {AreaBounds} from '../core/mapArea';
import {mapAreaFallback} from '../core/mapAreaName';
import {reverseAreaName} from './api';
import {notifyMapDownloads} from './mapDownloads';
import {t} from '../i18n/core';
const key='download-map-names-v1';let names:Promise<Record<string,string>>|undefined;const attempts=new Map<string,number>();let writes:Promise<unknown>=Promise.resolve();
function load(){return names??=(async()=>{try{const data=JSON.parse(await AsyncStorage.getItem(key)||'{}');return Object.fromEntries(Object.entries(data).filter(([,v])=>typeof v==='string')) as Record<string,string>;}catch{return {};}})();}
/** Upgrade unnamed legacy packs lazily: menus never wait on an online geocoder. */
export async function downloadedMapName(id:string,name:string|undefined,bounds?:AreaBounds){
 const generic=!name||/^Map region(?: ·|$)/i.test(name)||/^Regione mappa(?: ·|$)/i.test(name);
 if(!generic||!bounds)return name||t('Map region');
 const cached=await load();if(cached[id])return cached[id];
 if(Date.now()-(attempts.get(id)||0)>300000){attempts.set(id,Date.now());void reverseAreaName(bounds).then(value=>{if(!value)return;cached[id]=value;writes=writes.catch(()=>{}).then(()=>AsyncStorage.setItem(key,JSON.stringify(cached))).then(notifyMapDownloads);}).catch(()=>{});}
 return mapAreaFallback(bounds,t('Map region'));
}
