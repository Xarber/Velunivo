import {RecordedRide} from './recordings';
import {AnalyticsPoint} from './advancedTelemetry';
export function rideInsightTrends(rides:RecordedRide[],vehicleId=''): (AnalyticsPoint & {distanceKm:number;durationMinutes:number})[]{
 return rides.filter(r=>['finished','arrived'].includes(r.status)&&r.samples>=2&&Number.isFinite(r.meters)&&r.meters>0&&Number.isFinite(r.startedAt)&&Number.isFinite(r.endedAt)&&r.endedAt!>r.startedAt&&(!vehicleId||r.vehicle.id===vehicleId))
 .sort((a,b)=>a.startedAt-b.startedAt).map(r=>{
  const durationMinutes=(r.endedAt!-r.startedAt)/60000,battery=r.batteryUsagePercent;
  return {at:r.startedAt,coordinate:r.start??r.preview[0]??[0,0],distanceKm:r.meters/1000,durationMinutes,speedKmh:r.meters/(durationMinutes*60)*3.6,...(battery!==undefined&&Number.isFinite(battery)&&battery>=0&&battery<=100?{battery}:{})};
 });
}
