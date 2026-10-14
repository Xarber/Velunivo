import {useEffect,useState} from 'react';
import {transitGeometry,transitQueryBounds} from '../core/transitLines';
import {requestJson} from './request';
/** Cached viewport geometry supplements vector tiles that omit minor lines at low zoom. */
const empty=transitGeometry([]),cache=new Map<string,ReturnType<typeof transitGeometry>>(),pending=new Map<string,Promise<ReturnType<typeof transitGeometry>>>();
async function load(key:string){const cached=cache.get(key);if(cached)return cached;const existing=pending.get(key);if(existing)return existing;
 const task=(async()=>{const [west,south,east,north]=key.split(',').map(Number);
 const query=`[out:json][timeout:15];way[railway~"^(rail|subway|light_rail|tram|monorail)$"](${south},${west},${north},${east});out tags geom;`;
 const providers=process.env.EXPO_PUBLIC_OVERPASS_URL?[process.env.EXPO_PUBLIC_OVERPASS_URL]:['https://overpass-api.de/api/interpreter','https://overpass.private.coffee/api/interpreter'];
 for(const url of providers){try{const {response,body}=await requestJson(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'Velunivo (+https://github.com/Xarber/Velunivo)'},body:`data=${encodeURIComponent(query)}`},18000);if(response.ok&&Array.isArray(body.elements)){const next=transitGeometry(body.elements);cache.set(key,next);if(cache.size>20)cache.delete(cache.keys().next().value!);return next;}}catch{/* Keep cached geometry while another provider is tried. */}}
 throw new Error('Transit map service unavailable');})();pending.set(key,task);try{return await task;}finally{pending.delete(key);}
}
export function useTransitLines(enabled:boolean,bounds:[number,number,number,number]){const [data,setData]=useState(()=>empty),key=transitQueryBounds(bounds)?.join(',');
 useEffect(()=>{if(!enabled||!key)return;let cancelled=false;const timer=setTimeout(()=>{void load(key).then(next=>{if(!cancelled)setData(next);}).catch(()=>{});},600);return()=>{cancelled=true;clearTimeout(timer);};},[enabled,key]);
 return enabled?data:empty;
}
