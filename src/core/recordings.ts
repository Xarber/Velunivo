import { Coord, Fix, Vehicle } from './types';
import { distance } from './geo';
export interface VectorReading { x: number; y: number; z: number; timestamp: number; }
export interface RideSample { fix: Fix; compass: { heading: number; timestamp: number } | null; accelerometer: VectorReading | null; gyroscope: VectorReading | null; }
export interface RecordedRide { id: string; name: string; vehicle: Pick<Vehicle, 'id' | 'name' | 'kind' | 'maxSpeed' | 'ridingLimit'>; startLabel: string; endLabel: string; startedAt: number; endedAt?: number; lastFixAt?: number; status: 'recording' | 'finished' | 'arrived' | 'interrupted'; samples: number; chunks: number; meters: number; preview: Coord[]; start?: Coord; end?: Coord; }
export function freshVector(v: VectorReading | null, now: number): VectorReading | null { return v && now - v.timestamp >= 0 && now - v.timestamp < 2000 ? v : null; }
export function appendSample(r: RecordedRide, sample: RideSample, previous: Fix | null): RecordedRide {
  const f = sample.fix, usable = f.accuracy >= 0 && f.accuracy <= 35 && Number.isFinite(f.accuracy);
  const meters = usable && previous && previous.accuracy >= 0 && previous.accuracy <= 35 && f.timestamp > previous.timestamp && f.timestamp - previous.timestamp < 15000 ? distance(previous.coordinate, f.coordinate) : 0;
  let preview = usable ? [...r.preview, f.coordinate] : r.preview;
  if (preview.length > 256) preview = preview.filter((_, i) => i % 2 === 0 || i === preview.length - 1);
  return { ...r, samples: r.samples + 1, lastFixAt: f.timestamp, meters: r.meters + meters, preview, start: r.start || (usable ? f.coordinate : undefined), end: usable ? f.coordinate : r.end };
}
