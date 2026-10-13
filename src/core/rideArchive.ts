import {rideReliability} from './rideReliability';
import { analyzeRideEnergy } from './rideEnergy';
import {repairRecordedRide} from './repairRide';
import { validBatteryUsage } from './batteryLearning';
import { RecordedRide, RideSample } from './recordings';
export interface ArchiveStorage { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<unknown>; multiGet(keys: string[]): Promise<readonly (readonly [string, string | null])[]>; multiSet(entries: [string, string][]): Promise<unknown>; multiRemove(keys: string[]): Promise<unknown>; }
export function createRideArchive(AsyncStorage: ArchiveStorage) {
const indexKey = 'ride-history-ids-v1';
const summaryKey = (id: string) => `ride-summary-v1:${id}`;
const chunkKey = (id: string, n: number) => `ride-samples-v1:${id}:${n}`;
const liveSessions = new Set<string>();
const listeners = new Set<() => void>();
function subscribeRides(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function notify() { for (const listener of listeners) listener(); }
function liveRecording(id: string, active: boolean) { if (active) liveSessions.add(id); else liveSessions.delete(id); }
let pending: Promise<unknown> = Promise.resolve();
function queue<T>(task: () => Promise<T>): Promise<T> { const next = pending.then(task, task); pending = next.catch(() => {}); return next; }
async function readIds(): Promise<string[]> { const raw = await AsyncStorage.getItem(indexKey); return raw ? JSON.parse(raw) : []; }
function recordedRides(): Promise<RecordedRide[]> { return queue(async () => {
  const ids = await readIds(), all: RecordedRide[] = [];
  for (let offset = 0; offset < ids.length; offset += 50) {
    const values = await AsyncStorage.multiGet(ids.slice(offset, offset + 50).map(summaryKey));
    for (const [, value] of values) if (value) {
      let r: RecordedRide = JSON.parse(value);
      if(r.status === 'recording' && !liveSessions.has(r.id))r={...r,status:'interrupted',endedAt:r.lastFixAt||r.startedAt};
      if(r.status!=='recording' && (r.energyAnalysisVersion!==1||r.pathCleanupVersion!==2||r.reliability?.schema!==1)){
        const raw=await AsyncStorage.multiGet(Array.from({length:r.chunks},(_,i)=>chunkKey(r.id,i)));
        const repaired=repairRecordedRide(r,raw.flatMap(([,v])=>v?JSON.parse(v):[]));
        r={...analyzeRideEnergy(repaired.summary,repaired.samples),reliability:rideReliability(repaired.samples,r.reliability?.peerReconnects)};
        await AsyncStorage.multiSet(Array.from({length:r.chunks},(_,i)=>[chunkKey(r.id,i),JSON.stringify(repaired.samples.slice(i*100,(i+1)*100))]));
        await AsyncStorage.setItem(summaryKey(r.id),JSON.stringify(r));
      }
      all.push(r);
    }
  }
  return all;
}); }

function persistRide(ride: RecordedRide, chunks: { index: number; samples: RideSample[] }[]) {
  const snapshot = { ...ride, preview: [...ride.preview] };
  return queue(async () => {
    if (chunks.length) await AsyncStorage.multiSet(chunks.map(c => [chunkKey(ride.id, c.index), JSON.stringify(c.samples)]));
    const raw = await AsyncStorage.getItem(summaryKey(ride.id)), existing: RecordedRide | null = raw ? JSON.parse(raw) : null;
    // Late recorder checkpoints must not erase a battery answer already saved.
    let summary = existing?.batteryFeedback === 'answered' || existing?.batteryFeedback === 'skipped' ? { ...snapshot, batteryFeedback: existing.batteryFeedback, batteryUsagePercent: existing.batteryUsagePercent, batteryUsageSource:existing.batteryUsageSource } : snapshot;
    if(summary.status!=='recording'){
      const raw=await AsyncStorage.multiGet(Array.from({length:summary.chunks},(_,i)=>chunkKey(ride.id,i)));
      const repaired=repairRecordedRide(summary,raw.flatMap(([,v])=>v?JSON.parse(v):[]));
      summary={...analyzeRideEnergy(repaired.summary,repaired.samples),reliability:rideReliability(repaired.samples,summary.reliability?.peerReconnects)};
      await AsyncStorage.multiSet(Array.from({length:summary.chunks},(_,i)=>[chunkKey(ride.id,i),JSON.stringify(repaired.samples.slice(i*100,(i+1)*100))]));
    }
    await AsyncStorage.setItem(summaryKey(ride.id), JSON.stringify(summary));
    const ids = await readIds(); if (!ids.includes(ride.id)) await AsyncStorage.setItem(indexKey, JSON.stringify([ride.id, ...ids]));
    notify();
  });
}
function saveBatteryUsage(id: string, percent: number | null) { return queue(async () => {
  if (percent !== null && !validBatteryUsage(percent)) throw new Error('Enter a battery percentage from 0 to 100.');
  const raw = await AsyncStorage.getItem(summaryKey(id)); if (!raw) throw new Error('This ride is no longer saved.');
  let ride: RecordedRide = JSON.parse(raw);
  if (ride.status === 'recording' && !liveSessions.has(id)) ride = { ...ride, status: 'interrupted', endedAt: ride.lastFixAt || ride.startedAt };
  if (!['finished', 'arrived', 'interrupted'].includes(ride.status)) throw new Error('Finish the ride before adding battery usage.');
  await AsyncStorage.setItem(summaryKey(id), JSON.stringify({ ...ride, batteryFeedback: percent === null ? 'skipped' : 'answered', batteryUsagePercent: percent ?? undefined, batteryUsageSource:percent===null?undefined:'manual' }));
  notify();
}); }
function updateRideLabels(id:string,labels:{name?:string;startLabel?:string;endLabel?:string}){return queue(async()=>{const raw=await AsyncStorage.getItem(summaryKey(id));if(!raw)return;const ride:RecordedRide=JSON.parse(raw);if(ride.status==='recording')return;const fields=Object.fromEntries(Object.entries(labels).filter(([,v])=>typeof v==='string'&&v.trim()));await AsyncStorage.setItem(summaryKey(id),JSON.stringify({...ride,...fields}));notify();});}
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
  notify();
}); }

return { liveRecording, recordedRides, persistRide, rideSamples, deleteRecordedRide, saveBatteryUsage, subscribeRides, updateRideLabels };
}
