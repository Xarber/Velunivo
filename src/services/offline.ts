import { OfflineManager, OfflinePack, OfflinePackStatus } from '@maplibre/maplibre-react-native';
import { routeBounds } from '../core/geo';
import { Route } from '../core/types';
import { mapStyle, offlineEnabled } from '../components/mapConfig';
export type PackView = { id: string; name: string; percentage: number; bytes: number; state: string; pack: OfflinePack };
export async function packs(): Promise<PackView[]> {
  const all = await OfflineManager.getPacks();
  return Promise.all(all.map(async p => { const s = await p.status(); return { id: p.id, name: String(p.metadata.name || 'Map region'), percentage: s.percentage, bytes: s.completedResourceSize, state: s.state, pack: p }; }));
}
export async function download(route: Route, onProgress: (p: OfflinePack, s: OfflinePackStatus) => void, onError: (msg: string) => void) {
  if (!offlineEnabled) throw new Error('Configure an offline-licensed map style and enable downloads in .env.');
  const [w, s, e, n] = routeBounds(route.coordinates);
  if (e - w > .3 || n - s > .3) throw new Error('This region is too large for the MVP. Choose a shorter route.');
  return OfflineManager.createPack({ mapStyle, bounds: [w - .005, s - .005, e + .005, n + .005], minZoom: 10, maxZoom: 16, metadata: { name: route.name, createdAt: Date.now() } }, onProgress, (_, error) => onError(error.message));
}
export const deletePack = (id: string) => OfflineManager.deletePack(id);
export const listen = (id: string, onProgress: (p: OfflinePack, s: OfflinePackStatus) => void, onError: (msg: string) => void) => OfflineManager.addListener(id, onProgress, (_, e) => onError(e.message));
export const unlisten = (id: string) => OfflineManager.removeListener(id);
