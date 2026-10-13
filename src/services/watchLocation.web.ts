import type * as Location from 'expo-location';
import {browserLocationTimestamp} from './browserLocationTimestamp';
/** Expo's native accuracy enum is not the browser's enableHighAccuracy option. */
export async function watchLocation(_options:Parameters<typeof Location.watchPositionAsync>[0],receive:(p:Location.LocationObject)=>void,error?:(message:string)=>void):Promise<Location.LocationSubscription>{
 let closed=false,pending=false;const options={enableHighAccuracy:true,maximumAge:0,timeout:15000};
 const success=(p:GeolocationPosition)=>{if(!closed)receive({timestamp:browserLocationTimestamp(p.timestamp),coords:{latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy,altitude:p.coords.altitude,altitudeAccuracy:p.coords.altitudeAccuracy,heading:p.coords.heading,speed:p.coords.speed}});};
 const failure=(e:GeolocationPositionError)=>{if(!closed)error?.(e.code===1?'Location permission denied':e.message||'GPS unavailable');};
 const id=navigator.geolocation.watchPosition(success,failure,options);
 const timer=setInterval(()=>{if(closed||pending||document.visibilityState==='hidden')return;pending=true;navigator.geolocation.getCurrentPosition(p=>{pending=false;success(p);},e=>{pending=false;failure(e);},options);},10000);
 return {remove(){closed=true;clearInterval(timer);navigator.geolocation.clearWatch(id);}};
}
