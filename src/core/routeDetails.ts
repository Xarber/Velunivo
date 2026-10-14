import type {Route} from './types';
const cached=new WeakMap<Route['details'], {segments:number;columns:Map<string,(string|number|undefined)[]>}>();
/** Immutable provider details, indexed once. Preserve the first matching interval, including overlaps. */
export function segmentDetails(route:Route,key:string):readonly (string|number|undefined)[]{
  const segments=Math.max(0,route.coordinates.length-1);let index=cached.get(route.details);
  if(!index||index.segments!==segments){index={segments,columns:new Map()};cached.set(route.details,index);}
  let values=index.columns.get(key);
  if(!values){values=route.details[key]?.length?new Array(segments):[];for(const [from,to,value] of route.details[key]??[]){if(!Number.isFinite(from)||!Number.isFinite(to))continue;for(let i=Math.max(0,Math.ceil(from)),end=Math.min(segments,Math.ceil(to));i<end;i++)if(values[i]===undefined)values[i]=value;}index.columns.set(key,values);}
  return values;
}
