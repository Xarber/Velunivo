import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Coord, Route } from '../core/types';
import { packs, PackView } from './offline';
import { mapStyle } from '../components/mapConfig';
import {subscribeMapDownloads} from './mapDownloads';
import {AppState} from 'react-native';
import { coveredByDownload } from '../core/downloadCoverage';
export function useDownloadedMaps(enabled: boolean, position: Coord | undefined, route: Route | null) {
  const [regions, setRegions] = useState<PackView[]>([]);
  useFocusEffect(useCallback(() => { if(!enabled)return;let cancelled = false,downloading=false; const refresh = () => { void packs().then(all => { if (!cancelled){downloading=all.some(r=>r.percentage<100);setRegions(all);} }).catch(() => {}); }; refresh(); const interval=setInterval(()=>{if(downloading)refresh();},15000);const unsubscribe=subscribeMapDownloads(refresh),app=AppState.addEventListener('change',state=>{if(state==='active')refresh();});return () => { cancelled = true;clearInterval(interval); unsubscribe();app.remove(); }; }, [enabled]));
  return useMemo(() => enabled ? regions.find(r=>coveredByDownload([r], position, route?.coordinates))?.styleURL || (coveredByDownload(regions,position,route?.coordinates) ? mapStyle : undefined) : undefined, [enabled, regions, position, route?.coordinates]);
}
