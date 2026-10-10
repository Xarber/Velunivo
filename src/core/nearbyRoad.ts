import { Fix, Coord } from './types';
import { project } from './geo';
export interface NearbyWay {id:number;tags?:Record<string,string>;geometry?:{lon:number;lat:number}[];}
export function numericRoadLimit(value?:string){
  const match=value?.trim().match(/^(\d+(?:\.\d+)?)\s*(mph|km\/h)?$/i);
  if(!match)return null;
  const limit=Number(match[1])*(match[2]?.toLowerCase()==='mph'?1.609344:1);
  return limit>0 && limit<=200 ? limit : null;
}
/** Match all streets, including untagged ones; never borrow a limit from a nearby parallel road. */
export function nearbyRoadLimit(fix:Fix,ways:NearbyWay[]){
  if(fix.accuracy>20 || fix.accuracy<0)return null;
  const candidates=ways.filter(w=>w && w.tags?.highway && Array.isArray(w.geometry) && w.geometry.length>=2 && w.geometry.every(p=>p && Number.isFinite(p.lon) && Number.isFinite(p.lat) && Math.abs(p.lon)<=180 && Math.abs(p.lat)<=90)).map(w=>({way:w,near:project(fix.coordinate,w.geometry!.map(p=>[p.lon,p.lat] as Coord))})).sort((a,b)=>a.near.crossTrack-b.near.crossTrack);
  const nearest=candidates[0];
  if(!nearest || nearest.near.crossTrack>12 || (candidates[1] && candidates[1].near.crossTrack-nearest.near.crossTrack<8))return null;
  const tags=nearest.way.tags!;
  if(Object.keys(tags).some(k=>k.startsWith('maxspeed:') && k!=='maxspeed:type'))return null;
  if(tags.layer && tags.layer!=='0' || tags.bridge==='yes' || tags.tunnel==='yes')return null;
  return numericRoadLimit(tags.maxspeed);
}
