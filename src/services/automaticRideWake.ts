// SPDX-License-Identifier: AGPL-3.0-only
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {t} from '../i18n/core';
import {Platform} from 'react-native';
import {bluetoothBridge} from '../bluetooth/service';
import {AutomaticRideDetector} from '../core/automaticRide';
import {notifyRideEvent} from './localNotifications';
import {isRideLocked} from './rideLock';
const TASK='velunivo-bluetooth-ride-wake-v1';
let checking=false,generation=0,pending:Promise<unknown>=Promise.resolve();
function serialize<T>(run:()=>Promise<T>){const next=pending.then(run,run);pending=next.catch(()=>{});return next;}
/** A geofence exit can wake an OS-terminated iOS process. It is only a hint:
 * a fresh authenticated Bluetooth speed is still required before notifying. */
if(!TaskManager.isTaskDefined(TASK))TaskManager.defineTask<{eventType:Location.GeofencingEventType}>(TASK,async({data,error})=>{
 if(error||data?.eventType!==Location.GeofencingEventType.Exit||checking||isRideLocked())return;
 checking=true;let release:(()=>void)|undefined;
 try{
  const [consent,raw,vehicleId]=await AsyncStorage.multiGet(['automatic-ride-consent-v1','navigation-v1','automatic-ride-vehicle-v1']);
  const settings=raw[1]?JSON.parse(raw[1]):{};
  if(consent[1]!=='true'||!settings.autoBluetoothRecording||!vehicleId[1])return;
  const previous=Number(await AsyncStorage.getItem('automatic-ride-alert-at-v1'))||0;
  if(Date.now()-previous<5*60*1000)return;
  await bluetoothBridge.initialize();
  // No picker, registration or pairing: acquire only an existing association.
  if(!bluetoothBridge.association(vehicleId[1]))return;
  release=bluetoothBridge.acquire(vehicleId[1]);
  const detector=new AutomaticRideDetector();
  const found=await new Promise<boolean>(resolve=>{
   let done=false;const timer=setTimeout(()=>finish(false),20000);
   const finish=(value:boolean)=>{if(done)return;done=true;clearTimeout(timer);unsubscribe();resolve(value);};
   const inspect=()=>{if(detector.accept(bluetoothBridge.getSnapshot(),vehicleId[1]!,Date.now()))finish(true);};
   const unsubscribe=bluetoothBridge.subscribe(inspect);inspect();
  });
  if(!found||isRideLocked())return;
  // Re-read revocation before sending. Headless wake cannot rely on a mounted
  // React recorder, so use the honest notification fallback, not fake recording.
  if(await AsyncStorage.getItem('automatic-ride-consent-v1')!=='true')return;
  const queued=await notifyRideEvent('bluetooth-ride-detected','Looks like you’re riding',t('Tap to start recording your Bluetooth ride.'),'velunivo:///offline/record-trip');
  if(queued)await AsyncStorage.setItem('automatic-ride-alert-at-v1',String(Date.now()));
 }catch{/* Optional wake must never launch pairing or crash the background task. */}
 finally{release?.();checking=false;}
});
export function armAutomaticRideWake(vehicleId:string,coordinate?:readonly [number,number]){
 const token=generation;return serialize(async()=>{
 if(Platform.OS!=='ios'||!(await Location.getBackgroundPermissionsAsync()).granted)return;
 const fix=coordinate?{coords:{longitude:coordinate[0],latitude:coordinate[1]}}:await Location.getLastKnownPositionAsync({maxAge:60000,requiredAccuracy:100});
 if(!fix||token!==generation||await AsyncStorage.getItem('automatic-ride-consent-v1')!=='true')return;
 await AsyncStorage.setItem('automatic-ride-vehicle-v1',vehicleId);
 await Location.startGeofencingAsync(TASK,[{identifier:'connected-vehicle-departure',latitude:fix.coords.latitude,longitude:fix.coords.longitude,radius:200,notifyOnEnter:false,notifyOnExit:true}]);
 });
}
export function stopAutomaticRideWake(){
 generation++;return serialize(async()=>{
 if(Platform.OS==='web')return;
 if(await Location.hasStartedGeofencingAsync(TASK))await Location.stopGeofencingAsync(TASK);
 await AsyncStorage.removeItem('automatic-ride-vehicle-v1');
 });
}
