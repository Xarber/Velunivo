import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Fix, Route, Vehicle } from '../core/types';
import { appendSample, freshVector, RecordedRide, RideSample, VectorReading } from '../core/recordings';
import { liveRecording, persistRide } from './rideHistory';
export function useRideRecorder(active: boolean, enabled: boolean, arrived: boolean, route: Route | null, vehicle: Vehicle, motion: { accelerometer: VectorReading | null; gyroscope: VectorReading | null }, compass: { heading: number | null; timestamp: number }) {
  const [error, setError] = useState('');
  const sensors = useRef({ motion, compass }); useEffect(() => { sensors.current = { motion, compass }; }, [motion, compass]);
  const session = useRef<{ ride: RecordedRide; buffer: RideSample[]; pending: Map<number, RideSample[]>; chunk: number; previous: Fix | null; dirty: boolean } | null>(null);
  const flush = useCallback((status?: RecordedRide['status']) => {
    const s = session.current; if (!s || (!s.dirty && !status)) return;
    if (status) { s.ride = { ...s.ride, status, endedAt: Date.now() }; }
    const chunks = [...s.pending].map(([index, samples]) => ({ index, samples: [...samples] }));
    if (s.buffer.length) chunks.push({ index: s.chunk, samples: [...s.buffer] });
    s.ride = { ...s.ride, chunks: s.chunk + (s.buffer.length ? 1 : 0) }; s.dirty = false;
    const write = persistRide(s.ride, chunks).then(() => { setError(''); for (const c of chunks) if (c.samples.length >= 100) s.pending.delete(c.index); }).catch(e => { s.dirty = true; setError(`Ride could not be saved: ${e.message}. Check device storage.`); });
    if (s.buffer.length >= 100) { s.pending.set(s.chunk, [...s.buffer]); s.chunk++; s.buffer = []; }
    return write;
  }, []);
  const accept = useCallback((fix: Fix, arrived = false) => {
    const s = session.current; if (!s || s.ride.status !== 'recording') return;
    const now = Date.now(), sensor = sensors.current;
    const sample: RideSample = { fix, compass: sensor.compass.heading !== null && now - sensor.compass.timestamp < 3000 ? { heading: sensor.compass.heading, timestamp: sensor.compass.timestamp } : null, accelerometer: freshVector(sensor.motion.accelerometer, now), gyroscope: freshVector(sensor.motion.gyroscope, now) };
    s.ride = appendSample(s.ride, sample, s.previous); s.previous = fix; s.buffer.push(sample); s.dirty = true;
    if (arrived || s.buffer.length >= 100 || AppState.currentState !== 'active') return flush(arrived ? 'arrived' : undefined);
  }, [flush]);
  useEffect(() => {
    if (!active || !enabled || !route) return;
    const startedAt = Date.now();
    session.current = { ride: { id: `${startedAt}-${Math.random().toString(36).slice(2, 9)}`, name: route.name, vehicle: { id: vehicle.id, name: vehicle.name, kind: vehicle.kind, maxSpeed: vehicle.maxSpeed, ridingLimit: vehicle.ridingLimit }, startLabel: route.startLabel || 'Ride start', endLabel: route.endLabel || 'Ride arrival', startedAt, status: 'recording', samples: 0, chunks: 0, meters: 0, preview: [] }, buffer: [], pending: new Map(), chunk: 0, previous: null, dirty: true };
    liveRecording(session.current.ride.id, true); flush();
    const timer = setInterval(() => flush(), 5000);
    const app = AppState.addEventListener('change', state => { if (state !== 'active') flush(); });
    return () => { clearInterval(timer); app.remove(); if (session.current) liveRecording(session.current.ride.id, false); flush(session.current?.ride.status === 'recording' ? 'finished' : undefined); session.current = null; };
    // A session snapshots its vehicle and route; setting changes end/start recording without replacing navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, enabled, route?.id, flush]);
  useEffect(() => { if (arrived) flush('arrived'); }, [arrived, flush]);
  return { accept, error };
}
