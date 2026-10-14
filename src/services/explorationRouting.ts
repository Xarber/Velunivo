import {Route,Profile} from '../core/types';
import {explorationDetours,worthwhileExploration,routeTileCount,distinctReturnTiles} from '../core/explorationRouting';
import {fetchItinerary} from './api';
import {scratchMap} from './scratchMap';
import {t} from '../i18n/core';
/** Optional alternatives only; ordinary candidates and mandatory stops are preserved. */
export async function exploreAlternatives(routes:Route[],profile:Profile,current:()=>boolean):Promise<Route[]>{await scratchMap.load();const index=scratchMap.getSnapshot().index,out:Route[]=[];for(const base of routes){if(!current()||base.kind!=='bike'||base.waypoints?.length)continue;const detours=explorationDetours(base,index);let best:Route|undefined;for(const coordinate of detours){if(!current())return out;try{const r=await fetchItinerary(base.coordinates[0],base.coordinates.at(-1)!,[{coordinate,label:t('Explore new areas')}],base.kind,profile);if(worthwhileExploration(base,r,index,profile)&&(!best||routeTileCount(r,index)>routeTileCount(best,index)))best=r;}catch{/* Exploration never blocks the ordinary route. */}}if(best)out.push({...best,id:`explore-${best.id}`,name:`${t('Explore')} · ${t(base.kind==='bike'?'Bicycle':'Car-road')}`,exploration:true,startLabel:base.startLabel,endLabel:base.endLabel});}return out;}

/** A routed bicycle round trip, not a straight-line random GPX. */
export async function randomExplorationRide(start:import('../core/types').Coord,meters:number,profile:Profile,current:()=>boolean=()=>true){
 if(!Number.isFinite(meters)||meters<500||meters>30000)throw new Error('Choose an exploration distance between 0.5 and 30 km.');
 await scratchMap.load();const index=scratchMap.getSnapshot().index,{explorationTargets,destinationPoint,unexploredAround}=await import('../core/explorationRouting'),{fetchRoute}=await import('./api'),{joinLegs}=await import('../core/itinerary'),{distance}=await import('../core/geo');
 for(const target of explorationTargets(start,meters,index)){if(!current())throw new Error('Selection cancelled');try{
  const outbound=await fetchRoute(start,target,'bike',profile);if(distance(outbound.coordinates.at(-1)!,target)>Math.max(100,meters*.15))continue;if(!current())throw new Error('Selection cancelled');
  // Seek a different unexplored return corridor; compare actual routed coverage afterwards.
  const midpoint:[number,number]=[(start[0]+target[0])/2,(start[1]+target[1])/2],angle=Math.atan2(target[0]-start[0],target[1]-start[1])*180/Math.PI;
  const returns=[destinationPoint(midpoint,angle+90,meters*.2),destinationPoint(midpoint,angle-90,meters*.2)].sort((a,b)=>unexploredAround(b,index)-unexploredAround(a,index));
  const back=await fetchItinerary(outbound.coordinates.at(-1)!,start,[{coordinate:returns[0],label:t('Explore new areas')}],'bike',profile);
  const home=back.coordinates.at(-1)!;if(distance(home,outbound.coordinates[0])>100)continue;
  // Routable endpoints can differ by a few metres. Join only at the real snapped target.
  const route=joinLegs([outbound,back],[{coordinate:outbound.coordinates.at(-1)!,label:t('Exploration destination')}]);
  const length=(await import('../core/geo')).cumulative(route.coordinates).at(-1)||0;
  if(route.safetyWarnings?.length||length<meters*1.2||length>meters*3.5||routeTileCount(route,index)<3||distinctReturnTiles(outbound,back,index)<3)continue;
  return {...route,id:`explore-loop-${Date.now()}`,name:t('Exploration round trip'),waypoints:[...(route.waypoints||[]),...(back.waypoints||[]).map(p=>({...p,index:(p.index??0)+outbound.coordinates.length-1}))],exploration:true,startLabel:t('Ride starting point'),endLabel:t('Ride starting point')};
 }catch{/* Try the next target; ordinary destination-free recording remains available. */}}
 throw new Error('No usable exploration loop found. Try another distance or area.');
}
