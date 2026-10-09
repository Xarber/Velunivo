import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { VectorReading } from '../core/recordings';
import { Accelerometer, Gyroscope } from 'expo-sensors';
export function useMotion(enabled: boolean) {
  const [motion, set] = useState({ available: false, acceleration: 0, rotation: 0, status: 'Off', accelerometer: null as VectorReading | null, gyroscope: null as VectorReading | null });
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false, generation = 0;
    const subscriptions: { remove(): void }[] = [];
    function stop() { generation++; subscriptions.splice(0).forEach(s => s.remove()); }
    async function start() {
      const token = ++generation;
      try {
        const [a, g] = await Promise.all([Accelerometer.isAvailableAsync(), Gyroscope.isAvailableAsync()]);
        if (cancelled || token !== generation || AppState.currentState === 'background') return;
        if (!a && !g) { set(v => ({ ...v, status: 'Unavailable' })); return; }
        Accelerometer.setUpdateInterval(250); Gyroscope.setUpdateInterval(250);
        if (a) subscriptions.push(Accelerometer.addListener(v => set(m => ({ ...m, available: true, status: 'Active', acceleration: Math.hypot(v.x, v.y, v.z), accelerometer: { x: v.x, y: v.y, z: v.z, timestamp: Date.now() } }))));
        if (g) subscriptions.push(Gyroscope.addListener(v => set(m => ({ ...m, available: true, status: 'Active', rotation: Math.hypot(v.x, v.y, v.z), gyroscope: { x: v.x, y: v.y, z: v.z, timestamp: Date.now() } }))));
      } catch { if (!cancelled) set(v => ({ ...v, status: 'Permission denied' })); }
    }
    void start();
    const app = AppState.addEventListener('change', s => { stop(); if (s === 'active') void start(); });
    return () => { cancelled = true; stop(); app.remove(); };
  }, [enabled]);
  return enabled ? motion : { ...motion, status: 'Off' };
}
