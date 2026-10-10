import { photonResults } from '../src/core/addresses';
import { fromValhalla, valhallaRequest, valhallaAttributesRequest } from '../src/core/valhalla';
import { Coord, Profile } from '../src/core/types';
const valhalla = process.env.VALHALLA_URL || 'https://valhalla1.openstreetmap.de';
const photon = process.env.PHOTON_URL || 'https://photon.komoot.io';
let queue = Promise.resolve();
// Public demos: serialized, at most one upstream call per second. Deploy your own providers for production.
async function provider(url: string, body?: unknown) {
  const before = queue; let release!: () => void; queue = new Promise<void>(r => { release = r; }); await before;
  try { const response = await fetch(url, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'User-Agent': 'Velunivo/0.1 (https://github.com/Xarber/Velunivo)' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000) }); const data = await response.json(); if (!response.ok) throw new Error(response.status === 429 ? 'Public provider is busy. Wait a moment and try again.' : data.error || 'Routing provider unavailable'); return data; }
  finally { setTimeout(release, 1000); }
}
const cache = new Map<string, { until: number; data: unknown }>();
export async function addresses(query: string) {
  const id = `search:${query.toLowerCase()}`, hit = cache.get(id); if (hit && hit.until > Date.now()) return hit.data;
  const data = await provider(`${photon}/api/?q=${encodeURIComponent(query)}&limit=5`);
  const results = photonResults(data);
  remember(id, results); return results;
}
function remember(id: string, data: unknown) { if (cache.size >= 100) cache.delete(cache.keys().next().value!); cache.set(id, { until: Date.now() + 300000, data }); }
export async function publicRoute(start: Coord, end: Coord, kind: 'bike' | 'car', profile: Profile) {
  const q = valhallaRequest(start, end, kind, profile), id = JSON.stringify(q), hit = cache.get(id); if (hit && hit.until > Date.now()) return hit.data;
  const data = await provider(`${valhalla}/route`, q), shape = data?.trip?.legs?.[0]?.shape;
  if (!shape) throw new Error('No route found');
  const attributes = await provider(`${valhalla}/trace_attributes`, valhallaAttributesRequest(shape, q)).catch(error => ({ verificationError: error instanceof Error ? error.message : 'Road verification unavailable' }));
  const route = fromValhalla(data, attributes, kind, Math.min(profile.maxSpeed, profile.ridingLimit), [start, end]); remember(id, route); return route;
}
