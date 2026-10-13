import {RegroupRequest,activeRegroup} from './regroup';
let request:RegroupRequest|undefined;let name='';const listeners=new Set<()=>void>();
export function setRegroupPresence(next:RegroupRequest|undefined,requester=''){request=next;name=requester;for(const listener of listeners)listener();}
export const getRegroupWarning=()=>activeRegroup(request)?name:undefined;
export function subscribeRegroup(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
