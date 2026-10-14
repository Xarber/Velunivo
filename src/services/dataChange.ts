let revision=0;export const getAppDataRevision=()=>revision;
const listeners=new Set<()=>void>();
export const refreshAppData=()=>{revision++;for(const fn of listeners)fn();};
export function subscribeDataChange(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};}
