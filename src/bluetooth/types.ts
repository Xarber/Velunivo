export type VehicleType = 'electric_scooter' | 'electric_bike' | 'bicycle' | 'other';
export type ConnectionState = 'idle' | 'scanning' | 'connecting' | 'authenticating' | 'connected' | 'reconnecting' | 'disconnected' | 'error';
export type AdapterState = 'PoweredOn' | 'PoweredOff' | 'Unauthorized' | 'Unsupported' | 'Unknown' | 'Resetting';
export interface BLEDeviceInfo { id:string; name:string|null; rssi:number|null; services:string[]; manufacturerData?:Uint8Array; serviceData?:Record<string,Uint8Array>; connectable?:boolean; verifiedProtocol?:string; discoverySource?:'web-gatt'; }
export type Metric = 'speed' | 'batteryPercent' | 'voltage' | 'current' | 'charging' | 'batteryTemperature' | 'controllerTemperature' | 'motorTemperature' | 'power' | 'odometer' | 'tripDistance' | 'chargeCycles' | 'ridingMode' | 'remainingRange' | 'signal';
export interface Reading { value:number|boolean|string; timestamp:number; source:'vehicle'|'calculated'|'gps'|'simulator'; unit:'m/s'|'%'|'V'|'A'|'W'|'°C'|'m'|'count'|'dBm'|'boolean'|'text'; }
export type Telemetry = Partial<Record<Metric,Reading>>;
export interface TelemetryUpdate { fields:Telemetry; extensions?:Record<string,Reading>; }
export interface Detection { compatible:boolean; uncertain?:boolean; model?:string; reason?:string; }
export interface Capabilities {electricalSign?:'positive-discharge'|'negative-discharge'; fields:readonly Metric[]; commands:readonly ('readTelemetry'|'lock'|'unlock')[]; authentication:string; limitations:string[]; }
export interface BLELink {
  device:BLEDeviceInfo;
  hasCharacteristic(service:string,characteristic:string):Promise<boolean>;
  write(service:string,characteristic:string,bytes:Uint8Array):Promise<void>;
  monitor(service:string,characteristic:string,receive:(data:Uint8Array)=>void,error:(e:Error)=>void):()=>void;
  onDisconnect(listener:(error?:Error)=>void):()=>void;
  disconnect():Promise<void>;
  readRSSI():Promise<number|null>;
}
export interface ManufacturerDiscoveryFilter { companyIdentifier:number; dataPrefix:readonly number[]; }
export interface BLETransport { chooseDevice?(services:string[],manufacturerFilters?:readonly ManufacturerDiscoveryFilter[]):Promise<BLEDeviceInfo>; ready(requestPermission:boolean):Promise<void>; observeState(listener:(state:AdapterState)=>void):()=>void; scan(services:string[],listener:(device:BLEDeviceInfo)=>void,error:(e:Error)=>void):Promise<()=>void>; connect(device:BLEDeviceInfo):Promise<BLELink>; }
export interface ProtocolSession { identity:{serial?:string; firmware?:string; model:string}; capabilities:Capabilities; close():Promise<void>; setLocked?(locked:boolean):Promise<void>; }
export interface VehicleProtocolPlugin {
 id:string; manufacturer:string; vehicleTypes:readonly VehicleType[]; models:readonly string[]; services:readonly string[]; capabilities:Capabilities; simulator?:boolean; manufacturerFilters?:readonly ManufacturerDiscoveryFilter[];
 detect(device:BLEDeviceInfo):Detection;
 open(link:BLELink,context:{signal?:AbortSignal;approvalDeadline?:number;credentials?:Record<string,string>;emit(update:TelemetryUpdate):void; phase(message:string):void; random(length:number):Uint8Array}):Promise<ProtocolSession>;
}
export interface Association { schema:1; vehicleId:string; vehicleType:VehicleType; device:BLEDeviceInfo; pluginId:string; identity:ProtocolSession['identity']; associatedAt:number; credentials?:Record<string,string>; simulated?:boolean; }
export interface ConnectionDiagnostics {attempts:number;failures:number;disconnects:number;}
export interface BridgeSnapshot {connectionDiagnostics?:ConnectionDiagnostics; rePairRequired?:boolean; state:ConnectionState; message:string; vehicleId?:string; device?:BLEDeviceInfo; pluginId?:string; simulated?:boolean; fields:Telemetry; extensions:Record<string,Reading>; capabilities?:Capabilities; connectedAt?:number; }
export const vehicleType = (kind:'escooter'|'ebike'):VehicleType => kind==='ebike'?'electric_bike':'electric_scooter';

/** The OS/browser grant is separate from protocol registration; do not retry it silently. */
export class MissingBLEGrantError extends Error {}

/** A saved credential was refused; retain it and stop automatic authentication loops. */
export class SavedPairingRejectedError extends Error {}
