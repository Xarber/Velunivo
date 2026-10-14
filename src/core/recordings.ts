import {TripBluetooth,TripBluetoothSummary,updateTripBluetooth} from '../bluetooth/tripTelemetry';
import { Coord, Fix, Vehicle } from './types';
import { usableMovementFix } from './movement';
import { distance } from './geo';
export interface VectorReading { x: number; y: number; z: number; timestamp: number; }
export interface RideSample { displayCoordinate?:Coord; bluetooth?:TripBluetooth; pathFix?: Fix | null; breakBefore?: boolean; fix: Fix; compass: { heading: number; timestamp: number } | null; accelerometer: VectorReading | null; gyroscope: VectorReading | null; }
export interface RideBookmark {id:string;name:string;coordinate:Coord;timestamp:number;}
export interface RecordedRide {bookmarks?:RideBookmark[];reliability?:import('./rideReliability').RideReliability; groupRiders?:import('./groupRideRoster').RecordedRider[];groupSize?:number; estimatedSpeed?:boolean; bluetoothConnected?:boolean; energy?:import('./rideEnergy').RideEnergy; energyAnalysisVersion?:1|2; pathCleanupVersion?:1|2; bluetooth?:TripBluetoothSummary; batteryUsageSource?:'manual'|'bluetooth'; batteryUsagePercent?: number; batteryFeedback?: 'pending' | 'answered' | 'skipped'; id: string; name: string; vehicle: Pick<Vehicle, 'id' | 'name' | 'kind' | 'maxSpeed' | 'ridingLimit'> & Partial<Pick<Vehicle,'cruiseFactor'|'batteryWh'|'totalMassKg'>>; startLabel: string; endLabel: string; startedAt: number; endedAt?: number; lastFixAt?: number; status: 'recording' | 'finished' | 'arrived' | 'interrupted'; samples: number; chunks: number; meters: number; preview: Coord[]; trace?: Coord[][]; start?: Coord; end?: Coord; }
export function freshVector(v: VectorReading | null, now: number): VectorReading | null { return v && now - v.timestamp >= 0 && now - v.timestamp < 2000 ? v : null; }
/** Missing/startup or stationary estimates are not evidence of inaccurate ride speed. */
export function usesEstimatedSpeed(sample:RideSample):boolean {
 const speed=sample.bluetooth?.fields.speed;
 const vehicleSpeed=sample.bluetooth?.state==='connected' && speed?.source==='vehicle' && typeof speed.value==='number' && speed.value>=0 && Math.abs(sample.fix.timestamp-speed.timestamp)<10000;
 return !vehicleSpeed && sample.fix.speedSource==='estimated' && sample.fix.speed!==null && Number.isFinite(sample.fix.speed) && sample.fix.speed>.5;
}
export function appendSample(r: RecordedRide, sample: RideSample, previous: Fix | null): RecordedRide {
  const f = sample.pathFix === undefined ? sample.fix : sample.pathFix, usable = !!f && usableMovementFix(f);
  const meters = usable && !sample.breakBefore && previous && previous.accuracy >= 0 && previous.accuracy <= 35 && f.timestamp > previous.timestamp && (sample.pathFix !== undefined || f.timestamp - previous.timestamp < 15000) ? distance(previous.coordinate, f.coordinate) : 0;
  let preview = usable ? [...r.preview, f.coordinate] : r.preview;
  if (preview.length > 256) preview = preview.filter((_, i) => i % 2 === 0 || i === preview.length - 1);
  let trace = r.trace || [];
  if (usable) {
    trace = !trace.length || sample.breakBefore ? [...trace, [f.coordinate]] : [...trace.slice(0,-1), [...trace.at(-1)!, f.coordinate]];
    if (trace.reduce((n,segment)=>n+segment.length,0)>4096) trace=trace.map(segment=>segment.filter((_,i)=>i===0 || i%2===0 || i===segment.length-1));
  }
  return { ...r, estimatedSpeed:r.estimatedSpeed||usesEstimatedSpeed(sample), bluetooth:sample.bluetooth?updateTripBluetooth(r.bluetooth,sample.bluetooth,r.startedAt):r.bluetooth, trace, samples: r.samples + 1, lastFixAt: sample.fix.timestamp, meters: r.meters + meters, preview, start: r.start || (usable ? f.coordinate : undefined), end: usable ? f.coordinate : r.end };
}

/** Uses accumulated filtered path length, so loops count and stationary GPS drift does not. */
export const qualifiesRecordedRide=(meters:number,minimumMeters=0)=>Number.isFinite(meters) && meters>=minimumMeters;

export function minimumRideDistance(route?:Pick<import('./types').Route,'coordinates'> | null){const points=route?.coordinates;return points && points.length>1 && distance(points[0],points.at(-1)!)<100?15:100;}
