import { fromValhalla, valhallaRequest } from '../src/core/valhalla';
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
  const results = (data.features || []).filter((f: any) => f.geometry?.type === 'Point' && f.geometry.coordinates?.every(Number.isFinite)).map((f: any) => ({ coordinate: f.geometry.coordinates.slice(0, 2), label: [...new Set([f.properties.name, [f.properties.street, f.properties.housenumber].filter(Boolean).join(' '), f.properties.postcode, f.properties.city, f.properties.country].filter(Boolean))].join(', ') }));
  remember(id, results); return results;
}
function remember(id: string, data: unknown) { if (cache.size >= 100) cache.delete(cache.keys().next().value!); cache.set(id, { until: Date.now() + 300000, data }); }
export async function publicRoute(start: Coord, end: Coord, kind: 'bike' | 'car', profile: Profile) {
  const q = valhallaRequest(start, end, kind, profile), id = JSON.stringify(q), hit = cache.get(id); if (hit && hit.until > Date.now()) return hit.data;
  const data = await provider(`${valhalla}/route`, q), shape = data?.trip?.legs?.[0]?.shape;
  if (!shape) throw new Error('No route found');
  const attributes = await provider(`${valhalla}/trace_attributes`, { encoded_polyline: shape, shape_match: 'edge_walk', costing: q.costing, units: 'kilometers', filters: { action: 'include', attributes: ['shape', 'edge.speed_limit', 'edge.begin_shape_index', 'edge.end_shape_index', 'edge.road_class', 'edge.use', 'edge.surface'] } });
  const route = fromValhalla(data, attributes, kind, Math.min(profile.maxSpeed, profile.ridingLimit), [start, end]); remember(id, route); return route;
}
