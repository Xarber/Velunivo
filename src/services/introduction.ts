const listeners=new Set<(kind:'welcome'|'news')=>void>();
export function showIntroduction(kind:'welcome'|'news'){for(const fn of listeners)fn(kind);}
export function subscribeIntroduction(fn:(kind:'welcome'|'news')=>void){listeners.add(fn);return()=>{listeners.delete(fn);};}
