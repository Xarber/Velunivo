import { BridgeSnapshot, Telemetry } from './types';
import { freshReading } from './telemetry';
export interface TripBluetooth { vehicleId:string;pluginId:string;simulated:boolean;fields:Telemetry;state:BridgeSnapshot['state'];timestamp:number; }
export interface TripBluetoothSummary { schema:1;connected?:boolean;batteryGap?:boolean;simulated?:boolean;pluginId:string;startBattery?:number;endBattery?:number;startAt?:number;endAt?:number;chargedOrInconsistent:boolean;interrupted:boolean;lastAt?:number;lastState?:string;interruptions:number; }
export function sampleBluetooth(snapshot:BridgeSnapshot,vehicleId:string,now:number):TripBluetooth|undefined {if(snapshot.vehicleId!==vehicleId || !snapshot.pluginId)return;const fields:Telemetry={};for(const key of Object.keys(snapshot.fields) as (keyof Telemetry)[]){const r=freshReading(snapshot.fields,key,now,false);if(r)fields[key]=r;}return {vehicleId,pluginId:snapshot.pluginId,simulated:!!snapshot.simulated,fields,state:snapshot.state,timestamp:now};}
export function updateTripBluetooth(previous:TripBluetoothSummary|undefined,sample:TripBluetooth,startedAt:number):TripBluetoothSummary {
 const out:TripBluetoothSummary=previous?{...previous}:{schema:1,pluginId:sample.pluginId,chargedOrInconsistent:false,interrupted:false,interruptions:0};
 if(sample.simulated)out.simulated=true;
 if(sample.state==='connected' && !sample.simulated)out.connected=true;
 if(out.pluginId!==sample.pluginId || sample.simulated)out.chargedOrInconsistent=true;
 if(sample.state!=='connected' && out.lastState==='connected'){out.interrupted=true;out.interruptions++;}out.lastState=sample.state;
 const battery=freshReading(sample.fields,'batteryPercent',sample.timestamp,!sample.simulated),charging=freshReading(sample.fields,'charging',sample.timestamp,!sample.simulated);
 if(charging?.value===true)out.chargedOrInconsistent=true;
 if(battery && typeof battery.value==='number'){
  if(out.lastAt && battery.timestamp-out.lastAt>30000){out.interrupted=true;out.batteryGap=true;}
  if(out.startBattery===undefined && battery.timestamp-startedAt>=-30000 && battery.timestamp-startedAt<=15000){out.startBattery=battery.value;out.startAt=battery.timestamp;}
  if(out.endBattery!==undefined && battery.value>out.endBattery)out.chargedOrInconsistent=true;
  out.endBattery=battery.value;out.endAt=battery.timestamp;out.lastAt=battery.timestamp;
 }
 return out;
}
export function automaticBatteryUsage(summary:TripBluetoothSummary|undefined,endedAt:number){if(!summary || summary.simulated || summary.startBattery===undefined || summary.endBattery===undefined || summary.endAt===undefined || summary.startAt===undefined || summary.endAt-summary.startAt<10000 || endedAt-summary.endAt>30000 || summary.chargedOrInconsistent || summary.batteryGap || endedAt<summary.endAt || summary.startBattery<0 || summary.startBattery>100 || summary.endBattery<0 || summary.endBattery>100)return null;const used=summary.startBattery-summary.endBattery;return Number.isFinite(used) && used>=0 && used<=100?used:null;}
