import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Alert, Platform } from 'react-native';
import { Fix } from '../core/types';
const TASK = 'velunivo-active-navigation-v1';
type Listener = { token: symbol; accept: (fix: Fix) => Promise<void>; error: (message: string) => void };
let listener: Listener | null = null, pending: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>) { const next=pending.then(fn,fn);pending=next.catch(()=>{});return next; }
export function locationFix(p: Location.LocationObject): Fix { return {coordinate:[p.coords.longitude,p.coords.latitude],accuracy:p.coords.accuracy ?? 999,speed:p.coords.speed !== null && p.coords.speed >= 0 && Number.isFinite(p.coords.speed) ? p.coords.speed : null,heading:p.coords.heading !== null && p.coords.heading >= 0 ? p.coords.heading : undefined,timestamp:p.timestamp}; }
if (!TaskManager.isTaskDefined(TASK)) TaskManager.defineTask<{locations:Location.LocationObject[]}>(TASK, async ({data,error}) => {
  const current=listener;
  // Force-quit/restarted sessions never silently resurrect a ride or its recording.
  if (!current) { if(await Location.hasStartedLocationUpdatesAsync(TASK)) await Location.stopLocationUpdatesAsync(TASK);return; }
  if (error) {current.error(error.message);return;}
  for(const p of [...(data?.locations || [])].sort((a,b)=>a.timestamp-b.timestamp)) {
    if(listener!==current)return;
    try {await current.accept(locationFix(p));} catch(e) {current.error(e instanceof Error ? e.message : 'Background guidance update failed');}
  }
});
export async function beginBackgroundLocation(accept: Listener['accept'], error: Listener['error'], isCancelled: () => boolean = () => false) {
  if(!await TaskManager.isAvailableAsync()) throw new Error('Background location needs a native build.');
  let permission=await Location.getBackgroundPermissionsAsync();
  if(permission.status!=='granted') {
    if(Platform.OS==='android') {
      const approved=await new Promise<boolean>(resolve=>Alert.alert('Continue navigation when locked?', 'Allow location all the time in the next system screen so your active ride can update directions and recordings when the app is in the background.', [{text:'Foreground only',style:'cancel',onPress:()=>resolve(false)},{text:'Continue',onPress:()=>resolve(true)}],{cancelable:true,onDismiss:()=>resolve(false)}));
      if(!approved)throw new Error('Background location permission was not granted.');
    }
    permission=await Location.requestBackgroundPermissionsAsync();
  }
  if(isCancelled()) throw new Error('Ride ended before background location started.');
  if(permission.status!=='granted')throw new Error('Allow Always location in device Settings for locked-screen navigation.');
  const token=Symbol('ride');
  await serial(async()=>{
    if(isCancelled()) throw new Error('Ride ended before background location started.');
    if(await Location.hasStartedLocationUpdatesAsync(TASK))await Location.stopLocationUpdatesAsync(TASK);
    listener={token,accept,error};
    try {await Location.startLocationUpdatesAsync(TASK,{accuracy:Location.Accuracy.BestForNavigation,distanceInterval:2,timeInterval:1000,deferredUpdatesInterval:1000,deferredUpdatesDistance:0,activityType:Location.ActivityType.OtherNavigation,pausesUpdatesAutomatically:false,showsBackgroundLocationIndicator:true,foregroundService:{notificationTitle:'Velunivo navigation',notificationBody:'Your ride is active. Open Velunivo to stop navigation.',notificationColor:'#007F6D',killServiceOnDestroy:true}});} catch(e) {if(listener?.token===token)listener=null;throw e;}
  });
  return ()=>serial(async()=>{if(listener?.token!==token)return;listener=null;if(await Location.hasStartedLocationUpdatesAsync(TASK))await Location.stopLocationUpdatesAsync(TASK);});
}
