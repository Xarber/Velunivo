import React,{createContext,useContext,useEffect,useState,useSyncExternalStore} from 'react';
import {AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useStore} from '../services/store';
import {bluetoothBridge} from './service';
import {BluetoothPreferences,defaultBluetoothPreferences,restoreBluetoothPreferences} from './preferences';
const Context=createContext<{preferences:BluetoothPreferences;update:(p:Partial<BluetoothPreferences>)=>void;ready:boolean}>({preferences:defaultBluetoothPreferences,update:()=>{},ready:false});
export function BluetoothProvider({children}:{children:React.ReactNode}){
 const {navigationOptions:n}=useStore();
 useEffect(()=>{if(!n.developerMode && bluetoothBridge.getSnapshot().simulated)void bluetoothBridge.disconnect();},[n.developerMode]);
 const [preferences,setPreferences]=useState(defaultBluetoothPreferences),[ready,setReady]=useState(false);
 useEffect(()=>{let cancelled=false;void Promise.all([AsyncStorage.getItem('bluetooth-preferences-v1'),bluetoothBridge.initialize()]).then(([raw])=>{if(!cancelled){setPreferences(restoreBluetoothPreferences(raw));setReady(true);}}).catch(()=>{if(!cancelled)setReady(true);});const sub=AppState.addEventListener('change',state=>{if(state==='active')bluetoothBridge.foreground();});return()=>{cancelled=true;sub.remove();};},[]);
 useEffect(()=>{bluetoothBridge.autoReconnect=preferences.autoReconnect;if(ready)void AsyncStorage.setItem('bluetooth-preferences-v1',JSON.stringify(preferences)).catch(()=>{});},[preferences,ready]);
 return <Context.Provider value={{preferences,ready,update:p=>setPreferences(v=>({...v,...p,visible:p.visible?{...v.visible,...p.visible}:v.visible}))}}>{children}</Context.Provider>;
}
export const useBluetoothPreferences=()=>useContext(Context);
export function useBluetoothVehicle(vehicleId:string,active=false){const {ready}=useBluetoothPreferences();useEffect(()=>{if(active && ready)return bluetoothBridge.acquire(vehicleId);},[vehicleId,active,ready]);return useSyncExternalStore(bluetoothBridge.subscribe,bluetoothBridge.getSnapshot,bluetoothBridge.getSnapshot);}
/** A ride owns a lease, not a per-screen connection. It need not rerender on every packet. */
export function useBluetoothLease(vehicleId:string,active:boolean){const {ready}=useBluetoothPreferences();useEffect(()=>{if(active && ready)return bluetoothBridge.acquire(vehicleId);},[vehicleId,active,ready]);}
