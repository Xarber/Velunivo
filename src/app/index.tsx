import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Alert, Platform, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import RideMap from '../components/RideMap';
import ScheduleControl from '../components/ScheduleControl';
import { scheduleSummary } from '../core/schedule';
import EndpointPicker from '../components/EndpointPicker';
import { Button, styles, usePalette } from '../components/ui';
import { useStore } from '../services/store';
import { serverUrl, fetchRoute } from '../services/api';
import { pickTrack, shareTrack } from '../services/files';
import { useRide } from '../services/useRide';
import { useMotion } from '../services/useSensors';
import { parseCoordinate } from '../core/geo';
import { estimate, km, minutes } from '../core/eta';
import { Coord, Route } from '../core/types';
function Awake() { useKeepAwake(); return null; }
function notify(text: string) { if (Platform.OS === 'web') window.alert(text); else Alert.alert('Velunivo', text); }
export default function Explore() {
  const p = usePalette(), { height, width } = useWindowDimensions();
  const wide = width >= 900;
  const [trafficAvailable, setTrafficAvailable] = useState(false), [traffic, setTraffic] = useState(false);
  const [departure, setDeparture] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'depart' | 'arrive'>('depart');
  useEffect(() => { if (serverUrl) fetch(`${serverUrl}/health`).then(r => r.json()).then(r => setTrafficAvailable(!!r.trafficConfigured)).catch(() => {}); }, []);
  const { routes, selected, select, setRoutes, profile, save, ready } = useStore();
  const [planner, setPlanner] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [start, setStart] = useState(''), [end, setEnd] = useState('');
  const [startPoint, setStartPoint] = useState<Coord | undefined>(), [endPoint, setEndPoint] = useState<Coord | undefined>();
  const [offlineMap, setOfflineMap] = useState(false);
  const [picking, setPicking] = useState<'start' | 'end' | null>(null), [follow, setFollow] = useState(true);
  const ride = useRide(selected, profile), motion = useMotion(profile.motion && ride.mode === 'gps');
  const active = ride.mode !== 'idle', g = ride.progress;
  const eta = selected ? estimate(selected, profile, active && g?.valid && !g.offRoute ? g.along : 0) : null;
  const run = async (task: () => Promise<unknown>) => { try { await task(); } catch (e) { notify(e instanceof Error ? e.message : String(e)); } };
  async function plan() {
    setError(''); setBusy(true);
    try {
      let a: Coord, b: Coord;
      try { a = startPoint || parseCoordinate(start); b = endPoint || parseCoordinate(end); } catch { throw new Error('Search each address and choose a result, or pick both locations on the map.'); }
      const results = await Promise.allSettled([fetchRoute(a, b, 'bike', profile), fetchRoute(a, b, 'car', profile)]);
      const good: Route[] = [], failures: string[] = [];
      results.forEach((r, i) => r.status === 'fulfilled' ? good.push(r.value) : failures.push(`${i === 0 ? 'Bicycle' : 'Car-road'}: ${r.reason.message}`));
      if (good.length) { setRoutes(good); select(good[0]); setPlanner(false); }
      setError(failures.join('\n'));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }
  async function useLocation() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') throw new Error('Allow precise location to use your current position.');
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setStart(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`); setStartPoint([pos.coords.longitude, pos.coords.latitude]);
  }
  function picked(c: Coord) { if (!picking) return; const label = `${c[1].toFixed(6)}, ${c[0].toFixed(6)}`; if (picking === 'start') { setStart(label); setStartPoint(c); } else { setEnd(label); setEndPoint(c); } setPicking(null); setPlanner(true); }
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: p.bg }}>
    {active && <Awake />}
    <View style={s.header}><View><Text style={[s.brand, { color: p.text }]}>Velunivo<Text style={{ color: p.accent }}>↗</Text></Text><Text style={{ color: p.muted, fontSize: 13 }}>A better way to ride.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Plan a ride" disabled={active} onPress={() => setPlanner(true)} style={[s.round, { backgroundColor: p.card }]}><Ionicons name="search" size={22} color={p.text} /></Pressable></View>
    <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column' }}>
    <View style={{ flex: wide ? 1 : undefined, height: wide ? undefined : Math.max(240, Math.min(360, height * .38)), marginHorizontal: 16, borderRadius: 26, overflow: 'hidden', backgroundColor: p.line }}>
      <RideMap routes={routes} selected={selected} position={ride.fix?.coordinate} follow={active && follow} onPick={picked} traffic={traffic} startPoint={startPoint} endPoint={endPoint} offlineMap={offlineMap} />
      <View pointerEvents="none" style={[s.mapBadge, { backgroundColor: p.card }]}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: p.accent }} /><Text style={{ color: p.text, fontSize: 12, fontWeight: '700' }}>{picking ? `Tap your ${picking === 'start' ? 'start location' : 'destination'}` : selected?.source === 'gpx' ? 'GPX · TRACK PREVIEW' : 'ROUTE COMPARISON'}</Text></View>
      {picking && <View style={{ position: 'absolute', bottom: 12, left: 12 }}><Button title="Cancel map selection" secondary onPress={() => { setPicking(null); setPlanner(true); }} /></View>}
      {active && <Pressable accessibilityLabel="Toggle map following" onPress={() => setFollow(v => !v)} style={[s.recenter, { backgroundColor: p.card }]}><Ionicons name={follow ? 'locate' : 'locate-outline'} size={24} color={p.accent} /></Pressable>}
    </View>
    <ScrollView style={{ width: wide ? 430 : undefined, flexGrow: wide ? 0 : 1, flexShrink: wide ? 0 : 1 }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 28 }}>
      {active ? <View style={[styles.card, { backgroundColor: p.card }]}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}><Ionicons name={g?.next?.sign === -2 ? 'arrow-back' : g?.next?.sign === 2 ? 'arrow-forward' : 'arrow-up'} size={36} color={p.accent} /><View style={{ flex: 1 }}><Text style={{ color: p.accent, fontWeight: '700', fontSize: 13 }}>{g?.valid && !g.offRoute && g.maneuverMeters !== undefined ? `${Math.round(g.maneuverMeters)} m` : 'RIDE GUIDANCE'}</Text><Text style={{ color: p.text, fontSize: 21, fontWeight: '700' }}>{g?.arrived ? 'You have arrived' : g?.offRoute ? 'Off route' : !g?.valid ? 'Waiting for GPS' : g.next?.text || 'Follow the track'}</Text></View></View>
        <Text style={{ color: g?.offRoute ? '#C75A36' : p.muted }}>{ride.status}</Text>
        <View style={s.metrics}><Metric label="km/h" value={ride.fix ? (ride.fix.speed * 3.6).toFixed(0) : '—'} /><Metric label="remaining" value={eta ? km(eta.meters) : '—'} /><Metric label="estimate" value={eta ? minutes(eta.seconds) : '—'} /></View>
        {motion.status !== 'Off' && <Text style={{ color: p.muted, fontSize: 12 }}>Motion: {motion.status} · {motion.acceleration.toFixed(2)} g · {motion.rotation.toFixed(2)} rad/s</Text>}
        {g?.offRoute && <Button title="End ride & replan" secondary onPress={() => { ride.stop(); if (ride.fix) { setStart(`${ride.fix.coordinate[1]}, ${ride.fix.coordinate[0]}`); setStartPoint(ride.fix.coordinate); } setPlanner(true); }} />}
        <Button title="End ride" onPress={ride.stop} />
      </View> : <>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: p.text, fontSize: 23, fontWeight: '800' }}>Your next ride</Text><Text style={{ color: p.accent, fontSize: 12, fontWeight: '700' }}>{Math.min(profile.maxSpeed, profile.ridingLimit)} KM/H CAP</Text></View>
        {routes.length === 0 && <View style={[styles.card, { backgroundColor: p.card }]}><Text style={{ color: p.text, fontSize: 18, fontWeight: '700' }}>Where will you ride?</Text><Text style={{ color: p.muted, lineHeight: 20 }}>Plan a route or import your own GPX to see riding estimates. Imported tracks are previews; road access and turns are not verified.</Text></View>}
        {routes.map(r => { const e = estimate(r, profile), chosen = r.id === selected?.id; return <Pressable accessibilityRole="button" accessibilityLabel={`${r.name}, ${minutes(e.seconds)}`} accessibilityState={{ selected: chosen }} key={r.id} onPress={() => { select(r); void Haptics.selectionAsync(); }} style={[styles.card, { backgroundColor: p.card, borderWidth: 2, borderColor: chosen ? p.accent : 'transparent' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={[s.round, { backgroundColor: p.bg }]}><Ionicons name={r.kind === 'bike' ? 'bicycle' : r.kind === 'car' ? 'car-outline' : 'trail-sign-outline'} size={24} color={p.accent} /></View><View style={{ flex: 1 }}><Text style={{ color: p.text, fontSize: 17, fontWeight: '700' }}>{r.name}</Text><Text style={{ color: p.muted, marginTop: 3 }}>{km(e.meters)} · {r.source === 'gpx' ? 'Track only' : 'Access unverified'}</Text></View><View style={{ alignItems: 'flex-end' }}><Text style={{ color: p.text, fontSize: 25, fontWeight: '800' }}>{minutes(e.seconds)}</Text><Text style={{ color: p.muted, fontSize: 11 }}>minimum {minutes(e.minimumSeconds)}</Text></View></View>
        </Pressable>; })}
        {selected?.warnings.map(w => <Text key={w} style={{ color: p.muted, fontSize: 12, lineHeight: 18 }}>{w}</Text>)}
        {error !== '' && <Text accessibilityRole="alert" style={{ color: '#C75A36', lineHeight: 20 }}>{error}</Text>}
        <View style={{ gap: 10 }}><View style={{ flexDirection: 'row', gap: 8 }}><View style={{ flex: 1 }}><Button title="Depart at" secondary={scheduleMode !== 'depart'} onPress={() => setScheduleMode('depart')} /></View><View style={{ flex: 1 }}><Button title="Arrive by" secondary={scheduleMode !== 'arrive'} onPress={() => setScheduleMode('arrive')} /></View></View><ScheduleControl value={departure} onChange={setDeparture} /><Text style={{ color: p.muted, fontSize: 12 }}>{scheduleSummary(departure, eta?.seconds, scheduleMode)} · Estimated with your riding profile</Text><Text accessibilityRole="alert" style={{ color: '#C75A36', fontSize: 12, lineHeight: 18 }}>Scheduled trips do not use traffic conditions or traffic simulation. Allow extra time for delays.</Text><Button title={traffic ? 'Hide live traffic' : 'Show live traffic'} secondary disabled={!trafficAvailable} onPress={() => setTraffic(v => !v)} />{!trafficAvailable && <Text style={{ color: p.muted, fontSize: 12 }}>Live traffic needs a configured TomTom server key.</Text>}{traffic && <Text style={{ color: p.muted, fontSize: 12 }}>Current traffic flow · © TomTom · not included in scooter ETA</Text>}</View>
        {Platform.OS === 'ios' && <Button title={offlineMap ? 'Use device maps' : 'Use downloadable maps'} secondary onPress={() => setOfflineMap(v => !v)} />}
        <Button title="Plan bicycle & car routes" icon="search" onPress={() => setPlanner(true)} />
        {selected && <View style={{ flexDirection: 'row', gap: 10 }}><View style={{ flex: 1 }}><Button title="Start ride" icon="navigate" disabled={!ready} onPress={() => ride.start()} /></View><Button title="Simulate" secondary onPress={() => ride.start(true)} /></View>}
        <View style={{ flexDirection: 'row', gap: 10 }}><View style={{ flex: 1 }}><Button title="Import GPX" secondary icon="add" onPress={() => void run(async () => { const r = await pickTrack(); if (r) { setRoutes([r]); select(r); } })} /></View>{selected && <Button title="Save" secondary icon="bookmark-outline" onPress={() => void run(async () => { await save(selected); notify('Saved to your Library.'); })} />}</View>
      </>}
      {ride.recording.length > 1 && !active && <Button title={`Export ride · ${ride.recording.length} fixes`} secondary icon="share-outline" onPress={() => void run(() => shareTrack(ride.recording))} />}
      {selected && selected.steps.length > 0 && !active && <View style={[styles.card, { backgroundColor: p.card }]}><Text style={{ fontWeight: '700', color: p.text }}>Turn-by-turn directions</Text>{selected.steps.map((step, i) => <Text key={`${i}-${step.index}`} style={{ color: p.muted, lineHeight: 20 }}>{i + 1}. {step.text}</Text>)}</View>}
    </ScrollView>
    </View>
    <Modal visible={planner} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPlanner(false)}><SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, gap: 18, width: '100%', maxWidth: 780, alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={[styles.title, { color: p.text }]}>Where to?</Text><Pressable accessibilityLabel="Close planner" onPress={() => setPlanner(false)}><Ionicons name="close-circle" size={30} color={p.muted} /></Pressable></View>
      <Text style={[styles.subtitle, { color: p.muted }]}>Compare bicycle and car-road candidates at your riding speed. Search an address and select a result, use your location, or pick either endpoint on the map. Coordinates also work.</Text>
      <EndpointPicker label="Start" value={start} onChange={v => { setStart(v); setStartPoint(undefined); }} onSelect={(label, c) => { setStart(label); setStartPoint(c); }} onLocation={() => void run(useLocation)} onMap={() => { setPicking('start'); setPlanner(false); }} />
      <EndpointPicker label="Destination" value={end} onChange={v => { setEnd(v); setEndPoint(undefined); }} onSelect={(label, c) => { setEnd(label); setEndPoint(c); }} onMap={() => { setPicking('end'); setPlanner(false); }} />
      <View style={[styles.card, { backgroundColor: p.card }]}><Text style={{ color: p.text, fontWeight: '700' }}>{profile.name}</Text><Text style={{ color: p.muted }}>Hardware {profile.maxSpeed} km/h · Riding limit {profile.ridingLimit} km/h</Text><Text style={{ color: p.muted, fontSize: 12 }}>Avoid motorways, trunk roads, steps, ferries and known roads above 50 km/h. Scooter access and urban status need review.</Text></View>
      {busy && <ActivityIndicator color={p.accent} />}{!!error && <Text style={{ color: '#C75A36' }}>{error}</Text>}
      <Button title={busy ? 'Finding routes…' : 'Compare routes'} disabled={busy} onPress={() => void plan()} />
    </ScrollView></SafeAreaView></Modal>
  </SafeAreaView>;
}
function Metric({ label, value }: { label: string; value: string }) { const p = usePalette(); return <View style={{ flex: 1 }}><Text style={{ fontSize: 26, fontWeight: '800', color: p.text }}>{value}</Text><Text style={{ color: p.muted, fontSize: 12 }}>{label}</Text></View>; }
const s = StyleSheet.create({ header: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, brand: { fontSize: 30, letterSpacing: -1.3, fontWeight: '800' }, round: { height: 46, width: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, mapBadge: { position: 'absolute', left: 12, top: 12, padding: 10, borderRadius: 12, flexDirection: 'row', gap: 8, alignItems: 'center' }, recenter: { position: 'absolute', right: 12, top: 60, borderRadius: 14, padding: 12 }, metrics: { flexDirection: 'row', paddingVertical: 10 } });
