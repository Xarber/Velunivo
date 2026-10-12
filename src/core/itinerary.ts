import {Coord,Route} from './types';
import {distance,cumulative as importLengths} from './geo';
export interface RouteStop {coordinate:Coord;label:string;index?:number;}
export function joinLegs(legs:Route[],stops:RouteStop[]):Route{
 if(!legs.length||legs.length!==stops.length+1)throw new Error('Incomplete itinerary');
 const coordinates:Coord[]=[],steps:Route['steps']=[],details:Route['details']={},waypoints:RouteStop[]=[];
 for(const [i,leg] of legs.entries()){
  if(coordinates.length&&distance(coordinates.at(-1)!,leg.coordinates[0])>2)throw new Error('Route legs do not connect. Choose another stop.');
  const offset=coordinates.length?coordinates.length-1:0;
  coordinates.push(...(coordinates.length?leg.coordinates.slice(1):leg.coordinates));
  steps.push(...leg.steps.filter(s=>i===legs.length-1||s.sign!==4).map(s=>({...s,index:s.index+offset})));
  if(i<stops.length){const index=coordinates.length-1;steps.push({index,text:`Stop ${i+1} · ${stops[i].label}`,sign:5,distance:0});}
  for(const [key,values] of Object.entries(leg.details))(details[key]??=[]).push(...values.map(([a,b,v])=>[a+offset,b+offset,v] as import('./types').Detail));
  if(i<stops.length)waypoints.push({...stops[i],index:coordinates.length-1});
 }
 steps.sort((a,b)=>a.index-b.index);const lengths=importLengths(coordinates);steps.forEach((s,i)=>{s.distance=Math.max(0,(lengths[steps[i+1]?.index??coordinates.length-1]||0)-(lengths[s.index]||0));});
 return {...legs[0],coordinates,steps,details,waypoints,safetyWarnings:[...new Set(legs.flatMap(l=>l.safetyWarnings||[]))],warnings:[...new Set(legs.flatMap(l=>l.warnings))]};
}
export function remainingStops(route:Route,index:number){return(route.waypoints||[]).filter(s=>(s.index??Infinity)>index);}

export function reorderPoints<T>(points:T[],from:number,to:number):T[]{if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||from>=points.length||to<0||to>=points.length)return points;const result=[...points], [point]=result.splice(from,1);result.splice(to,0,point);return result;}

/** Older saved itineraries kept waypoints but omitted their arrival instructions. */
export function withStopInstructions(route:Route):Route{if(!route.waypoints?.length)return route;const steps=[...route.steps];let changed=false;for(const [i,stop] of route.waypoints.entries()){let index=stop.index;if(index===undefined){let nearest=Infinity;route.coordinates.forEach((point,n)=>{const meters=distance(point,stop.coordinate);if(meters<nearest){nearest=meters;index=n;}});if(nearest>75)continue;}if(index===undefined||index<0||index>=route.coordinates.length||steps.some(s=>s.sign===5&&s.index===index))continue;steps.push({index,text:`Stop ${i+1} · ${stop.label}`,sign:5,distance:0});changed=true;}if(!changed)return route;steps.sort((a,b)=>a.index-b.index||(a.sign===5?-1:b.sign===5?1:0));return {...route,steps};}
