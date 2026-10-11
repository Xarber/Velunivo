import {useRef,useEffect,useState} from 'react';
import {Fix} from '../core/types';
import {TravelHeadingTracker,HeadingResult} from '../core/travelHeading';
export function useRideHeading(fix:Fix|null,compass:{heading:number|null;timestamp:number},enabled:boolean,fallback:{heading:number;source:string},now:number,session:string){
 const state=useRef<{session:string;tracker:TravelHeadingTracker}|null>(null);
 const [result,setResult]=useState<HeadingResult>(()=>({...fallback,travelOverride:false}));
 const h=compass.heading,stamp=compass.timestamp,fallbackHeading=fallback.heading,fallbackSource=fallback.source;
 useEffect(()=>{
  if(state.current?.session!==session)state.current={session,tracker:new TravelHeadingTracker()};
  const next=state.current.tracker.next(fix,{heading:h,timestamp:stamp},enabled,{heading:fallbackHeading,source:fallbackSource},now);
  setResult(previous=>previous.heading===next.heading&&previous.source===next.source&&previous.travelOverride===next.travelOverride?previous:next);
 },[fix,h,stamp,enabled,fallbackHeading,fallbackSource,now,session]);
 return result;
}
