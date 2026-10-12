import {useSyncExternalStore} from 'react';
import {coordinateActivity} from '../core/coordinateActivity';
export const useCoordinateActivity=(label:string)=>useSyncExternalStore(coordinateActivity.subscribe,()=>coordinateActivity.pending(label),()=>false);
