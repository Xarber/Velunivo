import { photonResults, AddressResult } from '../core/addresses';
import { Coord, Profile, Route } from '../core/types';
import { requestJson } from './request';
import { fromValhalla, valhallaRequest, valhallaAttributesRequest } from '../core/valhalla';
import { fromGraphHopper } from '../core/routing';
export type { AddressResult } from '../core/addresses';
export const serverUrl = process.env.EXPO_PUBLIC_ROUTING_URL ?? '';
export async function fetchRoute(start: Coord, end: Coord, kind: 'bike' | 'car', profile: Profile): Promise<Route> {
  if (!serverUrl) {
    const q = valhallaRequest(start, end, kind, profile), data = await publicJson('https://valhalla1.openstreetmap.de/route', q);
    const shape = data?.trip?.legs?.[0]?.shape; if (!shape) throw new Error('No route found');
    const attributes = await publicJson('https://valhalla1.openstreetmap.de/trace_attributes', valhallaAttributesRequest(shape, q)).catch(error => ({ verificationError: error instanceof Error ? error.message : 'Road verification unavailable' }));
    return fromValhalla(data, attributes, kind, Math.min(profile.maxSpeed, profile.ridingLimit), [start, end]);
  }
  const { response, body } = await requestJson(`${serverUrl.replace(/\/$/, '')}/route`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start, end, kind, maxSpeed: profile.maxSpeed, ridingLimit: profile.ridingLimit }) });
  if (!response.ok) throw new Error(body.error || `Routing error ${response.status}`);
  if (body.route) return body.route as Route;
  if (!body.paths?.[0]) throw new Error('No route found.');
  return { ...fromGraphHopper(body.paths[0], kind), plannedCap: Math.min(profile.maxSpeed, profile.ridingLimit) };
}

export async function searchAddresses(query: string): Promise<AddressResult[]> {
  if (query.trim().length < 3 || query.length > 200) throw new Error('Enter an address or place between 3 and 200 characters.');
  if (!serverUrl) { const data = await publicJson(`https://photon.komoot.io/api/?q=${encodeURIComponent(query.trim())}&limit=5`); return photonResults(data); }
  const { response, body } = await requestJson(`${serverUrl.replace(/\/$/, '')}/geocode?q=${encodeURIComponent(query.trim())}`, {}, 15000);
  if (!response.ok) throw new Error(body.error || 'Address search unavailable');
  return body.results.map((r: any) => ({...r, name:r.name || r.label.split(',')[0],address:r.address || r.label}));
}

let publicQueue = Promise.resolve();
const publicCache = new Map<string, { until: number; body: any }>();
async function publicJson(url: string, payload?: unknown) {
  const id = url + JSON.stringify(payload || null), cached = publicCache.get(id); if (cached && cached.until > Date.now()) return cached.body;
  const previous = publicQueue; let release!: () => void; publicQueue = new Promise<void>(r => { release = r; }); await previous;
  try { const { response, body } = await requestJson(url, payload ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) } : {}, 20000); if (!response.ok) throw new Error(response.status === 429 ? 'Public service is busy. Wait a moment and try again.' : body.error || 'Public routing service unavailable'); if (publicCache.size >= 100) publicCache.delete(publicCache.keys().next().value!); publicCache.set(id, { until: Date.now() + 300000, body }); return body; }
  finally { setTimeout(release, 1000); }
}
