import {Coord,Route,Vehicle} from '../core/types';
import {RoutePreferences} from '../core/routePreferences';
import {fetchRoute} from './api';
const cache=new Map<string,{at:number;request:Promise<Route>}>();
/** Shared across candidate cards; never use straight-line distance as a routed estimate. */
export function returnBatteryRoute(from:Coord,to:Coord,kind:Route['kind'],vehicle:Vehicle,preferences:RoutePreferences){
 const key=JSON.stringify([from,to,kind,vehicle.maxSpeed,vehicle.ridingLimit,preferences]);const old=cache.get(key);if(old&&Date.now()-old.at<300000)return old.request;
 const request=fetchRoute(from,to,kind==='car'?'car':'bike',vehicle);cache.set(key,{at:Date.now(),request});if(cache.size>30)cache.delete(cache.keys().next().value!);void request.catch(()=>{if(cache.get(key)?.request===request)cache.delete(key);});return request;
}
