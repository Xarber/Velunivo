import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Coord, Route } from '../core/types';
import { packs, PackView } from './offline';
import { mapStyle } from '../components/mapConfig';
import { coveredByDownload } from '../core/downloadCoverage';
export function useDownloadedMaps(enabled: boolean, position: Coord | undefined, route: Route | null) {
  const [regions, setRegions] = useState<PackView[]>([]);
  useFocusEffect(useCallback(() => { let cancelled = false; const refresh = () => { void packs().then(all => { if (!cancelled) setRegions(all); }).catch(() => {}); }; refresh(); const interval = setInterval(refresh, 15000); return () => { cancelled = true; clearInterval(interval); }; }, []));
  return useMemo(() => enabled ? regions.find(r=>coveredByDownload([r], position, route?.coordinates))?.styleURL || (coveredByDownload(regions,position,route?.coordinates) ? mapStyle : undefined) : undefined, [enabled, regions, position, route?.coordinates]);
}
