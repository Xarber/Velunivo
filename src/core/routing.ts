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
  let details = path.details ?? {};
  const metadataWarnings: string[] = [];
  try {
    if (!path.details || typeof details !== 'object' || Array.isArray(details)) throw new Error('Missing road details');
    for (const key of Object.keys(details)) if (!Array.isArray(details[key]) || details[key].some((d: any) => !Array.isArray(d) || d.length !== 3 || !Number.isInteger(d[0]) || !Number.isInteger(d[1]) || d[0] < 0 || d[1] >= coords.length || d[1] <= d[0])) throw new Error('Routing service returned invalid road details.');
  } catch { details = {}; metadataWarnings.push('Road details are unverified. Road access and street speed limits are unknown.'); }
  let instructions = path.instructions ?? [];
  try {
    if (!instructions.length) throw new Error('Missing turn instructions');
    if (!Array.isArray(instructions) || instructions.some((s: any) => typeof s.text !== 'string' || !Number.isFinite(s.sign) || !Number.isInteger(s.interval?.[0]) || s.interval[0] < 0 || s.interval[0] >= coords.length)) throw new Error('Routing service returned invalid turn instructions.');
  } catch { instructions = []; metadataWarnings.push('Turn instructions are unavailable. Follow the mapped route; spoken turn guidance is unavailable.'); }
  const safetyWarnings = [...new Set<string>([...metadataWarnings,...(details.road_class ?? []).filter((d: any) => ['MOTORWAY', 'TRUNK', 'STEPS', 'FERRY'].includes(d[2])).map((d: any) => `Includes ${String(d[2]).toLowerCase()}; check vehicle access.`), ...(details.max_speed ?? []).filter((d: any) => Number(d[2]) > 50).map((d: any) => `Includes a road with a mapped speed limit of ${d[2]} km/h.`)])];
  return { id: `${kind}-${Date.now()}`, kind, name: kind === 'bike' ? 'Bicycle candidate' : 'Car-road candidate', coordinates: coords.map((p: any) => [p[0], p[1]]), details, source: 'graphhopper', steps: instructions.map((s: any) => ({ text: s.text, sign: s.sign, index: s.interval[0], distance: s.distance ?? 0 })), safetyWarnings, warnings: [...safetyWarnings, 'Scooter access and urban-road status are unverified. Check signs and local rules.', 'Routing avoids motorways, trunk roads, steps, ferries and known roads above 50 km/h where supported.'] };
}
