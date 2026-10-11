import {AppBackup} from './dataTransfer';
/** Old default IDs were identical on every install. Scope portable identities without changing local BLE associations. */
export function portableVehicleIds(backup:AppBackup,installation:string,restore=false):AppBackup{
 const aliases=['default-scooter','legacy-vehicle'];const convert=(id:string)=>{for(const alias of aliases){const scoped=`vehicle-${installation}-${alias}`;if(id===(restore?scoped:alias))return restore?alias:scoped;}return id;};
 return {...backup,garage:{...backup.garage,activeId:convert(backup.garage.activeId),vehicles:backup.garage.vehicles.map(v=>({...v,id:convert(v.id)}))},rides:backup.rides.map(r=>({...r,summary:{...r.summary,vehicle:{...r.summary.vehicle,id:convert(r.summary.vehicle.id)}},samples:r.samples.map(s=>s.bluetooth?{...s,bluetooth:{...s.bluetooth,vehicleId:convert(s.bluetooth.vehicleId)}}:s)}))};
}
