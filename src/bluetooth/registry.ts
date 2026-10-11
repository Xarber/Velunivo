import { BLEDeviceInfo, VehicleProtocolPlugin, VehicleType } from './types';
export class PluginRegistry {
 private plugins=new Map<string,VehicleProtocolPlugin>();
 register(plugin:VehicleProtocolPlugin){if(this.plugins.has(plugin.id))throw new Error(`Duplicate Bluetooth plugin: ${plugin.id}`);this.plugins.set(plugin.id,plugin);return this;}
 get(id:string){return this.plugins.get(id);}
 forType(type:VehicleType,development=false){return [...this.plugins.values()].filter(p=>p.vehicleTypes.includes(type) && (!p.simulator || development));}
 identify(device:BLEDeviceInfo,type:VehicleType,development=false){const hits=this.forType(type,development).map(plugin=>({plugin,detection:plugin.detect(device)})).filter(x=>x.detection.compatible && !x.detection.uncertain);return hits.length===1?hits[0]:null;}
}
