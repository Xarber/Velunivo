import {Vehicle,Route} from './types';
import {routeLengths} from './geo';
/** Transparent range-calibrated model; terrain is used only with actual elevation samples. */
export function routeEnergy(route:Route,vehicle:Vehicle,along=0){
 const lengths=routeLengths(route.coordinates),total=lengths.at(-1)||0,meters=Math.max(0,total-along),range=vehicle.learnedRangeKm||vehicle.rangeKm||(vehicle.energyCalibration?100/vehicle.energyCalibration.percentPerKm:null);
 if(!range||!meters)return range?{percent:0,climb:0,terrain:false,exceedsRange:false}:null;
 const speed=Math.min(vehicle.maxSpeed,vehicle.ridingLimit)*vehicle.cruiseFactor,reference=vehicle.energyReferenceSpeedKmh||20;
 const speedFactor=Math.max(.65,Math.min(2,.65+.35*(speed/reference)**2));
 let climb=0;const elevations=route.elevation,terrain=!!elevations&&elevations.length===lengths.length&&elevations.every(Number.isFinite);
 if(terrain){let base=elevations![0];for(let i=1;i<lengths.length;i++){if(lengths[i]<along){base=elevations![i];continue;}const change=elevations![i]-base;if(Math.abs(change)>=3){if(change>0)climb+=change;base=elevations![i];}}}
 const model=vehicle.energyCalibration;
 if(model?.schema===1&&model.count>0&&Number.isFinite(model.percentPerKm)&&model.percentPerKm>0&&Number.isFinite(model.referenceSpeedKmh)&&model.referenceSpeedKmh>0&&Number.isFinite(model.referenceCapKmh)&&model.referenceCapKmh>0&&Number.isFinite(model.percentPerClimbMeter)&&model.percentPerClimbMeter>=0){const ratio=Math.max(.8,Math.min(1.35,.65+.35*(Math.min(vehicle.maxSpeed,vehicle.ridingLimit)/model.referenceCapKmh)**2));const percent=meters/1000*model.percentPerKm*ratio+(terrain&&model.terrainCalibrated?climb*model.percentPerClimbMeter:0);return {percent,climb,terrain,exceedsRange:percent>100,calibrated:true,count:model.count};}
 const baseline=meters/1000/range*100*speedFactor;
 // Without a specified capacity, use a clearly modeled 12 Wh/km scooter / 10 Wh/km e-bike baseline.
 const capacity=vehicle.batteryWh || range*(vehicle.kind==='ebike'?10:12),mass=vehicle.totalMassKg||100;
 const uphillPercent=terrain?mass*9.81*climb/3600/.75/capacity*100:0;
 const percent=baseline+uphillPercent;
 return {percent,climb,terrain,exceedsRange:percent>100};
}
export function routeEnergyLabel(route:Route,vehicle:Vehicle,along=0){const e=routeEnergy(route,vehicle,along);return e?`≈${e.percent.toFixed(e.percent>0&&e.percent<1?1:0)}% of full battery · ${'calibrated' in e&&e.calibrated?'learned battery consumption':e.terrain?'terrain + speed estimate':'speed + range estimate'}${e.exceedsRange?' · exceeds full-charge range':''}`:'Add vehicle range for a battery estimate';}
