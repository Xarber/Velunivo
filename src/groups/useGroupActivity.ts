import {useEffect,useRef} from 'react';
import {registerRideActivity} from './activityReplacement';
/** Register only the live session, with a current save/stop callback. */
export function useGroupActivity(active:boolean,finish:()=>Promise<boolean>){const latest=useRef(finish);useEffect(()=>{latest.current=finish;},[finish]);useEffect(()=>{if(active)return registerRideActivity(()=>latest.current());},[active]);}
