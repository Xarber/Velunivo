import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as ScreenOrientation from 'expo-screen-orientation';
import { DeviceMotion } from 'expo-sensors';
import { headingDelta } from '../core/camera';
import { normalizeHeading, smoothHeading } from '../core/rideView';
export function useHeading(enabled: boolean) {
  const [reading, setReading] = useState<{ heading: number | null; timestamp: number; status: string }>({ heading: null, timestamp: 0, status: 'Waiting for compass' });
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    let cancelled = false, generation = 0, previous: number | null = null, lastUpdate = 0, lastGood = 0, offset: number | null = null;
    let subscription: Location.LocationSubscription | undefined, orientationSubscription: { remove(): void } | undefined, orientationTimer: ReturnType<typeof setInterval> | undefined, raw: Location.LocationHeadingObject | null = null;
    function stop() { generation++; subscription?.remove(); subscription = undefined; orientationSubscription?.remove(); orientationSubscription = undefined; if (orientationTimer) clearInterval(orientationTimer); orientationTimer = undefined; offset = null; raw = null; previous = null; lastGood = 0; lastUpdate = 0; }
    function publish(h: Location.LocationHeadingObject, token: number) {
      if (cancelled || token !== generation || AppState.currentState === 'background') return;
      const now = Date.now(); if (now - lastUpdate < 250) return;
      const value = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
      if (h.accuracy < 2 || !Number.isFinite(value) || value < 0 || value > 360) return;
      if (offset === null) { setReading({ heading: null, timestamp: now, status: 'Reading screen orientation · using travel direction' }); return; }
      lastGood = now;
      const corrected = normalizeHeading(value + offset);
      if (previous !== null && Math.abs(headingDelta(previous, corrected)) < 3 && now - lastUpdate < 2500) return;
      previous = smoothHeading(previous, corrected, .6);
      lastUpdate = now;
      setReading({ heading: previous, timestamp: now, status: h.trueHeading >= 0 ? 'Device compass' : 'Magnetic compass' });
    }
    function orientation(next: number, token: number) { if (cancelled || token !== generation) return; if (offset !== next) { offset = next; previous = null; lastUpdate = 0; if (raw) publish(raw, token); } }
    async function start() {
      const token = ++generation;
      try {
        if (Platform.OS === 'ios') {
          const update = async () => {
            const o = await ScreenOrientation.getOrientationAsync();
            orientation(o === ScreenOrientation.Orientation.LANDSCAPE_LEFT ? -90 : o === ScreenOrientation.Orientation.LANDSCAPE_RIGHT ? 90 : o === ScreenOrientation.Orientation.PORTRAIT_DOWN ? 180 : 0, token);
          };
          await update(); if (cancelled || token !== generation) return;
          // Poll too: the SDK listener does not emit every 180-degree orientation change.
          orientationTimer = setInterval(() => { void update().catch(() => {}); }, 1000);
        } else {
          const available = await DeviceMotion.isAvailableAsync(); if (cancelled || token !== generation) return;
          if (available) { DeviceMotion.setUpdateInterval(500); orientationSubscription = DeviceMotion.addListener(m => orientation(m.orientation, token)); }
        }
        const watch = await Location.watchHeadingAsync(h => { raw = h; publish(h, token); }, () => { if (!cancelled && token === generation && !lastGood) setReading({ heading: null, timestamp: Date.now(), status: 'Compass unavailable · using travel direction' }); });
        if (cancelled || token !== generation) watch.remove(); else subscription = watch;
      } catch { if (!cancelled && token === generation) setReading({ heading: null, timestamp: Date.now(), status: 'Compass unavailable · using travel direction' }); }
    }
    if (AppState.currentState !== 'background') void start();
    const stale = setInterval(() => { if (lastGood && Date.now() - lastGood > 3000) { lastGood = 0; previous = null; setReading({ heading: null, timestamp: Date.now(), status: 'Compass stale · using travel direction' }); } }, 500);
    const app = AppState.addEventListener('change', state => { stop(); setReading({ heading: null, timestamp: Date.now(), status: state === 'active' ? 'Waiting for compass' : 'Compass paused' }); if (state === 'active') void start(); });
    return () => { cancelled = true; clearInterval(stale); stop(); app.remove(); };
  }, [enabled]);
  return enabled && Platform.OS !== 'web' ? reading : { heading: null, timestamp: 0, status: Platform.OS === 'web' ? 'Compass unavailable on web' : 'Compass off' };
}
