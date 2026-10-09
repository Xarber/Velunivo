import { Coord, Fix, Route } from './types';
export const normalizeHeading = (degrees: number) => ((degrees % 360) + 360) % 360;
export function smoothHeading(previous: number | null, next: number, fraction = .3) {
  if (previous === null) return normalizeHeading(next);
  const delta = normalizeHeading(next - previous + 180) - 180;
  return normalizeHeading(previous + delta * fraction);
}
export function bearing(from: Coord, to: Coord) {
  if (from[0] === to[0] && from[1] === to[1]) return null;
  const rad = Math.PI / 180, a = from[1] * rad, b = to[1] * rad, d = (to[0] - from[0]) * rad;
  return normalizeHeading(Math.atan2(Math.sin(d) * Math.cos(b), Math.cos(a) * Math.sin(b) - Math.sin(a) * Math.cos(b) * Math.cos(d)) / rad);
}
export function freshFix(fix: Fix | null, now = Date.now()) {
  return !!fix && fix.accuracy >= 0 && fix.accuracy <= 35 && now - fix.timestamp < 15000 && now >= fix.timestamp - 1000;
}
export function roadSpeedLimit(route: Route | null, index: number | undefined) {
  if (!route || index === undefined) return null;
  const d = route.details.max_speed?.find(([a, b]) => index >= a && index < b), n = d ? Number(d[2]) : NaN;
  return Number.isFinite(n) && n > 0 && n <= 200 ? n : null;
}
export const displaySpeed = (kmh: number, unit: 'km' | 'mi') => unit === 'mi' ? kmh / 1.609344 : kmh;
export function distanceLeft(meters: number, unit: 'km' | 'mi') { return `${(meters / 1000 / (unit === 'mi' ? 1.609344 : 1)).toFixed(1)} ${unit === 'mi' ? 'mi' : 'km'}`; }
export function arrivalTime(seconds: number, now = Date.now()) {
  const arrival = new Date(now + seconds * 1000), today = new Date(now);
  const time = arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return arrival.toDateString() === today.toDateString() ? time : `${arrival.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
}
export function forwardHeading(route: Route | null, index: number | undefined, fix: Fix | null) {
  if (fix?.heading !== undefined && Number.isFinite(fix.heading) && fix.heading >= 0 && fix.heading < 360 && (fix.speed ?? 0) >= 1) return { heading: fix.heading, source: 'GPS direction' };
  // A route tangent keeps web navigation forward-facing when course is unavailable or stationary.
  if (route && index !== undefined) {
    for (let i = index; i < route.coordinates.length - 1; i++) { const h = bearing(route.coordinates[i], route.coordinates[i + 1]); if (h !== null) return { heading: h, source: 'Route direction' }; }
  }
  return { heading: 0, source: 'Direction unavailable' };
}
