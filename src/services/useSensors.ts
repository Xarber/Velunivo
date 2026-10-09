import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { Accelerometer, Gyroscope } from 'expo-sensors';
export function useMotion(enabled: boolean) {
  const [motion, set] = useState({ available: false, acceleration: 0, rotation: 0, status: 'Off' });
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const subscriptions: { remove(): void }[] = [];
    function stop() { subscriptions.splice(0).forEach(s => s.remove()); }
    async function start() {
      try {
        const [a, g] = await Promise.all([Accelerometer.isAvailableAsync(), Gyroscope.isAvailableAsync()]);
        if (cancelled || AppState.currentState === 'background') return;
        if (!a || !g) { set(v => ({ ...v, status: 'Unavailable' })); return; }
        Accelerometer.setUpdateInterval(250); Gyroscope.setUpdateInterval(250);
        subscriptions.push(Accelerometer.addListener(v => set(m => ({ ...m, available: true, status: 'Active', acceleration: Math.hypot(v.x, v.y, v.z) }))));
        subscriptions.push(Gyroscope.addListener(v => set(m => ({ ...m, rotation: Math.hypot(v.x, v.y, v.z) }))));
      } catch { if (!cancelled) set(v => ({ ...v, status: 'Permission denied' })); }
    }
    void start();
    const app = AppState.addEventListener('change', s => { stop(); if (s === 'active') void start(); });
    return () => { cancelled = true; stop(); app.remove(); };
  }, [enabled]);
  return enabled ? motion : { ...motion, status: 'Off' };
}
