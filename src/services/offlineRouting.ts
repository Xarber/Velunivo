import {RoutePreferences} from '../core/routePreferences';
import {downloadedMapName} from './mapNames';
import {AreaBounds,validateArea} from '../core/mapArea';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RoadPack,validateRoadPack,calculateOfflineRoute,packContains} from '../core/offlineRouting';
import {routeBounds} from '../core/geo';
import {Coord,Profile,Route} from '../core/types';
import {AddressResult} from '../core/addresses';
import {notifyMapDownloads} from './mapDownloads';
import {DownloadProgress,readDownload} from '../core/downloadProgress';
const prefix='offline-routing-v1',index=prefix+':index';
export interface RoadPackInfo {id:string;name:string;downloadedAt:number;bounds:RoadPack['bounds'];bytes:number;chunks:number;}
let cached:Promise<RoadPack[]>|undefined;
export function resetRoadPackCache(){cached=undefined;}
export async function roadPacks():Promise<RoadPackInfo[]>{try{const raw=JSON.parse(await AsyncStorage.getItem(index)||'[]');return Array.isArray(raw)?await Promise.all(raw.map(async (p:RoadPackInfo)=>({...p,name:await downloadedMapName(p.id,p.name,p.bounds)}))):[];}catch{return [];}}
async function loadedPacks(){return cached??=(async()=>{const result:RoadPack[]=[];for(const info of await roadPacks()){try{if(!Number.isInteger(info.chunks)||info.chunks>40)continue;const parts=await AsyncStorage.multiGet(Array.from({length:info.chunks},(_,i)=>`${prefix}:${info.id}:${i}`));if(parts.some(([,v])=>v===null))continue;result.push(validateRoadPack(JSON.parse(parts.map(([,v])=>v).join(''))));}catch{/* Corrupt downloads are not offered for route calculation. */}}return result;})();}
export async function deleteRoadPack(id:string){const all=await roadPacks(),pack=all.find(p=>p.id===id);if(pack)await AsyncStorage.multiRemove(Array.from({length:pack.chunks},(_,i)=>`${prefix}:${id}:${i}`));await AsyncStorage.setItem(index,JSON.stringify(all.filter(p=>p.id!==id)));cached=undefined;notifyMapDownloads();}
export async function offlineRoute(start:Coord,end:Coord,kind:'bike'|'car',profile:Profile,preferences:RoutePreferences={}):Promise<Route|null>{const packs=(await loadedPacks()).filter(p=>packContains(p,start)&&packContains(p,end)).sort((a,b)=>b.downloadedAt-a.downloadedAt);for(const pack of packs){try{return calculateOfflineRoute(pack,start,end,kind,profile,preferences);}catch{/* Try overlapping coverage, never invent a connecting line. */}}return null;}
export async function offlineAddresses(query:string):Promise<AddressResult[]>{const normalized=query.trim().toLocaleLowerCase(),seen=new Set<string>(),results:AddressResult[]=[];for(const pack of await loadedPacks()){const nodes=new Map(pack.elements.filter(e=>e.type==='node').map(e=>[e.id,[e.lon!,e.lat!] as Coord]));for(const way of pack.elements.filter(e=>e.type==='way')){const name=way.tags?.name;if(!name||!name.toLocaleLowerCase().includes(normalized)||seen.has(name))continue;const coordinate=nodes.get(way.nodes?.[Math.floor(way.nodes.length/2)]||0);if(!coordinate||!packContains(pack,coordinate))continue;seen.add(name);results.push({name,address:pack.name,label:`${name}, ${pack.name}`,coordinate});if(results.length>=5)return results;}}return results;}
let downloading=false,lastDownload=0;
export async function downloadRoadNetwork(route:Route,signal?:AbortSignal,onProgress?:(progress:DownloadProgress)=>void):Promise<RoadPackInfo>{
 const b=routeBounds(route.coordinates);return downloadRoadArea([b[0]-.01,b[1]-.01,b[2]+.01,b[3]+.01],route.endLabel||route.name,signal,onProgress);
}
export async function downloadRoadArea(bounds:AreaBounds,name:string,signal?:AbortSignal,onProgress?:(progress:DownloadProgress)=>void):Promise<RoadPackInfo>{
 validateArea(bounds);
 if(downloading)throw new Error('A road network download is already running.');if(Date.now()-lastDownload<30000)throw new Error('Wait a moment before downloading another road network.');
 if(bounds[2]-bounds[0]>.18||bounds[3]-bounds[1]>.12)throw new Error('Choose a shorter route for this offline region.');
 const current=await roadPacks();if(current.length>=5||current.reduce((sum,p)=>sum+p.bytes,0)>=20000000)throw new Error('Remove an unused road network before downloading another.');
 downloading=true;lastDownload=Date.now();const abort=new AbortController(),cancel=()=>abort.abort(),timer=setTimeout(cancel,55000);signal?.addEventListener('abort',cancel,{once:true});
 try{
  const box=[bounds[1],bounds[0],bounds[3],bounds[2]].join(','),query=`[out:json][timeout:40][maxsize:20000000];(way["highway"](${box});relation["type"="restriction"](${box}););out body;>;out skel qt;`;
  const endpoint=process.env.EXPO_PUBLIC_OVERPASS_URL||'https://overpass-api.de/api/interpreter';
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(query),signal:abort.signal});
  if(!response.ok)throw new Error('Road network download unavailable. Try again later.');const text=await readDownload(response,onProgress);if(text.length>20000000)throw new Error('This road network is too large. Choose a smaller region.');const data=JSON.parse(text);if(data.remark||!data.elements?.length)throw new Error('The road network download is incomplete. Try again later.');
  const id=Date.now().toString(36),pack=validateRoadPack({schema:1,id,name,downloadedAt:Date.now(),bounds,elements:data.elements}),serialized=JSON.stringify(pack),chunks=Math.ceil(serialized.length/500000),info:RoadPackInfo={id,name:pack.name,downloadedAt:pack.downloadedAt,bounds,bytes:serialized.length,chunks};
  if(current.reduce((sum,p)=>sum+p.bytes,0)+info.bytes>25000000)throw new Error('Remove an unused road network before downloading another.');
  const entries:[string,string][]=Array.from({length:chunks},(_,i)=>[`${prefix}:${id}:${i}`,serialized.slice(i*500000,(i+1)*500000)]);
  if(abort.signal.aborted)throw new Error('Download cancelled.');onProgress?.({phase:'saving'});await AsyncStorage.multiSet(entries);await AsyncStorage.setItem(index,JSON.stringify([...current,info]));cached=undefined;notifyMapDownloads();return info;
 }finally{downloading=false;clearTimeout(timer);signal?.removeEventListener('abort',cancel);}
}
