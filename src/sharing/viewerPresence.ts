/** Count viewers for one minute after the last successfully sent progress update. */
export function createViewerPresence(now:()=>number=Date.now){
 const sent=new Map<unknown,number>();
 return {mark(id:unknown){sent.set(id,now());},count(){const time=now();for(const [id,at] of sent)if(time-at>=60000)sent.delete(id);return sent.size;},clear(){sent.clear();}};
}
