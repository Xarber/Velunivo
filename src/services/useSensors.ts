import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { VectorReading } from '../core/recordings';
import { Accelerometer, Gyroscope } from 'expo-sensors';
export function useMotion(enabled: boolean) {
  const [motion, set] = useState({ available: false, acceleration: 0, rotation: 0, status: 'Off', accelerometer: null as VectorReading | null, gyroscope: null as VectorReading | null });
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false, generation = 0;
    let latest = { available: false, acceleration: 0, rotation: 0, status: 'Off', accelerometer: null as VectorReading | null, gyroscope: null as VectorReading | null }, dirty = false, publishTimer: ReturnType<typeof setInterval> | undefined;
    const subscriptions: { remove(): void }[] = [];
    function stop() { generation++; subscriptions.splice(0).forEach(s => s.remove());clearInterval(publishTimer);publishTimer=undefined;dirty=false; }
    async function start() {
      const token = ++generation;
      try {
        const [a, g] = await Promise.all([Accelerometer.isAvailableAsync(), Gyroscope.isAvailableAsync()]);
        if (cancelled || token !== generation || AppState.currentState === 'background') return;
        if (!a && !g) { set(v => ({ ...v, status: 'Unavailable' })); return; }
        Accelerometer.setUpdateInterval(250); Gyroscope.setUpdateInterval(250);
        if (a) subscriptions.push(Accelerometer.addListener(v => {if(cancelled||token!==generation)return;latest={...latest,available:true,status:'Active',acceleration:Math.hypot(v.x,v.y,v.z),accelerometer:{x:v.x,y:v.y,z:v.z,timestamp:Date.now()}};dirty=true;}));
        if (g) subscriptions.push(Gyroscope.addListener(v => {if(cancelled||token!==generation)return;latest={...latest,available:true,status:'Active',rotation:Math.hypot(v.x,v.y,v.z),gyroscope:{x:v.x,y:v.y,z:v.z,timestamp:Date.now()}};dirty=true;}));
        // Preserve both timestamped sensor readings, publish one combined UI snapshot per tick.
        publishTimer=setInterval(()=>{if(dirty&&!cancelled&&token===generation){dirty=false;set(latest);}},250);
      } catch { if (!cancelled && token === generation) set(v => ({ ...v, status: 'Permission denied' })); }
    }
    void start();
    const app = AppState.addEventListener('change', s => { stop(); if (s === 'active') void start(); });
    return () => { cancelled = true; stop(); app.remove(); };
  }, [enabled]);
  return enabled ? motion : { ...motion, status: 'Off' };
}
