import { OfflineManager, OfflinePack, OfflinePackStatus } from '@maplibre/maplibre-react-native';
import { routeBounds } from '../core/geo';
import { Route } from '../core/types';
import { downloadStyle } from './mapSettings';
export type PackView = { id: string; name: string; bounds?: [number, number, number, number]; styleURL?: string; percentage: number; bytes: number; state: string; pack: OfflinePack };
export async function packs(): Promise<PackView[]> {
  const all = await OfflineManager.getPacks();
  return Promise.all(all.map(async p => { const s = await p.status(); return { id: p.id, styleURL: typeof p.metadata.styleURL === 'string' ? p.metadata.styleURL : undefined, bounds: p.bounds, name: String(p.metadata.name || 'Map region'), percentage: s.percentage, bytes: s.completedResourceSize, state: s.state, pack: p }; }));
}
export async function download(route: Route, onProgress: (p: OfflinePack, s: OfflinePackStatus) => void, onError: (msg: string) => void) {
  const mapStyle = downloadStyle(); if (!mapStyle) throw new Error('Set up a downloadable map provider in Settings.');
  const regions = await packs(); const existingBytes=regions.reduce((s,p)=>s+p.bytes,0); if (existingBytes >= 80_000_000) throw new Error('Remove unused regions before downloading. Stadia caching is limited to 100 MB per device.');
  if (regions.some(p=>p.state === 'active' && p.percentage < 100)) throw new Error('Pause the current download before creating another region.');
  const [w, s, e, n] = routeBounds(route.coordinates);
  if (e - w > .3 || n - s > .3) throw new Error('This region is too large for the MVP. Choose a shorter route.');
  return OfflineManager.createPack({ mapStyle, bounds: [w - .005, s - .005, e + .005, n + .005], minZoom: 10, maxZoom: 14, metadata: { styleURL: mapStyle, name: route.name, createdAt: Date.now() } }, (pack,status)=>{ onProgress(pack,status); if (existingBytes + status.completedResourceSize > 90_000_000) { void pack.pause().catch(()=>{}); onError('Download paused near the 100 MB cache limit. Remove unused regions before resuming.'); } }, (_, error) => onError(error.message));
}
export const deletePack = (id: string) => OfflineManager.deletePack(id);
let budgetCheck=0;
async function enforceBudget(pack: OfflinePack, onError:(msg:string)=>void) { if (Date.now()-budgetCheck<1000) return; budgetCheck=Date.now(); try { const all=await packs(); if (all.reduce((s,p)=>s+p.bytes,0)>90_000_000) {await pack.pause();onError('Download paused near cache limit. Remove unused regions.');} } catch { /* Normal native errors are reported by its listener. */ } }
export const listen = (id: string, onProgress: (p: OfflinePack, s: OfflinePackStatus) => void, onError: (msg: string) => void) => OfflineManager.addListener(id, (pack,status)=>{onProgress(pack,status);void enforceBudget(pack,onError);}, (_, e) => onError(e.message));
export const unlisten = (id: string) => OfflineManager.removeListener(id);

export async function resumePack(id: string) {
  const all=await packs(), region=all.find(p=>p.id===id);
  if (!region) throw new Error('This map region is no longer available.');
  if (all.reduce((total,p)=>total+p.bytes,0)>=90_000_000) throw new Error('Remove unused map regions before resuming.');
  if (all.some(p=>p.id!==id && p.state==='active' && p.percentage<100)) throw new Error('Pause the current download before resuming another region.');
  await region.pack.resume();
}
