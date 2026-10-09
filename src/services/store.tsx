import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultProfile, Profile, Route } from '../core/types';
import example from '../core/example.json';
const sample = example as unknown as Route;
interface Store { profile: Profile; updateProfile: (p: Partial<Profile>) => void; routes: Route[]; setRoutes: (r: Route[]) => void; selected: Route | null; select: (r: Route | null) => void; saved: Route[]; save: (r: Route) => Promise<void>; remove: (id: string) => Promise<void>; ready: boolean; }
const Context = createContext<Store>(null!);
export const useStore = () => useContext(Context);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState(defaultProfile), [routes, setRoutes] = useState<Route[]>([sample]);
  const [selected, select] = useState<Route | null>(sample), [saved, setSaved] = useState<Route[]>([]), [ready, setReady] = useState(false);
  useEffect(() => { (async () => {
    try {
      const [p, r] = await Promise.all([AsyncStorage.getItem('profile-v1'), AsyncStorage.getItem('routes-v1')]);
      if (p) { const v = JSON.parse(p); if (v.maxSpeed > 0 && v.maxSpeed <= 60 && v.ridingLimit > 0 && v.ridingLimit <= 60 && v.cruiseFactor >= .2 && v.cruiseFactor <= 1 && v.acceleration >= .1 && v.acceleration <= 4 && v.stopDelay >= 0 && v.stopDelay <= 120) setProfile({ ...defaultProfile, ...v }); }
      if (r) { const v = JSON.parse(r); if (Array.isArray(v) && v.every(x => Array.isArray(x.coordinates) && x.coordinates.length >= 2 && Array.isArray(x.steps))) setSaved(v); }
    } catch { /* Corrupt local data: keep the sample, never replace it with fake routing. */ }
    setReady(true);
  })(); }, []);
  useEffect(() => { if (ready) AsyncStorage.setItem('profile-v1', JSON.stringify(profile)).catch(console.warn); }, [profile, ready]);
  async function save(route: Route) {
    const next = [{ ...route, savedAt: Date.now() }, ...saved.filter(r => r.id !== route.id)].slice(0, 20);
    await AsyncStorage.setItem('routes-v1', JSON.stringify(next)); setSaved(next);
  }
  async function remove(id: string) { const next = saved.filter(r => r.id !== id); await AsyncStorage.setItem('routes-v1', JSON.stringify(next)); setSaved(next); }
  return <Context.Provider value={{ profile, updateProfile: p => setProfile(v => ({ ...v, ...p })), routes, setRoutes, selected, select, saved, save, remove, ready }}>{children}</Context.Provider>;
}
