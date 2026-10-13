import {useEffect,useRef,useCallback} from 'react';
export const MAP_BROWSE_IDLE_MS=8000;
/** Only user interaction renews the timer; sensor updates cannot shorten it. */
export function useMapBrowsing(active:boolean,resume:()=>void){
 const latest=useRef({active,resume}),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);useEffect(()=>{latest.current={active,resume};},[active,resume]);
 const cancel=useCallback(()=>{clearTimeout(timer.current);timer.current=undefined;},[]);
 const touch=useCallback(()=>{cancel();if(latest.current.active)timer.current=setTimeout(()=>{timer.current=undefined;if(latest.current.active)latest.current.resume();},MAP_BROWSE_IDLE_MS);},[cancel]);
 useEffect(()=>{if(!active)cancel();return cancel;},[active,cancel]);return {touch,cancel};
}
