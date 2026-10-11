const listeners=new Set<()=>void>();
export const refreshAppData=()=>{for(const fn of listeners)fn();};
export function subscribeDataChange(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};}
