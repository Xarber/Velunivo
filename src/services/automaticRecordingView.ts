// SPDX-License-Identifier: AGPL-3.0-only
import {useSyncExternalStore} from 'react';
import type {useRideRecorder} from './useRideRecorder';
import type {useTripLocation} from './useTripLocation';
export interface AutomaticRecordingView {peak:number;recorder:ReturnType<typeof useRideRecorder>;location:ReturnType<typeof useTripLocation>;}
let view:AutomaticRecordingView|null=null;
const listeners=new Set<()=>void>();
const subscribe=(notify:()=>void)=>{listeners.add(notify);return()=>{listeners.delete(notify);};};
export function publishAutomaticRecordingView(value:AutomaticRecordingView|null){view=value;for(const notify of listeners)notify();}
/** UI adapter only: the root remains the sole owner of GPS, storage and background work. */
export const useAutomaticRecordingView=()=>useSyncExternalStore(subscribe,()=>view,()=>null);
