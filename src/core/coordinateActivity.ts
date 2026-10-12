import {parseCoordinate} from './geo';
import {Coord} from './types';
export function createCoordinateActivity(){
 const active=new Map<string,Coord>(),listeners=new Set<()=>void>();
 const notify=()=>listeners.forEach(fn=>fn());
 return {subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};},
 begin(key:string,c:Coord){active.set(key,c);notify();},end(key:string){active.delete(key);notify();},
 pending(label:string){let c:Coord;try{c=parseCoordinate(label);}catch{return false;}return [...active.values()].some(p=>Math.abs(p[0]-c[0])<.00002&&Math.abs(p[1]-c[1])<.00002);}};
}
export const coordinateActivity=createCoordinateActivity();
