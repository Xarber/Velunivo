import { cumulative, distance } from './geo';
import { Profile, Route } from './types';
const valueAt = (r: Route, key: string, i: number) => r.details[key]?.find(([from, to]) => i >= from && i < to)?.[2];
export function estimate(route: Route, profile: Profile, from = 0) {
  const cap = Math.max(1, Math.min(profile.maxSpeed, profile.ridingLimit));
  const learned = Number.isFinite(profile.learnedSpeedKmh) && (profile.learnedRideCount ?? 0) >= 3 && profile.learnedSpeedKmh! >= 2;
  const cruise = learned ? Math.min(cap, profile.learnedSpeedKmh!) : cap * Math.max(0.2, Math.min(1, profile.cruiseFactor));
  const lengths = cumulative(route.coordinates);
  let meters = 0, seconds = 0;
  for (let i = 0; i < route.coordinates.length - 1; i++) {
    const whole = distance(route.coordinates[i], route.coordinates[i + 1]);
    const d = Math.max(0, lengths[i + 1] - Math.max(from, lengths[i]));
    if (!whole || !d) continue;
    const speed = Number(valueAt(route, 'average_speed', i));
    const limit = Number(valueAt(route, 'max_speed', i));
    const road = valueAt(route, 'road_class', i);
    const surface = valueAt(route, 'surface', i);
    const context = road === 'LIVING_STREET' ? 10 : road === 'PATH' || road === 'CYCLEWAY' ? 18 : Infinity;
    const rough = ['GRAVEL', 'GROUND', 'SAND', 'DIRT', 'COBBLESTONE'].includes(String(surface)) ? 12 : Infinity;
    const actual = Math.max(1, Math.min(cruise, speed > 0 ? speed : Infinity, limit > 0 ? limit : Infinity, context, rough));
    meters += d;
    seconds += d / (actual / 3.6);
  }
  const turns = route.steps.filter(s => s.sign !== 0 && s.sign !== 4 && lengths[s.index] > from).length;
  // Assumed stop + acceleration loss per maneuver, not traffic prediction.
  if (!learned) seconds += turns * (profile.stopDelay + cruise / 3.6 / Math.max(0.1, profile.acceleration) / 2);
  return { learned: !!learned, meters, minimumSeconds: meters / (cap / 3.6), seconds, cap, turns };
}
export const minutes = (s: number) => `${Math.max(1, Math.ceil(s / 60))} min`;
export const km = (m: number) => `${(m / 1000).toFixed(1)} km`;
