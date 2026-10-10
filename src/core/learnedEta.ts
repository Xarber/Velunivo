import { RecordedRide, RideSample } from './recordings';
import { Vehicle } from './types';
import { distance } from './geo';
export interface RidePace { id: string; vehicleId: string; cap: number; meters: number; seconds: number; }
// Retain stops, exclude inaccurate fixes, jumps and paused/background gaps.
export function measuredPace(ride: RecordedRide, samples: RideSample[]): RidePace | null {
  if (!['finished','arrived'].includes(ride.status)) return null;
  let meters = 0, seconds = 0;
  const cap = Math.min(ride.vehicle.maxSpeed, ride.vehicle.ridingLimit);
  for (let i = 1; i < samples.length; i++) { const a = samples[i-1].fix, b = samples[i].fix, dt = (b.timestamp-a.timestamp)/1000;
    if (![a.accuracy,b.accuracy].every(x => Number.isFinite(x) && x >= 0 && x <= 35) || dt <= 0 || dt > 15) continue;
    const d = distance(a.coordinate,b.coordinate);
    if (!Number.isFinite(d) || d/dt*3.6 > Math.max(60,cap*1.8)) continue;
    meters += d; seconds += dt;
  }
  return meters >= 200 && seconds >= 60 && meters/seconds*3.6 >= 2 ? {id:ride.id,vehicleId:ride.vehicle.id,cap,meters,seconds} : null;
}
export function learnedPace(records: RidePace[], vehicle: Vehicle) {
 const cap = Math.min(vehicle.maxSpeed,vehicle.ridingLimit);
 const recent = records.filter(r => r.vehicleId === vehicle.id && Math.abs(r.cap-cap) < .5).slice(0,20);
 if (recent.length < 3) return null;
 const meters = recent.reduce((s,r)=>s+r.meters,0), seconds = recent.reduce((s,r)=>s+r.seconds,0);
 return {speedKmh:Math.min(cap,meters/seconds*3.6),count:recent.length};
}
