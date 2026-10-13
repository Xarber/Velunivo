import {RecordedRide} from './recordings';
export interface RecordedRider {id:string;name:string;}
/** Deliberately project only identity/name: never retain a peer's location, photo or telemetry. */
export function riderRoster(riders:readonly RecordedRider[]):RecordedRider[]{return riders.filter(r=>typeof r.id==='string'&&r.id.length>0&&r.id.length<=64&&typeof r.name==='string'&&!!r.name.trim()).slice(0,8).map(r=>({id:r.id,name:r.name.trim().slice(0,40)}));}
export function rememberRideRiders(ride:RecordedRide,current:readonly RecordedRider[]):RecordedRide{const incoming=riderRoster(current);if(!incoming.length)return ride;const merged=new Map((ride.groupRiders??[]).map(r=>[r.id,r]));for(const rider of incoming)merged.set(rider.id,rider);return {...ride,groupRiders:[...merged.values()].slice(-64),groupSize:Math.max(ride.groupSize??0,incoming.length)};}
/** Validate imported history separately from the eight-member live roster. */
export function readRecordedRoster(raw:unknown):RecordedRider[]|null{if(!Array.isArray(raw)||raw.length>64)return null;const ids=new Set<string>();const out:RecordedRider[]=[];for(const r of raw){if(!r||typeof r.id!=='string'||!r.id||r.id.length>64||ids.has(r.id)||typeof r.name!=='string'||!r.name.trim()||r.name.length>40)return null;ids.add(r.id);out.push({id:r.id,name:r.name.trim()});}return out;}
