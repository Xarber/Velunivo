import {canonicalJson} from './canonicalJson';
import {mergeSettingEdits,applySettingEdits,legacySettingEdits} from './syncSettings';
import {SyncEnvelope} from './syncPrivateData';
import {combineBackups,AppBackup} from './dataTransfer';
export interface ItemRevision {hash:string;modifiedAt:number;deleted?:boolean;}
export type Revisions=Record<string,ItemRevision>;
export interface AutomaticEnvelope extends SyncEnvelope {revisions:Revisions;}
/** Private key edits include explicit removal. Untouched defaults never erase configured keys. */
export function mergePrivateMapKey(a:SyncEnvelope['privateData'],b:SyncEnvelope['privateData']) {
 const left=a?.mapKeyEdit?.modifiedAt??(a?.mapKey?0:-1),right=b?.mapKeyEdit?.modifiedAt??(b?.mapKey?0:-1);
 const selected=right>left||right===left&&(b?.mapKey||'')>(a?.mapKey||'')?b:a;
 return {mapKey:selected?.mapKey||'',...(selected?.mapKeyEdit?{mapKeyEdit:selected.mapKeyEdit}:{})};
}
export function syncItems(backup:AppBackup){return [...backup.garage.vehicles.map(v=>['vehicle:'+v.id,v] as const),...backup.places.map(v=>['place:'+v.id,v] as const),...backup.routes.map(v=>['route:'+v.id,v] as const),...backup.rides.map(v=>['ride:'+v.summary.id,v] as const)];}
/** Tombstones participate in the same deterministic ordering as entity edits. */
export function automaticMerge(local:AutomaticEnvelope,incoming:AutomaticEnvelope):AutomaticEnvelope{
 const revisions:Revisions={...local.revisions};
 for(const [id,r] of Object.entries(incoming.revisions)){const l=revisions[id];if(!l||r.modifiedAt>l.modifiedAt||r.modifiedAt===l.modifiedAt&&(r.deleted&&!l.deleted||r.deleted===l.deleted&&r.hash>l.hash))revisions[id]=r;}
 function combine<T>(a:T[],b:T[],key:(v:T)=>string){const left=new Map(a.map(v=>[key(v),v])),right=new Map(b.map(v=>[key(v),v])),result:T[]=[];for(const id of new Set([...left.keys(),...right.keys()])){const winner=revisions[id];if(winner?.deleted&&id!=='vehicle:sharing-scooter')continue;const fromRight=winner===incoming.revisions[id],value=(fromRight?right.get(id):left.get(id))??left.get(id)??right.get(id);if(value)result.push(value);}return result;}
 const settings=mergeSettingEdits(legacySettingEdits(local.backup,local.settings),legacySettingEdits(incoming.backup,incoming.settings));
 const backup:AppBackup={...combineBackups(local.backup,incoming.backup,'merge'),createdAt:Math.max(local.backup.createdAt,incoming.backup.createdAt),garage:{...local.backup.garage,vehicles:combine(local.backup.garage.vehicles,incoming.backup.garage.vehicles,v=>'vehicle:'+v.id)},places:combine(local.backup.places,incoming.backup.places,v=>'place:'+v.id),routes:combine(local.backup.routes,incoming.backup.routes,v=>'route:'+v.id),rides:combine(local.backup.rides,incoming.backup.rides,v=>'ride:'+v.summary.id)};
 if(!backup.garage.vehicles.some(v=>v.id===backup.garage.activeId))backup.garage.activeId=backup.garage.vehicles[0].id;
 const existing=local.privateData?.associations||[],received=incoming.privateData?.associations||[],associations=new Map<string,typeof existing[number]>();for(const association of [...existing,...received]){const old=associations.get(association.vehicleId);if(!old||association.associatedAt>old.associatedAt||association.associatedAt===old.associatedAt&&canonicalJson(association)>canonicalJson(old))associations.set(association.vehicleId,association);}
 return {...local,backup:applySettingEdits(backup,settings),settings,revisions,privateData:{...mergePrivateMapKey(local.privateData,incoming.privateData),associations:[...associations.values()].filter(a=>backup.garage.vehicles.some(v=>v.id===a.vehicleId))}};
}

export function syncDigestPayload(data:AutomaticEnvelope){return {items:syncItems(data.backup).sort(([a],[b])=>a<b?-1:a>b?1:0),settings:data.settings,scratch:data.backup.scratch,exploration:data.backup.exploration?{...data.backup.exploration,achievements:[...data.backup.exploration.achievements].sort()}:undefined,privateData:data.privateData?{...data.privateData,associations:[...data.privateData.associations].sort((a,b)=>a.vehicleId.localeCompare(b.vehicleId))}:undefined,revisions:data.revisions};}
