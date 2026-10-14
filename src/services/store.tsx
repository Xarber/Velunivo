import {AppState,Platform} from 'react-native';
import {calibrateEnergy} from '../core/energyCalibration';
import {scratchMap} from './scratchMap';
import {freshReading} from '../bluetooth/telemetry';
import {recordSettingEdits,readSettingEdits} from './syncSettings';
import {setRideLock} from './rideLock';
import { sortVehicles } from '../core/vehicleUsage';
import React, { createContext, useContext, useEffect, useMemo,useCallback, useState,useSyncExternalStore } from 'react';
import {bluetoothBridge} from '../bluetooth/service';
import {removeVehicleAndPairing} from '../bluetooth/policy';
import { loadMapSettings } from './mapSettings';
import { loadSavedRoutes, saveRoute, removeRoute } from './routeLibrary';
import { restorePreferences } from '../core/preferences';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vehicle, Route, NavigationOptions, defaultNavigationOptions } from '../core/types';
import { createVehicle, defaultGarage, removeVehicle, restoreGarage } from '../core/vehicles';
import { SavedPlace, Journey, restorePlaces, renameSavedPlace } from '../core/places';
import { learnedPace, measuredPace, RidePace } from '../core/learnedEta';
import { confidentBluetoothRange, learnedBatteryRange } from '../core/batteryLearning';
import { RecordedRide } from '../core/recordings';
import { recordedRides, rideSamples, subscribeRides } from './rideHistory';
interface Store { places: SavedPlace[]; addPlace: (p: Omit<SavedPlace, 'id'>) => void; deletePlace: (id: string) => void; renamePlace: (id: string, name: string) => void; pendingJourney: Journey | null; requestJourney: (j: Journey | null) => void;  navigationOptions: NavigationOptions; updateNavigationOptions: (p: Partial<NavigationOptions>) => void; profile: Vehicle; vehicles: Vehicle[]; chooseVehicle: (id: string) => void; addVehicle: (kind: Vehicle['kind']) => string | undefined; deleteVehicle: (id: string) => Promise<void>; updateProfile: (p: Partial<Vehicle>, id?: string) => void; vehicleLocked: boolean; lockVehicle: (locked: boolean) => void; routes: Route[]; setRoutes: (r: Route[]) => void; selected: Route | null; select: (r: Route | null) => void; saved: Route[]; save: (r: Route) => Promise<void>; remove: (id: string) => Promise<void>; ready: boolean; }
const Context = createContext<Store>(null!);
export const useStore = () => useContext(Context);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [garage, setGarage] = useState(defaultGarage), [routes, setRoutes] = useState<Route[]>([]);
  const [navigationOptions, setNavigationOptions] = useState(defaultNavigationOptions);
  useEffect(()=>{scratchMap.configure(navigationOptions.scratchEnabled,navigationOptions.scratchDisplay);void scratchMap.load();},[navigationOptions.scratchEnabled,navigationOptions.scratchDisplay]);
  const [places, setPlaces] = useState<SavedPlace[]>([]), [pendingJourney, requestJourney] = useState<Journey | null>(null), [paces, setPaces] = useState<RidePace[]>([]);
  const [batteryRides, setBatteryRides] = useState<RecordedRide[]>([]);
  const [vehicleLocked, setVehicleLocked] = useState(false);
  const lockVehicle=useCallback((value:boolean)=>{setRideLock(value);setVehicleLocked(value);},[]);
  const [selected, select] = useState<Route | null>(null), [saved, setSaved] = useState<Route[]>([]), [ready, setReady] = useState(false);
  useEffect(() => { (async () => {
    try {
      const [p, r, g, n, edits] = await Promise.all([AsyncStorage.getItem('profile-v1'), AsyncStorage.getItem('routes-v1'), AsyncStorage.getItem('vehicles-v1'), AsyncStorage.getItem('navigation-v1'),readSettingEdits()]);
      const garage = restoreGarage(g, p); const preferences=restorePreferences(n, garage.vehicles.find(v => v.id === garage.activeId) || garage.vehicles[0],edits['navigation.groupVideo']?.configured===true,{preferBikeLanes:edits['navigation.preferBikeLanes']?.configured===true,preferQuietRoads:edits['navigation.preferQuietRoads']?.configured===true}); if (!preferences.showSharingVehicle && garage.activeId === 'sharing-scooter') garage.activeId=garage.vehicles.find(v=>v.id !== 'sharing-scooter')!.id; setGarage(garage);
      setNavigationOptions(preferences);
      await loadMapSettings().catch(console.warn); setSaved(await loadSavedRoutes(r)); setPlaces(restorePlaces(await AsyncStorage.getItem('places-v1')));
    } catch { /* Corrupt local data: keep an empty planner. */ }
    setReady(true);
  })(); }, []);
  useEffect(() => { if (ready) AsyncStorage.setItem('vehicles-v1', JSON.stringify(garage)).catch(console.warn); }, [garage, ready]);
  useEffect(() => { if (ready) AsyncStorage.setItem('navigation-v1', JSON.stringify(navigationOptions)).catch(console.warn); }, [navigationOptions, ready]);
  useEffect(() => { if (ready) AsyncStorage.setItem('places-v1', JSON.stringify(places)).catch(console.warn); }, [places, ready]);
  useEffect(() => {
    let cancelled = false, running = false,rerun=false; const cache = new Map<string, {samples: number; pace: RidePace | null}>();
    const refresh = async () => { if (running){rerun=true;return;} running = true; try { const rides = await recordedRides(); if (!cancelled) {setBatteryRides(previous=>previous.length===rides.length&&previous.every((r,i)=>r===rides[i])?previous:rides);setGarage(g=>{let changed=false;const vehicles=g.vehicles.map(v=>{const estimate=confidentBluetoothRange(rides,v);if(!estimate)return v;const range=Math.round(estimate.rangeKm*10)/10;if(!Number.isFinite(range)||range<=0||range>10000||v.rangeKm===range)return v;changed=true;return {...v,rangeKm:range};});return changed?{...g,vehicles}:g;});} const ids = new Set(rides.map(r => r.id)); for (const id of cache.keys()) if (!ids.has(id)) cache.delete(id);
      for (const r of rides) if (['finished','arrived'].includes(r.status) && cache.get(r.id)?.samples !== r.samples) { const pace = measuredPace(r, await rideSamples(r)); if (cancelled) return; cache.set(r.id, {samples:r.samples,pace}); }
      if (!cancelled) setPaces(previous=>{const next=rides.map(r=>cache.get(r.id)?.pace).filter((r): r is RidePace => !!r);return previous.length===next.length&&previous.every((r,i)=>r===next[i])?previous:next;});
    } catch { /* Keep modeled ETA when records cannot be read. */ } finally { running = false;if(rerun&&!cancelled){rerun=false;void refresh();} } }; void refresh(); const unsubscribe = subscribeRides(()=>void refresh()); const app=AppState.addEventListener('change',state=>{if(state==='active')void refresh();});const changed=(event:StorageEvent)=>{if(event.key?.startsWith('ride-'))void refresh();};if(Platform.OS==='web')window.addEventListener('storage',changed);return()=>{cancelled=true;unsubscribe();app.remove();if(Platform.OS==='web')window.removeEventListener('storage',changed);};
  }, []);
  async function save(route: Route) { setSaved(await saveRoute(route)); }
  async function remove(id: string) { setSaved(await removeRoute(id)); }
  useEffect(()=>{setRideLock(vehicleLocked);return()=>setRideLock(false);},[vehicleLocked]);

  const baseProfile = garage.vehicles.find(v => v.id === garage.activeId) || garage.vehicles[0];
  const learned = useMemo(() => navigationOptions.learnedEta ? learnedPace(paces, baseProfile) : null, [paces, baseProfile, navigationOptions.learnedEta]);
  const energyContext=useSyncExternalStore(bluetoothBridge.subscribe,()=>{const b=bluetoothBridge.getSnapshot();if(b.vehicleId!==baseProfile.id||b.simulated||b.state!=='connected')return '';const mode=freshReading(b.fields,'ridingMode'),voltage=freshReading(b.fields,'voltage');return JSON.stringify({mode:typeof mode?.value==='string'?mode.value:undefined,voltage:typeof voltage?.value==='number'?Math.round(voltage.value/2)*2:undefined});},()=> '');
  const battery = useMemo(() => baseProfile.id==='sharing-scooter'?null:learnedBatteryRange(batteryRides, baseProfile,energyContext?JSON.parse(energyContext):undefined), [batteryRides, baseProfile,energyContext]);
  const calibration=useMemo(()=>baseProfile.id==='sharing-scooter'?null:calibrateEnergy(batteryRides,baseProfile.id,energyContext?JSON.parse(energyContext):undefined),[batteryRides,baseProfile.id,energyContext]);
  const profile = useMemo(()=>({ ...baseProfile,energyCalibration:calibration??undefined, learnedRangeKm: battery?.rangeKm,energyReferenceSpeedKmh:battery?.referenceSpeedKmh||baseProfile.energyReferenceSpeedKmh, learnedBatteryRideCount: calibration?.count||battery?.count, learnedSpeedKmh: learned?.speedKmh, learnedRideCount: learned?.count }),[baseProfile,calibration,battery,learned]);
  return <Context.Provider value={{ places, addPlace: p => setPlaces(v => [...v, {...p, id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`}]), deletePlace: id => setPlaces(v => v.filter(p => p.id !== id)), renamePlace: (id,name) => setPlaces(v=>renameSavedPlace(v,id,name)), pendingJourney, requestJourney, navigationOptions, updateNavigationOptions: p => {void recordSettingEdits(Object.fromEntries(Object.entries(p).map(([key,value])=>['navigation.'+key,value??null]))).catch(console.warn); if (p.showSharingVehicle === false && garage.activeId === 'sharing-scooter') { if (vehicleLocked) return; setGarage(g => ({...g, activeId:g.vehicles.find(v => v.id !== 'sharing-scooter')?.id || g.activeId})); } setNavigationOptions(v => ({ ...v, ...p })); }, profile, vehicles: sortVehicles(garage.vehicles.filter(v => navigationOptions.showSharingVehicle || v.id !== 'sharing-scooter'), batteryRides), vehicleLocked, lockVehicle, chooseVehicle: id => !vehicleLocked && setGarage(g => g.vehicles.some(v => v.id === id) ? { ...g, activeId: id } : g), addVehicle: kind => { if (vehicleLocked) return; const v = createVehicle(kind); setGarage(g => ({ ...g, vehicles: [...g.vehicles, v] })); return v.id; }, deleteVehicle: async id => { if(vehicleLocked)return;const next=await removeVehicleAndPairing(garage,id,key=>bluetoothBridge.forget(key));if(next!==garage)setGarage(g=>removeVehicle(g,id)); }, updateProfile: (p, id) => !vehicleLocked && setGarage(g => ({ ...g, vehicles: g.vehicles.map(v => v.id === (id || g.activeId) ? { ...v, ...p, id: v.id, ...(v.id === 'sharing-scooter' ? {name:'Sharing E-Scooter',photo:null,photos:[],icon:'sharing-scooter',rangeKm:null,batteryWh:undefined} : {}) } : v) })), routes, setRoutes, selected, select, saved, save, remove, ready }}>{children}</Context.Provider>;
}
