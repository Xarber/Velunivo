import { Metric } from './types';
export interface BluetoothPreferences {schema:1;simulateTelemetry:boolean;autoReconnect:boolean;collectTelemetry:boolean;visible:Partial<Record<Metric,boolean>>;}
export const defaultBluetoothPreferences:BluetoothPreferences={schema:1,simulateTelemetry:false,autoReconnect:true,collectTelemetry:true,visible:{}};
export function restoreBluetoothPreferences(raw:string|null):BluetoothPreferences {try{const x=JSON.parse(raw||'null');if(x?.schema!==1)return defaultBluetoothPreferences;return {schema:1,simulateTelemetry:x.simulateTelemetry===true,autoReconnect:x.autoReconnect!==false,collectTelemetry:x.collectTelemetry!==false,visible:Object.fromEntries(Object.entries(x.visible||{}).filter(([,v])=>typeof v==='boolean'))};}catch{return defaultBluetoothPreferences;}}
export const metricVisible=(p:BluetoothPreferences,m:Metric)=>p.visible[m]!==false;

// Shared foreground/background read view; the provider remains the persistence owner.
let currentPreferences=defaultBluetoothPreferences;
export const getBluetoothPreferences=()=>currentPreferences;
export const setBluetoothPreferencesSnapshot=(preferences:BluetoothPreferences)=>{currentPreferences=preferences;};
