import { Coord } from './types';
export type MapsProvider = 'apple' | 'google';
export type MapsMode = 'bike' | 'car';
export interface ExternalNavigation { start: Coord; end: Coord; errors: string[]; }
function endpoint(point: Coord) {
  if (!Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite) || Math.abs(point[0]) > 180 || Math.abs(point[1]) > 90) throw new Error('Choose valid start and destination locations.');
  return `${point[1]},${point[0]}`;
}
// Public universal links: installed map app where supported, otherwise browser.
// Send selected endpoints, never the provider's possibly snapped route endpoints.
export function mapsDirectionsUrl(provider: MapsProvider, start: Coord, end: Coord, mode: MapsMode = 'bike') {
  const origin = endpoint(start), destination = endpoint(end);
  const query = provider === 'apple'
    ? { source: origin, destination, mode: mode === 'bike' ? 'cycling' : 'driving', avoid: mode === 'bike' ? 'busy-roads,stairs' : 'highways' }
    : { api: '1', origin, destination, travelmode: mode === 'bike' ? 'bicycling' : 'driving', dir_action: 'navigate', avoid: 'highways,ferries' };
  return (provider === 'apple' ? 'https://maps.apple.com/directions?' : 'https://www.google.com/maps/dir/?') + Object.entries(query).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
}
