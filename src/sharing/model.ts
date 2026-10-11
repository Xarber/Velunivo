import {resolveShareOrigin} from './hostConfig';
import { Coord, Route } from '../core/types';
export const PIN_PATTERN = /^[A-Za-z0-9_-]{20}$/;
export const SHARE_ORIGIN = resolveShareOrigin(process.env.EXPO_PUBLIC_SHARE_ORIGIN,typeof window!=='undefined' && window.location?.origin ? window.location.origin : undefined);
export interface SharedRoute { coordinates: Coord[]; startLabel: string; endLabel: string; }
export interface SharedProgress { position: Coord | null; arrivalAt: number; secondsLeft: number; metersLeft: number; updatedAt: number; }
export type TripMessage = { type: 'route'; route: SharedRoute } | { type: 'progress'; progress: SharedProgress } | { type: 'ended' };
export function pinFromBytes(bytes: Uint8Array) {
  if (bytes.length < 20) throw new Error('Twenty random bytes required');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  return Array.from(bytes.slice(0,20), b => alphabet[b & 63]).join('');
}
export const validCoordinate = (p: unknown): p is Coord => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 85;
export function sharedRoute(route: Route): SharedRoute {
  return { coordinates: route.coordinates.map(p => [p[0],p[1]]), startLabel: (route.startLabel || 'Ride start').slice(0,200), endLabel: (route.endLabel || 'Destination').slice(0,200) };
}
export function sharedProgress(position: Coord | null, seconds: number, meters: number, now: number): SharedProgress {
  return { position: position ? [position[0],position[1]] : null, arrivalAt: now + Math.max(0,seconds)*1000, secondsLeft: Math.max(0,seconds), metersLeft: Math.max(0,meters), updatedAt: now };
}
// Reconstruct allowed fields; never pass arbitrary remote objects into the app or map.
export function parseTripMessage(raw: unknown): TripMessage | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as any;
  if (v.type === 'ended') return {type:'ended'};
  if (v.type === 'route' && v.route && Array.isArray(v.route.coordinates) && v.route.coordinates.length >= 2 && v.route.coordinates.length <= 20000 && v.route.coordinates.every(validCoordinate) && typeof v.route.startLabel === 'string' && typeof v.route.endLabel === 'string') return {type:'route',route:{coordinates:v.route.coordinates.map((p:Coord)=>[p[0],p[1]]),startLabel:v.route.startLabel.slice(0,200),endLabel:v.route.endLabel.slice(0,200)}};
  const p=v.progress;
  if (v.type === 'progress' && p && (p.position === null || validCoordinate(p.position)) && ['arrivalAt','secondsLeft','metersLeft','updatedAt'].every(k=>Number.isFinite(p[k]) && p[k]>=0) && p.secondsLeft <= 86400*7 && p.metersLeft <= 10_000_000) return {type:'progress',progress:sharedProgress(p.position,p.secondsLeft,p.metersLeft,p.updatedAt)};
  return null;
}
export function previewRoute(r:SharedRoute): Route { return {id:'shared-preview',name:`${r.startLabel} → ${r.endLabel}`,coordinates:r.coordinates,kind:'track',source:'gpx',steps:[],details:{},warnings:[],startLabel:r.startLabel,endLabel:r.endLabel}; }
export function routeLink(r:Route) {
  const a=r.coordinates[0], b=r.coordinates.at(-1);
  if (!validCoordinate(a)||!validCoordinate(b)) throw new Error('Route endpoints unavailable');
  const params = new URLSearchParams({start:a.join(','),end:b.join(','),from:r.startLabel || 'Ride start',to:r.endLabel || 'Destination'});
  if(r.waypoints?.length)params.set('stops',JSON.stringify(r.waypoints.map(s=>({coordinate:s.coordinate,label:s.label.slice(0,200)}))));
  return `${SHARE_ORIGIN}/share/route?${params}`;
}
export function readRouteLink(p:Record<string,unknown>) {
  const read=(s:unknown) => typeof s==='string' && s.length<=60 ? s.split(',').map(Number) : null;
  const a=read(p.start),b=read(p.end);
  if(!validCoordinate(a)||!validCoordinate(b))return null;
  let stops:import('../core/itinerary').RouteStop[]|undefined;if(p.stops!==undefined){try{if(typeof p.stops!=='string'||p.stops.length>5000)return null;const parsed=JSON.parse(p.stops);if(!Array.isArray(parsed)||parsed.length>12||parsed.some(s=>!validCoordinate(s.coordinate)||typeof s.label!=='string'||s.label.length>200))return null;stops=parsed.map(s=>({coordinate:s.coordinate,label:s.label}));}catch{return null;}}
  return {...(stops?{stops}:{}),start:a,end:b,startLabel:typeof p.from==='string'?p.from.slice(0,200):'Ride start',endLabel:typeof p.to==='string'?p.to.slice(0,200):'Destination',requestedAt:0};
}
