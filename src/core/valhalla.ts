import { distance } from './geo';
import { Coord, Profile, Route, Detail } from './types';
export function decodeShape(shape: string): Coord[] {
  if (typeof shape !== 'string' || shape.length > 400000) throw new Error('Invalid route shape');
  let cursor = 0, lat = 0, lon = 0; const points: Coord[] = [];
  function number() { let result = 0, shift = 0, byte: number; do { if (cursor >= shape.length || shift > 30) throw new Error('Truncated route shape'); byte = shape.charCodeAt(cursor++) - 63; if (byte < 0 || byte > 63) throw new Error('Invalid route encoding'); result |= (byte & 31) << shift; shift += 5; } while (byte >= 32); return result & 1 ? ~(result >> 1) : result >> 1; }
  while (cursor < shape.length) { lat += number(); lon += number(); const p: Coord = [lon / 1e6, lat / 1e6]; if (Math.abs(p[0]) > 180 || Math.abs(p[1]) > 85 || points.length >= 20000) throw new Error('Invalid route coordinates'); points.push(p); }
  if (points.length < 2) throw new Error('No route geometry'); return points;
}
export function valhallaRequest(start: Coord, end: Coord, kind: 'bike' | 'car', profile: Pick<Profile, 'maxSpeed' | 'ridingLimit'>) {
  const costing = kind === 'bike' ? 'bicycle' : 'auto', cap = Math.min(profile.maxSpeed, profile.ridingLimit);
  return { locations: [start, end].map(([lon, lat]) => ({ lon, lat })), costing, units: 'kilometers', directions_options: { language: 'en-US' }, costing_options: { [costing]: { exclude_highways: true, exclude_ferries: true, use_ferry: 0, use_highways: 0, speed_types: ['freeflow'], ...(kind === 'car' ? { top_speed: Math.max(10, cap), use_distance: .6 } : { bicycle_type: 'hybrid', cycling_speed: Math.max(5, Math.min(60, cap)), avoid_bad_surfaces: 1, use_roads: .4 }) } } };
}
// Preserve the exact route's costing options when matching its roads. Otherwise
// bicycle access/preferences can produce a different path in the second request.
export function valhallaAttributesRequest(shape: string, request: ReturnType<typeof valhallaRequest>) {
  const { locations: _locations, ...options } = request;
  return { ...options, encoded_polyline: shape, shape_match: 'walk_or_snap', filters: { action: 'include', attributes: ['shape', 'edge.speed_limit', 'edge.begin_shape_index', 'edge.end_shape_index', 'edge.road_class', 'edge.use', 'edge.surface'] } };
}
export function fromValhalla(data: any, attributes: any, kind: 'bike' | 'car', cap: number, requested?: [Coord, Coord]): Route {
  const leg = data?.trip?.legs?.[0]; if (!leg || data.trip.legs.length !== 1) throw new Error('Unsupported route legs');
  if (typeof attributes?.shape !== 'string' || !Array.isArray(attributes.edges) || !attributes.edges.length) throw new Error('Road details could not be verified. Try again.');
  const original = decodeShape(leg.shape), coordinates = decodeShape(attributes.shape);
  // Polyline strings can differ through endpoint rounding. Indexes remain safe
  // only if every point corresponds in order within one metre. Never accept a
  // different snapped street or attach attribute indexes to another geometry.
  if (original.length !== coordinates.length || original.some((p, i) => distance(p, coordinates[i]) > 1)) throw new Error('Road verification matched a different path. Choose another endpoint or try again.');
  const details: Record<string, Detail[]> = { max_speed: [], road_class: [], surface: [] };
  let unknown = false, covered = 0;
  const risks = new Set<string>();
  for (const e of attributes.edges) {
    const a = e.begin_shape_index, b = e.end_shape_index, limit = Number(e.speed_limit);
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b >= coordinates.length || b < a) throw new Error('Invalid road interval');
    if (['motorway', 'trunk'].includes(e.road_class)) risks.add(`Includes a ${e.road_class} road, which may prohibit this vehicle.`);
    if (['steps', 'ferry', 'rail-ferry'].includes(e.use)) risks.add(`Includes ${e.use}; check access and whether you must dismount or arrange transport.`);
    if (limit > 50) risks.add(limit === 255 ? 'Includes a road with an unlimited mapped speed limit.' : `Includes a road with a mapped speed limit of ${limit} km/h.`);
    if (a > covered) throw new Error('Road details contain an unchecked gap'); covered = Math.max(covered, b);
    if (a === b) continue;
    const road = ['cycleway', 'footway', 'path'].includes(e.use) ? e.use.toUpperCase() : String(e.road_class || 'UNKNOWN').toUpperCase();
    details.road_class.push([a, b, road]); details.surface.push([a, b, String(e.surface || 'UNKNOWN').toUpperCase()]);
    if (limit > 0 && limit <= 200) details.max_speed.push([a, b, limit]); else unknown = true;
  }
  if (covered !== coordinates.length - 1) throw new Error('Road details do not cover the full route');
  const signs: Record<number, number> = { 4: 4, 5: 4, 6: 4, 9: 2, 10: 2, 11: 3, 12: -8, 13: -8, 14: -3, 15: -2, 16: -1, 26: 6, 27: -6 };
  if (!Array.isArray(leg.maneuvers)) throw new Error('Missing route instructions');
  const steps = leg.maneuvers.map((m: any) => { if (!Number.isInteger(m.begin_shape_index) || m.begin_shape_index < 0 || m.begin_shape_index >= coordinates.length || typeof m.instruction !== 'string') throw new Error('Invalid maneuver'); return { text: m.instruction, sign: signs[m.type] ?? 0, index: m.begin_shape_index, distance: (m.length ?? 0) * 1000 }; });
  const endGap = requested ? distance(coordinates.at(-1)!, requested[1]) : 0, startGap = requested ? distance(coordinates[0], requested[0]) : 0;
  return { id: `${kind}-${Date.now()}`, kind, source: 'valhalla', name: kind === 'bike' ? 'Bicycle candidate' : 'Car-road candidate', coordinates, details, steps, plannedCap: cap, safetyWarnings: [...risks], warnings: [...risks,'Road access for e-scooters is not certified. Check local signs and rules.', 'Mapped limits are OpenStreetMap data and can be missing or outdated.', ...(endGap > 30 ? [`Road route ends ${Math.round(endGap)} m from the selected destination. Final access is unverified and not included in ETA.`] : []), ...(startGap > 50 ? [`Road route starts ${Math.round(startGap)} m from the selected start.`] : []), ...(unknown ? ['Some road speed limits are unknown.'] : [])] };
}
