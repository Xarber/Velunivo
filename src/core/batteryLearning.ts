import { RecordedRide } from './recordings';
import { Vehicle } from './types';
export const validBatteryUsage = (percent: number) => Number.isFinite(percent) && percent >= 0 && percent <= 100;
/** Percentage points of full charge consumed, not percentage of the starting charge. */
export function learnedBatteryRange(rides: RecordedRide[], vehicle: Pick<Vehicle, 'id'>) {
  const reports = rides.filter(r => r.vehicle.id === vehicle.id && ['finished','arrived'].includes(r.status) && r.batteryFeedback === 'answered' && validBatteryUsage(r.batteryUsagePercent!) && r.batteryUsagePercent! >= 1 && Number.isFinite(r.meters) && r.meters >= 500).slice(0,20);
  if (reports.length < 3) return null;
  const meters = reports.reduce((n,r) => n+r.meters,0), percent = reports.reduce((n,r) => n+r.batteryUsagePercent!,0);
  return { rangeKm: meters / 1000 / percent * 100, count: reports.length };
}
export function pendingBatteryRide(rides: RecordedRide[]) {
  return rides.find(r => ['finished','arrived','interrupted'].includes(r.status) && r.batteryFeedback === 'pending' && r.samples >= 2);
}
