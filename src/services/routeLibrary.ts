import AsyncStorage from '@react-native-async-storage/async-storage';
import { Route } from '../core/types';
const indexKey = 'route-library-ids-v2', key = (id: string) => `route-library-v2:${id}`;
let pending: Promise<unknown> = Promise.resolve();
const valid = (v: unknown): v is Route => !!v && typeof v === 'object' && typeof (v as Route).id === 'string' && Array.isArray((v as Route).coordinates) && (v as Route).coordinates.length >= 2 && Array.isArray((v as Route).steps);
async function read(): Promise<Route[]> { const ids: string[] = JSON.parse(await AsyncStorage.getItem(indexKey) || '[]'); const values = await AsyncStorage.multiGet(ids.map(key)); return values.flatMap(([, value]) => { if (!value) return []; const r = JSON.parse(value); return valid(r) && r.id !== 'illustrative-track' ? [r] : []; }); }
export async function loadSavedRoutes(legacy: string | null): Promise<Route[]> {
  await pending;
  if (await AsyncStorage.getItem(indexKey) !== null) return read();
  let routes: Route[] = [];
  try { const v = legacy && JSON.parse(legacy); if (Array.isArray(v)) routes = v.filter(valid).filter(r => r.id !== 'illustrative-track'); } catch { /* Empty library recovers malformed legacy JSON. */ }
  if (routes.length) await AsyncStorage.multiSet(routes.map(r => [key(r.id), JSON.stringify(r)]));
  await AsyncStorage.setItem(indexKey, JSON.stringify(routes.map(r => r.id))); return routes;
}
function queue(task: () => Promise<Route[]>): Promise<Route[]> { const next = pending.then(task, task); pending = next.catch(() => {}); return next; }
export function saveRoute(route: Route): Promise<Route[]> { return queue(async () => { const all = await read(); await AsyncStorage.setItem(key(route.id), JSON.stringify({ ...route, savedAt: Date.now() })); await AsyncStorage.setItem(indexKey, JSON.stringify([route.id, ...all.filter(r => r.id !== route.id).map(r => r.id)])); return read(); }); }
export function removeRoute(id: string): Promise<Route[]> { return queue(async () => { const all = await read(); await AsyncStorage.setItem(indexKey, JSON.stringify(all.filter(r => r.id !== id).map(r => r.id))); await AsyncStorage.removeItem(key(id)); return read(); }); }
