import {Coord,Route,Profile} from './types';
import {distance,cumulative} from './geo';
import {bearing} from './rideView';
import {headingDelta} from './camera';
export interface OSMElement {type:'node'|'way'|'relation';id:number;lon?:number;lat?:number;nodes?:number[];tags?:Record<string,string>;members?:{type:string;ref:number;role:string}[];}
export interface RoadPack {schema:1;id:string;name:string;downloadedAt:number;bounds:[number,number,number,number];elements:OSMElement[];}
interface Edge {to:number;way:number;meters:number;tags:Record<string,string>;}
interface Restriction {from:number;to:number;via:number;only:boolean;uTurn:boolean;exceptBike:boolean;conditional:boolean;}
export const packContains=(p:RoadPack,c:Coord)=>c[0]>=p.bounds[0]&&c[0]<=p.bounds[2]&&c[1]>=p.bounds[1]&&c[1]<=p.bounds[3];
export function validateRoadPack(raw:unknown):RoadPack{
 const p=raw as RoadPack;if(p?.schema!==1||typeof p.id!=='string'||typeof p.name!=='string'||!Number.isFinite(p.downloadedAt)||!Array.isArray(p.bounds)||p.bounds.length!==4||!p.bounds.every(Number.isFinite)||Math.abs(p.bounds[0])>180||Math.abs(p.bounds[2])>180||Math.abs(p.bounds[1])>85||Math.abs(p.bounds[3])>85||p.bounds[0]>=p.bounds[2]||p.bounds[1]>=p.bounds[3]||!Array.isArray(p.elements)||p.elements.length>70000)throw new Error('Invalid offline road network.');
 for(const e of p.elements){if(e.tags&&(!e.tags||typeof e.tags!=='object'||Object.values(e.tags).some(t=>typeof t!=='string')))throw new Error('Invalid offline road network.');if(e.members&&(!Array.isArray(e.members)||e.members.some(m=>!m||!Number.isSafeInteger(m.ref)||typeof m.type!=='string'||typeof m.role!=='string')))throw new Error('Invalid offline road network.');if(!Number.isSafeInteger(e.id)||!['node','way','relation'].includes(e.type))throw new Error('Invalid offline road network.');if(e.type==='node'&&(!Number.isFinite(e.lon)||!Number.isFinite(e.lat)||Math.abs(e.lon!)>180||Math.abs(e.lat!)>85))throw new Error('Invalid offline road network.');if(e.type==='way'&&(!Array.isArray(e.nodes)||e.nodes.length>20000||e.nodes.some(n=>!Number.isSafeInteger(n))))throw new Error('Invalid offline road network.');}
 return p;
}
export function mappedLimit(tags:Record<string,string>){const match=tags.maxspeed?.match(/^(\d+(?:\.\d+)?)\s*(mph)?$/i);return match?Number(match[1])*(match[2]?1.609344:1):null;}
const no=(v:string|undefined)=>['no','private'].includes(v||'');
function accessible(tags:Record<string,string>,kind:'bike'|'car'){
 const explicit=kind==='bike'?tags.bicycle:tags.motor_vehicle||tags.vehicle;
 if(no(explicit)||no(tags.access)&&!['yes','designated','permissive','destination'].includes(explicit||''))return false;
 if(['reversible','alternating'].includes(tags.oneway||''))return false;
 if(tags.highway==='construction'||tags.highway==='proposed'||tags.area==='yes'||tags.route==='ferry')return false;
 if(Object.keys(tags).some(k=>k.endsWith(':conditional')))return false; // Do not guess time-dependent restrictions.
 if(kind==='bike')return !['motorway','motorway_link','trunk','trunk_link','steps'].includes(tags.highway);
 return !['motorway','motorway_link','trunk','trunk_link','steps','cycleway','footway','pedestrian','path','bridleway'].includes(tags.highway);
}
class Heap<T>{private values:{score:number;value:T}[]=[];push(value:T,score:number){const v=this.values;v.push({value,score});let i=v.length-1;while(i){const p=(i-1)>>1;if(v[p].score<=score)break;[v[i],v[p]]=[v[p],v[i]];i=p;}}pop(){const v=this.values,first=v[0],last=v.pop();if(v.length&&last){v[0]=last;let i=0;while(true){let j=i*2+1;if(j>=v.length)break;if(j+1<v.length&&v[j+1].score<v[j].score)j++;if(v[i].score<=v[j].score)break;[v[i],v[j]]=[v[j],v[i]];i=j;}}return first?.value;}get length(){return this.values.length;}}
/** Real local graph search. OSM road access is not legal certification for scooters. */
export function calculateOfflineRoute(pack:RoadPack,start:Coord,end:Coord,kind:'bike'|'car',profile:Profile):Route{
 if(!packContains(pack,start)||!packContains(pack,end))throw new Error('The endpoints are outside downloaded road coverage.');
 const points=new Map<number,Coord>(),graph=new Map<number,Edge[]>(),ways=new Map<number,OSMElement>(),restrictions:Restriction[]=[],blocked=new Set<number>();
 for(const e of pack.elements){if(e.type==='node')points.set(e.id,[e.lon!,e.lat!]);if(e.type==='way')ways.set(e.id,e);}
 for(const e of pack.elements.filter(e=>e.type==='relation'&&e.tags?.type==='restriction')){
  const members=e.members||[],from=members.find(m=>m.role==='from'&&m.type==='way'),to=members.find(m=>m.role==='to'&&m.type==='way'),via=members.filter(m=>m.role==='via'),restriction=e.tags?.['restriction:'+ (kind==='bike'?'bicycle':'motorcar')]||e.tags?.restriction;
  if(!restriction)continue;const exceptBike=!!e.tags?.except?.split(';').includes('bicycle');if(kind==='bike'&&exceptBike)continue;
  if(via.length!==1||via[0].type!=='node'||!from||!to){for(const v of via){if(v.type==='way')for(const n of ways.get(v.ref)?.nodes||[])blocked.add(n);else if(v.type==='node')blocked.add(v.ref);}continue;}
  restrictions.push({from:from.ref,to:to.ref,via:via[0].ref,only:restriction.startsWith('only_'),uTurn:restriction==='no_u_turn',exceptBike,conditional:Object.keys(e.tags||{}).some(k=>k.endsWith(':conditional'))});
 }
 const restrictionIndex=new Map<string,Restriction[]>();for(const r of restrictions){const key=`${r.via}:${r.from}`;(restrictionIndex.get(key)||restrictionIndex.set(key,[]).get(key)!).push(r);}
 const add=(from:number,to:number,way:OSMElement,tags:Record<string,string>)=>{const a=points.get(from),b=points.get(to);if(!a||!b||blocked.has(from)||blocked.has(to)||!packContains(pack,a)||!packContains(pack,b))return;if(!graph.has(to))graph.set(to,[]);const meters=distance(a,b);if(meters>0)(graph.get(from)||graph.set(from,[]).get(from)!).push({to,way:way.id,meters,tags});};
 for(const way of ways.values()){const tags=way.tags||{};if(!tags.highway||!accessible(tags,kind))continue;let one=tags.oneway;if(kind==='bike'){if(tags['oneway:bicycle']==='no'||tags.cycleway?.startsWith('opposite'))one='no';else one=tags['oneway:bicycle']||one;}const forward=one!=='-1',backward=!['yes','1','true','-1'].includes(one||'')&&tags.junction!=='roundabout'||one==='-1'||one==='no';for(let i=1;i<(way.nodes?.length||0);i++){const a=way.nodes![i-1],b=way.nodes![i];if(forward)add(a,b,way,tags);if(backward)add(b,a,way,tags);}}
 const nearest=(c:Coord)=>{let node:number|undefined,best=75;for(const id of graph.keys()){const d=distance(c,points.get(id)!);if(d<best){best=d;node=id;}}if(node===undefined)throw new Error('No downloaded road is close enough to this location.');return node;};
 const origin=nearest(start),target=nearest(end),queue=new Heap<string>(),costs=new Map<string,number>(),states=new Map<string,{node:number;way:number;previous:number}>(),parents=new Map<string,{key:string;edge:Edge}>();
 const first=`${origin}:0:0`;states.set(first,{node:origin,way:0,previous:0});costs.set(first,0);queue.push(first,0);let finish:string|undefined,expanded=0;
 while(queue.length){const key=queue.pop()!,state=states.get(key)!,cost=costs.get(key)!;if(state.node===target){finish=key;break;}if(++expanded>250000)throw new Error('Offline routing exceeded this region’s search limit.');
  for(const edge of graph.get(state.node)||[]){if(state.previous===edge.to)continue;
   const rules=restrictionIndex.get(`${state.node}:${state.way}`)||[];
   const only=rules.filter(r=>r.only);if(rules.some(r=>r.conditional||!r.only&&edge.way===r.to&&(!r.uTurn||edge.to===state.previous))||only.length&&!only.some(r=>edge.way===r.to))continue;
   const limit=mappedLimit(edge.tags),speed=Math.max(1,Math.min(profile.maxSpeed,profile.ridingLimit,limit||60,kind==='bike'&&['footway','path','pedestrian'].includes(edge.tags.highway)?12:60));
   const rough=['gravel','dirt','sand','ground','unpaved'].includes(edge.tags.surface||'')?1.5:1,fast=limit&&limit>50?2:1;
   const nextCost=cost+edge.meters/(speed/3.6)*rough*fast,nextKey=`${edge.to}:${edge.way}:${state.node}`;if(nextCost>=(costs.get(nextKey)??Infinity))continue;
   costs.set(nextKey,nextCost);states.set(nextKey,{node:edge.to,way:edge.way,previous:state.node});parents.set(nextKey,{key,edge});queue.push(nextKey,nextCost+distance(points.get(edge.to)!,points.get(target)!)/(Math.min(profile.maxSpeed,profile.ridingLimit)/3.6));
  }
 }
 if(!finish)throw new Error('No usable route in the downloaded road network.');
 const edges:Edge[]=[],ids:number[]=[target];let key=finish;while(key!==first){const parent=parents.get(key)!;edges.unshift(parent.edge);key=parent.key;ids.unshift(states.get(key)!.node);}
 if(ids.length<2)throw new Error('The locations are too close for an offline route.');
 const coordinates=ids.map(id=>points.get(id)!),lengths=cumulative(coordinates),steps:Route['steps']=[{index:0,text:`Continue on ${edges[0].tags.name||'the road'}`,sign:0,distance:0}],details:Route['details']={max_speed:[],average_speed:[],road_class:[]};
 for(let i=0;i<edges.length;i++){const e=edges[i],limit=mappedLimit(e.tags);if(limit)details.max_speed.push([i,i+1,limit]);details.road_class.push([i,i+1,e.tags.highway]);details.average_speed.push([i,i+1,Math.min(profile.maxSpeed,profile.ridingLimit,limit||60,kind==='bike'&&['footway','path','pedestrian'].includes(e.tags.highway)?12:60)]);
  if(i>0&&edges[i-1].way!==e.way){const before=bearing(coordinates[i-1],coordinates[i]),after=bearing(coordinates[i],coordinates[i+1]),turn=before===null||after===null?0:headingDelta(before,after),sign=Math.abs(turn)<30?0:turn<0?-2:2;steps.push({index:i,text:`${sign===0?'Continue':sign<0?'Turn left':'Turn right'}${e.tags.name?' onto '+e.tags.name:''}`,sign,distance:0});}}
 steps.push({index:coordinates.length-1,text:'You have arrived',sign:4,distance:0});steps.forEach((s,i)=>{s.distance=(lengths[steps[i+1]?.index??coordinates.length-1]||0)-lengths[s.index];});
 const safetyWarnings=[...new Set(edges.map(e=>mappedLimit(e.tags)).filter((v):v is number=>!!v&&v>50).map(v=>`Includes a road with a mapped speed limit of ${Math.round(v)} km/h.`))];
 return {id:`offline-${kind}-${Date.now()}`,name:kind==='bike'?'Bicycle candidate':'Car-road candidate',kind,source:'local-osm',coordinates,steps,details,safetyWarnings,warnings:['Offline road network · check signs and access rules.','Downloaded road data may be outdated.'],plannedCap:Math.min(profile.maxSpeed,profile.ridingLimit)};
}
