// SPDX-License-Identifier: AGPL-3.0-only
import type {Association} from '../bluetooth/types';
import type {Garage} from './vehicles';
export function validateBackupPairing(value:unknown,garage:Garage):Association[]|undefined {
 if(value===undefined)return undefined;
 if(!Array.isArray(value)||value.length>1000)throw new Error('Invalid scooter pairing backup.');
 const seen=new Set<string>();
 for(const a of value){const vehicle=garage.vehicles.find(v=>v.id===a?.vehicleId);
 if(!vehicle||a.vehicleId==='sharing-scooter'||vehicle.kind!=='escooter'||a.schema!==1||a.simulated||a.pluginId!=='xiaomi-m365-v1'||a.vehicleType!=='electric_scooter'||typeof a.device?.id!=='string'||!a.device.id||a.device.id.length>200||!Array.isArray(a.device.services)||a.device.services.some((s:unknown)=>typeof s!=='string'||s.length>100)||typeof a.identity?.model!=='string'||!Number.isFinite(a.associatedAt)||seen.has(a.vehicleId)||!a.credentials||typeof a.credentials!=='object'||Array.isArray(a.credentials)||Object.entries(a.credentials).some(([k,v])=>!/^[a-zA-Z0-9_-]{1,80}$/.test(k)||typeof v!=='string'||v.length>2000))throw new Error('Invalid scooter pairing backup.');seen.add(a.vehicleId);}
 return value;
}
