import {useCallback,useSyncExternalStore} from 'react';
import {markerOpacity} from '../core/mapFreshness';
const subscribe=(notify:()=>void)=>{const timer=setInterval(notify,5000);return()=>clearInterval(timer);};
/** A silent GPS stop must fade too; unchanged opacity snapshots do not rerender the map. */
export function useMarkerOpacity(locationAt:number|undefined,presenceAt?:number,fallback=1){const snapshot=useCallback(()=>locationAt===undefined&&presenceAt===undefined?fallback:markerOpacity(locationAt,presenceAt),[locationAt,presenceAt,fallback]);return useSyncExternalStore(subscribe,snapshot,()=>fallback);}
