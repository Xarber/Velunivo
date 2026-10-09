import { RecordedRide } from './recordings';
export function rideInsights(rides: RecordedRide[]) {
  const complete = rides.filter(r => ['finished', 'arrived'].includes(r.status) && r.samples >= 2 && r.meters > 0 && r.endedAt && r.endedAt > r.startedAt);
  if (complete.length < 3) return null;
  const meters = complete.reduce((sum, r) => sum + r.meters, 0), seconds = complete.reduce((sum, r) => sum + (r.endedAt! - r.startedAt) / 1000, 0);
  const vehicles = [...new Set(complete.map(r => r.vehicle.id))].map(id => {
    const group = complete.filter(r => r.vehicle.id === id);
    const distance = group.reduce((sum, r) => sum + r.meters, 0), time = group.reduce((sum, r) => sum + (r.endedAt! - r.startedAt) / 1000, 0);
    return { id, name: group[0].vehicle.name, count: group.length, typicalSpeedKmh: distance / time * 3.6, averageMeters: distance / group.length };
  }).filter(v => v.count >= 3);
  return { count: complete.length, meters, seconds, averageMeters: meters / complete.length, overallSpeedKmh: meters / seconds * 3.6, longestMeters: Math.max(...complete.map(r => r.meters)), vehicles };
}
