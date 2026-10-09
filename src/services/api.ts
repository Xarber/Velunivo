import { Coord, Profile, Route } from '../core/types';
import { fromGraphHopper } from '../core/routing';
export const serverUrl = process.env.EXPO_PUBLIC_ROUTING_URL ?? '';
export async function fetchRoute(start: Coord, end: Coord, kind: 'bike' | 'car', profile: Profile): Promise<Route> {
  if (!serverUrl) throw new Error('Set EXPO_PUBLIC_ROUTING_URL to your routing server. The sample GPX works without a key.');
  const response = await fetch(`${serverUrl.replace(/\/$/, '')}/route`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start, end, kind, maxSpeed: profile.maxSpeed, ridingLimit: profile.ridingLimit }), signal: AbortSignal.timeout(25000) });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || `Routing error ${response.status}`);
  if (!body.paths?.[0]) throw new Error('No route found.');
  return fromGraphHopper(body.paths[0], kind);
}
