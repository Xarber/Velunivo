import { automaticBatteryUsage, updateTripBluetooth } from '../bluetooth/tripTelemetry';
import { freshReading } from '../bluetooth/telemetry';
import type { RecordedRide, RideSample } from './recordings';
import { distance } from './geo';
export interface BatteryInterval {fromAt:number;toAt:number;percent:number;meters:number;movingSpeedKmh?:number;mode?:string;meanVoltage?:number;ascentMeters?:number;descentMeters?:number;}
export interface RideEnergy {
  schema:1;batteryIntervals?:BatteryInterval[]; movingSpeedKmh?:number; movingSeconds:number; modeSeconds:Record<string,number>;
  meanVoltage?:number; startVoltage?:number; endVoltage?:number; measuredWh?:number;powerCoverageSeconds?:number;
  ascentMeters?:number; descentMeters?:number; batteryPercentPerKm?:number;
}
/** Reprocess original timestamped readings, never infer absent vehicle or elevation data. */
export function analyzeRideEnergy(ride:RecordedRide,samples:RideSample[]):RecordedRide {
 if(ride.status==='recording')return ride;
 const energy:RideEnergy={schema:1,movingSeconds:0,modeSeconds:{}};
 let bluetooth:RecordedRide['bluetooth'],speedSum=0,voltageSum=0,voltageSeconds=0,powerSeconds=0,wh=0;
 let altitude: number|undefined,ascent=0,descent=0,elevationPoints=0;
 let traveled=0,previousPoint:RideSample['fix']|undefined;
 let anchor:{battery:number;at:number;meters:number;speedSum:number;seconds:number;voltageSum:number;voltageSeconds:number;ascent:number;descent:number;mode?:string;mixedMode:boolean}|undefined;
 const ordered=[...samples].sort((a,b)=>a.fix.timestamp-b.fix.timestamp);
 for(let i=0;i<ordered.length;i++){
  const sample=ordered[i],bt=sample.bluetooth;
  if(bt && bt.vehicleId===ride.vehicle.id && !bt.simulated)bluetooth=updateTripBluetooth(bluetooth,bt,ride.startedAt);
  const dt=i? (sample.fix.timestamp-ordered[i-1].fix.timestamp)/1000:0;
  const continuous=dt>0&&dt<=15&&!sample.breakBefore;
  const read=(key:Parameters<typeof freshReading>[1])=>bt&&!bt.simulated&&bt.vehicleId===ride.vehicle.id&&bt.state==='connected'?freshReading(bt.fields,key,sample.fix.timestamp,true):undefined;
  const number=(key:Parameters<typeof freshReading>[1])=>{const r=read(key);return typeof r?.value==='number'&&Number.isFinite(r.value)?r.value:undefined;};
  if(!continuous&&i)anchor=undefined;
  const voltage=number('voltage');if(voltage!==undefined){energy.startVoltage??=voltage;energy.endVoltage=voltage;if(continuous){voltageSum+=voltage*dt;voltageSeconds+=dt;}}
  const mode=read('ridingMode');if(anchor&&typeof mode?.value==='string'&&anchor.mode!==mode.value)anchor.mixedMode=true;if(continuous&&typeof mode?.value==='string')energy.modeSeconds[mode.value]=(energy.modeSeconds[mode.value]??0)+dt;
  const speed=number('speed')??sample.fix.speed;
  if(continuous&&typeof speed==='number'&&speed>.5&&speed<55){speedSum+=speed*3.6*dt;energy.movingSeconds+=dt;}
  // Only explicit vehicle electrical power: current sign conventions vary by protocol.
  const power=number('power');if(continuous&&power!==undefined&&power>=0&&power<=45000){wh+=power*dt/3600;powerSeconds+=dt;}
  const fix=sample.pathFix===undefined?sample.fix:sample.pathFix;
  if(!continuous)altitude=undefined;
  if(fix&&Number.isFinite(fix.altitude)&&Number.isFinite(fix.altitudeAccuracy)&&fix.altitudeAccuracy!>=0&&fix.altitudeAccuracy!<=10){
   elevationPoints++;const z=fix.altitude!;
   if(altitude===undefined)altitude=z;
   else if(i&&distance(ordered[i-1].fix.coordinate,fix.coordinate)>=2){const change=z-altitude,threshold=Math.max(5,fix.altitudeAccuracy!*2);if(Math.abs(change)>=threshold){if(change>0)ascent+=change;else descent-=change;altitude=z;}}
  }
  if(fix){if(previousPoint&&continuous)traveled+=distance(previousPoint.coordinate,fix.coordinate);previousPoint=fix;}else if(!continuous)previousPoint=undefined;
  const battery=number('batteryPercent');
  if(battery!==undefined){
   if(anchor&&battery!==anchor.battery){
    const percent=anchor.battery-battery,seconds=energy.movingSeconds-anchor.seconds,vSeconds=voltageSeconds-anchor.voltageSeconds;
    if(percent>0&&percent<=100){energy.batteryIntervals??=[];if(energy.batteryIntervals.length<512)energy.batteryIntervals.push({fromAt:anchor.at,toAt:sample.fix.timestamp,percent,meters:Math.max(0,traveled-anchor.meters),movingSpeedKmh:seconds?(speedSum-anchor.speedSum)/seconds:undefined,mode:anchor.mixedMode?undefined:anchor.mode,meanVoltage:vSeconds?(voltageSum-anchor.voltageSum)/vSeconds:undefined,...(elevationPoints>=2?{ascentMeters:ascent-anchor.ascent,descentMeters:descent-anchor.descent}:{})});}
    anchor=undefined;
   }
   anchor??={battery,at:sample.fix.timestamp,meters:traveled,speedSum,seconds:energy.movingSeconds,voltageSum,voltageSeconds,ascent,descent,mode:typeof mode?.value==='string'?mode.value:undefined,mixedMode:false};
  }

 }
 if(energy.movingSeconds)energy.movingSpeedKmh=speedSum/energy.movingSeconds;
 if(voltageSeconds)energy.meanVoltage=voltageSum/voltageSeconds;
 if(powerSeconds){energy.measuredWh=wh;energy.powerCoverageSeconds=powerSeconds;}
 if(elevationPoints>=2){energy.ascentMeters=ascent;energy.descentMeters=descent;}
 if(bluetooth && ride.bluetooth && !ride.bluetooth.simulated)bluetooth={...ride.bluetooth,...bluetooth,startBattery:ride.bluetooth.startAt!==undefined&&(bluetooth.startAt===undefined||ride.bluetooth.startAt<bluetooth.startAt)?ride.bluetooth.startBattery:bluetooth.startBattery,startAt:bluetooth.startAt===undefined?ride.bluetooth.startAt:ride.bluetooth.startAt===undefined?bluetooth.startAt:Math.min(bluetooth.startAt,ride.bluetooth.startAt),endBattery:ride.bluetooth.endAt!==undefined&&(bluetooth.endAt===undefined||ride.bluetooth.endAt>bluetooth.endAt)?ride.bluetooth.endBattery:bluetooth.endBattery,endAt:bluetooth.endAt===undefined?ride.bluetooth.endAt:ride.bluetooth.endAt===undefined?bluetooth.endAt:Math.max(bluetooth.endAt,ride.bluetooth.endAt),chargedOrInconsistent:bluetooth.chargedOrInconsistent||ride.bluetooth.chargedOrInconsistent};
 bluetooth??=ride.bluetooth;
 const used=automaticBatteryUsage(bluetooth,ride.endedAt??ride.lastFixAt??ride.startedAt);
 const realBluetooth=ride.bluetoothConnected||(!!bluetooth&&!bluetooth.simulated);
 const result:RecordedRide={...ride,bluetooth,energy,energyAnalysisVersion:2};
 if(used!==null){result.batteryUsagePercent=used;result.batteryUsageSource='bluetooth';result.batteryFeedback='answered';}
 else if(realBluetooth){if(result.batteryUsageSource==='bluetooth'){delete result.batteryUsagePercent;delete result.batteryUsageSource;result.batteryFeedback='skipped';}else if(result.batteryFeedback==='pending')result.batteryFeedback='skipped';}
 if(result.batteryFeedback==='answered'&&Number.isFinite(result.batteryUsagePercent)&&ride.meters>0)energy.batteryPercentPerKm=result.batteryUsagePercent!/(ride.meters/1000);
 return result;
}
