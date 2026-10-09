import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { Fix } from '../core/types';
export function useLocation(enabled: boolean) {
  const [fix, setFix] = useState<Fix | null>(null);
  const [status, setStatus] = useState('Finding your location…');
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false, generation = 0, subscription: Location.LocationSubscription | undefined, locationTimeout: ReturnType<typeof setTimeout> | undefined;
    const stop = () => { generation++; subscription?.remove(); subscription = undefined; if (locationTimeout) clearTimeout(locationTimeout); };
    async function start() {
      const token = ++generation;
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (cancelled || token !== generation) return;
        if (!permission.granted) { setStatus('Location off · allow it in device settings or choose a start on the map'); return; }
        setStatus('Finding your location…');
        locationTimeout = setTimeout(() => { if (!cancelled && token === generation) setStatus('GPS is taking longer · you can choose a start on the map'); }, 20000);
        const watch = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 0 }, p => {
          if (cancelled || token !== generation) return;
          const accuracy = p.coords.accuracy ?? 999;
          // Keep the last good marker during a brief poor fix; freshness is checked by the UI.
          if (accuracy > 100 || Date.now() - p.timestamp > 15000) { setStatus('Waiting for a precise location'); return; }
          if (locationTimeout) clearTimeout(locationTimeout);
          setFix({ coordinate: [p.coords.longitude, p.coords.latitude], accuracy, speed: p.coords.speed !== null && p.coords.speed >= 0 ? p.coords.speed : null, heading: p.coords.heading !== null && p.coords.heading >= 0 ? p.coords.heading : undefined, timestamp: p.timestamp });
          setStatus('Live location');
        }, () => { if (!cancelled && token === generation) { if (locationTimeout) clearTimeout(locationTimeout); setStatus('Location unavailable · choose a start on the map'); } });
        if (cancelled || token !== generation) watch.remove(); else subscription = watch;
      } catch { if (!cancelled && token === generation) setStatus('Location unavailable · choose a start on the map'); }
    }
    if (AppState.currentState !== 'background') void start();
    const app = AppState.addEventListener('change', state => { stop(); if (state === 'active') void start(); });
    return () => { cancelled = true; stop(); app.remove(); };
  }, [enabled]);
  return { fix, status };
}
