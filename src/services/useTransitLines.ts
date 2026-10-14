import {useEffect,useState} from 'react';
import {transitGeometry,transitQueryBounds} from '../core/transitLines';
import {requestJson} from './request';
import {ViewportRequests} from '../core/viewportRequests';
/** Cached viewport geometry supplements vector tiles that omit minor lines at low zoom. */
const empty=transitGeometry([]);
async function load(key:string,signal:AbortSignal){const [west,south,east,north]=key.split(',').map(Number);
 const query=`[out:json][timeout:15][maxsize:20000000];way[railway~"^(rail|subway|light_rail|tram|monorail)$"](${south},${west},${north},${east});out tags geom;`;
 const providers=process.env.EXPO_PUBLIC_OVERPASS_URL?[process.env.EXPO_PUBLIC_OVERPASS_URL]:['https://overpass-api.de/api/interpreter','https://overpass.private.coffee/api/interpreter'];
 for(const url of providers){if(signal.aborted)throw new Error('Viewport request cancelled');try{const {response,body}=await requestJson(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'Velunivo (+https://github.com/Xarber/Velunivo)'},body:`data=${encodeURIComponent(query)}`,signal},18000);if(response.ok&&!body.remark&&Array.isArray(body.elements)){const next=transitGeometry(body.elements);return next;}}catch{/* Keep cached geometry while another provider is tried. */}}
 throw new Error('Transit map service unavailable');
}
const requests=new ViewportRequests(load,value=>value.features.reduce((sum,feature)=>sum+feature.geometry.coordinates.length,0));
export function useTransitLines(enabled:boolean,bounds:[number,number,number,number]){const [data,setData]=useState(()=>empty),key=transitQueryBounds(bounds)?.join(',');
 useEffect(()=>{if(!enabled||!key)return;let cancelled=false,release:(()=>void)|undefined;const timer=setTimeout(()=>{const request=requests.acquire(key);release=request.release;void request.promise.then(next=>{if(!cancelled)setData(next);}).catch(()=>{});},600);return()=>{cancelled=true;clearTimeout(timer);release?.();};},[enabled,key]);
 return enabled?data:empty;
}
