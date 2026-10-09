import { Coord, Profile, Route, RouteKind } from './types';
export function routeRequest(start: Coord, end: Coord, kind: 'car' | 'bike', profile: Profile) {
  return {
    points: [start, end], profile: kind, points_encoded: false, instructions: true,
    locale: 'en', 'ch.disable': true,
    details: ['road_class', 'surface', 'average_speed', 'max_speed'],
    custom_model: {
      speed: [{ if: 'true', limit_to: String(Math.min(profile.maxSpeed, profile.ridingLimit)) }],
      priority: [
        { if: 'road_class == MOTORWAY || road_class == TRUNK || road_class == STEPS', multiply_by: '0' },
        { if: 'road_environment == FERRY', multiply_by: '0' },
        { if: 'max_speed > 50', multiply_by: '0' },
        { if: 'surface == SAND || surface == GRAVEL || surface == GROUND', multiply_by: '0.2' },
      ], distance_influence: 100,
    },
  };
}
export function fromGraphHopper(path: any, kind: RouteKind): Route {
  const coords = path?.points?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2 || coords.length > 20000 || coords.some((p: any) => !Array.isArray(p) || p.length < 2 || !Number.isFinite(p[0]) || !Number.isFinite(p[1]) || Math.abs(p[0]) > 180 || Math.abs(p[1]) > 85)) throw new Error('Routing service returned invalid geometry.');
  const details = path.details ?? {};
  for (const key of Object.keys(details)) if (!Array.isArray(details[key]) || details[key].some((d: any) => !Array.isArray(d) || d.length !== 3 || !Number.isInteger(d[0]) || !Number.isInteger(d[1]) || d[0] < 0 || d[1] >= coords.length || d[1] <= d[0])) throw new Error('Routing service returned invalid road details.');
  const instructions = path.instructions ?? [];
  if (!Array.isArray(instructions) || instructions.some((s: any) => typeof s.text !== 'string' || !Number.isFinite(s.sign) || !Number.isInteger(s.interval?.[0]) || s.interval[0] < 0 || s.interval[0] >= coords.length)) throw new Error('Routing service returned invalid turn instructions.');
  if ((details.road_class ?? []).some((d: any) => ['MOTORWAY', 'TRUNK', 'STEPS'].includes(d[2])) || (details.max_speed ?? []).some((d: any) => Number(d[2]) > 50)) throw new Error('Candidate contains an excluded road. Choose another destination or profile.');
  return { id: `${kind}-${Date.now()}`, kind, name: kind === 'bike' ? 'Bicycle candidate' : 'Car-road candidate', coordinates: coords.map((p: any) => [p[0], p[1]]), details, source: 'graphhopper', steps: instructions.map((s: any) => ({ text: s.text, sign: s.sign, index: s.interval[0], distance: s.distance ?? 0 })), warnings: ['Scooter access and urban-road status are unverified. Check signs and local rules.', 'Motorway, trunk, steps, ferries and known roads above 50 km/h excluded.'] };
}
