import type {RecordedRide} from './recordings';
export interface EnergyCalibration {schema:1;count:number;percentPerKm:number;percentPerClimbMeter:number;referenceSpeedKmh:number;referenceCapKmh:number;terrainCalibrated:boolean;}
/** Fit consumption in percentage points. Hills are learned together with distance, never subtracted then added twice. */
export function calibrateEnergy(rides:RecordedRide[],vehicleId:string,context?:{mode?:string;voltage?:number}):EnergyCalibration|null{
 let records=rides.filter(r=>r.vehicle.id===vehicleId&&!r.bluetooth?.simulated&&['finished','arrived'].includes(r.status)&&r.batteryFeedback==='answered'&&Number.isFinite(r.batteryUsagePercent)&&r.batteryUsagePercent!>=1&&r.batteryUsagePercent!<=100&&r.meters>=500).slice(0,40);
 const matched=records.filter(r=>(!context?.mode||Object.entries(r.energy?.modeSeconds??{}).sort((a,b)=>b[1]-a[1])[0]?.[0]===context.mode)&&(!context?.voltage||r.energy?.meanVoltage===undefined||Math.abs(r.energy.meanVoltage-context.voltage)/context.voltage<.1));if(matched.length>=3)records=matched;
 let rows=records.map(r=>({km:r.meters/1000,used:r.batteryUsagePercent!,climb:r.energy?.ascentMeters,cap:Math.min(r.vehicle.maxSpeed,r.vehicle.ridingLimit),speed:r.energy?.movingSpeedKmh??Math.min(r.vehicle.maxSpeed,r.vehicle.ridingLimit)*(r.vehicle.cruiseFactor??.8)}));
 if(!rows.length)return null;
 if(rows.length>=5){const rates=rows.map(r=>r.used/r.km).sort((a,b)=>a-b),median=rates[Math.floor(rates.length/2)];rows=rows.filter(r=>r.used/r.km>=median/3&&r.used/r.km<=median*3);}

 const km=rows.reduce((s,r)=>s+r.km,0),speed=rows.reduce((s,r)=>s+r.km*r.speed,0)/km;
 const usable=rows.filter(r=>r.climb!==undefined&&Number.isFinite(r.climb)&&r.climb!>=0&&r.climb!/r.km<200);
 let distanceRate=rows.reduce((s,r)=>s+r.used,0)/km,hillRate=0,terrainCalibrated=false;
 if(usable.length>=3){
  // Nonnegative two-feature least squares, with a meaningful spread of slopes.
  const xx=usable.reduce((s,r)=>s+r.km*r.km,0),xy=usable.reduce((s,r)=>s+r.km*r.climb!,0),yy=usable.reduce((s,r)=>s+r.climb!**2,0),xb=usable.reduce((s,r)=>s+r.km*r.used,0),yb=usable.reduce((s,r)=>s+r.climb!*r.used,0),det=xx*yy-xy*xy;
  if(det>xx*yy*.04){const a=(xb*yy-yb*xy)/det,b=(yb*xx-xb*xy)/det;if(a>0&&b>=0&&b<.2){distanceRate=a;hillRate=b;terrainCalibrated=true;}}
 }
 // A distance-only fit already includes typical terrain; do not add an invented uphill penalty.
 return {schema:1,count:rows.length,percentPerKm:distanceRate,percentPerClimbMeter:hillRate,referenceSpeedKmh:Math.max(1,speed),referenceCapKmh:rows.reduce((s,r)=>s+r.km*r.cap,0)/km,terrainCalibrated};
}
