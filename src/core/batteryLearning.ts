import {automaticBatteryUsage} from '../bluetooth/tripTelemetry';
import { RecordedRide } from './recordings';
import { Vehicle } from './types';
/** Public fleet vehicles have variable batteries and must never request manual feedback. */
export const canAskBatteryUsage = (vehicle: Pick<Vehicle, 'id'>, enabled: boolean) => enabled && vehicle.id !== 'sharing-scooter';
export const validBatteryUsage = (percent: number) => Number.isFinite(percent) && percent >= 0 && percent <= 100;
/** Percentage points of full charge consumed, not percentage of the starting charge. */
export function learnedBatteryRange(rides: RecordedRide[], vehicle: Pick<Vehicle, 'id'>, context?:{mode?:string;voltage?:number}) {
  let reports = rides.filter(r => r.vehicle.id === vehicle.id && !r.bluetooth?.simulated && ['finished','arrived'].includes(r.status) && r.batteryFeedback === 'answered' && validBatteryUsage(r.batteryUsagePercent!) && r.batteryUsagePercent! >= 1 && Number.isFinite(r.meters) && r.meters >= 500).slice(0,20);
  const matched=reports.filter(r=>{
    const modes=Object.entries(r.energy?.modeSeconds??{}).sort((a,b)=>b[1]-a[1]);
    return (!context?.mode||modes[0]?.[0]===context.mode)&&(!context?.voltage||r.energy?.meanVoltage===undefined||Math.abs(r.energy.meanVoltage-context.voltage)/context.voltage<.1);
  });
  if(matched.length>=3)reports=matched;
  if (reports.length < 3) return null;
  const meters = reports.reduce((n,r) => n+r.meters,0), percent = reports.reduce((n,r) => {
    const climb=r.energy?.ascentMeters,capacity=r.vehicle.batteryWh;
    const hill=climb!==undefined&&capacity? (r.vehicle.totalMassKg??100)*9.81*climb/3600/.75/capacity*100:0;
    return n+Math.max(r.batteryUsagePercent!*.25,r.batteryUsagePercent!-hill);
  },0);
  const referenceSpeedKmh=reports.reduce((sum,r)=>sum+r.meters*(r.energy?.movingSpeedKmh ?? Math.min(r.vehicle.maxSpeed,r.vehicle.ridingLimit)*(r.vehicle.cruiseFactor??.78)),0)/meters;
  return { rangeKm: meters / 1000 / percent * 100, count: reports.length,referenceSpeedKmh };
}
export function pendingBatteryRide(rides: RecordedRide[]) {
  return rides.find(r => ['finished','arrived','interrupted'].includes(r.status) && !r.bluetoothConnected && !r.bluetooth?.connected && !(r.bluetooth && !r.bluetooth.simulated) && r.batteryFeedback === 'pending' && canAskBatteryUsage(r.vehicle, true) && r.samples >= 2);
}

/** Persist range only after ten real battery rides with enough discharge and stable rates. */
export function confidentBluetoothRange(rides:RecordedRide[],vehicle:Pick<Vehicle,'id'>){
 if(vehicle.id==='sharing-scooter')return null;
 const reports=rides.filter(r=>r.vehicle.id===vehicle.id && ['finished','arrived'].includes(r.status)&&r.batteryUsageSource==='bluetooth'&&automaticBatteryUsage(r.bluetooth,r.endedAt??r.lastFixAt??r.startedAt)!==null&&!r.bluetooth?.simulated&&validBatteryUsage(r.batteryUsagePercent!)&&r.batteryUsagePercent!>=2&&r.meters>=500).slice(0,30);
 if(reports.length<10||reports.reduce((n,r)=>n+r.batteryUsagePercent!,0)<50)return null;
 const rates=reports.map(r=>r.batteryUsagePercent!/(r.meters/1000)),mean=rates.reduce((a,b)=>a+b,0)/rates.length;
 const variation=Math.sqrt(rates.reduce((n,v)=>n+(v-mean)**2,0)/rates.length)/mean;
 if(variation>.25)return null;
 return learnedBatteryRange(reports,vehicle);
}
