import { Vehicle } from './types';
import { RecordedRide } from './recordings';
export function vehicleUsage(rides: RecordedRide[], id: string) {
 const completed=rides.filter(r=>r.vehicle.id===id && r.status!=='recording' && r.meters>=15);
 return {rides:completed.length, meters:completed.reduce((sum,r)=>sum+r.meters,0)};
}
export function sortVehicles(vehicles: Vehicle[], rides: RecordedRide[]) {
 const counts=new Map(vehicles.map(v=>[v.id,vehicleUsage(rides,v.id).rides]));
 return [...vehicles].sort((a,b)=>(a.id==='sharing-scooter')!==(b.id==='sharing-scooter')?(a.id==='sharing-scooter'?-1:1):(counts.get(b.id)||0)-(counts.get(a.id)||0));
}
