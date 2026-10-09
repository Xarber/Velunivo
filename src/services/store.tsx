import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vehicle, Route, NavigationOptions, defaultNavigationOptions } from '../core/types';
import { createVehicle, defaultGarage, removeVehicle, restoreGarage } from '../core/vehicles';
interface Store { navigationOptions: NavigationOptions; updateNavigationOptions: (p: Partial<NavigationOptions>) => void; profile: Vehicle; vehicles: Vehicle[]; chooseVehicle: (id: string) => void; addVehicle: (kind: Vehicle['kind']) => void; deleteVehicle: (id: string) => void; updateProfile: (p: Partial<Vehicle>, id?: string) => void; vehicleLocked: boolean; lockVehicle: (locked: boolean) => void; routes: Route[]; setRoutes: (r: Route[]) => void; selected: Route | null; select: (r: Route | null) => void; saved: Route[]; save: (r: Route) => Promise<void>; remove: (id: string) => Promise<void>; ready: boolean; }
const Context = createContext<Store>(null!);
export const useStore = () => useContext(Context);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [garage, setGarage] = useState(defaultGarage), [routes, setRoutes] = useState<Route[]>([]);
  const [navigationOptions, setNavigationOptions] = useState(defaultNavigationOptions);
  const [vehicleLocked, lockVehicle] = useState(false);
  const [selected, select] = useState<Route | null>(null), [saved, setSaved] = useState<Route[]>([]), [ready, setReady] = useState(false);
  useEffect(() => { (async () => {
    try {
      const [p, r, g, n] = await Promise.all([AsyncStorage.getItem('profile-v1'), AsyncStorage.getItem('routes-v1'), AsyncStorage.getItem('vehicles-v1'), AsyncStorage.getItem('navigation-v1')]);
      setGarage(restoreGarage(g, p));
      try { const v = n && JSON.parse(n); if (v) setNavigationOptions({ compass: typeof v.compass === 'boolean' ? v.compass : true, tilted: v.tilted === true, unit: v.unit === 'mi' ? 'mi' : 'km' }); } catch { /* Keep default camera preferences. */ }
      if (r) { const v = JSON.parse(r); if (Array.isArray(v) && v.every(x => Array.isArray(x.coordinates) && x.coordinates.length >= 2 && Array.isArray(x.steps))) setSaved(v.filter(x => x.id !== 'illustrative-track')); }
    } catch { /* Corrupt local data: keep an empty planner. */ }
    setReady(true);
  })(); }, []);
  useEffect(() => { if (ready) AsyncStorage.setItem('vehicles-v1', JSON.stringify(garage)).catch(console.warn); }, [garage, ready]);
  useEffect(() => { if (ready) AsyncStorage.setItem('navigation-v1', JSON.stringify(navigationOptions)).catch(console.warn); }, [navigationOptions, ready]);
  async function save(route: Route) {
    const next = [{ ...route, savedAt: Date.now() }, ...saved.filter(r => r.id !== route.id)].slice(0, 20);
    await AsyncStorage.setItem('routes-v1', JSON.stringify(next)); setSaved(next);
  }
  async function remove(id: string) { const next = saved.filter(r => r.id !== id); await AsyncStorage.setItem('routes-v1', JSON.stringify(next)); setSaved(next); }
  const profile = garage.vehicles.find(v => v.id === garage.activeId) || garage.vehicles[0];
  return <Context.Provider value={{ navigationOptions, updateNavigationOptions: p => setNavigationOptions(v => ({ ...v, ...p })), profile, vehicles: garage.vehicles, vehicleLocked, lockVehicle, chooseVehicle: id => !vehicleLocked && setGarage(g => g.vehicles.some(v => v.id === id) ? { ...g, activeId: id } : g), addVehicle: kind => { if (vehicleLocked) return; const v = createVehicle(kind); setGarage(g => ({ vehicles: [...g.vehicles, v], activeId: v.id })); }, deleteVehicle: id => !vehicleLocked && setGarage(g => removeVehicle(g, id)), updateProfile: (p, id) => !vehicleLocked && setGarage(g => ({ ...g, vehicles: g.vehicles.map(v => v.id === (id || g.activeId) ? { ...v, ...p, id: v.id } : v) })), routes, setRoutes, selected, select, saved, save, remove, ready }}>{children}</Context.Provider>;
}
