import type {BridgeSnapshot} from '../bluetooth/types';
import {freshReading} from '../bluetooth/telemetry';
import {Route,Vehicle} from './types';
import {routeEnergy} from './energy';
export function batteryPlan(route:Route,vehicle:Vehicle,available:number|null,reserve=15,returnTrip=false,returnRoute?:Route){
 const outbound=routeEnergy(route,vehicle);if(!outbound||vehicle.id==='sharing-scooter')return null;
 const reverse=returnTrip?routeEnergy(returnRoute??{...route,coordinates:[...route.coordinates].reverse(),elevation:route.elevation?[...route.elevation].reverse():undefined},vehicle):null;
 const needed=outbound.percent+(reverse?.percent??0),charge=available!==null&&Number.isFinite(available)&&available>=0&&available<=100?available:null;
 const margin=Math.max(0,Math.min(50,reserve));return {needed,returnNeeded:reverse?.percent??0,available:charge,reserve:margin,remaining:charge===null?null:charge-needed,warning:charge===null?needed+margin>100:needed+margin>charge,returnTrip,learned:!!vehicle.learnedRangeKm};
}

export function connectedPlanningCharge(snapshot:BridgeSnapshot,vehicleId:string,now=Date.now()):number|null{if(vehicleId==='sharing-scooter'||snapshot.vehicleId!==vehicleId||snapshot.state!=='connected'||snapshot.simulated)return null;const r=freshReading(snapshot.fields,'batteryPercent',now);return typeof r?.value==='number'&&r.value>=0&&r.value<=100?r.value:null;}
