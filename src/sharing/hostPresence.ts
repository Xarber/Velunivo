/** Local host state only. No battery/telemetry is added to the public sharing protocol. */
let snapshot={sharing:false,viewers:0};
const listeners=new Set<()=>void>();
export const getHostPresence=()=>snapshot;
export const subscribeHostPresence=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
export function setHostPresence(sharing:boolean,viewers:number){const count=sharing?Math.max(0,Math.floor(viewers)):0;if(snapshot.sharing===sharing && snapshot.viewers===count)return;snapshot={sharing,viewers:count};listeners.forEach(listener=>listener());}
