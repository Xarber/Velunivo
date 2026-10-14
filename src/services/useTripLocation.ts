import {useScratchSession} from './scratchMap';
import {GPSSpeedTracker} from '../core/gpsSpeed';
import {publishGroupLocation} from '../groups/locationPublisher';
import {watchLocation} from './watchLocation';
import { MovementTracker } from '../core/movement';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { Fix } from '../core/types';
import { freshFix,displayableFix } from '../core/rideView';
import { beginBackgroundLocation, locationFix } from './backgroundLocation';
/** Explicit recording owns one location task; navigation and recording cannot run together. */
export function useTripLocation(active: boolean, background: boolean, accept: (fix: Fix) => Promise<unknown> | void) {
  const scratch=useScratchSession(active),scratchRef=useRef(scratch);useEffect(()=>{scratchRef.current=scratch;},[scratch]);
  const callback = useRef(accept); useEffect(()=>{callback.current=accept;},[accept]);
  const [fix, setFix] = useState<Fix | null>(null), [status, setStatus] = useState('Waiting for GPS'), [error, setError] = useState(''),[backgroundReady,setBackgroundReady]=useState(false);
  useEffect(() => {
    if (!active) return;
    queueMicrotask(()=>setBackgroundReady(false));
    let cancelled = false, previous = 0, watch: Location.LocationSubscription | undefined, stopBackground: (() => Promise<void>) | undefined;
    const movement = new MovementTracker(),speedTracker=new GPSSpeedTracker();
    async function receive(incoming: Fix) {
      const next=speedTracker.next(incoming,Platform.OS==='web');
      if(cancelled||next.timestamp<=previous)return;if(!freshFix(next)){if(displayableFix(next)){setFix({...next,speed:null});publishGroupLocation(next);}return;}
      previous = next.timestamp;scratchRef.current(next); const tracked=movement.next(next); if(tracked){setFix(tracked.fix);publishGroupLocation(tracked.fix);} await callback.current(next);
    }
    async function start() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (!permission.granted) { setStatus('Location permission required'); setError('Allow location in device settings to record your trip.'); return; }
        const subscription = await watchLocation({accuracy:Location.Accuracy.BestForNavigation,timeInterval:1000,distanceInterval:2}, p=>{void receive(locationFix(p));}, message=>setError(message));
        if (cancelled) {subscription.remove();return;} watch=subscription; setStatus('Recording · foreground GPS');
        if (background && Platform.OS !== 'web') {
          try {
            const stop = await beginBackgroundLocation(receive,setError,()=>cancelled);
            if (cancelled) {await stop();return;} stopBackground=stop; watch?.remove(); watch=undefined; setBackgroundReady(true);setStatus('Recording · background GPS enabled');
          } catch(e) {if(!cancelled)setError(`${e instanceof Error ? e.message : 'Background GPS unavailable'} Recording continues while the app is open.`);}
        }
      } catch(e) {if(!cancelled){setStatus('GPS unavailable');setError(e instanceof Error ? e.message : 'GPS unavailable');}}
    }
    void start();
    return ()=>{cancelled=true;watch?.remove();void stopBackground?.();};
  },[active,background]);
  return {fix,status,error,backgroundReady:active&&backgroundReady};
}
