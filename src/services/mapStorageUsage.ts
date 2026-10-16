import {OfflineManager} from '@maplibre/maplibre-react-native';
/** Resource payload sizes reported by the SDK, not an estimate from map area. */
export async function mapStorageUsage(){const packs=await OfflineManager.getPacks(),statuses=await Promise.all(packs.map(pack=>pack.status()));return {bytes:statuses.reduce((sum,s)=>sum+(Number.isFinite(s.completedResourceSize)?s.completedResourceSize:0),0),items:packs.length};}
