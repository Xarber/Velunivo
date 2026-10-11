import {BridgeSnapshot,Metric,VehicleType} from './types';
import {freshReading} from './telemetry';
import {PluginRegistry} from './registry';
/** Public rental profiles never represent a privately associated Bluetooth device. */
export const canPairVehicle=(id:string)=>id!=='sharing-scooter';
export function globalTelemetryMetrics(registry:PluginRegistry,development=false){const types:VehicleType[]=['electric_scooter','electric_bike','bicycle','other'];return [...new Set(types.flatMap(type=>registry.forType(type,development).flatMap(plugin=>plugin.capabilities.fields)))];}
/** Real and simulated dashboards share presentation, but source labels must remain explicit. */
export function dashboardReading(snapshot:BridgeSnapshot,id:string,metric:Metric,now:number){if(!canPairVehicle(id) || snapshot.vehicleId!==id || snapshot.state!=='connected')return;const reading=freshReading(snapshot.fields,metric,now,false);return reading && (snapshot.simulated?reading.source==='simulator':reading.source==='vehicle')?reading:undefined;}

/** Remove private association before committing a garage deletion; failures retain the vehicle. */
export async function removeVehicleAndPairing(garage:import('../core/vehicles').Garage,id:string,forget:(id:string)=>Promise<void>){const {removeVehicle}=await import('../core/vehicles');if(!garage.vehicles.some(v=>v.id===id))return garage;const next=removeVehicle(garage,id);if(next!==garage)await forget(id);return next;}
