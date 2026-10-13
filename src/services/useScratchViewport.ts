import {useRef,useEffect,useCallback,useState} from 'react';
type Bounds=[number,number,number,number];
/** Repaint during gestures, with one latest viewport per 120 ms rather than every camera frame. */
export function useScratchViewport(){
 const [bounds,setBounds]=useState<Bounds>([9.18,45.46,9.20,45.48]),pending=useRef<Bounds|null>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const update=useCallback((next:Bounds)=>{if(!next.every(Number.isFinite))return;pending.current=next;if(timer.current!==undefined)return;timer.current=setTimeout(()=>{timer.current=undefined;const value=pending.current;pending.current=null;if(value)setBounds(old=>old.every((v,i)=>Math.abs(v-value[i])<.00001)?old:value);},120);},[]);
 useEffect(()=>()=>clearTimeout(timer.current),[]);return {bounds,update};
}
