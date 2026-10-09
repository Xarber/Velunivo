import { RecordedRide, RideSample } from './recordings';
export interface ArchiveStorage { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<unknown>; multiGet(keys: string[]): Promise<readonly (readonly [string, string | null])[]>; multiSet(entries: [string, string][]): Promise<unknown>; multiRemove(keys: string[]): Promise<unknown>; }
export function createRideArchive(AsyncStorage: ArchiveStorage) {
const indexKey = 'ride-history-ids-v1';
const summaryKey = (id: string) => `ride-summary-v1:${id}`;
const chunkKey = (id: string, n: number) => `ride-samples-v1:${id}:${n}`;
const liveSessions = new Set<string>();
function liveRecording(id: string, active: boolean) { if (active) liveSessions.add(id); else liveSessions.delete(id); }
let pending: Promise<unknown> = Promise.resolve();
function queue<T>(task: () => Promise<T>): Promise<T> { const next = pending.then(task, task); pending = next.catch(() => {}); return next; }
async function readIds(): Promise<string[]> { const raw = await AsyncStorage.getItem(indexKey); return raw ? JSON.parse(raw) : []; }
async function recordedRides(): Promise<RecordedRide[]> {
  await pending; const ids = await readIds(), all: RecordedRide[] = [];
  // Separate summaries and 100-fix chunks avoid Android's per-entry size limit.
  for (let offset = 0; offset < ids.length; offset += 50) {
    const values = await AsyncStorage.multiGet(ids.slice(offset, offset + 50).map(summaryKey));
    for (const [, value] of values) if (value) { const r: RecordedRide = JSON.parse(value); all.push(r.status === 'recording' && !liveSessions.has(r.id) ? { ...r, status: 'interrupted', endedAt: r.lastFixAt || r.startedAt } : r); }
  }
  return all;
}
function persistRide(ride: RecordedRide, chunks: { index: number; samples: RideSample[] }[]) {
  const snapshot = { ...ride, preview: [...ride.preview] };
  return queue(async () => {
    if (chunks.length) await AsyncStorage.multiSet(chunks.map(c => [chunkKey(ride.id, c.index), JSON.stringify(c.samples)]));
    await AsyncStorage.setItem(summaryKey(ride.id), JSON.stringify(snapshot));
    const ids = await readIds(); if (!ids.includes(ride.id)) await AsyncStorage.setItem(indexKey, JSON.stringify([ride.id, ...ids]));
  });
}
async function rideSamples(ride: RecordedRide): Promise<RideSample[]> {
  await pending; const samples: RideSample[] = [];
  for (let offset = 0; offset < ride.chunks; offset += 25) {
    const raw = await AsyncStorage.multiGet(Array.from({ length: Math.min(25, ride.chunks - offset) }, (_, i) => chunkKey(ride.id, offset + i)));
    samples.push(...raw.flatMap(([, value]) => value ? JSON.parse(value) : []));
  }
  return samples;
}
function deleteRecordedRide(ride: RecordedRide) { return queue(async () => {
  const ids = await readIds(); await AsyncStorage.setItem(indexKey, JSON.stringify(ids.filter(id => id !== ride.id)));
  await AsyncStorage.multiRemove([summaryKey(ride.id), ...Array.from({ length: ride.chunks }, (_, i) => chunkKey(ride.id, i))]);
}); }

return { liveRecording, recordedRides, persistRide, rideSamples, deleteRecordedRide };
}
