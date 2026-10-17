import {useSyncExternalStore} from 'react';import {NavigationOptions} from '../core/types';import {emptyRewardTest,rewardTestSelection} from '../core/rewardTesting';
let state=emptyRewardTest();const listeners=new Set<()=>void>();const emit=()=>{for(const listener of listeners)listener();};
export function setRewardTesting(enabled:boolean){state={enabled,selection:{}};emit();}
export function selectTestReward(patch:Partial<NavigationOptions>){state=rewardTestSelection(state,patch);emit();}
export const getRewardTesting=()=>state;
export function useRewardTesting(){return useSyncExternalStore(listener=>{listeners.add(listener);return()=>{listeners.delete(listener);};},getRewardTesting,getRewardTesting);}
export function useDisplayCosmetics(n:NavigationOptions){const test=useRewardTesting();return n.developerMode&&test.enabled?{...n,...test.selection}:n;}
