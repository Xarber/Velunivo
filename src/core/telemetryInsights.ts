import {AdvancedAnalytics,percentile,SamplingCoverage} from './advancedTelemetry';
import {RecordedRide,RideSample} from './recordings';
import {Metric} from '../bluetooth/types';
import {units} from '../bluetooth/telemetry';
export interface SensorQuality {metric:Metric;coverage:number;readings:number;invalid:number;stale:number;medianInterval?:number;p95Interval?:number;}
const bounds:Partial<Record<Metric,[number,number]>>={speed:[0,55],batteryPercent:[0,100],voltage:[1,150],current:[-300,300],power:[-45000,45000],batteryTemperature:[-40,120],controllerTemperature:[-40,180],motorTemperature:[-40,200],odometer:[0,1e9]};
/** Coverage uses valid endpoints, not the number of repeated cached snapshots. */
export function sensorReliability(ride:RecordedRide,samples:readonly RideSample[]):SensorQuality[]{
 const metrics=new Map<Metric,{coverage:SamplingCoverage;times:number[];seen:Set<number>;invalid:number;stale:number}>(),ordered=[...samples].sort((a,b)=>a.fix.timestamp-b.fix.timestamp),duration=Math.max(0,((ride.endedAt??ride.lastFixAt??ride.startedAt)-ride.startedAt)/1000);
 for(const s of ordered)for(const key of Object.keys(s.bluetooth?.fields??{}) as Metric[])if(!metrics.has(key))metrics.set(key,{coverage:new SamplingCoverage(),times:[],seen:new Set(),invalid:0,stale:0});
 for(const s of ordered){const at=s.fix.timestamp,b=s.bluetooth,connected=b?.vehicleId===ride.vehicle.id&&b.state==='connected'&&!b.simulated;
  for(const [key,q] of metrics){const r=connected?b?.fields[key]:undefined,range=bounds[key],valid=!!r&&r.source==='vehicle'&&r.unit===units[key]&&Number.isFinite(r.timestamp)&&(typeof r.value==='number'?Number.isFinite(r.value)&&(!range||(r.value>=range[0]&&r.value<=range[1])):typeof r.value==='boolean'||typeof r.value==='string'),fresh=valid&&at-r!.timestamp>=-1000&&at-r!.timestamp<=(key==='batteryPercent'?30000:key.endsWith('Temperature')?15000:5000);
   q.coverage.accept(at,!!fresh&&!s.breakBefore);if(r&&!q.seen.has(r.timestamp)){q.seen.add(r.timestamp);if(!valid)q.invalid++;else q.times.push(r.timestamp);}if(valid&&!fresh)q.stale++;
  }
 }
 return [...metrics].map(([metric,q])=>{q.times.sort((a,b)=>a-b);const intervals=q.times.slice(1).map((at,i)=>(at-q.times[i])/1000);return{metric,coverage:duration?Math.min(100,q.coverage.seconds/duration*100):0,readings:q.times.length,invalid:q.invalid,stale:q.stale,medianInterval:percentile(intervals,.5),p95Interval:percentile(intervals,.95)};});
}
export interface RideEvidence {ride:RecordedRide;analytics:AdvancedAnalytics;}
/** Match observed conditions; no regression pretends unknown wind/load is controlled. */
export function matchedRides(current:RideEvidence,others:RideEvidence[]){const a=current.analytics,r=current.ride,speed=a.averageMovingKmh;if(!speed||a.quality.gps<80)return [];
 const terrain=(v:RecordedRide)=>v.energy?.ascentMeters===undefined||v.meters<500?undefined:v.energy.ascentMeters/(v.meters/1000);
 return others.filter(({ride,analytics:b})=>{if(ride.id===r.id||ride.vehicle.id!==r.vehicle.id||b.quality.gps<80||!b.averageMovingKmh||Math.abs(b.averageMovingKmh/speed-1)>.15||Math.abs(ride.meters/r.meters-1)>.5)return false;
  if(Math.abs(Math.min(ride.vehicle.maxSpeed,ride.vehicle.ridingLimit)-Math.min(r.vehicle.maxSpeed,r.vehicle.ridingLimit))>1)return false;
  const mode=(v:AdvancedAnalytics)=>Object.entries(v.modes).filter(([,m])=>m.seconds>v.movingSeconds*.1).map(([k])=>k).sort().join(',');if(mode(a)!==mode(b))return false;
  const t=terrain(r),u=terrain(ride);if((t===undefined)!==(u===undefined)||t!==undefined&&u!==undefined&&Math.abs(t-u)>15)return false;
  const mass=r.vehicle.totalMassKg,otherMass=ride.vehicle.totalMassKg;if(mass!==undefined&&otherMass!==undefined&&Math.abs(mass-otherMass)>10)return false;
  const temp=(v:AdvancedAnalytics)=>percentile(v.series.flatMap(p=>p.temperature===undefined?[]:[p.temperature]),.5),x=temp(a),y=temp(b);if(x!==undefined&&y!==undefined&&Math.abs(x-y)>8)return false;
  const charge=(v:AdvancedAnalytics)=>percentile(v.series.flatMap(p=>p.battery===undefined?[]:[p.battery]),.5),c=charge(a),d=charge(b);return !(c!==undefined&&d!==undefined&&Math.abs(c-d)>15);
 });
}
export interface TelemetryInsight {id:string;message:string;detail:string;confidence:'moderate'|'high';metric:Metric;value?:number;unit?:string;}
export function telemetryInsights(current:RideEvidence,others:RideEvidence[]):TelemetryInsight[]{const a=current.analytics,result:TelemetryInsight[]=[];
 if(a.sag.filter(s=>s.confidence==='high').length>=3)result.push({id:'sag',message:'Repeated voltage sag under acceleration',detail:'Fresh voltage, current and acceleration readings overlap. This observation does not diagnose battery health.',confidence:'high',metric:'voltage',value:Math.max(...a.sag.map(s=>s.drop)),unit:'V'});
 if(a.speedCalibration&&a.speedCalibration.pairs>=30&&Math.abs(a.speedCalibration.factor-1)>.1)result.push({id:'speed',message:'Vehicle speed differs from GPS',detail:'Compared simultaneous vehicle readings with precise GPS while moving. Check tire and speedometer configuration; Velunivo does not modify it.',confidence:'moderate',metric:'speed',value:(a.speedCalibration.factor-1)*100,unit:'%'});
 if(a.quality.interruptions>=3)result.push({id:'connection',message:'Repeated Bluetooth interruptions',detail:'Missing intervals are excluded from energy calculations. Keep the device within range and review connection diagnostics.',confidence:'high',metric:'signal',value:a.quality.interruptions});
 const matches=matchedRides(current,others);if(matches.length<5)return result;
 const compare=(id:string,message:string,metric:Metric,value:number|undefined,values:number[],unit:string,minimum:number)=>{if(value===undefined||values.length<5)return;const median=percentile(values,.5)!,mad=percentile(values.map(v=>Math.abs(v-median)),.5)!;if(value-median>Math.max(minimum,3*1.4826*mad))result.push({id,message,detail:'Compared rides on this vehicle with similar distance, moving speed, riding modes, terrain and available battery, temperature and load data. Unknown weather and traffic remain confounders.',confidence:'moderate',metric,value:value-median,unit});};
 if(a.quality.electrical>=80){compare('efficiency','Higher energy consumption than comparable rides','power',a.whPerKm,matches.filter(m=>m.analytics.quality.electrical>=80).flatMap(m=>m.analytics.whPerKm===undefined?[]:[m.analytics.whPerKm]),'Wh/km',Math.max(2,(a.whPerKm??0)*.15));}
 if(a.series.filter(p=>p.temperature!==undefined).length>=a.series.length*.8)compare('heat','Larger battery temperature rise than comparable rides','batteryTemperature',a.temperatureChange,matches.filter(m=>m.analytics.series.filter(p=>p.temperature!==undefined).length>=m.analytics.series.length*.8).flatMap(m=>m.analytics.temperatureChange===undefined?[]:[m.analytics.temperatureChange]),'°C',5);
 return result;
}
