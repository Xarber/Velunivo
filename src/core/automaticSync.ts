import {SyncEnvelope} from './syncPrivateData';
import {AppBackup} from './dataTransfer';
export interface ItemRevision {hash:string;modifiedAt:number;}
export type Revisions=Record<string,ItemRevision>;
export interface AutomaticEnvelope extends SyncEnvelope {revisions:Revisions;}
export function syncItems(backup:AppBackup){return [...backup.garage.vehicles.map(v=>['vehicle:'+v.id,v] as const),...backup.places.map(v=>['place:'+v.id,v] as const),...backup.routes.map(v=>['route:'+v.id,v] as const),...backup.rides.map(v=>['ride:'+v.summary.id,v] as const)];}
/** Newer changed entities win deterministically. Merge never propagates deletions. */
export function automaticMerge(local:AutomaticEnvelope,incoming:AutomaticEnvelope):AutomaticEnvelope{
 const revisions:Revisions={...local.revisions};
 function combine<T>(a:T[],b:T[],key:(v:T)=>string){const result=new Map(a.map(v=>[key(v),v]));for(const value of b){const id=key(value),l=local.revisions[id],r=incoming.revisions[id];if(!result.has(id)||r&&(!l||r.modifiedAt>l.modifiedAt||r.modifiedAt===l.modifiedAt&&r.hash>l.hash)){result.set(id,value);if(r)revisions[id]=r;}}return [...result.values()];}
 const backup:AppBackup={...local.backup,createdAt:Date.now(),garage:{...local.backup.garage,vehicles:combine(local.backup.garage.vehicles,incoming.backup.garage.vehicles,v=>'vehicle:'+v.id)},places:combine(local.backup.places,incoming.backup.places,v=>'place:'+v.id),routes:combine(local.backup.routes,incoming.backup.routes,v=>'route:'+v.id),rides:combine(local.backup.rides,incoming.backup.rides,v=>'ride:'+v.summary.id)};
 const existing=local.privateData?.associations||[],received=incoming.privateData?.associations||[];
 return {...local,backup,revisions,privateData:{mapKey:local.privateData?.mapKey||incoming.privateData?.mapKey||'',associations:[...existing,...received.filter(a=>!existing.some(v=>v.vehicleId===a.vehicleId))]}};
}
