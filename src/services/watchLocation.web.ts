import type * as Location from 'expo-location';
import {browserLocationTimestamp} from './browserLocationTimestamp';
/** Safari may stop issuing watch callbacks while stationary. Keep the watch and recover independently. */
export async function watchLocation(_options:Parameters<typeof Location.watchPositionAsync>[0],receive:(p:Location.LocationObject)=>void,error?:(message:string)=>void):Promise<Location.LocationSubscription>{
 let closed=false,requestToken=0,pendingUntil=0,lastDelivery=0;const options={enableHighAccuracy:true,maximumAge:0,timeout:12000};
 const success=(p:GeolocationPosition)=>{if(closed)return;lastDelivery=Date.now();receive({timestamp:browserLocationTimestamp(p.timestamp),coords:{latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy,altitude:p.coords.altitude,altitudeAccuracy:p.coords.altitudeAccuracy,heading:p.coords.heading,speed:p.coords.speed}});};
 const failure=(e:GeolocationPositionError)=>{if(!closed)error?.(e.code===1?'Location permission denied':e.message||'GPS unavailable');};
 const id=navigator.geolocation.watchPosition(success,failure,options);
 const recover=()=>{const now=Date.now();if(closed||document.visibilityState==='hidden'||now<pendingUntil||now-lastDelivery<8000)return;const token=++requestToken;pendingUntil=now+14000;navigator.geolocation.getCurrentPosition(p=>{if(token!==requestToken||closed)return;pendingUntil=0;success(p);},e=>{if(token!==requestToken||closed)return;pendingUntil=0;failure(e);},options);};
 const timer=setInterval(recover,5000);document.addEventListener('visibilitychange',recover);
 return {remove(){closed=true;requestToken++;clearInterval(timer);document.removeEventListener('visibilitychange',recover);navigator.geolocation.clearWatch(id);}};
}
