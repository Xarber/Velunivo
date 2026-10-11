export type VehicleType = 'electric_scooter' | 'electric_bike' | 'bicycle' | 'other';
export type ConnectionState = 'idle' | 'scanning' | 'connecting' | 'authenticating' | 'connected' | 'reconnecting' | 'disconnected' | 'error';
export type AdapterState = 'PoweredOn' | 'PoweredOff' | 'Unauthorized' | 'Unsupported' | 'Unknown' | 'Resetting';
export interface BLEDeviceInfo { id:string; name:string|null; rssi:number|null; services:string[]; manufacturerData?:Uint8Array; serviceData?:Record<string,Uint8Array>; connectable?:boolean; verifiedProtocol?:string; }
export type Metric = 'speed' | 'batteryPercent' | 'voltage' | 'current' | 'charging' | 'batteryTemperature' | 'controllerTemperature' | 'motorTemperature' | 'power' | 'odometer' | 'tripDistance' | 'chargeCycles' | 'ridingMode' | 'remainingRange' | 'signal';
export interface Reading { value:number|boolean|string; timestamp:number; source:'vehicle'|'calculated'|'gps'|'simulator'; unit:'m/s'|'%'|'V'|'A'|'W'|'°C'|'m'|'count'|'dBm'|'boolean'|'text'; }
export type Telemetry = Partial<Record<Metric,Reading>>;
export interface TelemetryUpdate { fields:Telemetry; extensions?:Record<string,Reading>; }
export interface Detection { compatible:boolean; uncertain?:boolean; model?:string; reason?:string; }
export interface Capabilities { fields:readonly Metric[]; commands:readonly ['readTelemetry']; authentication:string; limitations:string[]; }
export interface BLELink {
  device:BLEDeviceInfo;
  hasCharacteristic(service:string,characteristic:string):Promise<boolean>;
  write(service:string,characteristic:string,bytes:Uint8Array):Promise<void>;
  monitor(service:string,characteristic:string,receive:(data:Uint8Array)=>void,error:(e:Error)=>void):()=>void;
  onDisconnect(listener:(error?:Error)=>void):()=>void;
  disconnect():Promise<void>;
  readRSSI():Promise<number|null>;
}
export interface BLETransport { chooseDevice?(services:string[]):Promise<BLEDeviceInfo>; ready(requestPermission:boolean):Promise<void>; observeState(listener:(state:AdapterState)=>void):()=>void; scan(services:string[],listener:(device:BLEDeviceInfo)=>void,error:(e:Error)=>void):Promise<()=>void>; connect(device:BLEDeviceInfo):Promise<BLELink>; }
export interface ProtocolSession { identity:{serial?:string; firmware?:string; model:string}; capabilities:Capabilities; close():Promise<void>; }
export interface VehicleProtocolPlugin {
 id:string; manufacturer:string; vehicleTypes:readonly VehicleType[]; models:readonly string[]; services:readonly string[]; capabilities:Capabilities; simulator?:boolean;
 detect(device:BLEDeviceInfo):Detection;
 open(link:BLELink,context:{signal?:AbortSignal;emit(update:TelemetryUpdate):void; phase(message:string):void; random(length:number):Uint8Array}):Promise<ProtocolSession>;
}
export interface Association { schema:1; vehicleId:string; vehicleType:VehicleType; device:BLEDeviceInfo; pluginId:string; identity:ProtocolSession['identity']; associatedAt:number; simulated?:boolean; }
export interface BridgeSnapshot { state:ConnectionState; message:string; vehicleId?:string; device?:BLEDeviceInfo; pluginId?:string; simulated?:boolean; fields:Telemetry; extensions:Record<string,Reading>; capabilities?:Capabilities; connectedAt?:number; }
export const vehicleType = (kind:'escooter'|'ebike'):VehicleType => kind==='ebike'?'electric_bike':'electric_scooter';
