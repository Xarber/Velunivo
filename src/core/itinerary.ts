import {Coord,Route} from './types';
import {distance} from './geo';
export interface RouteStop {coordinate:Coord;label:string;index?:number;}
export function joinLegs(legs:Route[],stops:RouteStop[]):Route{
 if(!legs.length||legs.length!==stops.length+1)throw new Error('Incomplete itinerary');
 const coordinates:Coord[]=[],steps:Route['steps']=[],details:Route['details']={},waypoints:RouteStop[]=[];
 for(const [i,leg] of legs.entries()){
  if(coordinates.length&&distance(coordinates.at(-1)!,leg.coordinates[0])>2)throw new Error('Route legs do not connect. Choose another stop.');
  const offset=coordinates.length?coordinates.length-1:0;
  coordinates.push(...(coordinates.length?leg.coordinates.slice(1):leg.coordinates));
  steps.push(...leg.steps.filter(s=>i===legs.length-1||s.sign!==4).map(s=>({...s,index:s.index+offset})));
  for(const [key,values] of Object.entries(leg.details))(details[key]??=[]).push(...values.map(([a,b,v])=>[a+offset,b+offset,v] as import('./types').Detail));
  if(i<stops.length)waypoints.push({...stops[i],index:coordinates.length-1});
 }
 return {...legs[0],coordinates,steps,details,waypoints,safetyWarnings:[...new Set(legs.flatMap(l=>l.safetyWarnings||[]))],warnings:[...new Set(legs.flatMap(l=>l.warnings))]};
}
export function remainingStops(route:Route,index:number){return(route.waypoints||[]).filter(s=>(s.index??Infinity)>index);}
