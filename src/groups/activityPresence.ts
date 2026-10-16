import {RecordedRider,riderRoster} from '../core/groupRideRoster';
let count:number|undefined;
export const getGroupActivityCount=()=>count;
export function setGroupActivityCount(value:number|undefined){count=value===undefined?undefined:Math.max(1,Math.min(8,Math.floor(value)));}

let riders:RecordedRider[]=[];const rosterListeners=new Set<(riders:RecordedRider[])=>void>();
export const getGroupActivityRiders=()=>riders;
export function setGroupActivityRiders(value:readonly RecordedRider[]){const next=riderRoster(value);if(JSON.stringify(next)===JSON.stringify(riders))return;riders=next;for(const listener of rosterListeners)listener(riders);}

export function subscribeGroupActivityRiders(listener:(riders:RecordedRider[])=>void){rosterListeners.add(listener);return()=>{rosterListeners.delete(listener);};}

let joinRequest:string|undefined;
export const getGroupJoinRequest=()=>joinRequest;
export function setGroupJoinRequest(value:string|undefined){joinRequest=value;}
