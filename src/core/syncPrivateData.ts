import {Association} from '../bluetooth/types';
import {AppBackup,parseBackup,MAX_BACKUP} from './dataTransfer';
import {canPairVehicle} from '../bluetooth/policy';
export interface SyncEnvelope {format:'velunivo-device-sync';schema:1;backup:AppBackup;privateData?:{associations:Association[];mapKey:string};}
/** This format is never accepted by file import and is never generated for public signaling. */
export function parseSyncEnvelope(text:string,allowPrivate:boolean):SyncEnvelope{
 if(text.length>MAX_BACKUP)throw new Error('This backup is too large. Maximum size is 64 MB.');
 const raw=JSON.parse(text) as SyncEnvelope;
 if(raw?.format!=='velunivo-device-sync'||raw.schema!==1)throw new Error('This is not a valid Velunivo backup.');
 const backup=parseBackup(JSON.stringify(raw.backup));
 if(!raw.privateData)return {format:raw.format,schema:1,backup};
 if(!allowPrivate)throw new Error('Private data cannot be transferred through a public server.');
 const {associations,mapKey}=raw.privateData;
 if(typeof mapKey!=='string'||(mapKey!==''&&!/^[a-zA-Z0-9_-]{10,200}$/.test(mapKey))||!Array.isArray(associations)||associations.length>1000)throw new Error('Invalid private sync data.');
 const seen=new Set<string>();
 for(const a of associations){const vehicle=backup.garage.vehicles.find(v=>v.id===a.vehicleId);
 if(!vehicle||!canPairVehicle(a.vehicleId)||a.schema!==1||a.simulated||a.pluginId!=='xiaomi-m365-v1'||a.vehicleType!=='electric_scooter'||vehicle.kind!=='escooter'||typeof a.device?.id!=='string'||a.device.id.length>200||!Array.isArray(a.device.services)||a.device.services.some(s=>typeof s!=='string'||s.length>100)||typeof a.identity?.model!=='string'||!Number.isFinite(a.associatedAt)||seen.has(a.vehicleId)||Object.entries(a.credentials||{}).some(([k,v])=>!/^[a-zA-Z0-9_-]{1,80}$/.test(k)||typeof v!=='string'||v.length>2000))throw new Error('Invalid Bluetooth association in sync data.');
 seen.add(a.vehicleId);
 }
 return {format:raw.format,schema:1,backup,privateData:{associations,mapKey}};
}
