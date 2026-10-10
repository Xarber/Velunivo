import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Location from 'expo-location';
import { speakDirection, stopDirections } from './directionsVoice';
import { Fix, Profile, Route, NavigationOptions } from '../core/types';
import { beginBackgroundLocation } from './backgroundLocation';
import { updateRideActivity, markActivityPaused } from './useNavigationActivity';
import { maneuverDistance, bearing } from '../core/rideView';
import { guidance } from '../core/navigation';
import { cumulative, pointAt } from '../core/geo';
export function useRide(route: Route | null, profile: Profile, preferences: NavigationOptions, onFix?: (fix: Fix, arrived?: boolean) => void | Promise<void>) {
  const [completedMeters, setCompletedMeters] = useState(0);
  const [mode, setMode] = useState<'idle' | 'gps' | 'simulation'>('idle');
  const [fix, setFix] = useState<Fix | null>(null), [status, setStatus] = useState('Ready to ride');
  const [progress, setProgress] = useState<ReturnType<typeof guidance> | null>(null);
  const onFixRef = useRef(onFix); useEffect(() => { onFixRef.current = onFix; }, [onFix]);
  const along = useRef<number | undefined>(undefined), spoken = useRef('');
  const unitRef = useRef(preferences.unit), preferencesRef = useRef(preferences);
  useEffect(() => { unitRef.current = preferences.unit; preferencesRef.current = preferences; if (!preferences.voice || preferences.volume === 'off') void stopDirections(); }, [preferences]);
  const profileRef = useRef(profile);
  useEffect(() => { profileRef.current = profile; }, [profile]);
  useEffect(() => {
    along.current = undefined; spoken.current = '';
    // Session resets mirror the external GPS subscription lifecycle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(null); setFix(null); setCompletedMeters(0);
    if (mode === 'idle' || !route) return;
    let cancelled = false, paused = AppState.currentState !== 'active', background = false, halted = false, lastAccepted = 0, stopBackground: (()=>Promise<void>) | undefined, subscription: Location.LocationSubscription | undefined, timer: ReturnType<typeof setInterval> | undefined;
    async function accept(next: Fix) {
      if (cancelled || paused || halted || next.timestamp <= lastAccepted) return;
      lastAccepted=next.timestamp;
      setFix(next);
      const g = guidance(route!, next, along.current);
      if (!g.valid) { setStatus('Waiting for a precise GPS fix'); setProgress(v => v ? { ...v, valid: false } : null); if(mode==='gps')await onFixRef.current?.(next); return; }
      setProgress(g); if (!g.offRoute) setCompletedMeters(v => Math.max(v, g.along));
      if (g.offRoute) setStatus('Off route · stop safely to replan');
      else { along.current = g.along; setStatus(g.arrived ? 'You have arrived' : mode === 'simulation' ? 'Simulation · no live GPS' : background ? 'GPS guidance · background enabled' : Platform.OS === 'web' ? 'GPS guidance · keep this page open' : 'GPS guidance · foreground only'); }
      if(mode==='gps')await onFixRef.current?.(next,g.arrived);
      if(cancelled || lastAccepted!==next.timestamp)return;
      const cue = g.next ? `${g.next.index}-${(g.maneuverMeters ?? 0) < 40 ? 'near' : 'ahead'}` : '';
      if (preferencesRef.current.voice && preferencesRef.current.volume !== 'off' && mode === 'gps' && !g.offRoute && g.next && (g.maneuverMeters ?? 999) < 150 && cue !== spoken.current) {
        spoken.current = cue; await speakDirection(`${maneuverDistance(g.maneuverMeters ?? 0, unitRef.current)}. ${g.next.text}`, preferencesRef.current);
      }
      if(mode==='gps')await updateRideActivity(route!,profileRef.current,preferencesRef.current,g,next);
      if (g.arrived) { halted=true; if (timer) clearInterval(timer); subscription?.remove(); await stopBackground?.(); await stopDirections(); }
    }
    const app = AppState.addEventListener('change', s => { paused = s !== 'active' && !background; if (paused) { setStatus('Background location unavailable · keep the app open'); void stopDirections(); void markActivityPaused(); } });
    if (mode === 'simulation') {
      let meters = 0; const total = cumulative(route.coordinates).at(-1)!;
      void accept({ coordinate: route.coordinates[0], accuracy: 3, speed: 0, timestamp: Date.now() });
      timer = setInterval(() => { if (paused) return; const speed = Math.min(profileRef.current.maxSpeed, profileRef.current.ridingLimit) * profileRef.current.cruiseFactor / 3.6; const before = pointAt(route.coordinates, meters); meters = Math.min(total, meters + speed * .5); const coordinate = pointAt(route.coordinates, meters); void accept({ coordinate, accuracy: 3, speed: meters < total ? speed : 0, heading: bearing(before, coordinate) ?? undefined, timestamp: Date.now() }); }, 500);
    } else {
      setStatus('Requesting GPS permission');
      (async () => {
        try {
          const permission = await Location.requestForegroundPermissionsAsync();
          if (cancelled) return;
          if (permission.status !== 'granted') { setStatus('Location permission denied. Enable it in Settings.'); setMode('idle'); return; }
          if(Platform.OS!=='web' && preferencesRef.current.backgroundNavigation) {
            try { const stop=await beginBackgroundLocation(accept,msg=>{if(!cancelled){background=false;paused=AppState.currentState!=='active';setStatus(`Background location interrupted: ${msg}`);void markActivityPaused();}},()=>cancelled || halted);
              if(cancelled || halted) {await stop();return;} stopBackground=stop;background=true;paused=false;
            } catch(e) {if(!cancelled)setStatus(e instanceof Error ? e.message : 'Background location unavailable. Foreground navigation remains available.');}
          }
          if(cancelled)return;
          const watch = await Location.watchPositionAsync({ accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 0 }, p => {void accept({ coordinate: [p.coords.longitude, p.coords.latitude], accuracy: p.coords.accuracy ?? 999, speed: p.coords.speed !== null && Number.isFinite(p.coords.speed) && p.coords.speed >= 0 ? p.coords.speed : null, heading: p.coords.heading !== null && p.coords.heading >= 0 ? p.coords.heading : undefined, timestamp: p.timestamp }).catch(e=>{if(!cancelled)setStatus(e instanceof Error ? e.message : 'GPS update failed');});});
          if (cancelled) watch.remove(); else subscription = watch;
        } catch (e) { if (!cancelled) { setStatus(e instanceof Error ? e.message : 'GPS unavailable'); setMode('idle'); } }
      })();
    }
    return () => { cancelled = true; subscription?.remove(); void stopBackground?.().catch(console.warn); if (timer) clearInterval(timer); app.remove(); void stopDirections(); };
  }, [mode, route]);
  return { completedMeters, mode, fix, progress, status, start: (simulate = false) => setMode(simulate ? 'simulation' : 'gps'), stop: () => { setMode('idle'); setStatus('Ride ended'); } };
}
