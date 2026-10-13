import {Route,Profile} from '../core/types';
import {explorationDetours,worthwhileExploration,routeTileCount} from '../core/explorationRouting';
import {fetchItinerary} from './api';
import {scratchMap} from './scratchMap';
import {t} from '../i18n/core';
/** Optional alternatives only; ordinary candidates and mandatory stops are preserved. */
export async function exploreAlternatives(routes:Route[],profile:Profile,current:()=>boolean):Promise<Route[]>{await scratchMap.load();const index=scratchMap.getSnapshot().index,out:Route[]=[];for(const base of routes){if(!current()||base.kind==='track'||base.waypoints?.length)continue;const detours=explorationDetours(base,index);let best:Route|undefined;for(const coordinate of detours){if(!current())return out;try{const r=await fetchItinerary(base.coordinates[0],base.coordinates.at(-1)!,[{coordinate,label:t('Explore new areas')}],base.kind,profile);if(worthwhileExploration(base,r,index)&&(!best||routeTileCount(r,index)>routeTileCount(best,index)))best=r;}catch{/* Exploration never blocks the ordinary route. */}}if(best)out.push({...best,id:`explore-${best.id}`,name:`${t('Explore')} · ${t(base.kind==='bike'?'Bicycle':'Car-road')}`,exploration:true,startLabel:base.startLabel,endLabel:base.endLabel});}return out;}
