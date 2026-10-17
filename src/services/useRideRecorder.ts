import {noteLiveElectricalGps} from './liveElectrical';
import {peerReconnectCount} from './rideReliabilityEvents';
import {getGroupActivityRiders,subscribeGroupActivityRiders} from '../groups/activityPresence';
import {rememberRideRiders} from '../core/groupRideRoster';
import {LiveRecordedPath} from '../core/recordedPath';
import {canAskBatteryUsage} from '../core/batteryLearning';
import {nameRecordedTrip} from './tripNames';
import {notifyShortRide} from './rideNotice';
import {bluetoothBridge} from '../bluetooth/service';
import {useBluetoothPreferences} from '../bluetooth/react';
import {sampleBluetooth,automaticBatteryUsage,updateTripBluetooth} from '../bluetooth/tripTelemetry';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MovementTracker } from '../core/movement';
import { AppState } from 'react-native';
import { Fix, Route, Vehicle } from '../core/types';
import { qualifiesRecordedRide, appendSample, freshVector, RecordedRide, RideSample, VectorReading } from '../core/recordings';
import { liveRecording, persistRide } from './rideHistory';
export function useRideRecorder(active: boolean, enabled: boolean, arrived: boolean, route: Pick<Route, 'id' | 'name' | 'startLabel' | 'endLabel'> | null, vehicle: Vehicle, motion: { accelerometer: VectorReading | null; gyroscope: VectorReading | null }, compass: { heading: number | null; timestamp: number }, askBatteryUsage = false, minimumMeters = 100) {
  const [error, setError] = useState(''), [record, setRecord] = useState<RecordedRide | null>(null);
  const {preferences:bluetoothPreferences}=useBluetoothPreferences();
  const collect=useRef(bluetoothPreferences.collectTelemetry);useEffect(()=>{collect.current=bluetoothPreferences.collectTelemetry;},[bluetoothPreferences.collectTelemetry]);
  const sensors = useRef({ motion, compass }); useEffect(() => { sensors.current = { motion, compass }; }, [motion, compass]);
  const session = useRef<{ ride: RecordedRide; buffer: RideSample[]; pending: Map<number, RideSample[]>; chunk: number; previous: Fix | null; movement: MovementTracker; displayPath:LiveRecordedPath; lastTimestamp: number; dirty: boolean; minimumMeters:number; peerBaseline:number;discarded?:boolean } | null>(null);
  const flush = useCallback((status?: RecordedRide['status']) => {
    const s = session.current; if (!s || (!s.dirty && !status)) return;
    if(s.discarded)return Promise.resolve(true);
    s.ride={...rememberRideRiders(s.ride,getGroupActivityRiders()),reliability:{schema:1,samples:0,preciseGPS:0,poorGPS:0,estimatedSpeed:0,longestGapSeconds:0,bluetoothSamples:0,bluetoothInterruptions:0,peerReconnects:Math.max(0,peerReconnectCount()-s.peerBaseline)}};
    if(!qualifiesRecordedRide(s.ride.meters,s.minimumMeters)){if(status){s.discarded=true;s.ride={...s.ride,status,endedAt:Date.now(),batteryFeedback:undefined};notifyShortRide();}return Promise.resolve(true);}
    if (status) { const endedAt=Date.now(),snapshot=bluetoothBridge.getSnapshot();if(snapshot.vehicleId===s.ride.vehicle.id&&snapshot.state==='connected'&&!snapshot.simulated)s.ride={...s.ride,bluetoothConnected:true};const last=collect.current?sampleBluetooth(snapshot,s.ride.vehicle.id,endedAt):undefined;if(last)s.ride={...s.ride,bluetooth:updateTripBluetooth(s.ride.bluetooth,last,s.ride.startedAt)};const used=automaticBatteryUsage(s.ride.bluetooth,endedAt);s.ride = { ...s.ride, status, endedAt, ...(used!==null?{batteryUsagePercent:used,batteryUsageSource:'bluetooth' as const,batteryFeedback:'answered' as const}:s.ride.bluetoothConnected||(s.ride.bluetooth?.connected&&!s.ride.bluetooth.simulated)?{batteryFeedback:'skipped' as const}:{}) }; }
    const chunks = [...s.pending].map(([index, samples]) => ({ index, samples: [...samples] }));
    if (s.buffer.length) chunks.push({ index: s.chunk, samples: [...s.buffer] });
    s.ride = { ...s.ride, chunks: s.chunk + (s.buffer.length ? 1 : 0) }; s.dirty = false;setRecord(s.ride);
    const completed=s.ride;const write = persistRide(s.ride, chunks).then(() => {if(status)void nameRecordedTrip(completed).catch(()=>{}); setError(''); for (const c of chunks) if (c.samples.length >= 100) s.pending.delete(c.index); return true; }).catch(e => { s.dirty = true; setError(`Ride could not be saved: ${e.message}. Check device storage.`); return false; });
    if (s.buffer.length >= 100) { s.pending.set(s.chunk, [...s.buffer]); s.chunk++; s.buffer = []; }
    return write;
  }, []);
  const accept = useCallback((fix: Fix, arrived = false) => {noteLiveElectricalGps(fix);
    const s = session.current; if (!s || s.ride.status !== 'recording' || fix.timestamp <= s.lastTimestamp) return;
    s.lastTimestamp=fix.timestamp;
    const tracked=s.movement.next(fix);
    const now = Date.now(), sensor = sensors.current,snapshot=bluetoothBridge.getSnapshot();
    if(snapshot.state==='connected'&&snapshot.vehicleId===s.ride.vehicle.id&&!snapshot.simulated)s.ride={...s.ride,bluetoothConnected:true};
    const sample: RideSample = { bluetooth:collect.current?sampleBluetooth(bluetoothBridge.getSnapshot(),s.ride.vehicle.id,now):undefined, fix, pathFix: tracked?.point ?? null, breakBefore: tracked?.breakBefore, compass: sensor.compass.heading !== null && now - sensor.compass.timestamp < 3000 ? { heading: sensor.compass.heading, timestamp: sensor.compass.timestamp } : null, accelerometer: freshVector(sensor.motion.accelerometer, now), gyroscope: freshVector(sensor.motion.gyroscope, now) };
    s.ride = {...appendSample(rememberRideRiders(s.ride,getGroupActivityRiders()), sample, s.previous),trace:s.displayPath.next(sample)}; if(tracked?.point)s.previous = tracked.point; setRecord(s.ride); s.buffer.push(sample); s.dirty = true;
    if (arrived || s.buffer.length >= 100 || AppState.currentState !== 'active') return flush(arrived ? 'arrived' : undefined)?.then(() => {});
  }, [flush]);
  useEffect(() => {
    if (!active || !enabled || !route) return;
    const startedAt = Date.now();
    session.current = { ride: { id: `${startedAt}-${Math.random().toString(36).slice(2, 9)}`, name: route.name, vehicle: { id: vehicle.id, name: vehicle.name, kind: vehicle.kind, maxSpeed: vehicle.maxSpeed, ridingLimit: vehicle.ridingLimit,cruiseFactor:vehicle.cruiseFactor,batteryWh:vehicle.batteryWh,tireDiameterMm:vehicle.tireDiameterMm,totalMassKg:vehicle.totalMassKg }, startLabel: route.startLabel || 'Ride start', endLabel: route.endLabel || 'Ride arrival', startedAt, batteryFeedback: canAskBatteryUsage(vehicle,askBatteryUsage) ? 'pending' : undefined, status: 'recording', samples: 0, chunks: 0, meters: 0, preview: [] }, buffer: [], pending: new Map(), chunk: 0, previous: null, movement: new MovementTracker(), displayPath:new LiveRecordedPath(), lastTimestamp: 0, dirty: true,minimumMeters,peerBaseline:peerReconnectCount() };
    const snapshot=bluetoothBridge.getSnapshot(),first=collect.current?sampleBluetooth(snapshot,vehicle.id,startedAt):undefined;
    if(first)session.current.ride={...session.current.ride,bluetooth:updateTripBluetooth(undefined,first,startedAt),bluetoothConnected:snapshot.state==='connected'&&!snapshot.simulated};
    setRecord(session.current.ride); liveRecording(session.current.ride.id, true); flush();
    const stopRoster=subscribeGroupActivityRiders(riders=>{const s=session.current;if(s&&s.ride.status==='recording'){const next=rememberRideRiders(s.ride,riders);if(next!==s.ride){s.ride=next;s.dirty=true;setRecord(s.ride);}}});
    const timer = setInterval(() => flush(), 5000);
    const app = AppState.addEventListener('change', state => { if (state !== 'active') flush(); });
    return () => { stopRoster();clearInterval(timer); app.remove(); if (session.current) liveRecording(session.current.ride.id, false); flush(session.current?.ride.status === 'recording' ? 'finished' : undefined); session.current = null; };
    // A session snapshots its vehicle and route; setting changes end/start recording without replacing navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, enabled, route?.id, flush]);
  useEffect(() => { if (arrived) flush('arrived'); }, [arrived, flush]);
  const bookmark=useCallback((coordinate:import('../core/types').Coord,name:string)=>{const s=session.current;if(!s||s.ride.status!=='recording'||(s.ride.bookmarks?.length??0)>=1000)return;const timestamp=Date.now();s.ride={...s.ride,bookmarks:[...(s.ride.bookmarks||[]),{id:`${timestamp}-${Math.random().toString(36).slice(2,8)}`,name,coordinate,timestamp}]};s.dirty=true;setRecord(s.ride);void flush();},[flush]);
  return {bookmark,snapshot:()=>session.current?.ride??null, accept, error, record, cancel:()=>{const s=session.current;if(s){s.discarded=true;liveRecording(s.ride.id,false);}}, finish: () => flush('finished') };
}
