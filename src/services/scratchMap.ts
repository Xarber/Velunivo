import AsyncStorage from '@react-native-async-storage/async-storage';
import {createScratchArchive} from '../core/scratchArchive';
import {useEffect,useRef,useSyncExternalStore} from 'react';
import {AppState} from 'react-native';
import {Fix} from '../core/types';
export const scratchMap=createScratchArchive(AsyncStorage);
export function useScratchIndex(){useEffect(()=>{void scratchMap.load();},[]);return useSyncExternalStore(scratchMap.subscribe,scratchMap.getSnapshot,scratchMap.getSnapshot);}
/** No location subscriptions: the caller supplies raw fixes from its existing active GPS session. */
export function useScratchSession(active:boolean){const token=useRef<string|null>(null);useEffect(()=>{if(!active)return;const id=`${Date.now()}-${Math.random().toString(36).slice(2,10)}`;token.current=id;scratchMap.begin(id);const timer=setInterval(()=>void scratchMap.flush(),5000),sub=AppState.addEventListener('change',()=>void scratchMap.flush());return()=>{token.current=null;clearInterval(timer);sub.remove();void scratchMap.end(id);};},[active]);return (fix:Fix)=>{const id=token.current;if(id)void scratchMap.accept(id,fix).catch(()=>{});};}
