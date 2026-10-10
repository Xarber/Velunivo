import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadMapSettings } from './mapSettings';
import { loadSavedRoutes, saveRoute, removeRoute } from './routeLibrary';
import { restorePreferences } from '../core/preferences';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vehicle, Route, NavigationOptions, defaultNavigationOptions } from '../core/types';
import { createVehicle, defaultGarage, removeVehicle, restoreGarage } from '../core/vehicles';
import { SavedPlace, Journey, restorePlaces, renameSavedPlace } from '../core/places';
import { learnedPace, measuredPace, RidePace } from '../core/learnedEta';
import { learnedBatteryRange } from '../core/batteryLearning';
import { RecordedRide } from '../core/recordings';
import { recordedRides, rideSamples, subscribeRides } from './rideHistory';
interface Store { places: SavedPlace[]; addPlace: (p: Omit<SavedPlace, 'id'>) => void; deletePlace: (id: string) => void; renamePlace: (id: string, name: string) => void; pendingJourney: Journey | null; requestJourney: (j: Journey | null) => void;  navigationOptions: NavigationOptions; updateNavigationOptions: (p: Partial<NavigationOptions>) => void; profile: Vehicle; vehicles: Vehicle[]; chooseVehicle: (id: string) => void; addVehicle: (kind: Vehicle['kind']) => string | undefined; deleteVehicle: (id: string) => void; updateProfile: (p: Partial<Vehicle>, id?: string) => void; vehicleLocked: boolean; lockVehicle: (locked: boolean) => void; routes: Route[]; setRoutes: (r: Route[]) => void; selected: Route | null; select: (r: Route | null) => void; saved: Route[]; save: (r: Route) => Promise<void>; remove: (id: string) => Promise<void>; ready: boolean; }
const Context = createContext<Store>(null!);
export const useStore = () => useContext(Context);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [garage, setGarage] = useState(defaultGarage), [routes, setRoutes] = useState<Route[]>([]);
  const [navigationOptions, setNavigationOptions] = useState(defaultNavigationOptions);
  const [places, setPlaces] = useState<SavedPlace[]>([]), [pendingJourney, requestJourney] = useState<Journey | null>(null), [paces, setPaces] = useState<RidePace[]>([]);
  const [batteryRides, setBatteryRides] = useState<RecordedRide[]>([]);
  const [vehicleLocked, lockVehicle] = useState(false);
  const [selected, select] = useState<Route | null>(null), [saved, setSaved] = useState<Route[]>([]), [ready, setReady] = useState(false);
  useEffect(() => { (async () => {
    try {
      const [p, r, g, n] = await Promise.all([AsyncStorage.getItem('profile-v1'), AsyncStorage.getItem('routes-v1'), AsyncStorage.getItem('vehicles-v1'), AsyncStorage.getItem('navigation-v1')]);
      const garage = restoreGarage(g, p); const preferences=restorePreferences(n, garage.vehicles.find(v => v.id === garage.activeId) || garage.vehicles[0]); if (!preferences.showSharingVehicle && garage.activeId === 'sharing-scooter') garage.activeId=garage.vehicles.find(v=>v.id !== 'sharing-scooter')!.id; setGarage(garage);
      setNavigationOptions(preferences);
      await loadMapSettings().catch(console.warn); setSaved(await loadSavedRoutes(r)); setPlaces(restorePlaces(await AsyncStorage.getItem('places-v1')));
    } catch { /* Corrupt local data: keep an empty planner. */ }
    setReady(true);
  })(); }, []);
  useEffect(() => { if (ready) AsyncStorage.setItem('vehicles-v1', JSON.stringify(garage)).catch(console.warn); }, [garage, ready]);
  useEffect(() => { if (ready) AsyncStorage.setItem('navigation-v1', JSON.stringify(navigationOptions)).catch(console.warn); }, [navigationOptions, ready]);
  useEffect(() => { if (ready) AsyncStorage.setItem('places-v1', JSON.stringify(places)).catch(console.warn); }, [places, ready]);
  useEffect(() => {
    let cancelled = false, running = false; const cache = new Map<string, {samples: number; pace: RidePace | null}>();
    const refresh = async () => { if (running) return; running = true; try { const rides = await recordedRides(); if (!cancelled) setBatteryRides(rides); const ids = new Set(rides.map(r => r.id)); for (const id of cache.keys()) if (!ids.has(id)) cache.delete(id);
      for (const r of rides) if (['finished','arrived'].includes(r.status) && cache.get(r.id)?.samples !== r.samples) { const pace = measuredPace(r, await rideSamples(r)); if (cancelled) return; cache.set(r.id, {samples:r.samples,pace}); }
      if (!cancelled) setPaces(rides.map(r=>cache.get(r.id)?.pace).filter((r): r is RidePace => !!r));
    } catch { /* Keep modeled ETA when records cannot be read. */ } finally { running = false; } }; void refresh(); const unsubscribe = subscribeRides(()=>void refresh()); const timer = setInterval(()=>void refresh(),10000); return () => { cancelled = true; clearInterval(timer); unsubscribe(); };
  }, []);
  async function save(route: Route) { setSaved(await saveRoute(route)); }
  async function remove(id: string) { setSaved(await removeRoute(id)); }
  const baseProfile = garage.vehicles.find(v => v.id === garage.activeId) || garage.vehicles[0];
  const learned = useMemo(() => navigationOptions.learnedEta ? learnedPace(paces, baseProfile) : null, [paces, baseProfile, navigationOptions.learnedEta]);
  const battery = useMemo(() => learnedBatteryRange(batteryRides, baseProfile), [batteryRides, baseProfile]);
  const profile = { ...baseProfile, learnedRangeKm: battery?.rangeKm, learnedBatteryRideCount: battery?.count, learnedSpeedKmh: learned?.speedKmh, learnedRideCount: learned?.count };
  return <Context.Provider value={{ places, addPlace: p => setPlaces(v => [...v, {...p, id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`}]), deletePlace: id => setPlaces(v => v.filter(p => p.id !== id)), renamePlace: (id,name) => setPlaces(v=>renameSavedPlace(v,id,name)), pendingJourney, requestJourney, navigationOptions, updateNavigationOptions: p => { if (p.showSharingVehicle === false && garage.activeId === 'sharing-scooter') { if (vehicleLocked) return; setGarage(g => ({...g, activeId:g.vehicles.find(v => v.id !== 'sharing-scooter')?.id || g.activeId})); } setNavigationOptions(v => ({ ...v, ...p })); }, profile, vehicles: garage.vehicles.filter(v => navigationOptions.showSharingVehicle || v.id !== 'sharing-scooter'), vehicleLocked, lockVehicle, chooseVehicle: id => !vehicleLocked && setGarage(g => g.vehicles.some(v => v.id === id) ? { ...g, activeId: id } : g), addVehicle: kind => { if (vehicleLocked) return; const v = createVehicle(kind); setGarage(g => ({ ...g, vehicles: [...g.vehicles, v] })); return v.id; }, deleteVehicle: id => !vehicleLocked && setGarage(g => removeVehicle(g, id)), updateProfile: (p, id) => !vehicleLocked && setGarage(g => ({ ...g, vehicles: g.vehicles.map(v => v.id === (id || g.activeId) ? { ...v, ...p, id: v.id, ...(v.id === 'sharing-scooter' ? {maxSpeed:25,ridingLimit:20} : {}) } : v) })), routes, setRoutes, selected, select, saved, save, remove, ready }}>{children}</Context.Provider>;
}
