import {useEffect,useId} from 'react';
import {Platform} from 'react-native';
import {activateKeepAwakeAsync,deactivateKeepAwake} from 'expo-keep-awake';
import {screenWakeLease} from '../core/screenWake';
export function useScreenWake(){const tag=useId();useEffect(()=>{const lease=screenWakeLease(()=>activateKeepAwakeAsync(tag),()=>deactivateKeepAwake(tag));const foreground=()=>{if(document.visibilityState==='visible')void lease.refresh();};if(Platform.OS==='web')document.addEventListener('visibilitychange',foreground);return()=>{if(Platform.OS==='web')document.removeEventListener('visibilitychange',foreground);void lease.dispose();};},[tag]);}
