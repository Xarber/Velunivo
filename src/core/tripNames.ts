import {Coord} from './types';
import {SavedPlace} from './places';
import {distance} from './geo';
export function nearestSavedPlace(point:Coord,places:SavedPlace[],radius=75){return places.map(p=>({p,d:distance(point,p.coordinate)})).filter(x=>x.d<=radius).sort((a,b)=>a.d-b.d)[0]?.p;}
export function automaticTripName(start?:string,end?:string){return start&&end?`From ${start} to ${end}`:end?`To ${end}`:start?`From ${start}`:undefined;}
