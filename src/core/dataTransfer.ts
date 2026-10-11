import {LanguageChoice,languages} from '../i18n/core';
import {Garage,restoreGarage,validPhoto} from './vehicles';
import {Route,NavigationOptions,Coord} from './types';
import {SavedPlace,restorePlaces} from './places';
import {RecordedRide,RideSample} from './recordings';
import {restorePreferences} from './preferences';
import {BluetoothPreferences,restoreBluetoothPreferences} from '../bluetooth/preferences';
export const MAX_BACKUP=64_000_000;
export type ImportMode='merge'|'overwrite';
export interface AppBackup {format:'velunivo';schema:1;createdAt:number;garage:Garage;places:SavedPlace[];routes:Route[];rides:{summary:RecordedRide;samples:RideSample[]}[];navigation:NavigationOptions;language:LanguageChoice;bluetooth:BluetoothPreferences;}
const fail=()=>{throw new Error('This is not a valid Velunivo backup.');};
const coordinate=(v:unknown):v is Coord=>Array.isArray(v)&&v.length===2&&v.every(Number.isFinite)&&Math.abs(v[0])<=180&&Math.abs(v[1])<=90;
const id=(v:unknown):v is string=>typeof v==='string'&&/^[A-Za-z0-9._-]{1,160}$/.test(v);
function unique<T extends {id:string}>(items:T[]){return new Set(items.map(v=>v.id)).size===items.length;}
function safeTree(value:unknown,depth=0){if(depth>24)fail();if(typeof value==='number'&&!Number.isFinite(value))fail();if(Array.isArray(value)){if(value.length>500000)fail();value.forEach(v=>safeTree(v,depth+1));}else if(value&&typeof value==='object'){for(const [key,v] of Object.entries(value)){if(['__proto__','constructor','prototype'].includes(key))fail();safeTree(v,depth+1);}}}
export function parseBackup(text:string):AppBackup{
 if(text.length>MAX_BACKUP)throw new Error('This backup is too large. Maximum size is 64 MB.');
 let x:AppBackup;try{x=JSON.parse(text);}catch{return fail();}safeTree(x);
 if(x?.format!=='velunivo'||x.schema!==1||!Number.isFinite(x.createdAt)||!x.garage||!Array.isArray(x.garage.vehicles)||!x.garage.vehicles.length||x.garage.vehicles.length>1000)fail();
 const garage=restoreGarage(JSON.stringify(x.garage),null);if(x.garage.vehicles.some(v=>!id(v.id)||typeof v.name!=='string'||(v.photo!==null&&v.photo!==undefined&&(!validPhoto(v.photo)||v.photo.startsWith('velunivo-photo://')))||(v.photos||[]).some(p=>!validPhoto(p)||p.startsWith('velunivo-photo://')))||garage.vehicles.filter(v=>v.id!=='sharing-scooter').length!==x.garage.vehicles.filter(v=>v.id!=='sharing-scooter').length||!unique(x.garage.vehicles))fail();
 if(!Array.isArray(x.places)||x.places.length>10000||restorePlaces(JSON.stringify(x.places)).length!==x.places.length||x.places.some(p=>!id(p.id))||!unique(x.places))fail();
 if(!Array.isArray(x.routes)||x.routes.length>10000||!unique(x.routes)||x.routes.some(r=>!id(r.id)||typeof r.name!=='string'||!['bike','car','track'].includes(r.kind)||!['graphhopper','valhalla','gpx','local-osm'].includes(r.source)||!Array.isArray(r.coordinates)||r.coordinates.length<2||!r.coordinates.every(coordinate)||!Array.isArray(r.steps)||r.steps.some(s=>typeof s.text!=='string'||!Number.isFinite(s.index)||!Number.isFinite(s.distance)||!Number.isFinite(s.sign))||!r.details||typeof r.details!=='object'||Object.values(r.details).some(values=>!Array.isArray(values)||values.some(d=>!Array.isArray(d)||d.length!==3||!Number.isFinite(d[0])||!Number.isFinite(d[1])||!['number','string'].includes(typeof d[2])))||!Array.isArray(r.warnings)||r.warnings.some(w=>typeof w!=='string')))fail();
 for(const route of x.routes){if(route.waypoints!==undefined&&(!Array.isArray(route.waypoints)||route.waypoints.length>12||route.waypoints.some(s=>!coordinate(s.coordinate)||typeof s.label!=='string'||s.label.length>200||s.index!==undefined&&(!Number.isInteger(s.index)||s.index<0||s.index>=route.coordinates.length))))fail();if(route.elevation!==undefined&&(!Array.isArray(route.elevation)||route.elevation.length!==route.coordinates.length||route.elevation.some(n=>!Number.isFinite(n)||n < -500||n>10000)))fail();}
 if(!Array.isArray(x.rides)||x.rides.length>10000||new Set(x.rides.map(r=>r.summary?.id)).size!==x.rides.length)fail();
 for(const {summary:r,samples} of x.rides){if(!r||!id(r.id)||typeof r.name!=='string'||typeof r.startLabel!=='string'||typeof r.endLabel!=='string'||!r.vehicle||!id(r.vehicle.id)||typeof r.vehicle.name!=='string'||!Number.isFinite(r.vehicle.maxSpeed)||!Number.isFinite(r.vehicle.ridingLimit)||!['escooter','ebike'].includes(r.vehicle.kind)||!Number.isFinite(r.startedAt)||!Number.isFinite(r.meters)||r.meters<0||!Array.isArray(r.preview)||!r.preview.every(coordinate)||(r.trace!==undefined&&(!Array.isArray(r.trace)||r.trace.some(segment=>!Array.isArray(segment)||!segment.every(coordinate))))||!['finished','arrived','interrupted','recording'].includes(r.status)||!Array.isArray(samples)||samples.length!==r.samples||samples.some(s=>!s.fix||!coordinate(s.fix.coordinate)||!Number.isFinite(s.fix.timestamp)||!Number.isFinite(s.fix.accuracy)))fail();r.chunks=Math.ceil(samples.length/100);if(r.status==='recording')r.status='interrupted';}
 if(!['system',...languages].includes(x.language)||!x.navigation||!x.bluetooth)fail();
 return {format:'velunivo',schema:1,createdAt:x.createdAt,garage,places:x.places,routes:x.routes,rides:x.rides,language:x.language,navigation:restorePreferences(JSON.stringify(x.navigation),garage.vehicles[0]),bluetooth:{...restoreBluetoothPreferences(JSON.stringify(x.bluetooth)),simulateTelemetry:false}};
}
function merged<T extends {id:string}>(local:T[],incoming:T[]){const ids=new Set(local.map(v=>v.id));return [...local,...incoming.filter(v=>!ids.has(v.id))];}
/** Merge keeps local values for matching IDs and local preferences; imported IDs retain ride/vehicle links. */
export function combineBackups(local:AppBackup,incoming:AppBackup,mode:ImportMode):AppBackup{
 if(mode==='overwrite')return incoming;
 const rides=merged(local.rides.map(r=>({...r,id:r.summary.id})),incoming.rides.map(r=>({...r,id:r.summary.id}))).map(({id:_,...r})=>r);
 return {...local,createdAt:Date.now(),garage:{...local.garage,vehicles:merged(local.garage.vehicles,incoming.garage.vehicles)},places:merged(local.places,incoming.places),routes:merged(local.routes,incoming.routes),rides};
}
export function backupCounts(b:AppBackup){return `${b.garage.vehicles.length} vehicles · ${b.places.length} places · ${b.routes.length} routes · ${b.rides.length} rides`;}
export const CODE_ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function transferCode(bytes:Uint8Array){if(bytes.length<8)throw new Error('Secure randomness unavailable.');const code=Array.from(bytes.slice(0,8),b=>CODE_ALPHABET[b%32]).join('');return code.slice(0,4)+'-'+code.slice(4);}
export const normalizeCode=(code:string)=>code.toUpperCase().replace(/[^A-Z0-9]/g,'');
export const validCode=(code:string)=>/^[A-HJ-NP-Z2-9]{8}$/.test(normalizeCode(code));

export function formatTransferCode(value:string){const letters=normalizeCode(value).slice(0,8);return letters.length>4?letters.slice(0,4)+'-'+letters.slice(4):letters;}
