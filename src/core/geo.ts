import { Coord } from './types';
const rad = Math.PI / 180;
export function distance(a: Coord, b: Coord): number {
  const x = Math.sin((b[1] - a[1]) * rad / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin((b[0] - a[0]) * rad / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, x)));
}
export function cumulative(points: Coord[]) {
  const result = [0];
  for (let i = 1; i < points.length; i++) result.push(result[i - 1] + distance(points[i - 1], points[i]));
  return result;
}
export function routeBounds(points: Coord[]): [number, number, number, number] {
  return [Math.min(...points.map(p => p[0])), Math.min(...points.map(p => p[1])), Math.max(...points.map(p => p[0])), Math.max(...points.map(p => p[1]))];
}
// Local tangent-plane projection; accurate enough for short street segments.
export function project(fix: Coord, points: Coord[], previousAlong?: number) {
  const lengths = cumulative(points);
  const scaleX = 111320 * Math.cos(fix[1] * rad), scaleY = 111320;
  let best = { crossTrack: Infinity, along: 0, index: 0, coordinate: points[0] };
  for (let i = 0; i < points.length - 1; i++) {
    if (previousAlong !== undefined && (lengths[i + 1] < previousAlong - 80 || lengths[i] > previousAlong + 500)) continue;
    const ax = (points[i][0] - fix[0]) * scaleX, ay = (points[i][1] - fix[1]) * scaleY;
    const dx = (points[i + 1][0] - points[i][0]) * scaleX, dy = (points[i + 1][1] - points[i][1]) * scaleY;
    const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
    const crossTrack = Math.hypot(ax + t * dx, ay + t * dy);
    if (crossTrack < best.crossTrack) best = { crossTrack, along: lengths[i] + t * (lengths[i + 1] - lengths[i]), index: i, coordinate: [points[i][0] + t * (points[i + 1][0] - points[i][0]), points[i][1] + t * (points[i + 1][1] - points[i][1])] };
  }
  return { ...best, total: lengths.at(-1) ?? 0 };
}
export function pointAt(points: Coord[], along: number): Coord {
  const lengths = cumulative(points);
  for (let i = 1; i < points.length; i++) if (lengths[i] >= along) {
    const t = (along - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
    return [points[i - 1][0] + (points[i][0] - points[i - 1][0]) * t, points[i - 1][1] + (points[i][1] - points[i - 1][1]) * t];
  }
  return points.at(-1)!;
}
export function parseCoordinate(text: string): Coord {
  const fields = text.split(',').map(s => s.trim());
  if (fields.length !== 2 || fields.some(s => !s)) throw new Error('Enter latitude, longitude, for example 45.46, 9.19.');
  const [lat, lon] = fields.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 85 || Math.abs(lon) > 180) throw new Error('Coordinates are outside the supported map range.');
  return [lon, lat];
}
