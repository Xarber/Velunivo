import { cumulative, distance, project } from './geo';
import { Fix, Route } from './types';
export function guidance(route: Route, fix: Fix, previousAlong?: number) {
  const valid = fix.accuracy >= 0 && fix.accuracy <= 35 && Date.now() - fix.timestamp < 15000;
  const snap = project(fix.coordinate, route.coordinates, previousAlong);
  const offRoute = snap.crossTrack > Math.max(40, fix.accuracy * 2);
  const lengths = cumulative(route.coordinates);
  const next = route.steps.find(s => lengths[s.index] > snap.along + 8) ?? route.steps.at(-1);
  const arrived = valid && !offRoute && snap.along > snap.total * 0.95 && distance(fix.coordinate, route.coordinates.at(-1)!) < 20;
  return { ...snap, valid, offRoute, next, maneuverMeters: next ? Math.max(0, lengths[next.index] - snap.along) : undefined, arrived };
}
