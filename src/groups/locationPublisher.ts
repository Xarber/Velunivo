import {Fix,Coord} from '../core/types';import {displayableFix} from '../core/rideView';
let current:{token:symbol;send:(p:Coord)=>void}|null=null;
/** The consenting group owns this callback; native GPS tasks need no visible React commit to send. */
export function subscribeGroupLocation(send:(p:Coord)=>void){const token=Symbol('group-location');current={token,send};return()=>{if(current?.token===token)current=null;};}
export function publishGroupLocation(fix:Fix){if(displayableFix(fix))current?.send([...fix.coordinate] as Coord);}
