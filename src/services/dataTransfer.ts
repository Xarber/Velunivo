import {languages} from '../i18n/core';
import {SyncEnvelope,parseSyncEnvelope} from '../core/syncPrivateData';
import {associationStorage} from '../bluetooth/persistence';
import {bluetoothBridge,registry} from '../bluetooth/service';
import {getMapKey,setMapKey} from './mapSettings';
import * as Crypto from 'expo-crypto';
import {portableVehicleIds} from '../core/portableVehicleIds';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';
import {File,Paths} from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import {AppBackup,ImportMode,parseBackup,combineBackups,MAX_BACKUP} from '../core/dataTransfer';
import {restoreGarage} from '../core/vehicles';
import {restorePlaces} from '../core/places';
import {restorePreferences} from '../core/preferences';
import {restoreBluetoothPreferences} from '../bluetooth/preferences';
import {loadSavedRoutes} from './routeLibrary';
import {recordedRides,rideSamples} from './rideHistory';
import {portablePhoto,importPhoto,deletePhoto} from './vehiclePhotos';
import {commitDataEntries,transferableKey} from '../core/dataStorage';
let identity:Promise<string>|undefined;
export function resetTransferIdentity(){identity=undefined;}
function installationId(){return identity??=(async()=>{const key='portable-installation-id-v1';const old=await AsyncStorage.getItem(key);if(old&&/^[a-f0-9]{32}$/.test(old))return old;const value=Array.from(Crypto.getRandomBytes(16),b=>b.toString(16).padStart(2,'0')).join('');await AsyncStorage.setItem(key,value);return value;})();}
export async function exportAppData():Promise<AppBackup>{
 const values=Object.fromEntries(await AsyncStorage.multiGet(['vehicles-v1','profile-v1','places-v1','navigation-v1','ui-language-v1','bluetooth-preferences-v1','routes-v1'])),garage=restoreGarage(values['vehicles-v1'],values['profile-v1']);
 const vehicles=await Promise.all(garage.vehicles.map(async v=>{const photos=await Promise.all((v.photos||[]).map(portablePhoto));return{...v,photo:v.photo?await portablePhoto(v.photo):null,photos};}));
 const rides=await recordedRides();const archive=await Promise.all(rides.map(async summary=>({summary,samples:await rideSamples(summary)})));
 return portableVehicleIds(parseBackup(JSON.stringify({format:'velunivo',schema:1,createdAt:Date.now(),garage:{...garage,vehicles},places:restorePlaces(values['places-v1']),routes:await loadSavedRoutes(values['routes-v1']),rides:archive,navigation:restorePreferences(values['navigation-v1'],garage.vehicles[0]),language:['system',...languages].includes(values['ui-language-v1']||'')?values['ui-language-v1']:'system',bluetooth:restoreBluetoothPreferences(values['bluetooth-preferences-v1'])})),await installationId());
}
let applying=false;
export async function importAppData(incoming:AppBackup,mode:ImportMode){if(applying)throw new Error('A data transfer is already in progress.');applying=true;try{
 const validated=parseBackup(JSON.stringify(incoming)),combined=portableVehicleIds(combineBackups(await exportAppData(),validated,mode),await installationId(),true);
 const createdPhotos:string[]=[],photoCache=new Map<string,string>();const materialize=(photo:string)=>{if(photoCache.has(photo))return photoCache.get(photo)!;const imported=importPhoto(photo);if(imported!==photo)createdPhotos.push(imported);photoCache.set(photo,imported);return imported;};
 try{combined.garage={...combined.garage,vehicles:combined.garage.vehicles.map(v=>({...v,photo:v.photo?materialize(v.photo):null,photos:(v.photos||[]).map(materialize)}))};}catch(error){createdPhotos.forEach(deletePhoto);throw error;}
 const entries:[string,string][]=[['vehicles-v1',JSON.stringify(combined.garage)],['places-v1',JSON.stringify(combined.places)],['navigation-v1',JSON.stringify(combined.navigation)],['ui-language-v1',combined.language],['bluetooth-preferences-v1',JSON.stringify(combined.bluetooth)],['route-library-ids-v2',JSON.stringify(combined.routes.map(r=>r.id))],['ride-history-ids-v1',JSON.stringify(combined.rides.map(r=>r.summary.id))]];
 for(const r of combined.routes)entries.push([`route-library-v2:${r.id}`,JSON.stringify(r)]);
 for(const {summary,samples} of combined.rides){entries.push([`ride-summary-v1:${summary.id}`,JSON.stringify({...summary,chunks:Math.ceil(samples.length/100)})]);for(let n=0;n<samples.length;n+=100)entries.push([`ride-samples-v1:${summary.id}:${n/100}`,JSON.stringify(samples.slice(n,n+100))]);}
 try{await commitDataEntries(AsyncStorage,entries);}catch(error){createdPhotos.forEach(deletePhoto);throw error;}
 }finally{applying=false;}}
export async function pickBackup(){const result=await DocumentPicker.getDocumentAsync({type:['application/json','text/plain'],copyToCacheDirectory:true});if(result.canceled)return null;const asset=result.assets[0];if((asset.size||0)>MAX_BACKUP)throw new Error('This backup is too large. Maximum size is 64 MB.');return parseBackup(Platform.OS==='web'?await(await fetch(asset.uri)).text():await new File(asset.uri).text());}
export async function shareBackup(backup:AppBackup){const text=JSON.stringify(backup),name='velunivo-backup.json';if(Platform.OS==='web'){const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}const file=new File(Paths.cache,name);file.create({overwrite:true});file.write(text);if(!await Sharing.isAvailableAsync())throw new Error('Sharing is unavailable on this device.');await Sharing.shareAsync(file.uri,{mimeType:'application/json',UTI:'public.json'});}

export async function exportSyncData(allowPrivate:boolean):Promise<SyncEnvelope>{
 const backup=await exportAppData();if(!allowPrivate)return {format:'velunivo-device-sync',schema:1,backup};
 const local=restoreGarage(await AsyncStorage.getItem('vehicles-v1'),null),mapping=new Map(local.vehicles.map((v,i)=>[v.id,backup.garage.vehicles[i].id]));
 const associations=(await associationStorage.load()).filter(a=>!a.simulated&&mapping.has(a.vehicleId)).map(a=>({...a,vehicleId:mapping.get(a.vehicleId)!}));
 return parseSyncEnvelope(JSON.stringify({format:'velunivo-device-sync',schema:1,backup,privateData:{associations,mapKey:await getMapKey()}}),true);
}
export async function importSyncData(text:string,mode:ImportMode,allowPrivate:boolean){
 const envelope=parseSyncEnvelope(text,allowPrivate),privateData=envelope.privateData;
 if(privateData?.associations.some(a=>!registry.get(a.pluginId)?.vehicleTypes.includes(a.vehicleType)))throw new Error('Unsupported Bluetooth protocol in sync data.');
 if(!privateData){await importAppData(envelope.backup,mode);return;}
 const previous=await AsyncStorage.multiGet((await AsyncStorage.getAllKeys()).filter(transferableKey)),previousKeys=new Set(previous.map(([key])=>key)),previousAssociations=await associationStorage.load(),previousMapKey=await getMapKey();
 try{
 await importAppData(envelope.backup,mode);
 const restored=portableVehicleIds(envelope.backup,await installationId(),true),mapping=new Map(envelope.backup.garage.vehicles.map((v,i)=>[v.id,restored.garage.vehicles[i].id]));
 const incoming=privateData.associations.map(a=>({...a,vehicleId:mapping.get(a.vehicleId)!})),existing=await associationStorage.load();
 const garage=restoreGarage(await AsyncStorage.getItem('vehicles-v1'),null),validIds=garage.vehicles.map(v=>v.id);
 await bluetoothBridge.disconnect();
 const merged=mode==='overwrite'?incoming:[...existing,...incoming.filter(a=>!existing.some(v=>v.vehicleId===a.vehicleId))];
 for(const old of existing)if(!merged.some(a=>a.vehicleId===old.vehicleId))await bluetoothBridge.forget(old.vehicleId);
 await associationStorage.save(merged.filter(a=>validIds.includes(a.vehicleId)));await bluetoothBridge.initialize();await bluetoothBridge.retainVehicles(validIds);
 if(mode==='overwrite'||(!await getMapKey()&&privateData.mapKey))await setMapKey(privateData.mapKey);
 }catch(error){await bluetoothBridge.disconnect();await AsyncStorage.multiRemove((await AsyncStorage.getAllKeys()).filter(k=>transferableKey(k)&&!previousKeys.has(k)));await AsyncStorage.multiSet(previous.filter((entry):entry is [string,string]=>entry[1]!==null));await associationStorage.save(previousAssociations);await setMapKey(previousMapKey);await bluetoothBridge.initialize();throw error;}
}
