// SPDX-License-Identifier: AGPL-3.0-only
import {migrateCredentialProtection} from '../core/credentialProtection';
import * as SecureStore from 'expo-secure-store';
import { AssociationStorage } from './bridge';
import { Association } from './types';
// Per-vehicle entries avoid SecureStore's historical per-value size limits. Index and device IDs remain private.
const index='velunivo-ble-associations-v1',key=(id:string)=>`velunivo-ble-${id.replace(/[^a-zA-Z0-9_.-]/g,'_')}`;
const secureStorage:AssociationStorage={async load(){const ids:string[]=JSON.parse(await SecureStore.getItemAsync(index)||'[]');const records=await Promise.all(ids.map(id=>SecureStore.getItemAsync(key(id))));return records.flatMap(raw=>{try{const a:Association=JSON.parse(raw||'null');if(!a || a.schema!==1 || typeof a.vehicleId!=='string' || typeof a.device?.id!=='string')return [];return [{...a,device:{...a.device,manufacturerData:a.device.manufacturerData?Uint8Array.from(Object.values(a.device.manufacturerData)):undefined}}];}catch{return [];}});},async save(records){const old:string[]=JSON.parse(await SecureStore.getItemAsync(index)||'[]');for(const a of records)await SecureStore.setItemAsync(key(a.vehicleId),JSON.stringify({...a,device:{...a.device,serviceData:undefined}}),await accessibility());await SecureStore.setItemAsync(index,JSON.stringify(records.map(a=>a.vehicleId)),await accessibility());for(const id of old)if(!records.some(a=>a.vehicleId===id))await SecureStore.deleteItemAsync(key(id));}};

// Only this local consent controls accessibility and file export; never synchronized.
const consentKey='velunivo-ble-locked-access-v1';
export async function lockedCredentialAccessEnabled(){return await SecureStore.getItemAsync(consentKey)==='true';}
async function accessibility(){return {keychainAccessible:await lockedCredentialAccessEnabled()?SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY:SecureStore.WHEN_UNLOCKED};}
let pending:Promise<unknown>=Promise.resolve();
function serialized<T>(work:()=>Promise<T>):Promise<T>{const next=pending.then(work,work);pending=next.catch(()=>{});return next;}
export const associationStorage:AssociationStorage={load:()=>serialized(()=>secureStorage.load()),save:records=>serialized(()=>secureStorage.save(records))};
export function setLockedCredentialAccess(enabled:boolean){return serialized(async()=>{
 const previous=await lockedCredentialAccessEnabled(),records=await secureStorage.load();
 if(previous===enabled)return;
 const rewrite=async(value:boolean)=>{const options={keychainAccessible:value?SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY:SecureStore.WHEN_UNLOCKED};for(const a of records)await SecureStore.setItemAsync(key(a.vehicleId),JSON.stringify({...a,device:{...a.device,serviceData:undefined}}),options);await SecureStore.setItemAsync(index,JSON.stringify(records.map(a=>a.vehicleId)),options);};
 await migrateCredentialProtection(previous,enabled,rewrite,value=>SecureStore.setItemAsync(consentKey,String(value),{keychainAccessible:SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY}));
 });}
