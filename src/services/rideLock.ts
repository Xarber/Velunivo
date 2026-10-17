import {useSyncExternalStore} from 'react';
let locked=false,target='/',revision=0;const listeners=new Set<()=>void>();
const emit=()=>{revision++;for(const fn of listeners)fn();};
export const setRideLock=(value:boolean)=>{if(locked===value)return;locked=value;if(!value)target='/';emit();};
export const isRideLocked=()=>locked;
export const setRideScreen=(value:string)=>{if(target!==value){target=value;emit();}};
export function useRideChrome(){useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},()=>revision,()=>0);return {active:locked,target};}

export function subscribeRideLock(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};}
