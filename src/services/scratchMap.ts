import AsyncStorage from '@react-native-async-storage/async-storage';
import {createScratchArchive} from '../core/scratchArchive';
import {useEffect,useRef,useSyncExternalStore} from 'react';
import {AppState} from 'react-native';
import {emptyScratch} from '../core/scratchMap';
import {Fix} from '../core/types';
export const scratchMap=createScratchArchive(AsyncStorage);
const inactiveScratch={index:emptyScratch(),ready:false,revision:0,recap:null,error:''},inactiveSnapshot=()=>inactiveScratch,noScratchSubscription=()=>()=>{};
export function useScratchIndex(active=true){useEffect(()=>{if(active)void scratchMap.load();},[active]);return useSyncExternalStore(active?scratchMap.subscribe:noScratchSubscription,active?scratchMap.getSnapshot:inactiveSnapshot,active?scratchMap.getSnapshot:inactiveSnapshot);}
/** No location subscriptions: the caller supplies raw fixes from its existing active GPS session. */
export function useScratchSession(active:boolean){const token=useRef<string|null>(null);useEffect(()=>{if(!active)return;const id=`${Date.now()}-${Math.random().toString(36).slice(2,10)}`;token.current=id;scratchMap.begin(id);const timer=setInterval(()=>void scratchMap.flush(),5000),sub=AppState.addEventListener('change',()=>void scratchMap.flush());return()=>{token.current=null;clearInterval(timer);sub.remove();void scratchMap.end(id);};},[active]);return (fix:Fix)=>{const id=token.current;if(id)void scratchMap.accept(id,fix).catch(()=>{});};}
