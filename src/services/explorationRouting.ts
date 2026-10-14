import {Route,Profile} from '../core/types';
import {explorationDetours,worthwhileExploration,routeTileCount} from '../core/explorationRouting';
import {fetchItinerary} from './api';
import {scratchMap} from './scratchMap';
import {t} from '../i18n/core';
/** Optional alternatives only; ordinary candidates and mandatory stops are preserved. */
export async function exploreAlternatives(routes:Route[],profile:Profile,current:()=>boolean):Promise<Route[]>{await scratchMap.load();const index=scratchMap.getSnapshot().index,out:Route[]=[];for(const base of routes){if(!current()||base.kind!=='bike'||base.waypoints?.length)continue;const detours=explorationDetours(base,index);let best:Route|undefined;for(const coordinate of detours){if(!current())return out;try{const r=await fetchItinerary(base.coordinates[0],base.coordinates.at(-1)!,[{coordinate,label:t('Explore new areas')}],base.kind,profile);if(worthwhileExploration(base,r,index,profile)&&(!best||routeTileCount(r,index)>routeTileCount(best,index)))best=r;}catch{/* Exploration never blocks the ordinary route. */}}if(best)out.push({...best,id:`explore-${best.id}`,name:`${t('Explore')} · ${t(base.kind==='bike'?'Bicycle':'Car-road')}`,exploration:true,startLabel:base.startLabel,endLabel:base.endLabel});}return out;}

/** Rank real connected loops. Exploration is a preference, not an availability requirement. */
export async function randomExplorationRide(start:import('../core/types').Coord,meters:number,profile:Profile,current:()=>boolean=()=>true){
 if(!Number.isFinite(meters)||meters<500||meters>30000)throw new Error('Choose an exploration distance between 0.5 and 30 km.');
 await scratchMap.load();const index=scratchMap.getSnapshot().index,{explorationTargets,destinationPoint,unexploredAround,scoreExplorationLoop}=await import('../core/explorationRouting'),{fetchExplorationItinerary}=await import('./api');
 let best:{route:Route;score:number}|undefined;
 for(const target of explorationTargets(start,meters,index).slice(0,6)){if(!current())throw new Error('Selection cancelled');try{
  const midpoint:import('../core/types').Coord=[(start[0]+target[0])/2,(start[1]+target[1])/2],angle=Math.atan2((target[0]-start[0])*Math.cos(start[1]*Math.PI/180),target[1]-start[1])*180/Math.PI;
  const returns=[destinationPoint(midpoint,angle+90,meters*.24),destinationPoint(midpoint,angle-90,meters*.24)].sort((a,b)=>unexploredAround(b,index)-unexploredAround(a,index));
  const route=await fetchExplorationItinerary(start,[{coordinate:target,label:t('Exploration destination')},{coordinate:returns[0],label:t('Explore new areas')}],profile,current);
  const ranked=scoreExplorationLoop(route,index,meters);if(!ranked)continue;
  const candidate={...route,returnStartIndex:route.waypoints![0].index,id:`explore-loop-${Date.now()}`,name:t('Exploration round trip'),exploration:true,startLabel:t('Ride starting point'),endLabel:t('Ride starting point')};
  if(!best||ranked.score>best.score)best={route:candidate,score:ranked.score};
  if(ranked.outwardNew>=3&&ranked.returnNew>=3&&ranked.distinctReturn>=3)return candidate;
 }catch{if(!current())throw new Error('Selection cancelled');}}
 if(best)return {...best.route,warnings:[...best.route.warnings,t('This loop reuses explored roads. Try a different distance to explore further.')]};
 throw new Error('No usable exploration loop found. Try another distance or area.');
}
