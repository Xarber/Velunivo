import { Coord, Profile, Route } from '../core/types';
import { requestJson } from './request';
import { fromGraphHopper } from '../core/routing';
export const serverUrl = process.env.EXPO_PUBLIC_ROUTING_URL ?? '';
export async function fetchRoute(start: Coord, end: Coord, kind: 'bike' | 'car', profile: Profile): Promise<Route> {
  if (!serverUrl) throw new Error('Set EXPO_PUBLIC_ROUTING_URL to your routing server. The sample GPX works without a key.');
  const { response, body } = await requestJson(`${serverUrl.replace(/\/$/, '')}/route`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start, end, kind, maxSpeed: profile.maxSpeed, ridingLimit: profile.ridingLimit }) });
  if (!response.ok) throw new Error(body.error || `Routing error ${response.status}`);
  if (!body.paths?.[0]) throw new Error('No route found.');
  return { ...fromGraphHopper(body.paths[0], kind), plannedCap: Math.min(profile.maxSpeed, profile.ridingLimit) };
}

export interface AddressResult { label: string; coordinate: Coord; }
export async function searchAddresses(query: string): Promise<AddressResult[]> {
  if (!serverUrl) throw new Error('Address search is not configured yet. You can choose either location on the map.');
  const { response, body } = await requestJson(`${serverUrl.replace(/\/$/, '')}/geocode?q=${encodeURIComponent(query.trim())}`, {}, 15000);
  if (!response.ok) throw new Error(body.error || 'Address search unavailable');
  return body.results;
}
