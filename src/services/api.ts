import AsyncStorage from '@react-native-async-storage/async-storage';
import {offlineRoute,offlineAddresses} from './offlineRouting';
import {getLanguage} from '../i18n/core';
import { photonResults, AddressResult } from '../core/addresses';
import { Coord, Profile, Route } from '../core/types';
import { requestJson } from './request';
import { fromValhalla, valhallaRequest, valhallaAttributesRequest } from '../core/valhalla';
import { fromGraphHopper } from '../core/routing';
export type { AddressResult } from '../core/addresses';
export const serverUrl = process.env.EXPO_PUBLIC_ROUTING_URL ?? '';
async function onlineRoute(start: Coord, end: Coord, kind: 'bike' | 'car', profile: Profile): Promise<Route> {
  if (!serverUrl) {
    const q = valhallaRequest(start, end, kind, profile,getLanguage()), data = await publicJson('https://valhalla1.openstreetmap.de/route', q);
    const shape = data?.trip?.legs?.[0]?.shape; if (!shape) throw new Error('No route found');
    const attributes = await publicJson('https://valhalla1.openstreetmap.de/trace_attributes', valhallaAttributesRequest(shape, q)).catch(error => ({ verificationError: error instanceof Error ? error.message : 'Road verification unavailable' }));
    return fromValhalla(data, attributes, kind, Math.min(profile.maxSpeed, profile.ridingLimit), [start, end]);
  }
  const { response, body } = await requestJson(`${serverUrl.replace(/\/$/, '')}/route`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start, end, kind, language:getLanguage(), maxSpeed: profile.maxSpeed, ridingLimit: profile.ridingLimit }) });
  if (!response.ok) throw new Error(body.error || `Routing error ${response.status}`);
  if (body.route) return body.route as Route;
  if (!body.paths?.[0]) throw new Error('No route found.');
  return { ...fromGraphHopper(body.paths[0], kind), plannedCap: Math.min(profile.maxSpeed, profile.ridingLimit) };
}

export async function fetchRoute(start:Coord,end:Coord,kind:'bike'|'car',profile:Profile):Promise<Route>{const preferences=await AsyncStorage.getItem('navigation-v1');let prefer=false;try{prefer=JSON.parse(preferences||'{}').preferOfflineRouting===true;}catch{}if(prefer||typeof navigator!=='undefined'&&navigator.onLine===false){const local=await offlineRoute(start,end,kind,profile);if(local)return local;}try{return await onlineRoute(start,end,kind,profile);}catch(error){const local=await offlineRoute(start,end,kind,profile);if(local)return local;throw error;}}

async function onlineAddresses(query: string): Promise<AddressResult[]> {
  if (query.trim().length < 3 || query.length > 200) throw new Error('Enter an address or place between 3 and 200 characters.');
  if (!serverUrl) { const data = await publicJson(`https://photon.komoot.io/api/?q=${encodeURIComponent(query.trim())}&limit=5`); return photonResults(data); }
  const { response, body } = await requestJson(`${serverUrl.replace(/\/$/, '')}/geocode?q=${encodeURIComponent(query.trim())}`, {}, 15000);
  if (!response.ok) throw new Error(body.error || 'Address search unavailable');
  return body.results.map((r: any) => ({...r, name:r.name || r.label.split(',')[0],address:r.address || r.label}));
}

export async function searchAddresses(query:string):Promise<AddressResult[]>{try{return await onlineAddresses(query);}catch(error){const local=await offlineAddresses(query);if(local.length)return local;throw error;}}

let publicQueue = Promise.resolve();
const publicCache = new Map<string, { until: number; body: any }>();
async function publicJson(url: string, payload?: unknown) {
  const id = url + JSON.stringify(payload || null), cached = publicCache.get(id); if (cached && cached.until > Date.now()) return cached.body;
  const previous = publicQueue; let release!: () => void; publicQueue = new Promise<void>(r => { release = r; }); await previous;
  try { const { response, body } = await requestJson(url, payload ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) } : {}, 20000); if (!response.ok) throw new Error(response.status === 429 ? 'Public service is busy. Wait a moment and try again.' : body.error || 'Public routing service unavailable'); if (publicCache.size >= 100) publicCache.delete(publicCache.keys().next().value!); publicCache.set(id, { until: Date.now() + 300000, body }); return body; }
  finally { setTimeout(release, 1000); }
}

export async function fetchItinerary(start:Coord,end:Coord,stops:import('../core/itinerary').RouteStop[],kind:'bike'|'car',profile:Profile){if(!stops.length)return fetchRoute(start,end,kind,profile);const {joinLegs}=await import('../core/itinerary');const points=[start,...stops.map(s=>s.coordinate),end],legs:Route[]=[];for(let i=1;i<points.length;i++)legs.push(await fetchRoute(points[i-1],points[i],kind,profile));return joinLegs(legs,stops);}

export async function reverseAddress(coordinate:Coord):Promise<string|undefined>{const data=await publicJson(`https://photon.komoot.io/reverse?lon=${coordinate[0].toFixed(5)}&lat=${coordinate[1].toFixed(5)}&limit=1`);return photonResults(data)[0]?.label;}
export async function enrichElevation(route:Route):Promise<Route>{try{const count=Math.min(100,route.coordinates.length),indexes=Array.from({length:count},(_,i)=>Math.round(i*(route.coordinates.length-1)/(count-1))),shape=indexes.map(i=>({lon:route.coordinates[i][0],lat:route.coordinates[i][1]}));const data=await publicJson('https://valhalla1.openstreetmap.de/height',{shape});if(!Array.isArray(data.height)||data.height.length!==count||data.height.some((v:unknown)=>typeof v!=='number'||!Number.isFinite(v)))return route;const elevation=route.coordinates.map((_,i)=>{let n=1;while(n<indexes.length-1&&indexes[n]<i)n++;const f=(i-indexes[n-1])/Math.max(1,indexes[n]-indexes[n-1]);return data.height[n-1]+f*(data.height[n]-data.height[n-1]);});return {...route,elevation};}catch{return route;}}

/** Area naming uses free Photon reverse geocoding; omit street numbers for a region. */
export async function reverseAreaName(bounds:import('../core/mapArea').AreaBounds):Promise<string|undefined>{const lon=(bounds[0]+bounds[2])/2,lat=(bounds[1]+bounds[3])/2;const data=await publicJson(`https://photon.komoot.io/reverse?lon=${lon.toFixed(5)}&lat=${lat.toFixed(5)}&limit=1`);const p=data?.features?.[0]?.properties;if(!p)return;const small=bounds[2]-bounds[0]<.08&&bounds[3]-bounds[1]<.06;return [...new Set([small&&(p.district||p.locality),p.city||p.county,p.country].filter((s):s is string=>typeof s==='string'&&!!s.trim()))].join(', ')||undefined;}
