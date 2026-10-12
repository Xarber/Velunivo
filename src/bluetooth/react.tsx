import {recordSettingEdits} from '../services/syncSettings';
import React,{createContext,useContext,useEffect,useState,useSyncExternalStore} from 'react';
import {AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useStore} from '../services/store';
import {canPairVehicle} from './policy';
import {vehicleType} from './types';
import {bluetoothBridge} from './service';
import {BluetoothPreferences,defaultBluetoothPreferences,restoreBluetoothPreferences,setBluetoothPreferencesSnapshot} from './preferences';
const Context=createContext<{preferences:BluetoothPreferences;update:(p:Partial<BluetoothPreferences>)=>void;ready:boolean}>({preferences:defaultBluetoothPreferences,update:()=>{},ready:false});
export function BluetoothProvider({children}:{children:React.ReactNode}){
 const {navigationOptions:n,profile,vehicles,ready:garageReady}=useStore();
 const ids=vehicles.map(v=>v.id).sort().join('|');
 const [preferences,setPreferences]=useState(defaultBluetoothPreferences),[ready,setReady]=useState(false);
 const associatedDevice=useSyncExternalStore(bluetoothBridge.subscribe,()=>bluetoothBridge.association(profile.id)?.device.id ?? '',()=> '');
 useEffect(()=>{if(ready && garageReady && preferences.autoReconnect && associatedDevice && canPairVehicle(profile.id) && !(n.developerMode && preferences.simulateTelemetry))return bluetoothBridge.acquire(profile.id);},[ready,garageReady,preferences.autoReconnect,preferences.simulateTelemetry,n.developerMode,profile.id,associatedDevice]);

 useEffect(()=>{let cancelled=false;void Promise.all([AsyncStorage.getItem('bluetooth-preferences-v1'),bluetoothBridge.initialize()]).then(([raw])=>{if(!cancelled){setPreferences(restoreBluetoothPreferences(raw));setReady(true);}}).catch(()=>{if(!cancelled)setReady(true);});const sub=AppState.addEventListener('change',state=>{if(state==='active')bluetoothBridge.foreground();});return()=>{cancelled=true;sub.remove();};},[]);
 useEffect(()=>{if(ready && garageReady)void bluetoothBridge.retainVehicles(ids.split('|')).catch(console.warn);},[ids,ready,garageReady]);
 useEffect(()=>{if(!ready || !garageReady)return;let cancelled=false;const run=async()=>{const snapshot=bluetoothBridge.getSnapshot();if(n.developerMode && preferences.simulateTelemetry && canPairVehicle(profile.id)){if(!snapshot.simulated || snapshot.vehicleId!==profile.id){await bluetoothBridge.disconnect();if(!cancelled)await bluetoothBridge.simulate(profile.id,vehicleType(profile.kind));}}else if(snapshot.simulated)await bluetoothBridge.stopSimulation(snapshot.vehicleId===profile.id && canPairVehicle(profile.id));};void run().catch(console.warn);return()=>{cancelled=true;};},[ready,garageReady,n.developerMode,preferences.simulateTelemetry,profile.id,profile.kind]);
 useEffect(()=>{setBluetoothPreferencesSnapshot(preferences);bluetoothBridge.autoReconnect=preferences.autoReconnect;if(ready)void AsyncStorage.setItem('bluetooth-preferences-v1',JSON.stringify(preferences)).catch(()=>{});},[preferences,ready]);
 return <Context.Provider value={{preferences,ready,update:p=>{void recordSettingEdits({...Object.fromEntries(Object.entries(p).filter(([key])=>key!=='visible'&&key!=='schema').map(([key,value])=>['bluetooth.'+key,value as boolean])),...Object.fromEntries(Object.entries(p.visible||{}).map(([key,value])=>['bluetooth.visible.'+key,value!]))}).catch(console.warn);setPreferences(v=>({...v,...p,visible:p.visible?{...v.visible,...p.visible}:v.visible}));}}}>{children}</Context.Provider>;
}
export const useBluetoothPreferences=()=>useContext(Context);
export function useBluetoothVehicle(vehicleId:string,active=false){const {ready}=useBluetoothPreferences();useEffect(()=>{if(active && ready)return bluetoothBridge.acquire(vehicleId);},[vehicleId,active,ready]);return useSyncExternalStore(bluetoothBridge.subscribe,bluetoothBridge.getSnapshot,bluetoothBridge.getSnapshot);}
/** A ride owns a lease, not a per-screen connection. It need not rerender on every packet. */
export function useBluetoothLease(vehicleId:string,active:boolean){const {ready}=useBluetoothPreferences();useEffect(()=>{if(active && ready){const release=bluetoothBridge.acquire(vehicleId);if(bluetoothBridge.association(vehicleId) && !bluetoothBridge.getSnapshot().simulated)void bluetoothBridge.reconnect(vehicleId).catch(()=>{});return release;}},[vehicleId,active,ready]);}
